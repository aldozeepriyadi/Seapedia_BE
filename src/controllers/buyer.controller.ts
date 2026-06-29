import { Response } from "express";
import { pool } from "../config/database";
import { calculateCheckout, createOrder } from "../services/checkout.service";
import { AddressModel } from "../models/address.model";
import { CartModel } from "../models/cart.model";
import { OrderModel } from "../models/order.model";
import { WalletModel } from "../models/wallet.model";
import { DiscountModel } from "../models/discount.model";
import { AuthedRequest } from "../types/auth";
import { HttpError } from "../utils/http-error";
import {
  addCartItemSchema,
  addressSchema,
  checkoutSchema,
  topUpSchema,
  updateCartItemSchema,
} from "../validators/buyer.validator";

export class BuyerController {
  static async wallet(req: AuthedRequest, res: Response) {
    const wallet = await WalletModel.getSummary(req.auth!.userId);
    res.json({ wallet });
  }

  static async topUp(req: AuthedRequest, res: Response) {
    const payload = topUpSchema.parse(req.body);
    const wallet = await WalletModel.topUp(req.auth!.userId, payload.amount);
    res.json({ wallet });
  }

  static async addresses(req: AuthedRequest, res: Response) {
    const addresses = await AddressModel.findManyByUser(req.auth!.userId);
    res.json({ addresses });
  }

  static async createAddress(req: AuthedRequest, res: Response) {
    const payload = addressSchema.parse(req.body);
    const address = await AddressModel.create(req.auth!.userId, payload);
    res.status(201).json({ address });
  }

  static async cart(req: AuthedRequest, res: Response) {
    const cart = await CartModel.getSummary(req.auth!.userId);
    res.json({ cart });
  }

  static async addCartItem(req: AuthedRequest, res: Response) {
    const payload = addCartItemSchema.parse(req.body);
    const cart = await CartModel.addItem(req.auth!.userId, payload.productId, payload.quantity);
    res.status(201).json({ cart });
  }

  static async updateCartItem(req: AuthedRequest, res: Response) {
    const payload = updateCartItemSchema.parse(req.body);
    const cart = await CartModel.updateItem(
      req.auth!.userId,
      String(req.params.productId),
      payload.quantity,
    );
    res.json({ cart });
  }

  static async removeCartItem(req: AuthedRequest, res: Response) {
    const cart = await CartModel.removeItem(req.auth!.userId, String(req.params.productId));
    res.json({ cart });
  }

  static async clearCart(req: AuthedRequest, res: Response) {
    const cart = await CartModel.clear(req.auth!.userId);
    res.json({ cart });
  }

  static async checkoutPreview(req: AuthedRequest, res: Response) {
    const payload = checkoutSchema.parse(req.body);
    const cart = await CartModel.getSummary(req.auth!.userId);

    if (cart.items.length === 0) {
      throw new HttpError(400, "Keranjang masih kosong.");
    }

    const client = await pool.connect();
    try {
      const discount = await DiscountModel.validateWithClient(
        client,
        payload.discountCode,
        cart.subtotal,
      );
      res.json({
        checkout: calculateCheckout(cart.subtotal, payload.deliveryMethod, discount),
      });
    } finally {
      client.release();
    }
  }

  static async checkout(req: AuthedRequest, res: Response) {
    const payload = checkoutSchema.parse(req.body);
    const order = await createOrder({
      buyerId: req.auth!.userId,
      addressId: payload.addressId,
      deliveryMethod: payload.deliveryMethod,
      discountCode: payload.discountCode || undefined,
    });

    res.status(201).json(order);
  }

  static async orders(req: AuthedRequest, res: Response) {
    const orders = await OrderModel.findBuyerOrders(req.auth!.userId);
    res.json({ orders });
  }

  static async report(req: AuthedRequest, res: Response) {
    const report = await OrderModel.buyerReport(req.auth!.userId);
    res.json({ report });
  }

  static async orderDetail(req: AuthedRequest, res: Response) {
    const detail = await OrderModel.findDetailForUser(String(req.params.id), req.auth!.userId);

    if (!detail) {
      throw new HttpError(404, "Order tidak ditemukan.");
    }

    res.json(detail);
  }
}
