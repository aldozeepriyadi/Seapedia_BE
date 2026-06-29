"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartModel = void 0;
const database_1 = require("../config/database");
const id_service_1 = require("../services/id.service");
const http_error_1 = require("../utils/http-error");
async function getOrCreateCartId(userId) {
    const existing = await (0, database_1.query)("SELECT id FROM carts WHERE user_id = $1", [
        userId,
    ]);
    if (existing.rows[0])
        return existing.rows[0].id;
    const created = await (0, database_1.query)(`INSERT INTO carts (id, user_id)
     VALUES ($1, $2)
     RETURNING id`, [(0, id_service_1.createId)("crt"), userId]);
    return created.rows[0].id;
}
async function mapCart(userId) {
    const cartId = await getOrCreateCartId(userId);
    const cart = await (0, database_1.query)(`SELECT carts.id, carts.user_id, carts.store_id, stores.store_name
     FROM carts
     LEFT JOIN stores ON stores.id = carts.store_id
     WHERE carts.id = $1`, [cartId]);
    const items = await (0, database_1.query)(`SELECT
      cart_items.id,
      products.id AS product_id,
      products.name,
      products.price,
      products.stock,
      cart_items.quantity,
      products.price * cart_items.quantity AS subtotal,
      products.store_id,
      stores.store_name,
      products.image
     FROM cart_items
     JOIN products ON products.id = cart_items.product_id
     JOIN stores ON stores.id = products.store_id
     WHERE cart_items.cart_id = $1
     ORDER BY cart_items.created_at ASC`, [cartId]);
    const mappedItems = items.rows.map((item) => ({
        id: item.id,
        productId: item.product_id,
        name: item.name,
        price: Number(item.price),
        stock: Number(item.stock),
        quantity: Number(item.quantity),
        subtotal: Number(item.subtotal),
        storeId: item.store_id,
        storeName: item.store_name,
        image: item.image,
    }));
    return {
        id: cart.rows[0].id,
        userId: cart.rows[0].user_id,
        storeId: cart.rows[0].store_id,
        storeName: cart.rows[0].store_name,
        items: mappedItems,
        subtotal: mappedItems.reduce((total, item) => total + item.subtotal, 0),
    };
}
class CartModel {
    static async getSummary(userId) {
        return mapCart(userId);
    }
    static async addItem(userId, productId, quantity) {
        const client = await database_1.pool.connect();
        try {
            await client.query("BEGIN");
            const cartId = await getOrCreateCartId(userId);
            const product = await client.query("SELECT id, store_id, stock FROM products WHERE id = $1 FOR UPDATE", [productId]);
            if (!product.rows[0]) {
                throw new http_error_1.HttpError(404, "Produk tidak ditemukan.");
            }
            if (Number(product.rows[0].stock) < quantity) {
                throw new http_error_1.HttpError(400, "Stock produk tidak cukup.");
            }
            const cart = await client.query("SELECT store_id FROM carts WHERE id = $1 FOR UPDATE", [cartId]);
            const cartStoreId = cart.rows[0]?.store_id ?? null;
            const productStoreId = product.rows[0].store_id;
            if (cartStoreId && cartStoreId !== productStoreId) {
                throw new http_error_1.HttpError(400, "Keranjang hanya boleh berisi produk dari satu toko. Kosongkan keranjang untuk memilih toko lain.");
            }
            if (!cartStoreId) {
                await client.query("UPDATE carts SET store_id = $2, updated_at = NOW() WHERE id = $1", [
                    cartId,
                    productStoreId,
                ]);
            }
            await client.query(`INSERT INTO cart_items (id, cart_id, product_id, quantity)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (cart_id, product_id)
         DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity, updated_at = NOW()`, [(0, id_service_1.createId)("cit"), cartId, productId, quantity]);
            await client.query("COMMIT");
            return mapCart(userId);
        }
        catch (error) {
            await client.query("ROLLBACK");
            throw error;
        }
        finally {
            client.release();
        }
    }
    static async updateItem(userId, productId, quantity) {
        const cartId = await getOrCreateCartId(userId);
        await (0, database_1.query)(`UPDATE cart_items
       SET quantity = $3, updated_at = NOW()
       WHERE cart_id = $1 AND product_id = $2`, [cartId, productId, quantity]);
        return mapCart(userId);
    }
    static async removeItem(userId, productId) {
        const cartId = await getOrCreateCartId(userId);
        await (0, database_1.query)("DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2", [
            cartId,
            productId,
        ]);
        await this.normalizeStore(cartId);
        return mapCart(userId);
    }
    static async clear(userId) {
        const cartId = await getOrCreateCartId(userId);
        await (0, database_1.query)("DELETE FROM cart_items WHERE cart_id = $1", [cartId]);
        await (0, database_1.query)("UPDATE carts SET store_id = NULL, updated_at = NOW() WHERE id = $1", [cartId]);
        return mapCart(userId);
    }
    static async getForCheckoutWithClient(client, userId) {
        const cart = await client.query(`SELECT carts.id, carts.store_id
       FROM carts
       WHERE carts.user_id = $1
       FOR UPDATE`, [userId]);
        if (!cart.rows[0])
            return null;
        const store = cart.rows[0].store_id
            ? await client.query("SELECT seller_id FROM stores WHERE id = $1", [cart.rows[0].store_id])
            : null;
        const items = await client.query(`SELECT
        products.id AS product_id,
        products.name AS product_name,
        products.price AS unit_price,
        cart_items.quantity,
        products.stock,
        products.price * cart_items.quantity AS subtotal
       FROM cart_items
       JOIN products ON products.id = cart_items.product_id
       WHERE cart_items.cart_id = $1
       ORDER BY cart_items.created_at ASC
       FOR UPDATE OF products`, [cart.rows[0].id]);
        return {
            cart: cart.rows[0],
            sellerId: store?.rows[0]?.seller_id ?? null,
            items: items.rows.map((item) => ({
                ...item,
                unit_price: Number(item.unit_price),
                quantity: Number(item.quantity),
                stock: Number(item.stock),
                subtotal: Number(item.subtotal),
            })),
        };
    }
    static async clearWithClient(client, cartId) {
        await client.query("DELETE FROM cart_items WHERE cart_id = $1", [cartId]);
        await client.query("UPDATE carts SET store_id = NULL, updated_at = NOW() WHERE id = $1", [
            cartId,
        ]);
    }
    static async normalizeStore(cartId) {
        const remaining = await (0, database_1.query)(`SELECT products.store_id
       FROM cart_items
       JOIN products ON products.id = cart_items.product_id
       WHERE cart_items.cart_id = $1
       LIMIT 1`, [cartId]);
        await (0, database_1.query)("UPDATE carts SET store_id = $2, updated_at = NOW() WHERE id = $1", [
            cartId,
            remaining.rows[0]?.store_id ?? null,
        ]);
    }
}
exports.CartModel = CartModel;
