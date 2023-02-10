const db = require("./../db/connexion.js");
const promisify = require("util-promisify");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AppOpeError = require("../utils/appOpeErrors.js");
const crypto = require("crypto");
const sendEmail = require("./../utils/email.js");
const moment = require("moment");

// transformer la methode query en promesse
const query = promisify(db.query).bind(db);

//Génération de token
const generPassword = () => {
  // Générer token
  const resetToken = crypto.randomBytes(32).toString("hex");
  // crypter token généré qui sera enregistré dans la base
  const cryptResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const ConvExpireDate = moment(Date.now() + 10 * 60 * 1000).format(
    "YYYY-MM-DD HH:mm:ss"
  );
  const cryptData = {
    resetToken,
    cryptResetToken,
    resetToken,
    ConvExpireDate,
  };
  return cryptData;
};

// fonction de Génération du token
const GenToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRED,
  });
};

// Option des cookies
const cookieOptions = {
  expires: new Date(
    Date.now() + process.env.JWT_COOKIE_EXPIRED * 24 * 60 * 60 * 1000
  ),
  httpOnly: true,
};
if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

// fonction d'Envoi du token
const creatSendToken = (user, statusCode, res) => {
  const token = GenToken(user.user_id);
  // Envoyer le token par cookie
  res.cookie("jwt", token, cookieOptions);

  user.user_pwd = undefined;
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

// Création d'un nouvel utilisateur
exports.signup = async (req, res, next) => {
  try {
    // Destructuring
    req.body.pwdcrypt = await bcrypt.hash(req.body.pwd, 12);
    const { nom, mail, pwdcrypt, tel, poste, photo, profil } = req.body;
    // Requete
    let sql =
      "INSERT INTO user(user_nom, user_email, user_pwd, user_tel, user_poste, user_photo, user_profil) VALUES(?,?,?,?,?,?,?)";
    let data = [nom, mail, pwdcrypt, tel, poste, photo, profil];
    // Execution de la requete
    let rows = await query(sql, data);
    // Response
    res.status(200).json({
      status: "success",
      message: "Enregistré",
      data: rows,
    });
  } catch (error) {
    return next(new AppOpeError(error, 404));
  }
};

// Connexion d'un utilisateur
exports.login = async (req, res, next) => {
  try {
    // Destructuring
    const { mail, pwd } = req.body;
    // Requete
    let sql = "SELECT * FROM user WHERE user_email = ?";
    let data = [mail];
    let rows = await query(sql, data);
    // Controler utilisateur et password
    if (rows.length === 0 || !(await bcrypt.compare(pwd, rows[0].user_pwd))) {
      return next(new AppOpeError("Email ou mot de passe incorrects"), 401);
    }
    // Générer et envoyer le token
    creatSendToken(rows[0], 200, res);
  } catch (error) {
    return next(new AppOpeError(error, 404));
  }
};

// Middleware de protection des routes avec auth token
exports.auth = async (req, res, next) => {
  try {
    // rechercher le token
    let token = "";
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    // Token introuvable
    if (!token) {
      return next(new AppOpeError("Droits insuffisants, token incorrect", 401));
    }

    // Valider le token
    const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // Vérifier si l'utilisateur existe
    let sql = "SELECT COUNT(user_id) as nbuser FROM user WHERE user_id = ?";
    let data = [decode.id];
    let rows = await query(sql, data);
    if (rows.length === 0) {
      return next(
        new AppOpeError("Droits insuffisants, utilisateur introuvable"),
        401
      );
    }
    req.userId = decode.id;
    next();
  } catch (error) {
    return next(new AppOpeError(error, 404));
  }
};

// Gestion de la demande de nouveau mot de passe
exports.forgotPassword = async (req, res, next) => {
  try {
    // Vérifier l'existance de l'utilisateur
    let sql = "SELECT COUNT(user_id) as nbuser FROM user WHERE user_email = ?";
    let data = [req.body.mail];
    let rows = await query(sql, data);

    if (rows.length === 0) {
      return next(new AppOpeError("Utilisateur introuvable", 404));
    }
    // Générer un token temporaire à l'utilisateur
    const genToken = generPassword();
    // enregistrer les informations du token dans la base
    sql =
      "UPDATE user SET user_pwdtoken = ?, user_pwdtokenexp = ? WHERE user_email = ?";
    data = [genToken.cryptResetToken, genToken.ConvExpireDate, req.body.mail];
    rows = await query(sql, data);
    if (rows.affectedRows === 0) {
      return next(new AppOpeError("Utilisateur introuvable", 404));
    }
    // Envoyer un email de réinitialisation
    // Créer le lien de reset
    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/resetPassword/${genToken.resetToken}`;

    const message = `Vous avez oublié votre mot de passe ? Veuillez le réinitialiser en cliquant sur le lien ${resetURL}. ce lien est valide 10mn, si vous n'êtes pas à la base de cette action et que vous n'avez pas oublié votre mot de passe veuillez ignorer ce message.`;

    try {
      await sendEmail({
        email: req.body.mail,
        subject: "Réinitialisation de mot de passe",
        message,
      });

      res.status(200).json({
        status: "success",
        message: "Un email de réinitilisation vous à été envoyé",
      });
    } catch (error) {
      // En cas d'erreur d'envoi remettre les informations de réinitilisation PWD du user en l'état
      sql =
        "UPDATE user SET user_pwdtoken = ?, user_pwdtokenexp = ? WHERE user_email = ?";
      data = [undefined, undefined, req.body.mail];
      rows = await query(sql, data);
      return next(new AppOpeError(error, 404));
    }
  } catch (error) {
    return next(new AppOpeError(error, 404));
  }
};

// modifier le mot de passe
exports.resetPassword = async (req, res, next) => {
  try {
    // crypter le token
    let token = req.params.token;
    req.body.pwdcrypt = await bcrypt.hash(req.body.pwd, 12);
    const cryptToken = crypto.createHash("sha256").update(token).digest("hex");
    // rechercher l'existance de l'utilisateur et vérifier le token
    let sql =
      "SELECT * FROM user WHERE user_pwdtoken = ? AND user_pwdtokenexp > NOW()";
    let data = [cryptToken];
    let rows = await query(sql, data);
    if (rows.length === 0) {
      return next(new AppOpeError("Lien invalide ou expiré"), 400);
    }
    // Vérifier la différence des passwords
    if (await bcrypt.compare(req.body.pwd, rows[0].user_pwd)) {
      return next(
        new AppOpeError(
          "Votre nouveau mot de passe doit être différent l'ancien"
        ),
        400
      );
    }
    // mettre à jour le password
    const pwdChangeDate = moment(Date.now() - 1000).format(
      "YYYY-MM-DD HH:mm:ss"
    );
    sql =
      "UPDATE user SET user_pwd = ?, user_pwdtoken = ?, user_pwdtokenexp = ?, user_pwdchangedate = ? WHERE user_id = ?";
    data = [
      req.body.pwdcrypt,
      undefined,
      undefined,
      pwdChangeDate,
      rows[0].user_id,
    ];
    rows = await query(sql, data);
    if (rows.affectedRows === 0) {
      return next(
        new AppOpeError("Echec de le réinitilisation, veuillez réssayer."),
        400
      );
    }
    // Connecter l'utilisateur
    creatSendToken(rows[0], 200, res);
  } catch (error) {
    return next(new AppOpeError(error, 404));
  }
};

// mise à jour du mot de passe de l'utilisateur connecté
exports.updatePassword = async (req, res, next) => {
  try {
    // récupérer l'ID du user à partir de la validation du token
    const { pwd, pwd1 } = req.body;
    const userId = req.userId;
    // Requete
    let sql = "SELECT * FROM user WHERE user_id = ?";
    let data = [userId];
    let rows = await query(sql, data);
    // Controller si l'utilisateur existe et le mot de passe actuel est correcte
    if (rows.length === 0 || !(await bcrypt.compare(pwd, rows[0].user_pwd))) {
      return next(new AppOpeError("Mot de passe courant incorrect"), 400);
    }
    // Crypter et enregistrer le noveau mot de passe
    const pwdcrypt = await bcrypt.hash(pwd1, 12);
    // Mettre à jour le mot de passe de l'utilisateur
    const dTime = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");
    sql =
      "UPDATE user SET user_pwd = ?, user_pwdchangedate = ? WHERE user_id = ?";
    data = [pwdcrypt, dTime, userId];
    rows = await query(sql, data);
    // Reponse
    res.status(200).json({
      status: "success",
      message: "Mot de passe modifié avec succès",
    });
  } catch (error) {
    return next(new AppOpeError(error, 404));
  }
};
