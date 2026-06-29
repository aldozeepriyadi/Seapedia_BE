import { z } from "zod";

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
  storeName: z.string().trim().min(3, "Nama toko minimal 3 karakter.").max(80),
  description: z.string().trim().min(8, "Deskripsi toko minimal 8 karakter.").max(300),
});

export const productSchema = z.object({
  name: z.string().trim().min(3, "Nama produk minimal 3 karakter.").max(100),
  description: z.string().trim().min(8, "Deskripsi produk minimal 8 karakter.").max(700),
  price: z.coerce.number().int().min(0, "Harga tidak boleh negatif."),
  stock: z.coerce.number().int().min(0, "Stock tidak boleh negatif."),
  category: z.string().trim().min(2).max(60).default("General"),
  image: imageSchema,
});
