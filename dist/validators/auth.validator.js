"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectRoleSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const roles_1 = require("../constants/roles");
const security_1 = require("../utils/security");
exports.registerSchema = zod_1.z.object({
    username: zod_1.z
        .string()
        .trim()
        .min(3, "Username minimal 3 karakter.")
        .max(32, "Username maksimal 32 karakter.")
        .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh berisi huruf, angka, dan underscore."),
    email: zod_1.z
        .string()
        .trim()
        .email("Email tidak valid.")
        .max(120, "Email maksimal 120 karakter.")
        .transform((value) => value.toLowerCase()),
    displayName: zod_1.z
        .string()
        .trim()
        .min(2, "Nama minimal 2 karakter.")
        .max(80, "Nama maksimal 80 karakter.")
        .refine(security_1.isSafePlainText, security_1.safePlainTextMessage)
        .transform(security_1.normalizePlainText),
    password: zod_1.z
        .string()
        .min(8, "Password minimal 8 karakter.")
        .max(128, "Password maksimal 128 karakter."),
    roles: zod_1.z
        .array(zod_1.z.enum(roles_1.nonAdminRoles))
        .min(1, "Pilih minimal satu role.")
        .default([roles_1.Role.BUYER]),
});
exports.loginSchema = zod_1.z.object({
    username: zod_1.z.string().trim().min(1),
    password: zod_1.z.string().min(1),
});
exports.selectRoleSchema = zod_1.z.object({
    role: zod_1.z.enum(roles_1.allowedRoles),
});
