import { NextFunction, Response } from "express";
import { Role } from "../constants/roles";
import { verifyToken } from "../services/auth.service";
import { AuthedRequest } from "../types/auth";

export function authenticate(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ message: "Token tidak ditemukan." });
    return;
  }

  try {
    req.auth = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ message: "Token tidak valid atau sudah kedaluwarsa." });
  }
}

export const requireActiveRole =
  (role: Role) => (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (req.auth?.activeRole !== role) {
      res.status(403).json({
        message: `Akses membutuhkan active role ${role}.`,
      });
      return;
    }

    next();
  };
