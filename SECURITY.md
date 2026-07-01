# Security Notes

This document summarizes the Level 7 security hardening implemented in SEAPEDIA.

## SQL Injection

- PostgreSQL access uses `pg` parameterized query placeholders such as `$1`, `$2`, and query parameter arrays.
- User-controlled values are not concatenated into SQL filters or mutation statements.
- Dynamic database name creation during startup uses an identifier-quoting helper and is not sourced from form input.
- Search/filter behavior in the frontend is client-side for public catalog filtering and does not build SQL strings.

Suggested demo:

1. Try logging in with username `admin' OR '1'='1`.
2. The login should fail normally and no database behavior should change.
3. Try SQL-like text in review/search/checkout fields; validation or parameterized queries should keep behavior safe.

## XSS Prevention

- Public review display uses React text rendering, not `dangerouslySetInnerHTML`.
- Public review input is validated server-side and rejects HTML tags, `<script>`, `javascript:` URLs, and inline event handlers.
- Seller/admin/driver SweetAlert modals that render HTML use escaped values for user-controlled content or `titleText` for plain text.
- Review comments use length limits and `break-words` styling so long input cannot break the page layout.

Suggested demo:

```json
{
  "reviewerName": "Tester",
  "rating": 5,
  "comment": "<script>alert(1)</script>"
}
```

Expected result: `400 Input tidak valid` with a message that HTML/script input is not allowed.

## Input Validation

Backend validation uses Zod before saving data.

Validated inputs include:

- Register: username, email, display name, password, and roles.
- Review: reviewer name, rating 1-5, comment length, and dangerous markup rejection.
- Buyer: top-up amount, phone number, address fields, postal code, cart quantity, delivery method, and discount code format.
- Seller: store name, store description, product name, description, price, stock, category, image URL/blob data.
- Admin: voucher/promo code format, discount amount, future expiry date, and voucher usage count.

Invalid input returns a clear `400` response with field-level issues.

## Session Behavior

- Passwords are hashed with bcrypt.
- JWT tokens expire after 2 hours.
- After login, the first token has no active role.
- `POST /auth/select-role` issues a fresh token containing the selected active role.
- `POST /auth/logout` revokes the current token in an in-memory revocation list and the frontend clears local storage.
- Revocation is in-memory for the local demo. After a server restart, tokens remain protected by the 2-hour expiration.

## Role-Based Access Control

- Backend middleware authenticates JWT tokens and checks `activeRole` for protected route groups.
- Admin endpoints require active role `ADMIN`.
- Seller endpoints require active role `SELLER`.
- Buyer endpoints require active role `BUYER`.
- Driver endpoints require active role `DRIVER`.
- The backend does not trust frontend navigation or visible role badges.

Suggested demo:

1. Login as `buyerdemo`, select active role `BUYER`.
2. Call `GET /api/admin/monitoring` with that token.
3. Expected result: `403 Akses membutuhkan active role ADMIN.`

## Ownership Checks

- Seller product update/delete uses the seller's own store id.
- Seller order processing only updates orders owned by that seller and still in `Sedang Dikemas`.
- Buyer order detail requires the order to belong to the buyer, or to the seller for seller-side visibility.
- Buyer checkout requires an address owned by the buyer.
- Driver job detail/action is limited to available jobs or jobs assigned to that driver, depending on the action.
- Admin-only monitoring and overdue handling are protected by active role `ADMIN`.

## Overdue Safety

- Overdue processing locks eligible orders in a transaction.
- Final statuses `Pesanan Selesai` and `Dikembalikan` are excluded from overdue candidates.
- This prevents double refund, double stock restoration, and double status-history insertion for the same returned order.
- Refunds are recorded in wallet transaction history and status changes are recorded in order status history.
