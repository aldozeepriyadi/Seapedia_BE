import { z } from "zod";

const discountCodeSchema = z
  .string()
  .trim()
  .min(3, "Kode minimal 3 karakter.")
  .max(40, "Kode maksimal 40 karakter.")
  .regex(/^[a-zA-Z0-9_-]+$/, "Kode hanya boleh huruf, angka, underscore, atau dash.")
  .transform((value) => value.toUpperCase());

const futureDateTimeSchema = z
  .string()
  .datetime("Expiry date harus ISO datetime yang valid.")
  .refine(
    (value) => new Date(value).getTime() > Date.now(),
    "Expiry date harus tanggal masa depan.",
  );

export const voucherSchema = z.object({
  code: discountCodeSchema,
  discountAmount: z.coerce
    .number()
    .int("Nominal diskon harus angka bulat.")
    .min(1000, "Nominal diskon minimal Rp 1.000.")
    .max(100000000, "Nominal diskon terlalu besar."),
  expiryDate: futureDateTimeSchema,
  remainingUsage: z.coerce
    .number()
    .int("Remaining usage harus angka bulat.")
    .min(1, "Remaining usage minimal 1.")
    .max(1000000, "Remaining usage terlalu besar."),
});

export const promoSchema = z.object({
  code: discountCodeSchema,
  discountAmount: z.coerce
    .number()
    .int("Nominal diskon harus angka bulat.")
    .min(1000, "Nominal diskon minimal Rp 1.000.")
    .max(100000000, "Nominal diskon terlalu besar."),
  expiryDate: futureDateTimeSchema,
});
