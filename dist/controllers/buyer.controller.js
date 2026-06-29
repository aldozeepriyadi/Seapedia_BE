"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuyerController = void 0;
const checkout_service_1 = require("../services/checkout.service");
const address_model_1 = require("../models/address.model");
const cart_model_1 = require("../models/cart.model");
const order_model_1 = require("../models/order.model");
const wallet_model_1 = require("../models/wallet.model");
const http_error_1 = require("../utils/http-error");
const buyer_validator_1 = require("../validators/buyer.validator");
class BuyerController {
    static async wallet(req, res) {
        const wallet = await wallet_model_1.WalletModel.getSummary(req.auth.userId);
        res.json({ wallet });
    }
    static async topUp(req, res) {
        const payload = buyer_validator_1.topUpSchema.parse(req.body);
        const wallet = await wallet_model_1.WalletModel.topUp(req.auth.userId, payload.amount);
        res.json({ wallet });
    }
    static async addresses(req, res) {
        const addresses = await address_model_1.AddressModel.findManyByUser(req.auth.userId);
        res.json({ addresses });
    }
    static async createAddress(req, res) {
        const payload = buyer_validator_1.addressSchema.parse(req.body);
        const address = await address_model_1.AddressModel.create(req.auth.userId, payload);
        res.status(201).json({ address });
    }
    static async cart(req, res) {
        const cart = await cart_model_1.CartModel.getSummary(req.auth.userId);
        res.json({ cart });
    }
    static async addCartItem(req, res) {
        const payload = buyer_validator_1.addCartItemSchema.parse(req.body);
        const cart = await cart_model_1.CartModel.addItem(req.auth.userId, payload.productId, payload.quantity);
        res.status(201).json({ cart });
    }
    static async updateCartItem(req, res) {
        const payload = buyer_validator_1.updateCartItemSchema.parse(req.body);
        const cart = await cart_model_1.CartModel.updateItem(req.auth.userId, String(req.params.productId), payload.quantity);
        res.json({ cart });
    }
    static async removeCartItem(req, res) {
        const cart = await cart_model_1.CartModel.removeItem(req.auth.userId, String(req.params.productId));
        res.json({ cart });
    }
    static async clearCart(req, res) {
        const cart = await cart_model_1.CartModel.clear(req.auth.userId);
        res.json({ cart });
    }
    static async checkoutPreview(req, res) {
        const payload = buyer_validator_1.checkoutSchema.parse(req.body);
        const cart = await cart_model_1.CartModel.getSummary(req.auth.userId);
        if (cart.items.length === 0) {
            throw new http_error_1.HttpError(400, "Keranjang masih kosong.");
        }
        res.json({ checkout: (0, checkout_service_1.calculateCheckout)(cart.subtotal, payload.deliveryMethod) });
    }
    static async checkout(req, res) {
        const payload = buyer_validator_1.checkoutSchema.parse(req.body);
        const order = await (0, checkout_service_1.createOrder)({
            buyerId: req.auth.userId,
            addressId: payload.addressId,
            deliveryMethod: payload.deliveryMethod,
        });
        res.status(201).json(order);
    }
    static async orders(req, res) {
        const orders = await order_model_1.OrderModel.findBuyerOrders(req.auth.userId);
        res.json({ orders });
    }
    static async report(req, res) {
        const report = await order_model_1.OrderModel.buyerReport(req.auth.userId);
        res.json({ report });
    }
    static async orderDetail(req, res) {
        const detail = await order_model_1.OrderModel.findDetailForUser(String(req.params.id), req.auth.userId);
        if (!detail) {
            throw new http_error_1.HttpError(404, "Order tidak ditemukan.");
        }
        res.json(detail);
    }
}
exports.BuyerController = BuyerController;
