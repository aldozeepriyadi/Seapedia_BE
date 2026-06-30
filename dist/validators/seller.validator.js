"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productSchema = exports.storeSchema = void 0;
const zod_1 = require("zod");
const security_1 = require("../utils/security");
const safeText = (min, max, label) => zod_1.z
    .string()
    .trim()
    .min(min, `${label} minimal ${min} karakter.`)
    .max(max, `${label} maksimal ${max} karakter.`)
    .refine(security_1.isSafePlainText, security_1.safePlainTextMessage)
    .transform(security_1.normalizePlainText);
const imageSchema = zod_1.z
    .string()
    .trim()
    .max(3_000_000)
    .refine((value) => value === "" ||
    zod_1.z.string().url().safeParse(value).success ||
    /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(value), "Image harus berupa URL valid atau file image yang valid.")
    .default("");
exports.storeSchema = zod_1.z.object({
    storeName: safeText(3, 80, "Nama toko"),
    description: safeText(8, 300, "Deskripsi toko"),
});
exports.productSchema = zod_1.z.object({
    name: safeText(3, 100, "Nama produk"),
    description: safeText(8, 700, "Deskripsi produk"),
    price: zod_1.z.coerce
        .number()
        .int("Harga harus angka bulat.")
        .min(0, "Harga tidak boleh negatif.")
        .max(1000000000, "Harga terlalu besar."),
    stock: zod_1.z.coerce
        .number()
        .int("Stock harus angka bulat.")
        .min(0, "Stock tidak boleh negatif.")
        .max(1000000, "Stock terlalu besar."),
    category: safeText(2, 60, "Kategori").default("General"),
    image: imageSchema,
});
