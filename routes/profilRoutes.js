const express = require("express");
const profilController = require("./../Controllers/profilsController.js");
const authController = require("./../Controllers/authController.js");
const router = express.Router();

//router.param("id", profilController.checkID);

// Middleware qui s'applique à tous les autres
router.use(authController.auth);
// Router
router
  .route("/")
  .get(profilController.getAllProfils)
  .post(profilController.createProfil);

router
  .route("/:id")
  .get(profilController.getProfil)
  .patch(profilController.updateProfil)
  .delete(profilController.deleteProfil);

module.exports = router;
