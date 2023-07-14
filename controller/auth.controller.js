const userModel = require("../models/user.model.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const otpVerificationModel = require("../models/otp-verication.model.js");
const { sendMessageEmail } = require("../email.js");
const { default: mongoose } = require("mongoose");
const { use } = require("../routes/auth.routes.js");

const generatCodeNumber = (codeLength) => {
  let result = [];
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = 0; i < codeLength; i++) {
    result.push(Math.floor(Math.random() * numbers.length));
  }
  return result;
};

const JWT_SECRET = process.env.JWT_SECRET || "DAVID";

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a user
 *     tags:
 *       - auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Code sent! Please verify your email
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *       401:
 *         description: Account already exists or verification required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Account already exists! Please login
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

const RegisterController = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const alradyExistUser = await userModel.findOne({ email });

    if (alradyExistUser?.is_verify)
      return res
        .status(401)
        .json({ message: "Accaunt alrady exist! Please login" });

    if (alradyExistUser && !alradyExistUser.is_verify)
      return res
        .status(401)
        .json({ message: "Please verify your code accaunt" });

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await userModel.create({
      email,
      username,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { email, is_verify: user?.is_verify, _id: user._id },
      JWT_SECRET,
      {
        expiresIn: "1d",
        algorithm: "HS256",
      }
    );

    const genCode = generatCodeNumber(6).join("");

    await otpVerificationModel.create({
      user_id: user._id,
      code: genCode,
    });

    sendMessageEmail(email, username, genCode);

    return res
      .status(200)
      .json({ message: "Code send! Please verify your email", token });
  } catch (error) {
    return res.status(500).json(error.message);
  }
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags:
 *       - auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   description: User object
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *       403:
 *         description: Invalid password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid password
 *       404:
 *         description: Account not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Account not found. Please register below or account not registered.
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

const LoginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    const alradyExistUser = await userModel.findOne({ email });

    if (!alradyExistUser || !alradyExistUser?._doc.is_verify)
      return res.status(404).json({
        message:
          "Accaunt Not found please register below or accaunt not registered",
      });

    const isVefiryPassword = await bcrypt.compare(
      password,
      alradyExistUser._doc.password
    );

    if (!isVefiryPassword)
      return res.status(403).json({ message: "Invalid password" });

    const token = jwt.sign(
      {
        email,
        is_verify: alradyExistUser?.is_verify,
        _id: alradyExistUser._id,
      },
      JWT_SECRET,
      {
        expiresIn: "1d",
        algorithm: "HS256",
      }
    );

    delete alradyExistUser._doc.password;

    res.status(200).json({
      user: {
        ...alradyExistUser._doc,
      },
      token,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset user password
 *     tags:
 *       - auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               confirmEmail:
 *                 type: string
 *     responses:
 *       200:
 *         description: Code sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Code sent! Please verify your email
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *       403:
 *         description: Code already sent for verification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Code already sent! Please verify
 *       404:
 *         description: Unconfirmed email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unconfirmed email
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

const ResetPasswordController = async (req, res) => {
  try {
    const { email, confirmEmail } = req.body;

    if (email?.trim()?.toLowerCase() !== confirmEmail?.trim()?.toLowerCase())
      return res.status(404).json({ message: "Uncorfirmed email" });
    const alradyExistUser = await userModel.findOne({ email });
    const genCode = generatCodeNumber(6).join("");

    const oldOtpCode = await otpVerificationModel.findOne({
      user_id: alradyExistUser._id,
    });
    if (oldOtpCode?.code)
      return res
        .status(403)
        .json({ message: "Alrady code was send! Please verify" });

    const token = jwt.sign(
      {
        email,
        is_verify: alradyExistUser.is_verify,
        _id: alradyExistUser._id,
      },
      JWT_SECRET,
      {
        expiresIn: "1d",
        algorithm: "HS256",
      }
    );

    await otpVerificationModel.create({
      user_id: alradyExistUser._id,
      code: genCode,
    });

    sendMessageEmail(email, alradyExistUser.username, genCode);

    await alradyExistUser.updateOne({ is_verify: false });

    res
      .status(200)
      .json({ message: "Code send! Please verify your email", token: token });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /auth/email-verify:
 *   post:
 *     summary: Verify user email
 *     tags:
 *       - auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User verified successfully
 *       402:
 *         description: Invalid password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid password
 *       404:
 *         description: Invalid ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid ID
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
const EmailVerifyController = async (req, res) => {
  try {
    const userId = req.userId;
    const { password } = req.body;
    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(404).json({ message: "Invalid id" });

    const user = await userModel.findById(userId);

    const otpCodeCheck = await otpVerificationModel.findOne({
      user_id: userId,  
    });

    if (password !== otpCodeCheck.code)
      return res.status(402).json({ message: "Invalid password" });
    await otpVerificationModel.findByIdAndDelete(otpCodeCheck._id);
    await user.updateOne({ is_verify: true });
    res.status(200).json({ message: "User verified succesfully" });
  } catch (error) {
    return res.status(500).json({ messsage: error.status });
  }
};

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Set new password for user
 *     tags:
 *       - auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Password set successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password set successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       404:
 *         description: Please verify your account
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Please verify your account
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
const ForgotPasswordController = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    const userId = req.userId;
    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(401).json({ message: "Un Authrorized" });

    if (password !== confirmPassword)
      return res.status(401).json({ message: "Password confirmation failed" });

    const currentUser = await userModel.findById(userId);

    if (!currentUser.is_verify)
      return res.status(404).json({ message: "Please verify your accaunt" });

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    await currentUser.updateOne({ password: hashedPassword });
    return res.status(200).json({ message: "Password set user" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  RegisterController,
  LoginController,
  ResetPasswordController,
  EmailVerifyController,
  ForgotPasswordController,
};
