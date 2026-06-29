"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreModel = void 0;
const database_1 = require("../config/database");
const id_service_1 = require("../services/id.service");
function mapStore(row) {
    return {
        id: row.id,
        sellerId: row.seller_id,
        storeName: row.store_name,
        description: row.description,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
    };
}
class StoreModel {
    static async findBySellerId(sellerId) {
        const result = await (0, database_1.query)(`SELECT id, seller_id, store_name, description, created_at, updated_at
       FROM stores
       WHERE seller_id = $1`, [sellerId]);
        return result.rows[0] ? mapStore(result.rows[0]) : null;
    }
    static async createForSeller(sellerId, storeName, description) {
        const result = await (0, database_1.query)(`INSERT INTO stores (id, seller_id, store_name, description)
       VALUES ($1, $2, $3, $4)
       RETURNING id, seller_id, store_name, description, created_at, updated_at`, [(0, id_service_1.createId)("str"), sellerId, storeName, description]);
        return mapStore(result.rows[0]);
    }
    static async updateForSeller(sellerId, storeName, description) {
        const result = await (0, database_1.query)(`UPDATE stores
       SET store_name = $2,
           description = $3,
           updated_at = NOW()
       WHERE seller_id = $1
       RETURNING id, seller_id, store_name, description, created_at, updated_at`, [sellerId, storeName, description]);
        return result.rows[0] ? mapStore(result.rows[0]) : null;
    }
}
exports.StoreModel = StoreModel;
