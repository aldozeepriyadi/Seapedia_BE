import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/async-handler";

export const authRoutes = Router();

authRoutes.post("/register", asyncHandler(AuthController.register));
authRoutes.post("/login", asyncHandler(AuthController.login));
authRoutes.get("/me", authenticate, asyncHandler(AuthController.me));
authRoutes.post("/select-role", authenticate, asyncHandler(AuthController.selectRole));
authRoutes.post("/logout", authenticate, AuthController.logout);
