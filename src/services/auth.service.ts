import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";
import { Role } from "../constants/roles";
import { StoredUser } from "../models/database.model";
import { AuthPayload } from "../types/auth";
import { createId } from "./id.service";

const revokedTokenIds = new Map<string, number>();

function cleanupRevokedTokens() {
  const nowInSeconds = Math.floor(Date.now() / 1000);

  for (const [tokenId, expiresAt] of revokedTokenIds.entries()) {
    if (expiresAt <= nowInSeconds) {
      revokedTokenIds.delete(tokenId);
    }
  }
}

export function createToken(payload: AuthPayload) {
  cleanupRevokedTokens();
  return jwt.sign(
    {
      userId: payload.userId,
      activeRole: payload.activeRole,
    },
    env.jwtSecret,
    { expiresIn: "2h", jwtid: createId("tok") },
  );
}

export function verifyToken(token: string) {
  cleanupRevokedTokens();

  const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload & AuthPayload;

  if (decoded.jti && revokedTokenIds.has(decoded.jti)) {
    throw new Error("Token sudah logout.");
  }

  return {
    userId: decoded.userId,
    activeRole: decoded.activeRole,
    jti: decoded.jti,
    exp: decoded.exp,
  };
}

export function revokeToken(payload: AuthPayload) {
  if (!payload.jti) return;

  const expiresAt = payload.exp ?? Math.floor(Date.now() / 1000) + 7200;
  revokedTokenIds.set(payload.jti, expiresAt);
  cleanupRevokedTokens();
}

export function toPublicUser(user: StoredUser, activeRole: Role | null) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    roles: user.roles,
    activeRole,
    createdAt: user.createdAt,
  };
}
