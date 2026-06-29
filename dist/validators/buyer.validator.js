"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkoutSchema = exports.updateCartItemSchema = exports.addCartItemSchema = exports.addressSchema = exports.topUpSchema = void 0;
const zod_1 = require("zod");
const commerce_1 = require("../constants/commerce");
exports.topUpSchema = zod_1.z.object({
    amount: zod_1.z.coerce.number().int().min(1000).max(10000000),
});
exports.addressSchema = zod_1.z.object({
    recipientName: zod_1.z.string().trim().min(2).max(80),
    phone: zod_1.z.string().trim().min(8).max(20),
    addressLine: zod_1.z.string().trim().min(8).max(300),
    city: zod_1.z.string().trim().min(2).max(80),
    postalCode: zod_1.z.string().trim().min(3).max(12),
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
});
