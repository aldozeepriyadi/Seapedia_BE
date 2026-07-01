# SEAPEDIA API Documentation

Base URL: `http://localhost:4100/api`

Protected endpoints require:

```http
Authorization: Bearer <jwt>
Content-Type: application/json
```

The JWT contains the current active role. To access Seller, Buyer, Driver, or Admin endpoints, login first and call `POST /auth/select-role`.

## Public

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | API health check |
| GET | `/products` | Public product catalog |
| GET | `/products/:id` | Product detail with store information |
| GET | `/reviews` | Public application reviews |
| POST | `/reviews` | Create public application review |

Review body:

```json
{
  "reviewerName": "Guest Reviewer",
  "rating": 5,
  "comment": "Aplikasi mudah dipakai."
}
```

## Auth

| Method | Path | Description |
| --- | --- | --- |
| POST | `/auth/register` | Register non-admin user |
| POST | `/auth/login` | Login with username/email and password |
| GET | `/auth/me` | Current authenticated user |
| POST | `/auth/select-role` | Issue token with active role |
| POST | `/auth/logout` | Revoke current token and logout |

Register body:

```json
{
  "displayName": "Demo Multi Role",
  "username": "demomulti",
  "email": "demo@example.com",
  "password": "Password123!",
  "roles": ["BUYER", "SELLER"]
}
```

Select role body:

```json
{ "role": "BUYER" }
```

Login body accepts either username or email in the `username` field:

```json
{
  "username": "admin@seapedia.test",
  "password": "Admin123!"
}
```

## Buyer

Requires active role `BUYER`.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/buyer/wallet` | Wallet balance and transactions |
| POST | `/buyer/wallet/top-up` | Dummy wallet top-up |
| GET | `/buyer/addresses` | Buyer delivery addresses |
| POST | `/buyer/addresses` | Create delivery address |
| GET | `/buyer/cart` | Current cart |
| POST | `/buyer/cart/items` | Add product to cart |
| PUT | `/buyer/cart/items/:productId` | Update cart quantity |
| DELETE | `/buyer/cart/items/:productId` | Remove cart item |
| DELETE | `/buyer/cart` | Clear cart |
| POST | `/buyer/checkout/preview` | Preview checkout total |
| POST | `/buyer/checkout` | Pay wallet and create order |
| GET | `/buyer/reports/summary` | Buyer spending summary |
| GET | `/buyer/orders` | Buyer order history |
| GET | `/buyer/orders/:id` | Buyer/seller-visible order detail |

Checkout body:

```json
{
  "addressId": "addr_xxx",
  "deliveryMethod": "Regular",
  "discountCode": "WELCOME50"
}
```

Rules:

- Cart is single-store only.
- Delivery method is `Instant`, `Next Day`, or `Regular`.
- PPN is 12% after discount.
- Voucher and promo cannot be stacked; one code is accepted per checkout.

## Seller

Requires active role `SELLER`.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/seller/store` | Seller store |
| POST | `/seller/store` | Create or save store |
| PUT | `/seller/store` | Update store |
| GET | `/seller/products` | Seller products |
| POST | `/seller/products` | Create product |
| PUT | `/seller/products/:id` | Update own product |
| DELETE | `/seller/products/:id` | Delete own product |
| GET | `/seller/orders` | Incoming seller orders |
| GET | `/seller/reports/summary` | Seller income summary |
| POST | `/seller/orders/:id/process` | Move own order to `Menunggu Pengirim` |

Product body:

```json
{
  "name": "SEA Hoodie",
  "description": "Hoodie clean fit untuk demo.",
  "price": 189000,
  "stock": 24,
  "category": "Fashion",
  "image": "https://example.com/image.jpg"
}
```

## Driver

Requires active role `DRIVER`.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/driver/jobs/available` | Jobs waiting for driver |
| GET | `/driver/jobs/active` | Current active driver job |
| GET | `/driver/jobs/history` | Completed/returned job history |
| GET | `/driver/jobs/:id` | Driver-visible job detail |
| POST | `/driver/jobs/:id/take` | Take available delivery job |
| POST | `/driver/jobs/:id/complete` | Complete taken delivery job |
| GET | `/driver/reports/summary` | Driver earnings summary |

Driver earning rule: completed job earning equals the order delivery fee.

## Admin

Requires active role `ADMIN`.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/admin/monitoring` | Users, stores, products, orders, discounts, deliveries, overdue summary |
| POST | `/admin/overdue/run` | Process overdue refund/return with optional simulated time |
| GET | `/admin/vouchers` | Voucher list |
| POST | `/admin/vouchers` | Create voucher |
| GET | `/admin/vouchers/:id` | Voucher detail by id or code |
| GET | `/admin/promos` | Promo list |
| POST | `/admin/promos` | Create promo |
| GET | `/admin/promos/:id` | Promo detail by id or code |

Monitoring with simulated time:

```http
GET /api/admin/monitoring?simulatedNow=2026-07-07T07%3A00%3A00.000Z
```

Run overdue body:

```json
{
  "simulatedNow": "2026-07-07T07:00:00.000Z"
}
```

Voucher body:

```json
{
  "code": "WELCOME50",
  "discountAmount": 50000,
  "expiryDate": "2026-12-31T23:59:59.000Z",
  "remainingUsage": 25
}
```

Promo body:

```json
{
  "code": "PROMO25",
  "discountAmount": 25000,
  "expiryDate": "2026-12-31T23:59:59.000Z"
}
```

## Error Format

Validation errors:

```json
{
  "message": "Input tidak valid.",
  "issues": [
    { "path": "comment", "message": "Input tidak boleh berisi tag HTML, script, javascript URL, atau event handler." }
  ]
}
```

Authorization errors:

```json
{ "message": "Akses membutuhkan active role ADMIN." }
```
