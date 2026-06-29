import { z } from "zod";
import { DeliveryMethod } from "../constants/commerce";

export const topUpSchema = z.object({
  amount: z.coerce.number().int().min(1000).max(10000000),
});

export const addressSchema = z.object({
  recipientName: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(8).max(20),
  addressLine: z.string().trim().min(8).max(300),
  city: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().min(3).max(12),
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
});
