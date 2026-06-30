import { pool, query } from "../config/database";
import {
  DeliveryJobStatus,
  DeliveryMethod,
  deliverySlaHours,
  OrderStatus,
} from "../constants/commerce";
import { createId } from "../services/id.service";
import { WalletModel } from "./wallet.model";

type CountRow = { count: string };

type MonitoringOrderRow = {
  id: string;
  buyer_name: string;
  store_name: string;
  delivery_method: DeliveryMethod;
  final_total: number;
  status: string;
  created_at: Date;
};

type MonitoringUserRow = {
  id: string;
  username: string;
  display_name: string;
  roles: string[];
  created_at: Date;
};

type MonitoringStoreRow = {
  id: string;
  store_name: string;
  seller_name: string;
  product_count: string;
  created_at: Date;
};

type MonitoringProductRow = {
  id: string;
  name: string;
  store_name: string;
  category: string;
  price: number;
  stock: number;
  created_at: Date;
};

type MonitoringDeliveryRow = {
  id: string;
  order_id: string;
  store_name: string;
  driver_name: string | null;
  job_status: string;
  order_status: string;
  earning_amount: number;
  created_at: Date;
  taken_at: Date | null;
  completed_at: Date | null;
};

type OverdueOrderRow = {
  id: string;
  buyer_id: string;
  buyer_name: string;
  store_name: string;
  delivery_method: DeliveryMethod;
  final_total: number;
  status: string;
  created_at: Date;
  deadline_at: Date;
};

const orderStatusFinal = [OrderStatus.COMPLETED, OrderStatus.RETURNED];

function slaExpression() {
  return `orders.created_at + CASE orders.delivery_method
    WHEN 'Instant' THEN INTERVAL '${deliverySlaHours[DeliveryMethod.INSTANT]} hours'
    WHEN 'Next Day' THEN INTERVAL '${deliverySlaHours[DeliveryMethod.NEXT_DAY]} hours'
    ELSE INTERVAL '${deliverySlaHours[DeliveryMethod.REGULAR]} hours'
  END`;
}

function mapOrder(row: MonitoringOrderRow) {
  return {
    id: row.id,
    buyerName: row.buyer_name,
    storeName: row.store_name,
    deliveryMethod: row.delivery_method,
    finalTotal: Number(row.final_total),
    status: row.status,
    createdAt: row.created_at.toISOString(),
  };
}

function mapDelivery(row: MonitoringDeliveryRow) {
  return {
    id: row.id,
    orderId: row.order_id,
    storeName: row.store_name,
    driverName: row.driver_name,
    jobStatus: row.job_status,
    orderStatus: row.order_status,
    earningAmount: Number(row.earning_amount),
    createdAt: row.created_at.toISOString(),
    takenAt: row.taken_at?.toISOString() ?? null,
    completedAt: row.completed_at?.toISOString() ?? null,
  };
}

function mapUser(row: MonitoringUserRow) {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    roles: row.roles,
    createdAt: row.created_at.toISOString(),
  };
}

function mapStore(row: MonitoringStoreRow) {
  return {
    id: row.id,
    storeName: row.store_name,
    sellerName: row.seller_name,
    productCount: Number(row.product_count),
    createdAt: row.created_at.toISOString(),
  };
}

function mapProduct(row: MonitoringProductRow) {
  return {
    id: row.id,
    name: row.name,
    storeName: row.store_name,
    category: row.category,
    price: Number(row.price),
    stock: Number(row.stock),
    createdAt: row.created_at.toISOString(),
  };
}

function mapOverdue(row: OverdueOrderRow) {
  return {
    id: row.id,
    buyerId: row.buyer_id,
    buyerName: row.buyer_name,
    storeName: row.store_name,
    deliveryMethod: row.delivery_method,
    finalTotal: Number(row.final_total),
    status: row.status,
    createdAt: row.created_at.toISOString(),
    deadlineAt: row.deadline_at.toISOString(),
  };
}

