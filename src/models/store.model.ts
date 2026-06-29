import { query } from "../config/database";
import { createId } from "../services/id.service";
import { Store } from "./database.model";

type StoreRow = {
  id: string;
  seller_id: string;
  store_name: string;
  description: string;
  created_at: Date;
  updated_at: Date;
};

function mapStore(row: StoreRow): Store {
  return {
    id: row.id,
    sellerId: row.seller_id,
    storeName: row.store_name,
    description: row.description,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export class StoreModel {
  static async findBySellerId(sellerId: string) {
    const result = await query<StoreRow>(
      `SELECT id, seller_id, store_name, description, created_at, updated_at
       FROM stores
       WHERE seller_id = $1`,
      [sellerId],
    );

    return result.rows[0] ? mapStore(result.rows[0]) : null;
  }

  static async createForSeller(
    sellerId: string,
    storeName: string,
    description: string,
  ) {
    const result = await query<StoreRow>(
      `INSERT INTO stores (id, seller_id, store_name, description)
       VALUES ($1, $2, $3, $4)
       RETURNING id, seller_id, store_name, description, created_at, updated_at`,
      [createId("str"), sellerId, storeName, description],
    );

    return mapStore(result.rows[0]!);
  }

  static async updateForSeller(
    sellerId: string,
    storeName: string,
    description: string,
  ) {
    const result = await query<StoreRow>(
      `UPDATE stores
       SET store_name = $2,
           description = $3,
           updated_at = NOW()
       WHERE seller_id = $1
       RETURNING id, seller_id, store_name, description, created_at, updated_at`,
      [sellerId, storeName, description],
    );

    return result.rows[0] ? mapStore(result.rows[0]) : null;
  }
}
