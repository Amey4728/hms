# HMS — Enterprise Hospital Management System

A production-grade, modular Hospital Management System. Monorepo managed with
**pnpm workspaces + Turborepo**.

```
hmas/
├── apps/
│   └── api/          NestJS backend (Phase 1)
├── packages/
│   └── shared/       @hms/shared — RBAC catalogue, API envelope, Zod schemas
├── turbo.json
└── pnpm-workspace.yaml
```

## Tech stack

| Layer    | Choice                                                        |
| -------- | ------------------------------------------------------------- |
| Backend  | NestJS · TypeScript · Prisma · PostgreSQL 18                  |
| Auth     | JWT access + rotating refresh (httpOnly cookie) · Argon2id    |
| Security | Helmet · CORS · Throttler · RBAC permission guards · audit    |
| Frontend | React 19 · Vite · Tailwind (added in a later phase)           |

## Prerequisites

- Node.js ≥ 20 (tested on 24)
- pnpm 9 (`npm i -g pnpm@9`)
- PostgreSQL 18 running locally

## Getting started

```bash
pnpm install

# 1. Configure the DB connection
#    edit apps/api/.env → set DATABASE_URL password

# 2. Create the database (once)
#    createdb -U postgres hms         (or via pgAdmin)

# 3. Generate client, run migrations, seed roles/permissions + super admin
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 4. Run the API (http://localhost:4000/api/v1, Swagger at /docs)
pnpm --filter @hms/api dev
```

## Useful scripts (run from repo root)

| Script             | Description                              |
| ------------------ | ---------------------------------------- |
| `pnpm build`       | Build every package (shared → api)       |
| `pnpm dev`         | Build shared, then run all `dev` tasks   |
| `pnpm test`        | Run all tests                            |
| `pnpm db:migrate`  | Apply Prisma migrations                  |
| `pnpm db:seed`     | Seed RBAC + super admin                  |
| `pnpm db:studio`   | Open Prisma Studio                       |

See [`docs/PHASE-1.md`](docs/PHASE-1.md) for the full Phase 1 documentation
(schema, endpoints, RBAC model, flows, sequence diagrams).
