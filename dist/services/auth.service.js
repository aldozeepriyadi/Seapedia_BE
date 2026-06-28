"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createToken = createToken;
exports.verifyToken = verifyToken;
exports.toPublicUser = toPublicUser;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
function createToken(payload) {
    return jsonwebtoken_1.default.sign(payload, env_1.env.jwtSecret, { expiresIn: "2h" });
}
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
}
function toPublicUser(user, activeRole) {
    return {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        roles: user.roles,
        activeRole,
        createdAt: user.createdAt,
    };
}
