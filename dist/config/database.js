"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.query = query;
exports.initializeDatabase = initializeDatabase;
const pg_1 = require("pg");
const env_1 = require("./env");
exports.pool = new pg_1.Pool({
    connectionString: env_1.env.databaseUrl,
});
async function query(text, params = []) {
    return exports.pool.query(text, params);
}
async function ensureDatabaseExists() {
    const targetUrl = new URL(env_1.env.databaseUrl);
    const databaseName = targetUrl.pathname.replace(/^\//, "");
    if (!databaseName || databaseName === "postgres")
        return;
    const maintenanceUrl = new URL(env_1.env.databaseUrl);
    maintenanceUrl.pathname = "/postgres";
    const maintenancePool = new pg_1.Pool({
        connectionString: maintenanceUrl.toString(),
    });
    try {
        const result = await maintenancePool.query("SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = $1) AS exists", [databaseName]);
        if (!result.rows[0]?.exists) {
            await maintenancePool.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
        }
    }
    finally {
        await maintenancePool.end();
    }
}
function quoteIdentifier(value) {
    return `"${value.replace(/"/g, '""')}"`;
}
async function initializeDatabase() {
    await ensureDatabaseExists();
    await query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS user_roles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('ADMIN', 'BUYER', 'SELLER', 'DRIVER')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, role)
    );

    CREATE TABLE IF NOT EXISTS app_reviews (
      id TEXT PRIMARY KEY,
      reviewer_name TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      seller_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      store_name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price INTEGER NOT NULL CHECK (price >= 0),
      stock INTEGER NOT NULL CHECK (stock >= 0),
      category TEXT NOT NULL DEFAULT 'General',
      image TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
    CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
    CREATE INDEX IF NOT EXISTS idx_app_reviews_created_at ON app_reviews(created_at);
  `);
}
