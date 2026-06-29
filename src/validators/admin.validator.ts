import { z } from "zod";

export const voucherSchema = z.object({
  code: z.string().trim().min(3).max(40).transform((value) => value.toUpperCase()),
  discountAmount: z.coerce.number().int().min(1000),
  expiryDate: z.string().datetime(),
  remainingUsage: z.coerce.number().int().min(1),
});

export const promoSchema = z.object({
  code: z.string().trim().min(3).max(40).transform((value) => value.toUpperCase()),
  discountAmount: z.coerce.number().int().min(1000),
  expiryDate: z.string().datetime(),
});
