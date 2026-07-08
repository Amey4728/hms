# Phase 5 — Laboratory · Pharmacy · Billing (+ Core user CRUD)

Three revenue/clinical-support modules plus admin user management. All follow
the established Controller → Service → Repository pattern with soft delete,
audit columns, optimistic locking, and Zod DTOs in `@hms/shared`.

Migrations: `laboratory`, `pharmacy`, `billing`.

---

## Core — Admin user management
`POST /users` (create staff + assign roles), `PATCH /users/:id` (profile,
optimistic lock), `PATCH /users/:id/status` (activate/suspend/deactivate —
revokes refresh tokens), `DELETE /users/:id` (soft delete, self-delete guard),
`GET /users?role=` (role filter for pickers). Shared password util
(`common/security/password.util.ts`) used by auth + users.

---

## Laboratory (`/api/v1/lab`)
- **Test catalogue** `lab/tests` — CRUD (`lab.test.manage`; read `lab.result.read`).
  Decimal `price` mapped to number.
- **Orders** `lab/orders` — create with N tests; state machine
  `ORDERED → SAMPLE_COLLECTED → IN_PROGRESS → COMPLETED` (+CANCELLED).
  Per-item result entry (`PATCH /:id/items/:itemId/result`) gated to IN_PROGRESS;
  completion blocked until every item is resulted; `GET /:id/report` for
  COMPLETED orders. Permissions `lab.result.create` / `lab.result.read`.

## Pharmacy & Inventory (`/api/v1/pharmacy`)
- **Medicines** `pharmacy/medicines` — catalogue CRUD (`inventory.manage`).
- **Inventory** `pharmacy/inventory` — receive stock batches; `GET stock`
  (on-hand per medicine + low-stock flag); `alerts/low-stock`
  (stock ≤ reorderLevel); `alerts/expiring?days=` (batches with qty > 0 expiring
  soon).
- **Sales** `pharmacy/sales` — **FEFO** (first-expiry-first-out) stock decrement
  across batches inside a transaction, per-batch line items,
  subtotal/discount/tax(%)/total via Decimal; insufficient stock → 400.
  Permission `pharmacy.sale.create`.

## Billing (`/api/v1/billing`)
- **Invoices** `billing/invoices` — generate with line items; totals computed
  (subtotal − discount, +taxRate% → total) via Decimal. Status
  `ISSUED → PARTIALLY_PAID → PAID`, plus `REFUNDED`, `CANCELLED`.
- **Payments** `POST /:id/payments` — updates amountPaid + status atomically;
  overpayment (> balance) → 400.
- **Refunds** `POST /:id/refunds` (`billing.refund`) — decrements amountPaid;
  refund > paid → 400; drives status to REFUNDED.
- **Cancel** `PATCH /:id/cancel` — only when no payments exist (else 409).
  Permissions `billing.generate` / `billing.read` / `billing.refund`.

---

## Money handling
All monetary values stored as PostgreSQL `Decimal` and computed with
`Prisma.Decimal` (no float error), then serialized to `number` in view mappers.

## Verified (smoke tests)
- Lab: result-entry gating (409), complete-gating with unresulted count, report.
- Pharmacy: FEFO split across batches, totals, insufficient-stock 400, low-stock
  + expiry alerts.
- Billing: totals, ISSUED→PARTIALLY_PAID→PAID→REFUNDED, overpay/over-refund 400,
  cancel guard 409, unpaid cancel → CANCELLED.
- 15 API unit tests still pass.