export class AdminMonitoringModel {
  static async snapshot(now = new Date()) {
    const [
      users,
      stores,
      products,
      orders,
      vouchers,
      promos,
      deliveryJobs,
      overdue,
      userRows,
      storeRows,
      productRows,
      recentOrders,
      deliveryRows,
      overdueRows,
    ] = await Promise.all([
      query<CountRow>("SELECT COUNT(*) AS count FROM users"),
      query<CountRow>("SELECT COUNT(*) AS count FROM stores"),
      query<CountRow>("SELECT COUNT(*) AS count FROM products"),
      query<CountRow>("SELECT COUNT(*) AS count FROM orders"),
      query<CountRow>("SELECT COUNT(*) AS count FROM vouchers"),
      query<CountRow>("SELECT COUNT(*) AS count FROM promos"),
      query<CountRow>("SELECT COUNT(*) AS count FROM delivery_jobs"),
      query<CountRow>(
        `SELECT COUNT(*) AS count
         FROM orders
         WHERE status <> ALL($1::text[])
           AND ${slaExpression()} <= $2::timestamptz`,
        [orderStatusFinal, now.toISOString()],
      ),
      query<MonitoringUserRow>(
        `SELECT
          users.id,
          users.username,
          users.display_name,
          ARRAY_AGG(user_roles.role ORDER BY user_roles.role) AS roles,
          users.created_at
         FROM users
         JOIN user_roles ON user_roles.user_id = users.id
         GROUP BY users.id
         ORDER BY users.created_at DESC
         LIMIT 20`,
      ),
      query<MonitoringStoreRow>(
        `SELECT
          stores.id,
          stores.store_name,
          users.display_name AS seller_name,
          COUNT(products.id) AS product_count,
          stores.created_at
         FROM stores
         JOIN users ON users.id = stores.seller_id
         LEFT JOIN products ON products.store_id = stores.id
         GROUP BY stores.id, users.display_name
         ORDER BY stores.created_at DESC
         LIMIT 20`,
      ),
      query<MonitoringProductRow>(
        `SELECT
          products.id,
          products.name,
          stores.store_name,
          products.category,
          products.price,
          products.stock,
          products.created_at
         FROM products
         JOIN stores ON stores.id = products.store_id
         ORDER BY products.created_at DESC
         LIMIT 20`,
      ),
      query<MonitoringOrderRow>(
        `SELECT
          orders.id,
          users.display_name AS buyer_name,
          stores.store_name,
          orders.delivery_method,
          orders.final_total,
          orders.status,
          orders.created_at
         FROM orders
         JOIN users ON users.id = orders.buyer_id
         JOIN stores ON stores.id = orders.store_id
         ORDER BY orders.created_at DESC
         LIMIT 20`,
      ),
      query<MonitoringDeliveryRow>(
        `SELECT
          delivery_jobs.id,
          delivery_jobs.order_id,
          stores.store_name,
          drivers.display_name AS driver_name,
          delivery_jobs.status AS job_status,
          orders.status AS order_status,
          delivery_jobs.earning_amount,
          delivery_jobs.created_at,
          delivery_jobs.taken_at,
          delivery_jobs.completed_at
         FROM delivery_jobs
         JOIN orders ON orders.id = delivery_jobs.order_id
         JOIN stores ON stores.id = orders.store_id
         LEFT JOIN users drivers ON drivers.id = delivery_jobs.driver_id
         ORDER BY delivery_jobs.created_at DESC
         LIMIT 20`,
      ),
      this.overdueCandidates(now),
    ]);

    return {
      summary: {
        users: Number(users.rows[0]?.count ?? 0),
        stores: Number(stores.rows[0]?.count ?? 0),
        products: Number(products.rows[0]?.count ?? 0),
        orders: Number(orders.rows[0]?.count ?? 0),
        vouchers: Number(vouchers.rows[0]?.count ?? 0),
        promos: Number(promos.rows[0]?.count ?? 0),
        deliveryJobs: Number(deliveryJobs.rows[0]?.count ?? 0),
        overdueOrders: Number(overdue.rows[0]?.count ?? 0),
      },
      slaRules: deliverySlaHours,
      now: now.toISOString(),
      users: userRows.rows.map(mapUser),
      stores: storeRows.rows.map(mapStore),
      products: productRows.rows.map(mapProduct),
      recentOrders: recentOrders.rows.map(mapOrder),
      deliveryJobs: deliveryRows.rows.map(mapDelivery),
      overdueOrders: overdueRows.map(mapOverdue),
    };
  }

