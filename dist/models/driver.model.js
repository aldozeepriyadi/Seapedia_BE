"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverModel = void 0;
const database_1 = require("../config/database");
const commerce_1 = require("../constants/commerce");
const id_service_1 = require("../services/id.service");
const http_error_1 = require("../utils/http-error");
const jobSelect = `
  SELECT
    delivery_jobs.id,
    delivery_jobs.order_id,
    orders.status AS order_status,
    delivery_jobs.status AS job_status,
    delivery_jobs.driver_id,
    users.display_name AS buyer_name,
    orders.seller_id,
    stores.store_name,
    orders.delivery_method,
    orders.delivery_fee,
    delivery_jobs.earning_amount,
    buyer_addresses.recipient_name,
    buyer_addresses.phone,
    buyer_addresses.address_line,
    buyer_addresses.city,
    buyer_addresses.postal_code,
    delivery_jobs.created_at,
    delivery_jobs.taken_at,
    delivery_jobs.completed_at
  FROM delivery_jobs
  JOIN orders ON orders.id = delivery_jobs.order_id
  JOIN users ON users.id = orders.buyer_id
  JOIN stores ON stores.id = orders.store_id
  JOIN buyer_addresses ON buyer_addresses.id = orders.address_id
`;
function mapJob(row) {
    return {
        id: row.id,
        orderId: row.order_id,
        orderStatus: row.order_status,
        jobStatus: row.job_status,
        driverId: row.driver_id,
        buyerName: row.buyer_name,
        sellerId: row.seller_id,
        storeName: row.store_name,
        deliveryMethod: row.delivery_method,
        deliveryFee: Number(row.delivery_fee),
        earningAmount: Number(row.earning_amount),
        recipientName: row.recipient_name,
        phone: row.phone,
        addressLine: row.address_line,
        city: row.city,
        postalCode: row.postal_code,
        createdAt: row.created_at.toISOString(),
        takenAt: row.taken_at?.toISOString() ?? null,
        completedAt: row.completed_at?.toISOString() ?? null,
    };
}
class DriverModel {
    static async listAvailableJobs() {
        const result = await (0, database_1.query)(`${jobSelect}
       WHERE delivery_jobs.status = $1
         AND delivery_jobs.driver_id IS NULL
         AND orders.status = $2
       ORDER BY delivery_jobs.created_at ASC`, [commerce_1.DeliveryJobStatus.AVAILABLE, commerce_1.OrderStatus.WAITING_DRIVER]);
        return result.rows.map(mapJob);
    }
    static async activeJob(driverId) {
        const result = await (0, database_1.query)(`${jobSelect}
       WHERE delivery_jobs.driver_id = $1
         AND delivery_jobs.status = $2
       ORDER BY delivery_jobs.taken_at DESC
       LIMIT 1`, [driverId, commerce_1.DeliveryJobStatus.TAKEN]);
        return result.rows[0] ? mapJob(result.rows[0]) : null;
    }
    static async jobHistory(driverId) {
        const result = await (0, database_1.query)(`${jobSelect}
       WHERE delivery_jobs.driver_id = $1
       ORDER BY COALESCE(delivery_jobs.completed_at, delivery_jobs.taken_at, delivery_jobs.created_at) DESC`, [driverId]);
        return result.rows.map(mapJob);
    }
    static async findJob(jobId, driverId) {
        const result = await (0, database_1.query)(`${jobSelect}
       WHERE delivery_jobs.id = $1
         AND (
          (delivery_jobs.status = $2 AND delivery_jobs.driver_id IS NULL AND orders.status = $3)
          OR delivery_jobs.driver_id = $4
         )`, [jobId, commerce_1.DeliveryJobStatus.AVAILABLE, commerce_1.OrderStatus.WAITING_DRIVER, driverId]);
        return result.rows[0] ? mapJob(result.rows[0]) : null;
    }
    static async takeJob(jobId, driverId) {
        const client = await database_1.pool.connect();
        try {
            await client.query("BEGIN");
            const locked = await client.query(`SELECT
          delivery_jobs.order_id,
          delivery_jobs.status AS job_status,
          delivery_jobs.driver_id,
          orders.status AS order_status
         FROM delivery_jobs
         JOIN orders ON orders.id = delivery_jobs.order_id
         WHERE delivery_jobs.id = $1
         FOR UPDATE OF delivery_jobs, orders`, [jobId]);
            const job = locked.rows[0];
            if (!job)
                throw new http_error_1.HttpError(404, "Delivery job tidak ditemukan.");
            if (job.job_status !== commerce_1.DeliveryJobStatus.AVAILABLE || job.driver_id) {
                throw new http_error_1.HttpError(409, "Delivery job sudah diambil driver lain.");
            }
            if (job.order_status !== commerce_1.OrderStatus.WAITING_DRIVER) {
                throw new http_error_1.HttpError(400, "Order belum siap diambil driver.");
            }
            await client.query(`UPDATE delivery_jobs
         SET driver_id = $2,
             status = $3,
             taken_at = NOW(),
             updated_at = NOW()
         WHERE id = $1`, [jobId, driverId, commerce_1.DeliveryJobStatus.TAKEN]);
            await client.query(`UPDATE orders
         SET status = $2,
             updated_at = NOW()
         WHERE id = $1`, [job.order_id, commerce_1.OrderStatus.SHIPPING]);
            await client.query(`INSERT INTO order_status_history (id, order_id, status, note)
         VALUES ($1, $2, $3, $4)`, [
                (0, id_service_1.createId)("osh"),
                job.order_id,
                commerce_1.OrderStatus.SHIPPING,
                "Driver mengambil job dan pesanan sedang dikirim.",
            ]);
            await client.query("COMMIT");
            return this.findJob(jobId, driverId);
        }
        catch (error) {
            await client.query("ROLLBACK");
            throw error;
        }
        finally {
            client.release();
        }
    }
    static async completeJob(jobId, driverId) {
        const client = await database_1.pool.connect();
        try {
            await client.query("BEGIN");
            const locked = await client.query(`SELECT
          delivery_jobs.order_id,
          delivery_jobs.status AS job_status,
          delivery_jobs.driver_id,
          orders.status AS order_status
         FROM delivery_jobs
         JOIN orders ON orders.id = delivery_jobs.order_id
         WHERE delivery_jobs.id = $1
         FOR UPDATE OF delivery_jobs, orders`, [jobId]);
            const job = locked.rows[0];
            if (!job || job.driver_id !== driverId) {
                throw new http_error_1.HttpError(404, "Delivery job tidak ditemukan untuk driver ini.");
            }
            if (job.job_status !== commerce_1.DeliveryJobStatus.TAKEN || job.order_status !== commerce_1.OrderStatus.SHIPPING) {
                throw new http_error_1.HttpError(400, "Delivery job belum dalam status Sedang Dikirim.");
            }
            await client.query(`UPDATE delivery_jobs
         SET status = $2,
             completed_at = NOW(),
             updated_at = NOW()
         WHERE id = $1`, [jobId, commerce_1.DeliveryJobStatus.COMPLETED]);
            await client.query(`UPDATE orders
         SET status = $2,
             updated_at = NOW()
         WHERE id = $1`, [job.order_id, commerce_1.OrderStatus.COMPLETED]);
            await client.query(`INSERT INTO order_status_history (id, order_id, status, note)
         VALUES ($1, $2, $3, $4)`, [
                (0, id_service_1.createId)("osh"),
                job.order_id,
                commerce_1.OrderStatus.COMPLETED,
                "Driver mengonfirmasi pesanan selesai.",
            ]);
            await client.query("COMMIT");
            return this.findJob(jobId, driverId);
        }
        catch (error) {
            await client.query("ROLLBACK");
            throw error;
        }
        finally {
            client.release();
        }
    }
    static async report(driverId) {
        const result = await (0, database_1.query)(`SELECT
        COUNT(*) FILTER (WHERE status = $2) AS active_jobs,
        COUNT(*) FILTER (WHERE status = $3) AS completed_jobs,
        COALESCE(SUM(earning_amount) FILTER (WHERE status = $3), 0) AS total_earnings
       FROM delivery_jobs
       WHERE driver_id = $1`, [driverId, commerce_1.DeliveryJobStatus.TAKEN, commerce_1.DeliveryJobStatus.COMPLETED]);
        const available = await (0, database_1.query)(`SELECT COUNT(*) AS count
       FROM delivery_jobs
       JOIN orders ON orders.id = delivery_jobs.order_id
       WHERE delivery_jobs.status = $1
         AND delivery_jobs.driver_id IS NULL
         AND orders.status = $2`, [commerce_1.DeliveryJobStatus.AVAILABLE, commerce_1.OrderStatus.WAITING_DRIVER]);
        return {
            availableJobs: Number(available.rows[0]?.count ?? 0),
            activeJobs: Number(result.rows[0]?.active_jobs ?? 0),
            completedJobs: Number(result.rows[0]?.completed_jobs ?? 0),
            totalEarnings: Number(result.rows[0]?.total_earnings ?? 0),
            earningRule: "Driver earning = delivery fee dari order yang selesai.",
        };
    }
}
exports.DriverModel = DriverModel;
