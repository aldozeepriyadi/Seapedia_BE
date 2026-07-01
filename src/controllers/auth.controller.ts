import bcrypt from "bcrypt";
import { Response } from "express";
import { UserModel } from "../models/user.model";
import { createToken, revokeToken, toPublicUser } from "../services/auth.service";
import { createId } from "../services/id.service";
import { AuthedRequest } from "../types/auth";
import {
  loginSchema,
  registerSchema,
  selectRoleSchema,
} from "../validators/auth.validator";

export class AuthController {
  static async register(req: AuthedRequest, res: Response) {
    const payload = registerSchema.parse(req.body);
    const username = payload.username.toLowerCase();
    const usernameExists = await UserModel.existsByUsername(username);

    if (usernameExists) {
      res.status(409).json({ message: "Username sudah digunakan." });
      return;
    }

    const emailExists = await UserModel.existsByEmail(payload.email);
    if (emailExists) {
      res.status(409).json({ message: "Email sudah digunakan." });
      return;
    }

    const now = new Date().toISOString();
    const user = await UserModel.create({
      id: createId("usr"),
      username,
      email: payload.email,
      displayName: payload.displayName,
      passwordHash: await bcrypt.hash(payload.password, 10),
      roles: payload.roles,
      createdAt: now,
      updatedAt: now,
    });

    const activeRole = null;
    const token = createToken({ userId: user.id, activeRole });

    res.status(201).json({
      token,
      user: toPublicUser(user, activeRole),
      requiresRoleSelection: true,
    });
  }

  static async login(req: AuthedRequest, res: Response) {
    const payload = loginSchema.parse(req.body);
    const user = await UserModel.findByUsernameOrEmail(payload.username);

    if (!user) {
      res.status(401).json({ message: "Username/email atau password salah." });
      return;
    }

    const passwordMatches = await bcrypt.compare(payload.password, user.passwordHash);

    if (!passwordMatches) {
      res.status(401).json({ message: "Username/email atau password salah." });
      return;
    }

    const activeRole = null;
    const token = createToken({ userId: user.id, activeRole });

    res.json({
      token,
      user: toPublicUser(user, activeRole),
      requiresRoleSelection: true,
    });
  }

  static async me(req: AuthedRequest, res: Response) {
    const user = await UserModel.findById(req.auth!.userId);

    if (!user) {
      res.status(404).json({ message: "User tidak ditemukan." });
      return;
    }

    res.json({ user: toPublicUser(user, req.auth!.activeRole) });
  }

  static async selectRole(req: AuthedRequest, res: Response) {
    const payload = selectRoleSchema.parse(req.body);
    const user = await UserModel.findById(req.auth!.userId);

    if (!user) {
      res.status(404).json({ message: "User tidak ditemukan." });
      return;
    }

    if (!UserModel.hasRole(user, payload.role)) {
      res.status(403).json({ message: "Role ini tidak dimiliki oleh user." });
      return;
    }

    const token = createToken({ userId: user.id, activeRole: payload.role });

    res.json({
      token,
      user: toPublicUser(user, payload.role),
    });
  }

  static logout(req: AuthedRequest, res: Response) {
    revokeToken(req.auth!);
    res.json({
      message:
        "Logout berhasil. Token aktif sudah direvoke dan client harus menghapus token dari storage.",
    });
  }
}
