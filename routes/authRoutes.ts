/**This file defines routes for authentication and authorization. 
It can include routes for user login, token verification, 
password reset, etc. */

import express, { Request, Response } from "express";
import { loginController } from "../controllers/authController";

const authRouter = express.Router();

authRouter.post("/login", loginController);

export default authRouter;