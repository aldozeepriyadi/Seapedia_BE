import { query } from "../config/database";
import { DeliveryJobStatus, OrderStatus } from "../constants/commerce";
import { createId } from "../services/id.service";
import { OrderSummary } from "./database.model";

type OrderRow = {
  id: string;
  buyer_id: string;
  buyer_name: string;
  seller_id: string;
  store_id: string;
  store_name: string;
  delivery_method: "Instant" | "Next Day" | "Regular";
  delivery_fee: number;
  subtotal: number;
  ppn: number;
  final_total: number;
  discount_code: string | null;
  discount_type: string | null;
  discount_amount: number;
  taxable_amount: number;
  status: string;
  created_at: Date;
};

function mapOrder(row: OrderRow): OrderSummary {
  return {
    id: row.id,
    buyerId: row.buyer_id,
    buyerName: row.buyer_name,
    sellerId: row.seller_id,
    storeId: row.store_id,
    storeName: row.store_name,
    deliveryMethod: row.delivery_method,
    deliveryFee: Number(row.delivery_fee),
    subtotal: Number(row.subtotal),
    ppn: Number(row.ppn),
    finalTotal: Number(row.final_total),
    discountCode: row.discount_code,
    discountType: row.discount_type,
    discountAmount: Number(row.discount_amount),
    taxableAmount: Number(row.taxable_amount),
    status: row.status,
    createdAt: row.created_at.toISOString(),
  };
}

const orderSelect = `
  SELECT
    orders.id,
    orders.buyer_id,
    users.display_name AS buyer_name,
    orders.seller_id,
    orders.store_id,
    stores.store_name,
    orders.delivery_method,
    orders.delivery_fee,
    orders.subtotal,
    orders.ppn,
    orders.final_total,
    orders.discount_code,
    orders.discount_type,
    orders.discount_amount,
    orders.taxable_amount,
    orders.status,
    orders.created_at
  FROM orders
  JOIN users ON users.id = orders.buyer_id
  JOIN stores ON stores.id = orders.store_id
`;

export class OrderModel {
  static async findBuyerOrders(buyerId: string) {
    const result = await query<OrderRow>(
      `${orderSelect}
       WHERE orders.buyer_id = $1
       ORDER BY orders.created_at DESC`,
      [buyerId],
    );

    return result.rows.map(mapOrder);
  }

  static async findSellerOrders(sellerId: string) {
    const result = await query<OrderRow>(
      `${orderSelect}
       WHERE orders.seller_id = $1
       ORDER BY orders.created_at DESC`,
      [sellerId],
    );

    return result.rows.map(mapOrder);
  }

