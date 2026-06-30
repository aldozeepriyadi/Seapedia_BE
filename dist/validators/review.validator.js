"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewSchema = void 0;
const zod_1 = require("zod");
const security_1 = require("../utils/security");
exports.reviewSchema = zod_1.z.object({
    reviewerName: zod_1.z
        .string()
        .trim()
        .min(2, "Nama reviewer minimal 2 karakter.")
        .max(60, "Nama reviewer maksimal 60 karakter.")
        .refine(security_1.isSafePlainText, security_1.safePlainTextMessage)
        .transform(security_1.normalizePlainText),
    rating: zod_1.z.coerce.number().int().min(1).max(5),
    comment: zod_1.z
        .string()
        .trim()
        .min(4, "Komentar minimal 4 karakter.")
        .max(500, "Komentar maksimal 500 karakter.")
        .refine(security_1.isSafePlainText, security_1.safePlainTextMessage)
        .transform(security_1.normalizePlainText),
});
