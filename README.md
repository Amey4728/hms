# HMS — Enterprise Hospital Management System

A production-grade, modular Hospital Management System. Monorepo managed with
**pnpm workspaces + Turborepo**.

```
hmas/
├── apps/
│   ├── api/          NestJS backend (all modules)
│   └── web/          React 19 + Vite frontend
├── packages/
│   └── shared/       @hms/shared — RBAC catalogue, API envelope, Zod schemas
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

## Tech stack

| Layer    | Choice                                                        |
| -------- | ------------------------------------------------------------- |
| Backend  | NestJS · TypeScript · Prisma · PostgreSQL 18                  |
| Auth     | JWT access + rotating refresh (httpOnly cookie) · Argon2id    |
| Security | Helmet · CORS · Throttler · RBAC permission guards · audit    |
| Frontend | React 19 · Vite · Tailwind · React Router · TanStack Query · Zustand |
| Infra    | Docker · Docker Compose · Nginx · GitHub Actions CI           |

## Modules

**Core** — Auth, RBAC (12 roles, permission-based guards), Users, Hospitals,
Branches, Departments · **Clinical** — Patients + medical history / allergies /
emergency contacts, Visits, Diagnoses, Prescriptions, Treatment Plans ·
**Appointments** — booking, walk-in, queue + token, doctor availability ·
**Laboratory** · **Radiology** · **Pharmacy + Inventory** · **Billing** ·
**Insurance** · **HR** (employees, attendance, leave, shifts, payroll) ·
**General Inventory** (vendors, equipment/consumables, purchase requests,
transfers) · **Reports & Analytics**.

Every endpoint is under `/api/v1` and documented in Swagger at `/docs`. Per-phase
docs live in [`docs/`](docs/) (`PHASE-1.md` … `PHASE-6.md`).

## Prerequisites

- Node.js ≥ 20 (tested on 24)
- pnpm 9 (`npm i -g pnpm@9`)
- PostgreSQL 18 running locally (or use Docker below)

## Getting started (local)

```bash
pnpm install

# 1. Configure the DB connection — edit apps/api/.env → DATABASE_URL
# 2. Generate client, run migrations, seed roles/permissions + super admin
pnpm db:generate && pnpm db:migrate && pnpm db:seed

# 3. Run
pnpm --filter @hms/api dev     # API  → http://localhost:4000/api/v1  (Swagger /docs)
pnpm --filter @hms/web dev     # Web  → http://localhost:5173
```

Seeded super admin: `superadmin@hms.local` / `SuperAdmin@123`.

## Run everything in Docker

```bash
cp .env.docker.example .env.docker           # set strong secrets
docker compose --env-file .env.docker up --build
# Web + Swagger → http://localhost:8080  (Swagger at /docs)
```

The `web` container (Nginx) serves the SPA and reverse-proxies `/api` and `/docs`
to the `api` container, so everything is same-origin. The API applies pending
migrations on start.

## Useful scripts (repo root)

| Script             | Description                              |
| ------------------ | ---------------------------------------- |
| `pnpm build`       | Build every package                      |
| `pnpm dev`         | Build shared, then run all `dev` tasks   |
| `pnpm test`        | Run all tests                            |
| `pnpm db:migrate`  | Apply Prisma migrations                  |
| `pnpm db:seed`     | Seed RBAC + super admin                  |
| `pnpm db:studio`   | Open Prisma Studio                       |

## CI

`.github/workflows/ci.yml` runs on push / PR to `main`: install → build shared →
prisma generate → lint → unit tests → build api → build web.
