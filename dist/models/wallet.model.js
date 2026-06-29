"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletModel = void 0;
const database_1 = require("../config/database");
const id_service_1 = require("../services/id.service");
function mapTransaction(row) {
    return {
        id: row.id,
        userId: row.user_id,
        type: row.type,
        amount: Number(row.amount),
        description: row.description,
        createdAt: row.created_at.toISOString(),
    };
}
class WalletModel {
    static async ensureWallet(userId) {
        await (0, database_1.query)(`INSERT INTO buyer_wallets (user_id, balance)
       VALUES ($1, 0)
       ON CONFLICT (user_id) DO NOTHING`, [userId]);
    }
    static async getSummary(userId) {
        await this.ensureWallet(userId);
        const wallet = await (0, database_1.query)(`SELECT user_id, balance
       FROM buyer_wallets
       WHERE user_id = $1`, [userId]);
        const transactions = await (0, database_1.query)(`SELECT id, user_id, type, amount, description, created_at
       FROM wallet_transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 25`, [userId]);
        return {
            balance: Number(wallet.rows[0]?.balance ?? 0),
            transactions: transactions.rows.map(mapTransaction),
        };
    }
    static async topUp(userId, amount) {
        await this.ensureWallet(userId);
        await (0, database_1.query)(`UPDATE buyer_wallets
       SET balance = balance + $2, updated_at = NOW()
       WHERE user_id = $1`, [userId, amount]);
        await (0, database_1.query)(`INSERT INTO wallet_transactions (id, user_id, type, amount, description)
       VALUES ($1, $2, 'TOP_UP', $3, $4)`, [(0, id_service_1.createId)("wtx"), userId, amount, "Top-up saldo buyer"]);
        return this.getSummary(userId);
    }
    static async deductWithClient(client, userId, amount, description) {
        await client.query(`INSERT INTO buyer_wallets (user_id, balance)
       VALUES ($1, 0)
       ON CONFLICT (user_id) DO NOTHING`, [userId]);
        const wallet = await client.query(`SELECT user_id, balance
       FROM buyer_wallets
       WHERE user_id = $1
       FOR UPDATE`, [userId]);
        const balance = Number(wallet.rows[0]?.balance ?? 0);
        if (balance < amount)
            return false;
        await client.query(`UPDATE buyer_wallets
       SET balance = balance - $2, updated_at = NOW()
       WHERE user_id = $1`, [userId, amount]);
        await client.query(`INSERT INTO wallet_transactions (id, user_id, type, amount, description)
       VALUES ($1, $2, 'PAYMENT', $3, $4)`, [(0, id_service_1.createId)("wtx"), userId, -amount, description]);
        return true;
    }
}
exports.WalletModel = WalletModel;
