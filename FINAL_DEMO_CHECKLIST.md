# Final Demo Checklist

Use this checklist to demonstrate SEAPEDIA as one integrated Level 1-7 system.

## Guest, Review, and Authentication Flow

- [ ] Guest opens the home page.
- [ ] Guest opens `/products` and sees backend product data.
- [ ] Guest opens product detail and sees store information.
- [ ] Guest submits an application review with reviewer name, rating, and comment.
- [ ] Submitted review appears in the public review list.
- [ ] XSS test: submit `<script>alert(1)</script>` as review comment and confirm it is rejected safely.
- [ ] User registers with display name, username, email, password, and one or more non-admin roles.
- [ ] User logs in.
- [ ] Multi-role user chooses an active role.
- [ ] Private dashboards are blocked unless the token has the required active role.
- [ ] Logout asks for confirmation and clears the session.

## Seller Flow

- [ ] Login as `sellerdemo` / `Seller123!`.
- [ ] Select active role `SELLER`.
- [ ] Open Seller workspace.
- [ ] Create or update store with a unique store name.
- [ ] Open Product Management page.
- [ ] Create product using modal popup.
- [ ] Update product using modal popup.
- [ ] Delete product with confirmation.
- [ ] Confirm seller products appear in public catalog.
- [ ] Open Order Processing page.
- [ ] Process incoming order from `Sedang Dikemas` to `Menunggu Pengirim`.

## Buyer Flow

- [ ] Login as `buyerdemo` / `Buyer123!`.
- [ ] Select active role `BUYER`.
- [ ] Top up wallet using dummy top-up.
- [ ] Create delivery address from checkout page.
- [ ] Add product to cart from product detail.
- [ ] Confirm cart page is separate from dashboard.
- [ ] Open checkout page.
- [ ] Choose delivery method.
- [ ] Apply optional voucher `WELCOME50` or promo `PROMO25`.
- [ ] Confirm checkout summary shows subtotal, discount, delivery fee, PPN 12%, and final total.
- [ ] Checkout successfully and see SweetAlert feedback.
- [ ] Open order history.
- [ ] Open order detail and verify status timeline.

## Driver Flow

- [ ] Login as `driverdemo` / `Driver123!`.
- [ ] Select active role `DRIVER`.
- [ ] Open Driver dashboard with marketplace-style navigation, not admin panel UI.
- [ ] Open Available Jobs.
- [ ] Take one available job.
- [ ] Open Active Delivery.
- [ ] Confirm completed job.
- [ ] Open Job History.
- [ ] Verify driver earnings equal completed delivery fee.

## Admin, Overdue, and Security Flow

- [ ] Login as `admin` / `Admin123!`.
- [ ] Select active role `ADMIN`.
- [ ] Open Admin dashboard.
- [ ] Open Marketplace Monitoring.
- [ ] Verify monitoring data for users, stores, products, orders, vouchers/promos, delivery jobs, and overdue orders.
- [ ] Open Voucher Management.
- [ ] Generate voucher and view it in the datatable/detail modal.
- [ ] Open Promo Management.
- [ ] Generate promo and view it in the datatable/detail modal.
- [ ] Open Overdue Handling.
- [ ] Use `+1 day` or `+3 days` simulation, or set a custom simulated time.
- [ ] Confirm overdue candidates appear when the simulated time passes delivery SLA.
- [ ] Run overdue handling.
- [ ] Confirm SweetAlert success and processed refund table.
- [ ] Confirm returned order status is `Dikembalikan`.
- [ ] Confirm buyer wallet has a `REFUND` transaction.
- [ ] Confirm product stock is restored.
- [ ] Confirm returned order is not counted as seller income.
- [ ] SQL Injection test: try `admin' OR '1'='1` in login and confirm it fails safely.
- [ ] RBAC test: use a Buyer active-role token against `/api/admin/monitoring` and confirm backend returns 403.

## Required Documentation

- [ ] README explains setup, environment variables, demo accounts, business rules, and demo flow.
- [ ] API docs exist in `docs/API.md`.
- [ ] Security notes exist in `docs/SECURITY.md`.
- [ ] Final demo checklist exists in this file.
- [ ] Backend `npm run lint` passes.
- [ ] Frontend `npm run build` passes.
