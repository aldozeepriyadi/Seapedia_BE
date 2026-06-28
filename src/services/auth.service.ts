import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { Role } from "../constants/roles";
import { StoredUser } from "../models/database.model";
import { AuthPayload } from "../types/auth";

export function createToken(payload: AuthPayload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "2h" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.jwtSecret) as AuthPayload;
}

export function toPublicUser(user: StoredUser, activeRole: Role | null) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    roles: user.roles,
    activeRole,
    createdAt: user.createdAt,
  };
}
