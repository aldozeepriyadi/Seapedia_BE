import { z } from "zod";
import { DeliveryMethod } from "../constants/commerce";
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

export const topUpSchema = z.object({
  amount: z.coerce.number().int().min(1000).max(10000000),
});

export const addressSchema = z.object({
  recipientName: safeText(2, 80, "Nama penerima"),
  phone: z
    .string()
    .trim()
    .min(8, "Nomor telepon minimal 8 karakter.")
    .max(20, "Nomor telepon maksimal 20 karakter.")
    .regex(/^\+?[0-9][0-9 -]{6,18}[0-9]$/, "Nomor telepon hanya boleh angka, spasi, tanda plus, atau dash."),
  addressLine: safeText(8, 300, "Alamat"),
  city: safeText(2, 80, "Kota"),
  postalCode: z
    .string()
    .trim()
    .min(3, "Kode pos minimal 3 karakter.")
    .max(12, "Kode pos maksimal 12 karakter.")
    .regex(/^[a-zA-Z0-9 -]+$/, "Kode pos hanya boleh huruf, angka, spasi, atau dash."),
  isPrimary: z.boolean().default(false),
});

export const addCartItemSchema = z.object({
  productId: z.string().trim().min(1),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(99),
});

export const checkoutSchema = z.object({
  addressId: z.string().trim().min(1),
  deliveryMethod: z.enum([
    DeliveryMethod.INSTANT,
    DeliveryMethod.NEXT_DAY,
    DeliveryMethod.REGULAR,
  ]),
  discountCode: z
    .string()
    .trim()
    .max(40, "Kode diskon maksimal 40 karakter.")
    .refine(
      (value) => value === "" || /^[a-zA-Z0-9_-]+$/.test(value),
      "Kode diskon hanya boleh huruf, angka, underscore, atau dash.",
    )
    .transform((value) => value.toUpperCase())
    .optional()
    .or(z.literal("")),
});
