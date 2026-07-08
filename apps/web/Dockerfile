# ── HMS Web (React/Vite) — build then serve static assets via Nginx ─────────
# Build context is the repository root:  docker build -f apps/web/Dockerfile .

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /repo/ /repo/
COPY . .
# In the container the API is reached same-origin through Nginx at /api/v1.
ENV VITE_API_URL=/api/v1
RUN pnpm --filter @hms/shared run build \
 && pnpm --filter @hms/web run build

FROM nginx:1.27-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 80
