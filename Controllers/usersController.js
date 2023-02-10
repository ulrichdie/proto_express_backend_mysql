const db = require("./../db/connexion.js");
const multer = require('multer');
const promisify = require("util-promisify");
const AppOpeError = require("../utils/appOpeErrors.js");

// transformer la methode query en promesse
const query = promisify(db.query).bind(db);

// Multer storage
const multerStorage = multer.diskStorage({
  destination : (req, file, cb) =>{
    cb(null, 'public/images/users');
  },
  filename : (req, file, cb) =>{
    const ext = file.mimetype.split('/')[1];
    cb(null, `user-${req.userId}-${Date.now()}.${ext}`)
  },
});

// Multer Filter
const multerFilter = (req, file, cb) =>{
  if(file.mimetype.startsWith('image')){
    cb(null, true);
  }else{
    cb(AppOpeError('Format de fichier non supporté.', 400), false);
  }
}

const upload = multer({
  Storage: multerStorage,
  fileFilter: multerFilter,
});

// Middlewear Uploader la photo de l'utilisateur
exports.uploadUserPhoto = upload.single('photo');

// Récupérer tous les profils
exports.getAllUsers = async (req, res, next) => {
  try {
    // Requete
    let sql = "SELECT * FROM user";
    let rows = await query(sql);
    // Response
    rows[0].user_pwd = undefined;
    res.status(200).json({
      status: "success",
      results: rows.length,
      data: rows[0],
    });
  } catch (error) {
    next(new AppOpeError(error, 404));
  }
};

// Modifier ses informations personnelles
exports.updateMe = async (req, res, next) => {
  // Destructuring
  const { nom, mail, tel, poste, photo } = req.body;
  const userId = req.userId;
  // Requete
  let sql =
    "UPDATE user SET user_nom = ?, user_email = ?, user_tel = ?, user_poste = ? user_photo = ? WHERE user_id = ?";
  let data = [nom, mail, tel, poste, photo, userId];
  let rows = await query(sql, data);
  // Reponse
  res.status(200).json({
    status: "success",
    message: "Informations mises à jour avec succès",
    data: rows,
  });
  try {
  } catch (error) {
    next(new AppOpeError(error, 404));
  }
};

// Créer utilisateurs
exports.createUsers = async (req, res, next) => {
  // Destructuring
  const { nom, mail, tel, poste, photo, profil } = req.body;
  // Vérifier si l'email est déjà utilisée
  let sql = "SELECT user_id FROM user WHERE user_email = ?";
  let data = [mail];
  let rows = await query(sql, data);
  if (rows.length > 0) {
    return next(new AppOpeError("Email déjà utilisée", 404));
  }
  // Générer mot de passe de l'utilisateur

  // Enregistrer l'utilisateur
  sql =
    "INSERT INTO user (user_nom, user_email, user_tel, user_poste, user_photo, user_profil) VALUES (?, ?, ?, ?, ?, ?)";
  data = [nom, mail, tel, poste, photo, profil];
  rows = await query(sql, data);

  // Envoyer par mail le mot de passe de l'utilisateur

  // Reponse
  res.status(200).json({
    status: "success",
    message: "Utilisateur créé avec succès",
    data: rows,
  });
  try {
  } catch (error) {
    next(new AppOpeError(error, 404));
  }
};

// Rechercher utilisateur
exports.getUser = async (req, res, next) => {
  try {
    const id = req.params.id;
    let sql = "SELECT * FROM user WHERE user_id = ?";
    let data = [id];
    let rows = await query(sql, data);
    // Reponse
    rows[0].user_pwd = undefined;
    res.status(200).json({
      status: "success",
      results: rows.length,
      data: rows[0],
    });
  } catch (error) {
    next(new AppOpeError(error, 404));
  }
};

// Modifier utilisateur
exports.updateUser = async (req, res, next) => {
  try {
    // Destructuring
    const { nom, mail, tel, poste, photo, profil } = req.body;
    const id = req.params.id;
    // Requete
    let sql =
      "UPDATE user SET user_nom = ?, user_email = ?, user_tel = ?, user_poste = ? user_photo = ?, user_profil = ? WHERE user_id = ?";
    let data = [nom, mail, tel, poste, photo, profil, id];
    let rows = await query(sql, data);
    // Reponse
    res.status(200).json({
      status: "success",
      message: "Utilisateur modifié avec succès",
      data: rows,
    });
  } catch (error) {
    next(new AppOpeError(error, 404));
  }
};

// Supprimer utilisateur (le modifier en inactif)
exports.deleteUser = async (req, res, next) => {
  try {
    const id = req.params.id;
    let sql = "UPDATE user SET user_actif = 0 WHERE user_id = ?";
    let data = [id];
    let rows = await query(sql, data);
    // Reponse
    res.status(200).json({
      status: "success",
      message: "Utilisateur supprimé avec succès",
      data: rows,
    });
  } catch (error) {
    next(new AppOpeError(error, 404));
  }
};
