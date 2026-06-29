"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateCheckout = calculateCheckout;
exports.createOrder = createOrder;
const database_1 = require("../config/database");
const commerce_1 = require("../constants/commerce");
const cart_model_1 = require("../models/cart.model");
const wallet_model_1 = require("../models/wallet.model");
const http_error_1 = require("../utils/http-error");
const id_service_1 = require("./id.service");
function calculateCheckout(subtotal, deliveryMethod) {
    const deliveryFee = commerce_1.deliveryFees[deliveryMethod];
    const ppn = Math.round(subtotal * commerce_1.ppnRate);
    const finalTotal = subtotal + deliveryFee + ppn;
    return {
        subtotal,
        deliveryMethod,
        deliveryFee,
        ppn,
        ppnRate: commerce_1.ppnRate,
        finalTotal,
    };
}
async function createOrder(input) {
    const client = await database_1.pool.connect();
    try {
        await client.query("BEGIN");
        const address = await client.query("SELECT id FROM buyer_addresses WHERE id = $1 AND user_id = $2", [input.addressId, input.buyerId]);
        if (!address.rows[0]) {
            throw new http_error_1.HttpError(404, "Alamat pengiriman tidak ditemukan.");
        }
        const checkoutCart = await cart_model_1.CartModel.getForCheckoutWithClient(client, input.buyerId);
        if (!checkoutCart || checkoutCart.items.length === 0) {
            throw new http_error_1.HttpError(400, "Keranjang masih kosong.");
        }
        if (!checkoutCart.cart.store_id || !checkoutCart.sellerId) {
            throw new http_error_1.HttpError(400, "Keranjang belum memiliki toko yang valid.");
        }
        for (const item of checkoutCart.items) {
            if (item.stock < item.quantity) {
                throw new http_error_1.HttpError(400, `Stock ${item.product_name} tidak cukup.`);
            }
        }
        const subtotal = checkoutCart.items.reduce((total, item) => total + item.subtotal, 0);
        const totals = calculateCheckout(subtotal, input.deliveryMethod);
        const paid = await wallet_model_1.WalletModel.deductWithClient(client, input.buyerId, totals.finalTotal, "Pembayaran order SEAPEDIA");
        if (!paid) {
            throw new http_error_1.HttpError(400, "Saldo wallet tidak cukup untuk checkout.");
        }
        const orderId = (0, id_service_1.createId)("ord");
        await client.query(`INSERT INTO orders
        (id, buyer_id, seller_id, store_id, address_id, delivery_method, delivery_fee, subtotal, ppn, final_total, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`, [
            orderId,
            input.buyerId,
            checkoutCart.sellerId,
            checkoutCart.cart.store_id,
            input.addressId,
            input.deliveryMethod,
            totals.deliveryFee,
            totals.subtotal,
            totals.ppn,
            totals.finalTotal,
            commerce_1.OrderStatus.PACKING,
        ]);
        for (const item of checkoutCart.items) {
            await client.query(`UPDATE products
         SET stock = stock - $2, updated_at = NOW()
         WHERE id = $1 AND stock >= $2`, [item.product_id, item.quantity]);
            await client.query(`INSERT INTO order_items (id, order_id, product_id, product_name, unit_price, quantity, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
                (0, id_service_1.createId)("oit"),
                orderId,
                item.product_id,
                item.product_name,
                item.unit_price,
                item.quantity,
                item.subtotal,
            ]);
        }
        await client.query(`INSERT INTO order_status_history (id, order_id, status, note)
       VALUES ($1, $2, $3, $4)`, [(0, id_service_1.createId)("osh"), orderId, commerce_1.OrderStatus.PACKING, "Order berhasil dibuat dari checkout."]);
        await cart_model_1.CartModel.clearWithClient(client, checkoutCart.cart.id);
        await client.query("COMMIT");
        return { orderId, checkout: totals };
    }
    catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }
    finally {
        client.release();
    }
}
