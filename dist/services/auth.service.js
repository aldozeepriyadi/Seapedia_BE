"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createToken = createToken;
exports.verifyToken = verifyToken;
exports.revokeToken = revokeToken;
exports.toPublicUser = toPublicUser;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const id_service_1 = require("./id.service");
const revokedTokenIds = new Map();
function cleanupRevokedTokens() {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    for (const [tokenId, expiresAt] of revokedTokenIds.entries()) {
        if (expiresAt <= nowInSeconds) {
            revokedTokenIds.delete(tokenId);
        }
    }
}
function createToken(payload) {
    cleanupRevokedTokens();
    return jsonwebtoken_1.default.sign({
        userId: payload.userId,
        activeRole: payload.activeRole,
    }, env_1.env.jwtSecret, { expiresIn: "2h", jwtid: (0, id_service_1.createId)("tok") });
}
function verifyToken(token) {
    cleanupRevokedTokens();
    const decoded = jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
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
function revokeToken(payload) {
    if (!payload.jti)
        return;
    const expiresAt = payload.exp ?? Math.floor(Date.now() / 1000) + 7200;
    revokedTokenIds.set(payload.jti, expiresAt);
    cleanupRevokedTokens();
}
function toPublicUser(user, activeRole) {
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
