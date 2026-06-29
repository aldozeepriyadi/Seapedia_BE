"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promoSchema = exports.voucherSchema = void 0;
const zod_1 = require("zod");
exports.voucherSchema = zod_1.z.object({
    code: zod_1.z.string().trim().min(3).max(40).transform((value) => value.toUpperCase()),
    discountAmount: zod_1.z.coerce.number().int().min(1000),
    expiryDate: zod_1.z.string().datetime(),
    remainingUsage: zod_1.z.coerce.number().int().min(1),
});
exports.promoSchema = zod_1.z.object({
    code: zod_1.z.string().trim().min(3).max(40).transform((value) => value.toUpperCase()),
    discountAmount: zod_1.z.coerce.number().int().min(1000),
    expiryDate: zod_1.z.string().datetime(),
});
