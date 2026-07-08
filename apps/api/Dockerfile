# ── HMS API (NestJS) — multi-stage build for the pnpm monorepo ──────────────
# Build context is the repository root:  docker build -f apps/api/Dockerfile .

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

# ── deps: install with the frozen lockfile (workspace-aware) ────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile

# ── build: compile shared → generate Prisma client → build api ─────────────
FROM base AS build
COPY --from=deps /repo/ /repo/
COPY . .
RUN pnpm --filter @hms/shared run build \
 && pnpm --filter @hms/api exec prisma generate \
 && pnpm --filter @hms/api run build

# ── runtime ─────────────────────────────────────────────────────────────────
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages ./packages
COPY --from=build /repo/apps/api/package.json ./apps/api/package.json
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=build /repo/apps/api/prisma ./apps/api/prisma
WORKDIR /repo/apps/api
EXPOSE 4000
# Apply migrations, then start. (Uses the bundled Prisma CLI.)
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/main.js"]
