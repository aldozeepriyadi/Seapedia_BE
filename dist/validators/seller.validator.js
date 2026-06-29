"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productSchema = exports.storeSchema = void 0;
const zod_1 = require("zod");
const imageSchema = zod_1.z
    .string()
    .trim()
    .max(3_000_000)
    .refine((value) => value === "" ||
    zod_1.z.string().url().safeParse(value).success ||
    /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(value), "Image harus berupa URL valid atau file image yang valid.")
    .default("");
exports.storeSchema = zod_1.z.object({
    storeName: zod_1.z.string().trim().min(3, "Nama toko minimal 3 karakter.").max(80),
    description: zod_1.z.string().trim().min(8, "Deskripsi toko minimal 8 karakter.").max(300),
});
exports.productSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(3, "Nama produk minimal 3 karakter.").max(100),
    description: zod_1.z.string().trim().min(8, "Deskripsi produk minimal 8 karakter.").max(700),
    price: zod_1.z.coerce.number().int().min(0, "Harga tidak boleh negatif."),
    stock: zod_1.z.coerce.number().int().min(0, "Stock tidak boleh negatif."),
    category: zod_1.z.string().trim().min(2).max(60).default("General"),
    image: imageSchema,
});