  static async findDetailForUser(orderId: string, userId: string) {
    const order = await query<OrderRow>(
      `${orderSelect}
       WHERE orders.id = $1 AND (orders.buyer_id = $2 OR orders.seller_id = $2)`,
      [orderId, userId],
    );

    if (!order.rows[0]) return null;

    const items = await query<{
      id: string;
      product_id: string;
      product_name: string;
      unit_price: number;
      quantity: number;
      subtotal: number;
    }>(
      `SELECT id, product_id, product_name, unit_price, quantity, subtotal
       FROM order_items
       WHERE order_id = $1
       ORDER BY id ASC`,
      [orderId],
    );
    const history = await query<{
      id: string;
      status: string;
      note: string;
      created_at: Date;
    }>(
      `SELECT id, status, note, created_at
       FROM order_status_history
       WHERE order_id = $1
       ORDER BY created_at ASC`,
      [orderId],
    );

    return {
      order: mapOrder(order.rows[0]),
      items: items.rows.map((item) => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        unitPrice: Number(item.unit_price),
        quantity: Number(item.quantity),
        subtotal: Number(item.subtotal),
      })),
      history: history.rows.map((item) => ({
        id: item.id,
        status: item.status,
        note: item.note,
        createdAt: item.created_at.toISOString(),
      })),
    };
  }

  static async buyerReport(buyerId: string) {
    const result = await query<{
      order_count: string;
      total_spending: string;
      total_discount: string;
      total_ppn: string;
      total_delivery_fee: string;
    }>(
      `SELECT
        COUNT(*) AS order_count,
        COALESCE(SUM(final_total), 0) AS total_spending,
        COALESCE(SUM(discount_amount), 0) AS total_discount,
        COALESCE(SUM(ppn), 0) AS total_ppn,
        COALESCE(SUM(delivery_fee), 0) AS total_delivery_fee
       FROM orders
       WHERE buyer_id = $1`,
      [buyerId],
    );

    return {
      orderCount: Number(result.rows[0]?.order_count ?? 0),
      totalSpending: Number(result.rows[0]?.total_spending ?? 0),
      totalDiscount: Number(result.rows[0]?.total_discount ?? 0),
      totalPpn: Number(result.rows[0]?.total_ppn ?? 0),
      totalDeliveryFee: Number(result.rows[0]?.total_delivery_fee ?? 0),
    };
  }

  static async sellerReport(sellerId: string) {
    const result = await query<{
      order_count: string;
      total_income: string;
      total_discount: string;
      pending_orders: string;
      processed_orders: string;
    }>(
      `SELECT
        COUNT(*) AS order_count,
        COALESCE(SUM(final_total - delivery_fee) FILTER (WHERE status <> $3), 0) AS total_income,
        COALESCE(SUM(discount_amount), 0) AS total_discount,
        COUNT(*) FILTER (WHERE status = $2) AS pending_orders,
        COUNT(*) FILTER (WHERE status <> $2) AS processed_orders
       FROM orders
       WHERE seller_id = $1`,
      [sellerId, OrderStatus.PACKING, OrderStatus.RETURNED],
    );

    return {
      orderCount: Number(result.rows[0]?.order_count ?? 0),
      totalIncome: Number(result.rows[0]?.total_income ?? 0),
      totalDiscount: Number(result.rows[0]?.total_discount ?? 0),
      pendingOrders: Number(result.rows[0]?.pending_orders ?? 0),
      processedOrders: Number(result.rows[0]?.processed_orders ?? 0),
    };
  }

  static async processBySeller(orderId: string, sellerId: string) {
    const result = await query<OrderRow>(
      `WITH updated_order AS (
        UPDATE orders
        SET status = $3, updated_at = NOW()
        WHERE id = $1 AND seller_id = $2 AND status = $4
        RETURNING *
      ),
      inserted_history AS (
        INSERT INTO order_status_history (id, order_id, status, note)
        SELECT $5, id, $3, 'Seller memproses order dan menunggu pengirim.'
        FROM updated_order
        RETURNING id
      ),
      inserted_delivery_job AS (
        INSERT INTO delivery_jobs (id, order_id, status, earning_amount)
        SELECT $6, id, $7, delivery_fee
        FROM updated_order
        ON CONFLICT (order_id) DO NOTHING
        RETURNING id
      )
      SELECT
        updated_order.id,
        updated_order.buyer_id,
        users.display_name AS buyer_name,
        updated_order.seller_id,
        updated_order.store_id,
        stores.store_name,
        updated_order.delivery_method,
        updated_order.delivery_fee,
        updated_order.subtotal,
        updated_order.ppn,
        updated_order.final_total,
        updated_order.discount_code,
        updated_order.discount_type,
        updated_order.discount_amount,
        updated_order.taxable_amount,
        updated_order.status,
        updated_order.created_at
      FROM updated_order
      JOIN users ON users.id = updated_order.buyer_id
      JOIN stores ON stores.id = updated_order.store_id`,
      [
        orderId,
        sellerId,
        OrderStatus.WAITING_DRIVER,
        OrderStatus.PACKING,
        createId("osh"),
        createId("dlj"),
        DeliveryJobStatus.AVAILABLE,
      ],
    );

    return result.rows[0] ? mapOrder(result.rows[0]) : null;
  }
}
