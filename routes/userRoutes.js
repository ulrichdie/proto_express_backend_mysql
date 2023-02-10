const express = require("express");
const authController = require("./../Controllers/authController.js");
const usersController = require("./../Controllers/usersController.js");
const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);
router.patch(
  "/updatePassword",
  authController.auth,
  authController.updatePassword
);
router.patch("/updateMe", authController.auth, usersController.uploadUserPhoto, usersController.updateMe);

router
  .route("/")
  .get(authController.auth, usersController.getAllUsers)
  .post(authController.auth, usersController.createUsers);
router
  .route("/:id")
  .get(authController.auth, usersController.getUser)
  .patch(authController.auth, usersController.updateUser)
  .delete(authController.auth, usersController.deleteUser);

module.exports = router;
