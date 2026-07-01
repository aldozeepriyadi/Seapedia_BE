# Seapedia Backend

Backend Seapedia adalah REST API untuk marketplace multi-role. Project ini memakai pola MVC: route menerima request, controller mengatur alur, service menangani business rule, model menjalankan query database, validator memvalidasi input, dan middleware mengurus auth/error handling.

## Tech Stack

- Node.js, Express, TypeScript
- PostgreSQL dengan package `pg`
- JWT untuk session dan active role
- bcrypt untuk password hashing
- Zod untuk validasi request
- CORS untuk koneksi frontend

## Fitur Utama

- Public catalog: product listing, product detail, dan public review.
- Authentication: register, login, active role selection, profile, logout.
- Buyer: wallet top-up, address, cart, checkout, voucher/promo, order history.
- Seller: store management, product CRUD, order processing, income report.
- Driver: available jobs, active delivery, complete job, job history, earnings.
- Admin: monitoring, voucher/promo management, overdue refund/return simulation.
- Security: parameterized query, input validation, active-role RBAC, ownership check, XSS payload rejection, token revocation.

## Struktur Folder

```text
src/
  app.ts                  Express app, CORS, route mounting
  index.ts                Server entry point
  config/                 Environment and PostgreSQL connection
  constants/              Role and commerce constants
  controllers/            HTTP request handlers
  middleware/             Auth, async handler, error handler
  models/                 PostgreSQL query layer
  routes/                 API route definitions
  services/               Business logic and seed data
  types/                  Shared backend types
  utils/                  Error/security helpers
  validators/             Zod request schemas
```

## Environment Variables

Buat file `.env` berdasarkan `.env.example`.

```env
PORT=4100
JWT_SECRET="change-this-secret"
FRONTEND_URL="http://localhost:5173"
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/seapedia"
```

