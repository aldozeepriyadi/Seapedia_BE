import { PoolClient } from "pg";
import { query } from "../config/database";
import { createId } from "../services/id.service";
import { WalletTransaction } from "./database.model";

type WalletRow = {
  user_id: string;
  balance: number;
};

type WalletTransactionRow = {
  id: string;
  user_id: string;
  type: "TOP_UP" | "PAYMENT" | "REFUND";
  amount: number;
  description: string;
  created_at: Date;
};

function mapTransaction(row: WalletTransactionRow): WalletTransaction {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    amount: Number(row.amount),
    description: row.description,
    createdAt: row.created_at.toISOString(),
  };
}

export class WalletModel {
  static async ensureWallet(userId: string) {
    await query(
      `INSERT INTO buyer_wallets (user_id, balance)
       VALUES ($1, 0)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId],
    );
  }

  static async getSummary(userId: string) {
    await this.ensureWallet(userId);

    const wallet = await query<WalletRow>(
      `SELECT user_id, balance
       FROM buyer_wallets
       WHERE user_id = $1`,
      [userId],
    );
    const transactions = await query<WalletTransactionRow>(
      `SELECT id, user_id, type, amount, description, created_at
       FROM wallet_transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 25`,
      [userId],
    );

    return {
      balance: Number(wallet.rows[0]?.balance ?? 0),
      transactions: transactions.rows.map(mapTransaction),
    };
  }

  static async topUp(userId: string, amount: number) {
    await this.ensureWallet(userId);

    await query(
      `UPDATE buyer_wallets
       SET balance = balance + $2, updated_at = NOW()
       WHERE user_id = $1`,
      [userId, amount],
    );
    await query(
      `INSERT INTO wallet_transactions (id, user_id, type, amount, description)
       VALUES ($1, $2, 'TOP_UP', $3, $4)`,
      [createId("wtx"), userId, amount, "Top-up saldo buyer"],
    );

    return this.getSummary(userId);
  }

  static async deductWithClient(
    client: PoolClient,
    userId: string,
    amount: number,
    description: string,
  ) {
    await client.query(
      `INSERT INTO buyer_wallets (user_id, balance)
       VALUES ($1, 0)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId],
    );

    const wallet = await client.query<WalletRow>(
      `SELECT user_id, balance
       FROM buyer_wallets
       WHERE user_id = $1
       FOR UPDATE`,
      [userId],
    );

    const balance = Number(wallet.rows[0]?.balance ?? 0);
    if (balance < amount) return false;

    await client.query(
      `UPDATE buyer_wallets
       SET balance = balance - $2, updated_at = NOW()
       WHERE user_id = $1`,
      [userId, amount],
    );
    await client.query(
      `INSERT INTO wallet_transactions (id, user_id, type, amount, description)
       VALUES ($1, $2, 'PAYMENT', $3, $4)`,
      [createId("wtx"), userId, -amount, description],
    );

    return true;
  }
}
