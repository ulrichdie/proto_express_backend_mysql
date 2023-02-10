const db = require("./../db/connexion.js");
const promisify = require("util-promisify");
const AppOpeError = require("../utils/appOpeErrors.js");

// transformer la methode query en promesse
const query = promisify(db.query).bind(db);

// Param middleware pour le contrôle de l'ID
/*exports.checkID = (req, res, next, val) => {
  //if (val * 1 === 0) {
  if (req.params.id * 1 === 0 || req.params.id === undefined) {
    return res.status(404).json({ status: "error", message: "ID invalide" });
  }
  next();
};*/

// Récupérer tous les profils
exports.getAllProfils = async (req, res, next) => {
  try {
    // Requete
    let sql = "SELECT * FROM profil";
    let rows = await query(sql);
    // Response
    res.status(200).json({
      status: "success",
      results: rows.length,
      data: rows[0],
    });
  } catch (error) {
    next(new AppOpeError(error, 404));
  }
};

// Créer un profil
exports.createProfil = async (req, res, next) => {
  try {
    //destructuring
    const { libelle, description } = req.body;
    // Requete
    let sql =
      "INSERT INTO profil (profil_libelle, Profil_description) VALUES (?, ?)";
    let data = [libelle, description];
    let rows = await query(sql, data);
    // Response
    return res.status(200).json({
      status: "success",
      message: "Créé avec succès",
      data: rows,
    });
  } catch (error) {
    next(new AppOpeError(error, 404));
  }
};

// Lire un profil
exports.getProfil = async (req, res, next) => {
  try {
    const id = req.params.id;
    // Requete
    let sql = "SELECT * FROM profil WHERE profil_id = ?";
    let data = [id];
    let rows = await query(sql, data);
    // Response
    return res.status(200).json({
      status: "success",
      results: rows.length,
      data: rows[0],
    });
  } catch (error) {
    next(new AppOpeError(error, 404));
  }
};

// Modifier un profil
exports.updateProfil = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { libelle, description } = req.body;
    // Requete
    let sql =
      "UPDATE profil SET profil_libelle = ?, profil_description = ? WHERE profil_id = ?";
    let data = [libelle, description, id];
    let rows = await query(sql, data);
    // Response
    return res.status(200).json({
      status: "success",
      message: "Modifié avec succès",
      data: rows[0],
    });
  } catch (error) {
    next(new AppOpeError(error, 404));
  }
};

// Supprimer un profil
exports.deleteProfil = async (req, res, next) => {
  try {
    const id = req.params.id;
    // Requete
    let sql = "DELETE FROM profil WHERE profil_id = ?";
    let data = [id];
    let rows = await query(sql, data);
    // Response
    return res.status(200).json({
      status: "success",
      message: "Supprimé avec succès",
      data: rows,
    });
  } catch (error) {
    next(new AppOpeError(error, 404));
  }
};
