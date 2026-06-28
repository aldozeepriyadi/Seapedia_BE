import { z } from "zod";
import { allowedRoles, nonAdminRoles, Role } from "../constants/roles";

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username minimal 3 karakter.")
    .max(32, "Username maksimal 32 karakter.")
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh berisi huruf, angka, dan underscore."),
  displayName: z.string().trim().min(2, "Nama minimal 2 karakter.").max(80),
  password: z.string().min(8, "Password minimal 8 karakter."),
  roles: z
    .array(z.enum(nonAdminRoles))
    .min(1, "Pilih minimal satu role.")
    .default([Role.BUYER]),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export const selectRoleSchema = z.object({
  role: z.enum(allowedRoles),
});
