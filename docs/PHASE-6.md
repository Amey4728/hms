# Phase 6 — Remaining modules + Infrastructure

Completes the platform: Radiology, Insurance, Clinical encounters, HR, general
Inventory, Reports, plus Docker / CI / Nginx. All backends follow the same
Controller → Service → Repository pattern with soft delete, audit columns,
optimistic locking, Decimal money, state machines, and Zod DTOs in `@hms/shared`.

## Modules (all `/api/v1`)

| Module | Endpoints (prefix) | Highlights |
| ------ | ------------------ | ---------- |
| **Radiology** | `/radiology/exams`, `/radiology/studies` | catalogue + study state machine REQUESTED→SCHEDULED→PERFORMED→REPORTED; report upload |
| **Insurance** | `/insurance/providers`, `/insurance/claims` | claim workflow SUBMITTED→UNDER_REVIEW→APPROVED→SETTLED / REJECTED; approvedAmount |
| **Clinical** | `/visits`, `/prescriptions`, `/treatment-plans` | visits w/ vitals (JSON) + notes, nested diagnoses, drug prescriptions, plans |
| **HR** | `/hr/employees`, `/hr/leave`, `/hr/shifts`, `/hr/payslips` | attendance, leave approval, shift scheduling, payroll (net = base + allowances − deductions) |
| **Inventory** | `/inventory/vendors`, `/items`, `/purchase-requests`, `/transfers` | items + stock adjust, low-stock alert, purchase workflow (receive → stock++), transfers |
| **Reports** | `/reports/*` | overview, revenue, appointments, patients, doctors, inventory, occupancy (aggregations) |

## Money
All monetary values are PostgreSQL `Decimal`, computed with `Prisma.Decimal`
(no float error), serialized to `number` in view mappers.

## State machines (all reject illegal edges with 409)
- Radiology study, Insurance claim, Lab order, Appointment, Purchase request.

## Infrastructure
- **Dockerfiles** — `apps/api/Dockerfile` (multi-stage pnpm build → `node dist/main.js`,
  runs `prisma migrate deploy` on start), `apps/web/Dockerfile` (Vite build → Nginx static).
- **docker-compose.yml** — `postgres` (18), `redis` (7), `api`, `web` (Nginx). Web
  reverse-proxies `/api` + `/docs` to the API (same-origin, no CORS needed).
  Config via `.env.docker` (see `.env.docker.example`).
- **Nginx** — `apps/web/nginx.conf`: SPA fallback + API proxy + asset caching.
- **CI** — `.github/workflows/ci.yml`: install → build shared → prisma generate →
  lint → test → build api → build web, on push/PR to `main`.

### Run the whole stack in Docker
```bash
cp .env.docker.example .env.docker      # set strong secrets
docker compose --env-file .env.docker up --build
# Web + Swagger: http://localhost:8080  (Swagger at /docs)
```

## Verification (smoke tests)
Radiology (study → report), Insurance (claim workflow), Clinical (visit + dx + rx
+ plan, closed-visit guard), HR (employee, leave approve, payslip net), Inventory
(purchase receive increments stock, low-stock, transfer), Reports (all 7 KPIs).
Lint clean, 15 unit tests pass, api + web build clean.
