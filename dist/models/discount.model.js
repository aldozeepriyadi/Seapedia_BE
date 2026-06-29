"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscountModel = void 0;
const database_1 = require("../config/database");
const id_service_1 = require("../services/id.service");
const http_error_1 = require("../utils/http-error");
function mapDiscount(row) {
    return {
        id: row.id,
        code: row.code,
        discountAmount: Number(row.discount_amount),
        expiryDate: row.expiry_date.toISOString(),
        ...(row.remaining_usage === undefined
            ? {}
            : { remainingUsage: Number(row.remaining_usage) }),
        createdAt: row.created_at.toISOString(),
    };
}
class DiscountModel {
    static async createVoucher(input) {
        const result = await (0, database_1.query)(`INSERT INTO vouchers (id, code, discount_amount, expiry_date, remaining_usage, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, code, discount_amount, expiry_date, remaining_usage, created_at`, [
            (0, id_service_1.createId)("voc"),
            input.code,
            input.discountAmount,
            input.expiryDate,
            input.remainingUsage,
            input.createdBy,
        ]);
        return mapDiscount(result.rows[0]);
    }
    static async createPromo(input) {
        const result = await (0, database_1.query)(`INSERT INTO promos (id, code, discount_amount, expiry_date, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, code, discount_amount, expiry_date, created_at`, [(0, id_service_1.createId)("prm"), input.code, input.discountAmount, input.expiryDate, input.createdBy]);
        return mapDiscount(result.rows[0]);
    }
    static async listVouchers() {
        const result = await (0, database_1.query)(`SELECT id, code, discount_amount, expiry_date, remaining_usage, created_at
       FROM vouchers
       ORDER BY created_at DESC`);
        return result.rows.map(mapDiscount);
    }
    static async listPromos() {
        const result = await (0, database_1.query)(`SELECT id, code, discount_amount, expiry_date, created_at
       FROM promos
       ORDER BY created_at DESC`);
        return result.rows.map(mapDiscount);
    }
    static async findVoucher(id) {
        const result = await (0, database_1.query)(`SELECT id, code, discount_amount, expiry_date, remaining_usage, created_at
       FROM vouchers
       WHERE id = $1 OR code = $1`, [id]);
        return result.rows[0] ? mapDiscount(result.rows[0]) : null;
    }
    static async findPromo(id) {
        const result = await (0, database_1.query)(`SELECT id, code, discount_amount, expiry_date, created_at
       FROM promos
       WHERE id = $1 OR code = $1`, [id]);
        return result.rows[0] ? mapDiscount(result.rows[0]) : null;
    }
    static async validateWithClient(client, code, subtotal, consume = false) {
        const normalizedCode = code?.trim().toUpperCase();
        if (!normalizedCode)
            return null;
        const voucher = await client.query(`SELECT id, code, discount_amount, expiry_date, remaining_usage, created_at
       FROM vouchers
       WHERE code = $1
       FOR UPDATE`, [normalizedCode]);
        if (voucher.rows[0]) {
            return this.validateDiscountRow(client, voucher.rows[0], "VOUCHER", subtotal, consume);
        }
        const promo = await client.query(`SELECT id, code, discount_amount, expiry_date, created_at
       FROM promos
       WHERE code = $1
       FOR UPDATE`, [normalizedCode]);
        if (promo.rows[0]) {
            return this.validateDiscountRow(client, promo.rows[0], "PROMO", subtotal, consume);
        }
        throw new http_error_1.HttpError(404, "Kode voucher atau promo tidak ditemukan.");
    }
    static async validateDiscountRow(client, row, type, subtotal, consume) {
        if (row.expiry_date.getTime() <= Date.now()) {
            throw new http_error_1.HttpError(400, `${type === "VOUCHER" ? "Voucher" : "Promo"} sudah expired.`);
        }
        if (type === "VOUCHER" && Number(row.remaining_usage ?? 0) <= 0) {
            throw new http_error_1.HttpError(400, "Voucher sudah habis digunakan.");
        }
        if (consume && type === "VOUCHER") {
            await client.query(`UPDATE vouchers
         SET remaining_usage = remaining_usage - 1
         WHERE id = $1 AND remaining_usage > 0`, [row.id]);
        }
        return {
            code: row.code,
            type,
            discountAmount: Math.min(Number(row.discount_amount), subtotal),
        };
    }
}
exports.DiscountModel = DiscountModel;
