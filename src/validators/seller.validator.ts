import { z } from "zod";
import {
  isSafePlainText,
  normalizePlainText,
  safePlainTextMessage,
} from "../utils/security";

const safeText = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `${label} minimal ${min} karakter.`)
    .max(max, `${label} maksimal ${max} karakter.`)
    .refine(isSafePlainText, safePlainTextMessage)
    .transform(normalizePlainText);

const imageSchema = z
  .string()
  .trim()
  .max(3_000_000)
  .refine(
    (value) =>
      value === "" ||
      z.string().url().safeParse(value).success ||
      /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(value),
    "Image harus berupa URL valid atau file image yang valid.",
  )
  .default("");

export const storeSchema = z.object({
  storeName: safeText(3, 80, "Nama toko"),
  description: safeText(8, 300, "Deskripsi toko"),
});

export const productSchema = z.object({
  name: safeText(3, 100, "Nama produk"),
  description: safeText(8, 700, "Deskripsi produk"),
  price: z.coerce
    .number()
    .int("Harga harus angka bulat.")
    .min(0, "Harga tidak boleh negatif.")
    .max(1000000000, "Harga terlalu besar."),
  stock: z.coerce
    .number()
    .int("Stock harus angka bulat.")
    .min(0, "Stock tidak boleh negatif.")
    .max(1000000, "Stock terlalu besar."),
  category: safeText(2, 60, "Kategori").default("General"),
  image: imageSchema,
});
