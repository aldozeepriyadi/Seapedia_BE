"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminMonitoringModel = void 0;
const database_1 = require("../config/database");
const commerce_1 = require("../constants/commerce");
const id_service_1 = require("../services/id.service");
const wallet_model_1 = require("./wallet.model");
const orderStatusFinal = [commerce_1.OrderStatus.COMPLETED, commerce_1.OrderStatus.RETURNED];
function slaExpression() {
    return `orders.created_at + CASE orders.delivery_method
    WHEN 'Instant' THEN INTERVAL '${commerce_1.deliverySlaHours[commerce_1.DeliveryMethod.INSTANT]} hours'
    WHEN 'Next Day' THEN INTERVAL '${commerce_1.deliverySlaHours[commerce_1.DeliveryMethod.NEXT_DAY]} hours'
    ELSE INTERVAL '${commerce_1.deliverySlaHours[commerce_1.DeliveryMethod.REGULAR]} hours'
  END`;
}
function mapOrder(row) {
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
function mapDelivery(row) {
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
function mapOverdue(row) {
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
class AdminMonitoringModel {
    static async snapshot(now = new Date()) {
        const [users, stores, products, orders, vouchers, promos, deliveryJobs, overdue, recentOrders, deliveryRows, overdueRows,] = await Promise.all([
            (0, database_1.query)("SELECT COUNT(*) AS count FROM users"),
            (0, database_1.query)("SELECT COUNT(*) AS count FROM stores"),
            (0, database_1.query)("SELECT COUNT(*) AS count FROM products"),
            (0, database_1.query)("SELECT COUNT(*) AS count FROM orders"),
            (0, database_1.query)("SELECT COUNT(*) AS count FROM vouchers"),
            (0, database_1.query)("SELECT COUNT(*) AS count FROM promos"),
            (0, database_1.query)("SELECT COUNT(*) AS count FROM delivery_jobs"),
            (0, database_1.query)(`SELECT COUNT(*) AS count
         FROM orders
         WHERE status <> ALL($1::text[])
           AND ${slaExpression()} <= $2::timestamptz`, [orderStatusFinal, now.toISOString()]),
            (0, database_1.query)(`SELECT
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
         LIMIT 20`),
            (0, database_1.query)(`SELECT
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
         LIMIT 20`),
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
            slaRules: commerce_1.deliverySlaHours,
            now: now.toISOString(),
            recentOrders: recentOrders.rows.map(mapOrder),
            deliveryJobs: deliveryRows.rows.map(mapDelivery),
            overdueOrders: overdueRows.map(mapOverdue),
        };
    }
    static async overdueCandidates(now = new Date()) {
        const result = await (0, database_1.query)(`SELECT
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
       ORDER BY deadline_at ASC`, [orderStatusFinal, now.toISOString()]);
        return result.rows;
    }
    static async processOverdue(now = new Date()) {
        const client = await database_1.pool.connect();
        const processed = [];
        try {
            await client.query("BEGIN");
            const candidates = await client.query(`SELECT
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
         FOR UPDATE OF orders`, [orderStatusFinal, now.toISOString()]);
            for (const order of candidates.rows) {
                await wallet_model_1.WalletModel.refundWithClient(client, order.buyer_id, Number(order.final_total), `Refund overdue order ${order.id}`);
                await client.query(`UPDATE products
           SET stock = products.stock + order_items.quantity,
               updated_at = NOW()
           FROM order_items
           WHERE order_items.order_id = $1
             AND products.id = order_items.product_id`, [order.id]);
                await client.query(`UPDATE orders
           SET status = $2,
               updated_at = NOW()
           WHERE id = $1`, [order.id, commerce_1.OrderStatus.RETURNED]);
                await client.query(`UPDATE delivery_jobs
           SET status = $2,
               completed_at = COALESCE(completed_at, NOW()),
               updated_at = NOW()
           WHERE order_id = $1
             AND status <> $3`, [order.id, commerce_1.DeliveryJobStatus.RETURNED, commerce_1.DeliveryJobStatus.COMPLETED]);
                await client.query(`INSERT INTO order_status_history (id, order_id, status, note)
           VALUES ($1, $2, $3, $4)`, [
                    (0, id_service_1.createId)("osh"),
                    order.id,
                    commerce_1.OrderStatus.RETURNED,
                    `Admin overdue handling: refund ${Number(order.final_total)} dan stock dikembalikan. Simulated time ${now.toISOString()}.`,
                ]);
                processed.push(mapOverdue(order));
            }
            await client.query("COMMIT");
            return {
                simulatedNow: now.toISOString(),
                processedCount: processed.length,
                processedOrders: processed,
            };
        }
        catch (error) {
            await client.query("ROLLBACK");
            throw error;
        }
        finally {
            client.release();
        }
    }
}
exports.AdminMonitoringModel = AdminMonitoringModel;
