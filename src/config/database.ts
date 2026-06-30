import { Pool, QueryResultRow } from "pg";
import { env } from "./env";

function needsSsl(connectionString: string) {
  const url = new URL(connectionString);
  return (
    url.searchParams.get("sslmode") === "require" ||
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("pooler.supabase.com")
  );
}

function createPool(connectionString: string) {
  const url = new URL(connectionString);
  const ssl = needsSsl(connectionString);
  url.searchParams.delete("sslmode");

  return new Pool({
    connectionString: url.toString(),
    ...(ssl
      ? {
          ssl: {
            rejectUnauthorized: false,
          },
        }
      : {}),
  });
}

export const pool = createPool(env.databaseUrl);

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
) {
  return pool.query<T>(text, params);
}

async function ensureDatabaseExists() {
  const targetUrl = new URL(env.databaseUrl);
  const databaseName = targetUrl.pathname.replace(/^\//, "");

  if (!databaseName || databaseName === "postgres") return;

  const maintenanceUrl = new URL(env.databaseUrl);
  maintenanceUrl.pathname = "/postgres";

  const maintenancePool = createPool(maintenanceUrl.toString());

  try {
    const result = await maintenancePool.query<{ exists: boolean }>(
      "SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = $1) AS exists",
      [databaseName],
    );

    if (!result.rows[0]?.exists) {
      await maintenancePool.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
    }
  } finally {
    await maintenancePool.end();
  }
}

function quoteIdentifier(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export async function initializeDatabase() {
  await ensureDatabaseExists();

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
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

    CREATE TABLE IF NOT EXISTS buyer_wallets (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('TOP_UP', 'PAYMENT', 'REFUND')),
      amount INTEGER NOT NULL,
      description TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS buyer_addresses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      recipient_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address_line TEXT NOT NULL,
      city TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      is_primary BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS carts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      store_id TEXT REFERENCES stores(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY,
      cart_id TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (cart_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      buyer_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      seller_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
      address_id TEXT NOT NULL REFERENCES buyer_addresses(id) ON DELETE RESTRICT,
      delivery_method TEXT NOT NULL CHECK (delivery_method IN ('Instant', 'Next Day', 'Regular')),
      delivery_fee INTEGER NOT NULL CHECK (delivery_fee >= 0),
      subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
      ppn INTEGER NOT NULL CHECK (ppn >= 0),
      final_total INTEGER NOT NULL CHECK (final_total >= 0),
      discount_code TEXT,
      discount_type TEXT,
      discount_amount INTEGER NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
      taxable_amount INTEGER NOT NULL DEFAULT 0 CHECK (taxable_amount >= 0),
      status TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      product_name TEXT NOT NULL,
      unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      subtotal INTEGER NOT NULL CHECK (subtotal >= 0)
    );

    CREATE TABLE IF NOT EXISTS order_status_history (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS delivery_jobs (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
      driver_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      status TEXT NOT NULL CHECK (status IN ('AVAILABLE', 'TAKEN', 'COMPLETED', 'RETURNED')),
      earning_amount INTEGER NOT NULL DEFAULT 0 CHECK (earning_amount >= 0),
      taken_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS vouchers (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      discount_amount INTEGER NOT NULL CHECK (discount_amount > 0),
      expiry_date TIMESTAMPTZ NOT NULL,
      remaining_usage INTEGER NOT NULL CHECK (remaining_usage >= 0),
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS promos (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      discount_amount INTEGER NOT NULL CHECK (discount_amount > 0),
      expiry_date TIMESTAMPTZ NOT NULL,
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_type TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS taxable_amount INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
    UPDATE users
    SET email = LOWER(username) || '@seapedia.test'
    WHERE email IS NULL OR email = '';
    ALTER TABLE users ALTER COLUMN email SET NOT NULL;
    ALTER TABLE delivery_jobs DROP CONSTRAINT IF EXISTS delivery_jobs_status_check;
    ALTER TABLE delivery_jobs ADD CONSTRAINT delivery_jobs_status_check
      CHECK (status IN ('AVAILABLE', 'TAKEN', 'COMPLETED', 'RETURNED'));

    INSERT INTO delivery_jobs (id, order_id, status, earning_amount)
    SELECT
      'dlj_' || substr(md5(orders.id), 1, 12),
      orders.id,
      'AVAILABLE',
      orders.delivery_fee
    FROM orders
    LEFT JOIN delivery_jobs ON delivery_jobs.order_id = orders.id
    WHERE orders.status = 'Menunggu Pengirim' AND delivery_jobs.id IS NULL;

    CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));
    CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
    CREATE INDEX IF NOT EXISTS idx_app_reviews_created_at ON app_reviews(created_at);
    CREATE INDEX IF NOT EXISTS idx_buyer_addresses_user_id ON buyer_addresses(user_id);
    CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
    CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_delivery_jobs_order_id ON delivery_jobs(order_id);
    CREATE INDEX IF NOT EXISTS idx_delivery_jobs_driver_id ON delivery_jobs(driver_id);
    CREATE INDEX IF NOT EXISTS idx_delivery_jobs_status ON delivery_jobs(status);
    CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);
    CREATE INDEX IF NOT EXISTS idx_promos_code ON promos(code);
  `);
}
