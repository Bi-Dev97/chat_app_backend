/**This file defines routes for authentication and authorization. 
It can include routes for user login, token verification, 
password reset, etc. */

import express from "express";
import {
  login,
  googleLogin,
  loginAdmin,
  logout,
  handleRefreshToken,
  passwordResetToken,
  resetPassword,
} from "../controllers/authController";
import authMiddleware from "../middlewares/authMiddleware";

const authRouter = express.Router();

authRouter.post("/login", login);
authRouter.get("/google-auth", googleLogin);
authRouter.post("/admin-login", loginAdmin);
authRouter.post("/password-reset-token", passwordResetToken);
authRouter.put("/reset-password/:resetToken", resetPassword);
authRouter.get("/handle-refresh-token", handleRefreshToken);
authRouter.get("/logout", authMiddleware, logout);

export default authRouter;
