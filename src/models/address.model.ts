import { pool, query } from "../config/database";
import { createId } from "../services/id.service";
import { BuyerAddress } from "./database.model";

type AddressRow = {
  id: string;
  user_id: string;
  recipient_name: string;
  phone: string;
  address_line: string;
  city: string;
  postal_code: string;
  is_primary: boolean;
  created_at: Date;
  updated_at: Date;
};

function mapAddress(row: AddressRow): BuyerAddress {
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

export class AddressModel {
  static async findManyByUser(userId: string) {
    const result = await query<AddressRow>(
      `SELECT id, user_id, recipient_name, phone, address_line, city, postal_code, is_primary, created_at, updated_at
       FROM buyer_addresses
       WHERE user_id = $1
       ORDER BY is_primary DESC, created_at DESC`,
      [userId],
    );

    return result.rows.map(mapAddress);
  }

  static async create(
    userId: string,
    input: {
      recipientName: string;
      phone: string;
      addressLine: string;
      city: string;
      postalCode: string;
      isPrimary: boolean;
    },
  ) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const count = await client.query<{ count: string }>(
        "SELECT COUNT(*) AS count FROM buyer_addresses WHERE user_id = $1",
        [userId],
      );
      const shouldBePrimary = input.isPrimary || Number(count.rows[0]?.count ?? 0) === 0;

      if (shouldBePrimary) {
        await client.query("UPDATE buyer_addresses SET is_primary = FALSE WHERE user_id = $1", [
          userId,
        ]);
      }

      const result = await client.query<AddressRow>(
        `INSERT INTO buyer_addresses
          (id, user_id, recipient_name, phone, address_line, city, postal_code, is_primary)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, user_id, recipient_name, phone, address_line, city, postal_code, is_primary, created_at, updated_at`,
        [
          createId("adr"),
          userId,
          input.recipientName,
          input.phone,
          input.addressLine,
          input.city,
          input.postalCode,
          shouldBePrimary,
        ],
      );

      await client.query("COMMIT");
      return mapAddress(result.rows[0]!);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
