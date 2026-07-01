import { z } from "zod";
import { allowedRoles, nonAdminRoles, Role } from "../constants/roles";
import {
  isSafePlainText,
  normalizePlainText,
  safePlainTextMessage,
} from "../utils/security";

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username minimal 3 karakter.")
    .max(32, "Username maksimal 32 karakter.")
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh berisi huruf, angka, dan underscore."),
  email: z
    .string()
    .trim()
    .email("Email tidak valid.")
    .max(120, "Email maksimal 120 karakter.")
    .transform((value) => value.toLowerCase()),
  displayName: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(80, "Nama maksimal 80 karakter.")
    .refine(isSafePlainText, safePlainTextMessage)
    .transform(normalizePlainText),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter.")
    .max(128, "Password maksimal 128 karakter."),
  roles: z
    .array(z.enum(nonAdminRoles))
    .min(1, "Pilih minimal satu role.")
    .default([Role.BUYER]),
});

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Username atau email wajib diisi.")
    .max(120, "Username atau email maksimal 120 karakter."),
  password: z.string().min(1),
});

export const selectRoleSchema = z.object({
  role: z.enum(allowedRoles),
});
