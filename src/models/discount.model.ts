import { PoolClient } from "pg";
import { query } from "../config/database";
import { createId } from "../services/id.service";
import { HttpError } from "../utils/http-error";
import { DiscountResource } from "./database.model";

type DiscountKind = "VOUCHER" | "PROMO";

type DiscountRow = {
  id: string;
  code: string;
  discount_amount: number;
  expiry_date: Date;
  remaining_usage?: number;
  created_at: Date;
};

function mapDiscount(row: DiscountRow): DiscountResource {
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

export class DiscountModel {
  static async createVoucher(input: {
    code: string;
    discountAmount: number;
    expiryDate: string;
    remainingUsage: number;
    createdBy: string;
  }) {
    const result = await query<DiscountRow>(
      `INSERT INTO vouchers (id, code, discount_amount, expiry_date, remaining_usage, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, code, discount_amount, expiry_date, remaining_usage, created_at`,
      [
        createId("voc"),
        input.code,
        input.discountAmount,
        input.expiryDate,
        input.remainingUsage,
        input.createdBy,
      ],
    );

    return mapDiscount(result.rows[0]!);
  }

  static async createPromo(input: {
    code: string;
    discountAmount: number;
    expiryDate: string;
    createdBy: string;
  }) {
    const result = await query<DiscountRow>(
      `INSERT INTO promos (id, code, discount_amount, expiry_date, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, code, discount_amount, expiry_date, created_at`,
      [createId("prm"), input.code, input.discountAmount, input.expiryDate, input.createdBy],
    );

    return mapDiscount(result.rows[0]!);
  }

  static async listVouchers() {
    const result = await query<DiscountRow>(
      `SELECT id, code, discount_amount, expiry_date, remaining_usage, created_at
       FROM vouchers
       ORDER BY created_at DESC`,
    );

    return result.rows.map(mapDiscount);
  }

  static async listPromos() {
    const result = await query<DiscountRow>(
      `SELECT id, code, discount_amount, expiry_date, created_at
       FROM promos
       ORDER BY created_at DESC`,
    );

    return result.rows.map(mapDiscount);
  }

  static async findVoucher(id: string) {
    const result = await query<DiscountRow>(
      `SELECT id, code, discount_amount, expiry_date, remaining_usage, created_at
       FROM vouchers
       WHERE id = $1 OR code = $1`,
      [id],
    );

    return result.rows[0] ? mapDiscount(result.rows[0]) : null;
  }

  static async findPromo(id: string) {
    const result = await query<DiscountRow>(
      `SELECT id, code, discount_amount, expiry_date, created_at
       FROM promos
       WHERE id = $1 OR code = $1`,
      [id],
    );

    return result.rows[0] ? mapDiscount(result.rows[0]) : null;
  }

  static async validateWithClient(
    client: PoolClient,
    code: string | undefined,
    subtotal: number,
    consume = false,
  ) {
    const normalizedCode = code?.trim().toUpperCase();
    if (!normalizedCode) return null;

    const voucher = await client.query<DiscountRow>(
      `SELECT id, code, discount_amount, expiry_date, remaining_usage, created_at
       FROM vouchers
       WHERE code = $1
       FOR UPDATE`,
      [normalizedCode],
    );

    if (voucher.rows[0]) {
      return this.validateDiscountRow(client, voucher.rows[0], "VOUCHER", subtotal, consume);
    }

    const promo = await client.query<DiscountRow>(
      `SELECT id, code, discount_amount, expiry_date, created_at
       FROM promos
       WHERE code = $1
       FOR UPDATE`,
      [normalizedCode],
    );

    if (promo.rows[0]) {
      return this.validateDiscountRow(client, promo.rows[0], "PROMO", subtotal, consume);
    }

    throw new HttpError(404, "Kode voucher atau promo tidak ditemukan.");
  }

  private static async validateDiscountRow(
    client: PoolClient,
    row: DiscountRow,
    type: DiscountKind,
    subtotal: number,
    consume: boolean,
  ) {
    if (row.expiry_date.getTime() <= Date.now()) {
      throw new HttpError(400, `${type === "VOUCHER" ? "Voucher" : "Promo"} sudah expired.`);
    }

    if (type === "VOUCHER" && Number(row.remaining_usage ?? 0) <= 0) {
      throw new HttpError(400, "Voucher sudah habis digunakan.");
    }

    if (consume && type === "VOUCHER") {
      await client.query(
        `UPDATE vouchers
         SET remaining_usage = remaining_usage - 1
         WHERE id = $1 AND remaining_usage > 0`,
        [row.id],
      );
    }

    return {
      code: row.code,
      type,
      discountAmount: Math.min(Number(row.discount_amount), subtotal),
    };
  }
}
