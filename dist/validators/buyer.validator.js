"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkoutSchema = exports.updateCartItemSchema = exports.addCartItemSchema = exports.addressSchema = exports.topUpSchema = void 0;
const zod_1 = require("zod");
const commerce_1 = require("../constants/commerce");
const security_1 = require("../utils/security");
const safeText = (min, max, label) => zod_1.z
    .string()
    .trim()
    .min(min, `${label} minimal ${min} karakter.`)
    .max(max, `${label} maksimal ${max} karakter.`)
    .refine(security_1.isSafePlainText, security_1.safePlainTextMessage)
    .transform(security_1.normalizePlainText);
exports.topUpSchema = zod_1.z.object({
    amount: zod_1.z.coerce.number().int().min(1000).max(10000000),
});
exports.addressSchema = zod_1.z.object({
    recipientName: safeText(2, 80, "Nama penerima"),
    phone: zod_1.z
        .string()
        .trim()
        .min(8, "Nomor telepon minimal 8 karakter.")
        .max(20, "Nomor telepon maksimal 20 karakter.")
        .regex(/^\+?[0-9][0-9 -]{6,18}[0-9]$/, "Nomor telepon hanya boleh angka, spasi, tanda plus, atau dash."),
    addressLine: safeText(8, 300, "Alamat"),
    city: safeText(2, 80, "Kota"),
    postalCode: zod_1.z
        .string()
        .trim()
        .min(3, "Kode pos minimal 3 karakter.")
        .max(12, "Kode pos maksimal 12 karakter.")
        .regex(/^[a-zA-Z0-9 -]+$/, "Kode pos hanya boleh huruf, angka, spasi, atau dash."),
    isPrimary: zod_1.z.boolean().default(false),
});
exports.addCartItemSchema = zod_1.z.object({
    productId: zod_1.z.string().trim().min(1),
    quantity: zod_1.z.coerce.number().int().min(1).max(99).default(1),
});
exports.updateCartItemSchema = zod_1.z.object({
    quantity: zod_1.z.coerce.number().int().min(1).max(99),
});
exports.checkoutSchema = zod_1.z.object({
    addressId: zod_1.z.string().trim().min(1),
    deliveryMethod: zod_1.z.enum([
        commerce_1.DeliveryMethod.INSTANT,
        commerce_1.DeliveryMethod.NEXT_DAY,
        commerce_1.DeliveryMethod.REGULAR,
    ]),
    discountCode: zod_1.z
        .string()
        .trim()
        .max(40, "Kode diskon maksimal 40 karakter.")
        .refine((value) => value === "" || /^[a-zA-Z0-9_-]+$/.test(value), "Kode diskon hanya boleh huruf, angka, underscore, atau dash.")
        .transform((value) => value.toUpperCase())
        .optional()
        .or(zod_1.z.literal("")),
});
