"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const user_model_1 = require("../models/user.model");
const auth_service_1 = require("../services/auth.service");
const id_service_1 = require("../services/id.service");
const auth_validator_1 = require("../validators/auth.validator");
class AuthController {
    static async register(req, res) {
        const payload = auth_validator_1.registerSchema.parse(req.body);
        const username = payload.username.toLowerCase();
        const usernameExists = await user_model_1.UserModel.existsByUsername(username);
        if (usernameExists) {
            res.status(409).json({ message: "Username sudah digunakan." });
            return;
        }
        const now = new Date().toISOString();
        const user = await user_model_1.UserModel.create({
            id: (0, id_service_1.createId)("usr"),
            username,
            displayName: payload.displayName,
            passwordHash: await bcrypt_1.default.hash(payload.password, 10),
            roles: payload.roles,
            createdAt: now,
            updatedAt: now,
        });
        const activeRole = null;
        const token = (0, auth_service_1.createToken)({ userId: user.id, activeRole });
        res.status(201).json({
            token,
            user: (0, auth_service_1.toPublicUser)(user, activeRole),
            requiresRoleSelection: true,
        });
    }
    static async login(req, res) {
        const payload = auth_validator_1.loginSchema.parse(req.body);
        const user = await user_model_1.UserModel.findByUsername(payload.username.toLowerCase());
        if (!user) {
            res.status(401).json({ message: "Username atau password salah." });
            return;
        }
        const passwordMatches = await bcrypt_1.default.compare(payload.password, user.passwordHash);
        if (!passwordMatches) {
            res.status(401).json({ message: "Username atau password salah." });
            return;
        }
        const activeRole = null;
        const token = (0, auth_service_1.createToken)({ userId: user.id, activeRole });
        res.json({
            token,
            user: (0, auth_service_1.toPublicUser)(user, activeRole),
            requiresRoleSelection: true,
        });
    }
    static async me(req, res) {
        const user = await user_model_1.UserModel.findById(req.auth.userId);
        if (!user) {
            res.status(404).json({ message: "User tidak ditemukan." });
            return;
        }
        res.json({ user: (0, auth_service_1.toPublicUser)(user, req.auth.activeRole) });
    }
    static async selectRole(req, res) {
        const payload = auth_validator_1.selectRoleSchema.parse(req.body);
        const user = await user_model_1.UserModel.findById(req.auth.userId);
        if (!user) {
            res.status(404).json({ message: "User tidak ditemukan." });
            return;
        }
        if (!user_model_1.UserModel.hasRole(user, payload.role)) {
            res.status(403).json({ message: "Role ini tidak dimiliki oleh user." });
            return;
        }
        const token = (0, auth_service_1.createToken)({ userId: user.id, activeRole: payload.role });
        res.json({
            token,
            user: (0, auth_service_1.toPublicUser)(user, payload.role),
        });
    }
    static logout(_req, res) {
        res.json({
            message: "Logout berhasil. Token JWT stateless, jadi client harus menghapus token dari storage.",
        });
    }
}
exports.AuthController = AuthController;