  static async overdueCandidates(now = new Date()) {
    const result = await query<OverdueOrderRow>(
      `SELECT
        orders.id,
        orders.buyer_id,
        users.display_name AS buyer_name,
        stores.store_name,
        orders.delivery_method,
        orders.final_total,
        orders.status,
        orders.created_at,
        ${slaExpression()} AS deadline_at
       FROM orders
       JOIN users ON users.id = orders.buyer_id
       JOIN stores ON stores.id = orders.store_id
       WHERE orders.status <> ALL($1::text[])
         AND ${slaExpression()} <= $2::timestamptz
       ORDER BY deadline_at ASC`,
      [orderStatusFinal, now.toISOString()],
    );

    return result.rows;
  }

  static async processOverdue(now = new Date()) {
    const client = await pool.connect();
    const processed: ReturnType<typeof mapOverdue>[] = [];

    try {
      await client.query("BEGIN");

      const candidates = await client.query<OverdueOrderRow>(
        `SELECT
          orders.id,
          orders.buyer_id,
          users.display_name AS buyer_name,
          stores.store_name,
          orders.delivery_method,
          orders.final_total,
          orders.status,
          orders.created_at,
          ${slaExpression()} AS deadline_at
         FROM orders
         JOIN users ON users.id = orders.buyer_id
         JOIN stores ON stores.id = orders.store_id
         WHERE orders.status <> ALL($1::text[])
           AND ${slaExpression()} <= $2::timestamptz
         ORDER BY deadline_at ASC
         FOR UPDATE OF orders`,
        [orderStatusFinal, now.toISOString()],
      );

      for (const order of candidates.rows) {
        await WalletModel.refundWithClient(
          client,
          order.buyer_id,
          Number(order.final_total),
          `Refund overdue order ${order.id}`,
          now,
        );

        await client.query(
          `UPDATE products
           SET stock = products.stock + order_items.quantity,
               updated_at = $2
           FROM order_items
           WHERE order_items.order_id = $1
             AND products.id = order_items.product_id`,
          [order.id, now.toISOString()],
        );

        await client.query(
          `UPDATE orders
           SET status = $2,
               updated_at = $3
           WHERE id = $1`,
          [order.id, OrderStatus.RETURNED, now.toISOString()],
        );

        await client.query(
          `UPDATE delivery_jobs
           SET status = $2,
               completed_at = COALESCE(completed_at, $4),
               updated_at = $4
           WHERE order_id = $1
             AND status <> $3`,
          [order.id, DeliveryJobStatus.RETURNED, DeliveryJobStatus.COMPLETED, now.toISOString()],
        );

        await client.query(
          `INSERT INTO order_status_history (id, order_id, status, note, created_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            createId("osh"),
            order.id,
            OrderStatus.RETURNED,
            `Admin overdue handling: refund ${Number(order.final_total)} dan stock dikembalikan. Simulated time ${now.toISOString()}.`,
            now.toISOString(),
          ],
        );

        processed.push({ ...mapOverdue(order), status: OrderStatus.RETURNED });
      }

      await client.query("COMMIT");

      return {
        simulatedNow: now.toISOString(),
        processedCount: processed.length,
        processedOrders: processed,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