Untuk Supabase Session Pooler:

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:YOUR_DB_PASSWORD@REGION.pooler.supabase.com:5432/postgres?sslmode=require"
```

Jangan commit `.env`, password database, atau JWT secret ke GitHub.

## Local Development

Requirements:

- Node.js 20+
- PostgreSQL lokal atau Supabase PostgreSQL

Install dan run:

```bash
npm install
npm run dev
```

API lokal:

```text
http://localhost:4100/api
```

Health check:

```bash
curl http://localhost:4100/api/health
```

Backend otomatis membuat tabel yang belum ada dan mengisi seed demo saat server start.

## Scripts

```bash
npm run dev      # run development server dengan tsx watch
npm run build    # compile TypeScript ke dist
npm start        # run dist/index.js
npm run lint     # type-check tanpa emit
```

## Demo Accounts

| Role | Username | Email | Password |
| --- | --- | --- | --- |
| Admin | `admin` | `admin@seapedia.test` | `Admin123!` |
| Seller | `sellerdemo` | `seller@seapedia.test` | `Seller123!` |
| Buyer | `buyerdemo` | `buyer@seapedia.test` | `Buyer123!` |
| Driver | `driverdemo` | `driver@seapedia.test` | `Driver123!` |

Seed discount:

- Voucher: `WELCOME50`
- Promo: `PROMO25`

Login menerima username atau email. Contoh: `admin` dan `admin@seapedia.test` sama-sama valid untuk akun admin.

## API Summary

Public:

| Method | Path | Fungsi |
| --- | --- | --- |
| GET | `/api/health` | Cek status API |
| GET | `/api/products` | Public product catalog |
| GET | `/api/products/:id` | Product detail |
| GET | `/api/reviews` | Public review list |
| POST | `/api/reviews` | Buat public review |

Auth:

| Method | Path | Fungsi |
| --- | --- | --- |
| POST | `/api/auth/register` | Register user non-admin |
| POST | `/api/auth/login` | Login user dengan username atau email |
| GET | `/api/auth/me` | Ambil profile dari token |
| POST | `/api/auth/select-role` | Pilih active role |
| POST | `/api/auth/logout` | Revoke token dan logout |

Buyer membutuhkan active role `BUYER`:

| Method | Path | Fungsi |
| --- | --- | --- |
| GET | `/api/buyer/wallet` | Wallet dan transaction history |
| POST | `/api/buyer/wallet/top-up` | Dummy top-up |
| GET/POST | `/api/buyer/addresses` | List dan create delivery address |
| GET | `/api/buyer/cart` | Lihat cart |
| POST | `/api/buyer/cart/items` | Tambah item cart |
| PUT/DELETE | `/api/buyer/cart/items/:productId` | Update atau hapus item |
| POST | `/api/buyer/checkout/preview` | Preview total checkout |
| POST | `/api/buyer/checkout` | Buat order dan bayar pakai wallet |
| GET | `/api/buyer/orders` | Order history |
| GET | `/api/buyer/orders/:id` | Order detail |

Seller membutuhkan active role `SELLER`:

| Method | Path | Fungsi |
| --- | --- | --- |
| GET/POST/PUT | `/api/seller/store` | Store management |
| GET/POST | `/api/seller/products` | List dan create product |
| PUT/DELETE | `/api/seller/products/:id` | Update atau delete product |
| GET | `/api/seller/orders` | Incoming orders |
| POST | `/api/seller/orders/:id/process` | Proses order ke delivery |
| GET | `/api/seller/reports/summary` | Seller report |

Driver membutuhkan active role `DRIVER`:

| Method | Path | Fungsi |
| --- | --- | --- |
| GET | `/api/driver/jobs/available` | Available delivery jobs |
| GET | `/api/driver/jobs/active` | Active job |
| GET | `/api/driver/jobs/history` | Job history |
| GET | `/api/driver/jobs/:id` | Job detail |
| POST | `/api/driver/jobs/:id/take` | Ambil job |
| POST | `/api/driver/jobs/:id/complete` | Selesaikan job |
| GET | `/api/driver/reports/summary` | Driver earnings report |

Admin membutuhkan active role `ADMIN`:

| Method | Path | Fungsi |
| --- | --- | --- |
| GET | `/api/admin/monitoring` | Marketplace monitoring |
| POST | `/api/admin/overdue/run` | Run overdue refund/return |
| GET/POST | `/api/admin/vouchers` | List dan create voucher |
| GET | `/api/admin/vouchers/:id` | Voucher detail |
| GET/POST | `/api/admin/promos` | List dan create promo |
| GET | `/api/admin/promos/:id` | Promo detail |

## Business Rules

- User bisa punya beberapa role, tetapi akses endpoint role ditentukan oleh active role di JWT.
- Cart buyer hanya boleh berisi produk dari satu store.
- Checkout menghitung subtotal, discount, delivery fee, PPN 12%, dan final total.
- Voucher punya expiry dan remaining usage; promo punya expiry tanpa kuota.
- Seller hanya bisa update produk dan order milik store sendiri.
- Driver earning sama dengan delivery fee dari order yang diselesaikan.
- Overdue order akan dikembalikan, wallet buyer direfund, stock produk dikembalikan, dan seller income tidak menghitung order return.

## Deploy Railway

Settings yang umum:

```text
Root Directory: Seapedia_BE_revisi
Build Command: npm install && npm run build
Start Command: npm start
```

Jika repository GitHub hanya berisi isi folder backend, Root Directory dikosongkan.

Variables Railway:

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:YOUR_DB_PASSWORD@REGION.pooler.supabase.com:5432/postgres?sslmode=require"
JWT_SECRET="your-long-production-secret"
FRONTEND_URL="https://your-frontend.vercel.app"
NODE_ENV="production"
```

Setelah deploy, cek:

```text
https://your-backend.up.railway.app/api/health
```

## Troubleshooting

- `DATABASE_URL belum diset`: variable belum masuk ke service/environment Railway yang benar, atau service belum redeploy.
- `Failed to fetch` dari frontend: cek `VITE_API_URL`, backend health check, dan CORS `FRONTEND_URL`.
- `Akses membutuhkan active role ...`: login berhasil tetapi belum memilih role, atau token role tidak cocok.
- Supabase connection error: pastikan pakai Session Pooler, port `5432`, password benar, dan URL memakai `sslmode=require`.
