import { PoolClient } from "pg";
import { pool, query } from "../config/database";
import { createId } from "../services/id.service";
import { HttpError } from "../utils/http-error";
import { CartSummary } from "./database.model";

type CartRow = {
  id: string;
  user_id: string;
  store_id: string | null;
  store_name: string | null;
};

type CartItemRow = {
  id: string;
  product_id: string;
  name: string;
  price: number;
  stock: number;
  quantity: number;
  subtotal: number;
  store_id: string;
  store_name: string;
  image: string;
};

async function getOrCreateCartId(userId: string) {
  const existing = await query<{ id: string }>("SELECT id FROM carts WHERE user_id = $1", [
    userId,
  ]);

  if (existing.rows[0]) return existing.rows[0].id;

  const created = await query<{ id: string }>(
    `INSERT INTO carts (id, user_id)
     VALUES ($1, $2)
     RETURNING id`,
    [createId("crt"), userId],
  );

  return created.rows[0]!.id;
}

async function mapCart(userId: string): Promise<CartSummary> {
  const cartId = await getOrCreateCartId(userId);
  const cart = await query<CartRow>(
    `SELECT carts.id, carts.user_id, carts.store_id, stores.store_name
     FROM carts
     LEFT JOIN stores ON stores.id = carts.store_id
     WHERE carts.id = $1`,
    [cartId],
  );
  const items = await query<CartItemRow>(
    `SELECT
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
     ORDER BY cart_items.created_at ASC`,
    [cartId],
  );

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
    id: cart.rows[0]!.id,
    userId: cart.rows[0]!.user_id,
    storeId: cart.rows[0]!.store_id,
    storeName: cart.rows[0]!.store_name,
    items: mappedItems,
    subtotal: mappedItems.reduce((total, item) => total + item.subtotal, 0),
  };
}

export class CartModel {
  static async getSummary(userId: string) {
    return mapCart(userId);
  }

  static async addItem(userId: string, productId: string, quantity: number) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const cartId = await getOrCreateCartId(userId);
      const product = await client.query<{
        id: string;
        store_id: string;
        stock: number;
      }>("SELECT id, store_id, stock FROM products WHERE id = $1 FOR UPDATE", [productId]);

      if (!product.rows[0]) {
        throw new HttpError(404, "Produk tidak ditemukan.");
      }

      if (Number(product.rows[0].stock) < quantity) {
        throw new HttpError(400, "Stock produk tidak cukup.");
      }

      const cart = await client.query<{ store_id: string | null }>(
        "SELECT store_id FROM carts WHERE id = $1 FOR UPDATE",
        [cartId],
      );
      const cartStoreId = cart.rows[0]?.store_id ?? null;
      const productStoreId = product.rows[0].store_id;

      if (cartStoreId && cartStoreId !== productStoreId) {
        throw new HttpError(
          400,
          "Keranjang hanya boleh berisi produk dari satu toko. Kosongkan keranjang untuk memilih toko lain.",
        );
      }

      if (!cartStoreId) {
        await client.query("UPDATE carts SET store_id = $2, updated_at = NOW() WHERE id = $1", [
          cartId,
          productStoreId,
        ]);
      }

      await client.query(
        `INSERT INTO cart_items (id, cart_id, product_id, quantity)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (cart_id, product_id)
         DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity, updated_at = NOW()`,
        [createId("cit"), cartId, productId, quantity],
      );

      await client.query("COMMIT");
      return mapCart(userId);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateItem(userId: string, productId: string, quantity: number) {
    const cartId = await getOrCreateCartId(userId);

    await query(
      `UPDATE cart_items
       SET quantity = $3, updated_at = NOW()
       WHERE cart_id = $1 AND product_id = $2`,
      [cartId, productId, quantity],
    );

    return mapCart(userId);
  }

  static async removeItem(userId: string, productId: string) {
    const cartId = await getOrCreateCartId(userId);

    await query("DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2", [
      cartId,
      productId,
    ]);
    await this.normalizeStore(cartId);

    return mapCart(userId);
  }

  static async clear(userId: string) {
    const cartId = await getOrCreateCartId(userId);
    await query("DELETE FROM cart_items WHERE cart_id = $1", [cartId]);
    await query("UPDATE carts SET store_id = NULL, updated_at = NOW() WHERE id = $1", [cartId]);

    return mapCart(userId);
  }

  static async getForCheckoutWithClient(client: PoolClient, userId: string) {
    const cart = await client.query<{
      id: string;
      store_id: string | null;
    }>(
      `SELECT carts.id, carts.store_id
       FROM carts
       WHERE carts.user_id = $1
       FOR UPDATE`,
      [userId],
    );

    if (!cart.rows[0]) return null;

    const store = cart.rows[0].store_id
      ? await client.query<{ seller_id: string }>(
          "SELECT seller_id FROM stores WHERE id = $1",
          [cart.rows[0].store_id],
        )
      : null;

    const items = await client.query<{
      product_id: string;
      product_name: string;
      unit_price: number;
      quantity: number;
      stock: number;
      subtotal: number;
    }>(
      `SELECT
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
       FOR UPDATE OF products`,
      [cart.rows[0].id],
    );

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

  static async clearWithClient(client: PoolClient, cartId: string) {
    await client.query("DELETE FROM cart_items WHERE cart_id = $1", [cartId]);
    await client.query("UPDATE carts SET store_id = NULL, updated_at = NOW() WHERE id = $1", [
      cartId,
    ]);
  }

  private static async normalizeStore(cartId: string) {
    const remaining = await query<{ store_id: string }>(
      `SELECT products.store_id
       FROM cart_items
       JOIN products ON products.id = cart_items.product_id
       WHERE cart_items.cart_id = $1
       LIMIT 1`,
      [cartId],
    );

    await query("UPDATE carts SET store_id = $2, updated_at = NOW() WHERE id = $1", [
      cartId,
      remaining.rows[0]?.store_id ?? null,
    ]);
  }
}
