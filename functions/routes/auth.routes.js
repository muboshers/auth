const {
  RegisterController,
  LoginController,
  ResetPasswordController,
  EmailVerifyController,
  ForgotPasswordController,
} = require("../controller/auth.controller.js");
const { IsAuthenticated } = require("../middleware/authorization.js");
const router = require("express").Router();

router.post("/register", RegisterController);
router.post("/login", LoginController);
router.post("/reset-password", ResetPasswordController);
router.post("/email-verify", IsAuthenticated, EmailVerifyController);
router.post("/forgot-password", IsAuthenticated, ForgotPasswordController);
// router.patch("/forgot-password", );
module.exports = router;
