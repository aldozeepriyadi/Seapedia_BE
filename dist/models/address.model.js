"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressModel = void 0;
const database_1 = require("../config/database");
const id_service_1 = require("../services/id.service");
function mapAddress(row) {
    return {
        id: row.id,
        userId: row.user_id,
        recipientName: row.recipient_name,
        phone: row.phone,
        addressLine: row.address_line,
        city: row.city,
        postalCode: row.postal_code,
        isPrimary: row.is_primary,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
    };
}
class AddressModel {
    static async findManyByUser(userId) {
        const result = await (0, database_1.query)(`SELECT id, user_id, recipient_name, phone, address_line, city, postal_code, is_primary, created_at, updated_at
       FROM buyer_addresses
       WHERE user_id = $1
       ORDER BY is_primary DESC, created_at DESC`, [userId]);
        return result.rows.map(mapAddress);
    }
    static async create(userId, input) {
        const client = await database_1.pool.connect();
        try {
            await client.query("BEGIN");
            const count = await client.query("SELECT COUNT(*) AS count FROM buyer_addresses WHERE user_id = $1", [userId]);
            const shouldBePrimary = input.isPrimary || Number(count.rows[0]?.count ?? 0) === 0;
            if (shouldBePrimary) {
                await client.query("UPDATE buyer_addresses SET is_primary = FALSE WHERE user_id = $1", [
                    userId,
                ]);
            }
            const result = await client.query(`INSERT INTO buyer_addresses
          (id, user_id, recipient_name, phone, address_line, city, postal_code, is_primary)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, user_id, recipient_name, phone, address_line, city, postal_code, is_primary, created_at, updated_at`, [
                (0, id_service_1.createId)("adr"),
                userId,
                input.recipientName,
                input.phone,
                input.addressLine,
                input.city,
                input.postalCode,
                shouldBePrimary,
            ]);
            await client.query("COMMIT");
            return mapAddress(result.rows[0]);
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
exports.AddressModel = AddressModel;
