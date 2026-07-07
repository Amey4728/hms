# Phase 1 — Core, Authentication & RBAC

This document covers the foundation modules: **Auth**, **Users**, **RBAC**, and
the **organisation** entities (Hospital / Branch / Department), plus the
cross-cutting platform (config, guards, filters, interceptors).

---

## 1. Folder structure

```
apps/api/
├── prisma/
│   ├── schema.prisma          # DB schema (UUID, soft delete, audit, versioning)
│   └── seed.ts                # seeds permissions, roles, super admin from @hms/shared
└── src/
    ├── main.ts                # bootstrap: helmet, cookies, CORS, prefix, Swagger
    ├── app.module.ts          # global pipe/filter/interceptor/guard wiring
    ├── config/                # env validation (Zod) + typed config namespaces
    ├── prisma/                # global PrismaService/Module
    ├── common/
    │   ├── decorators/        # @Public, @Permissions, @CurrentUser, @ResponseMessage
    │   ├── guards/            # JwtAuthGuard, PermissionsGuard
    │   ├── filters/           # AllExceptionsFilter (standard error envelope)
    │   ├── interceptors/      # TransformInterceptor, LoggingInterceptor
    │   ├── dto/               # PaginationQueryDto, PaginatedResult
    │   └── types/             # AuthenticatedUser, token payloads
    └── modules/
        ├── auth/              # controller, service, TokenService, JwtStrategy, DTOs
        ├── users/             # controller, service, repository, mapper
        ├── rbac/              # roles & permissions management, role assignment
        └── health/            # liveness + DB probe

packages/shared/src/
├── rbac/        # permissions.ts (catalogue), roles.ts (role→permission map)
├── api/         # response.ts (ApiResponse / ApiErrorResponse envelopes)
└── auth/        # schemas.ts (login/register Zod schemas)
```

---

## 2. Database schema (ER overview)

```
User ─────< UserRole >───── Role ─────< RolePermission >───── Permission
  │                           │
  │                           └── isSystem, displayName
  ├──< RefreshToken            (rotation family, sha256 hash)
  ├──< LoginHistory            (success/failure, ip, reason)
  └──< AuditLog

Hospital ──< Branch ──< Department
   │            │            │
   └──< User    └──< User    (scoped to hospital/branch)
```

Every business table carries: `id (uuid)`, `createdAt`, `updatedAt`,
`deletedAt` (soft delete), `createdBy`/`updatedBy` (audit), and `version`
(optimistic locking). Indexes exist on `deletedAt`, all foreign keys, `email`,
and `login_histories.createdAt`.

**Why data-driven RBAC (tables, not enums):** a Hospital Admin can create custom
roles and re-map permissions at runtime without a code deploy. Guards check
permission strings, so no business logic references role names.

---

## 3. API endpoints

Base URL: `/api/v1`

| Method | Path                    | Auth   | Permission          | Description                          |
| ------ | ----------------------- | ------ | ------------------- | ------------------------------------ |
| GET    | `/health`               | Public | —                   | Liveness + DB probe                  |
| POST   | `/auth/register`        | Public | —                   | Self-register a patient              |
| POST   | `/auth/login`           | Public | —                   | Authenticate, receive access token   |
| POST   | `/auth/refresh`         | Cookie | —                   | Rotate refresh cookie, new access    |
| POST   | `/auth/logout`          | Bearer | —                   | Revoke refresh token, clear cookie   |
| GET    | `/auth/me`              | Bearer | —                   | Current user profile                 |
| GET    | `/users`                | Bearer | `user.read`         | List users (page/limit/sort/search)  |
| GET    | `/users/:id`            | Bearer | `user.read`         | Get user by id                       |
| GET    | `/rbac/roles`           | Bearer | `role.read`         | List roles + their permissions       |
| GET    | `/rbac/permissions`     | Bearer | `permission.read`   | List permission catalogue            |
| POST   | `/rbac/assign-role`     | Bearer | `role.assign`       | Grant a role to a user               |
| DELETE | `/rbac/assign-role`     | Bearer | `role.assign`       | Remove a role from a user            |

---

## 4. Validation

All request bodies/queries are validated by **Zod** via `nestjs-zod`
(`ZodValidationPipe` global). Schemas for login/register live in `@hms/shared`
so the React app reuses the exact same rules.

- **Password:** ≥ 8 chars, upper + lower + digit + symbol.
- **Email:** trimmed, lowercased, RFC-valid.
- **Pagination:** `page ≥ 1`, `1 ≤ limit ≤ 100`, `sortOrder ∈ {asc, desc}`.

Validation failures return `400 VALIDATION_ERROR` with per-field `details`.

---

## 5. Business rules

- Self-registration always creates a user with the **PATIENT** role only.
- Login increments `failedLoginAttempts`; at `MAX_FAILED_LOGINS` (default 5) the
  account is locked for `ACCOUNT_LOCK_MINUTES` (default 15).
- Successful login resets counters and stamps `lastLoginAt`.
- Refresh tokens **rotate** on every use; reuse of a revoked token revokes the
  whole token **family** (theft detection).
- Only `ACTIVE` users may authenticate.
- Permissions are the **union** across all of a user's roles.

---

## 6. Security considerations

- **Argon2id** password hashing (19 MiB, t=2, p=1).
- Access token: JWT, 15 min, carries the resolved permission set (stateless authz).
- Refresh token: opaque 96-hex, **only its sha256 hash is stored**, delivered in
  an **httpOnly + SameSite=Lax** cookie scoped to `/api/v1/auth`.
- Helmet, CORS (credentialed, allow-listed origins), rate limiting (Throttler,
  stricter on `/auth/*`).
- Prisma parameterises all queries → SQL-injection safe.
- Every login attempt recorded in `login_histories`; `audit_logs` table ready
  for entity change tracking.
- Generic `Invalid credentials` message prevents user enumeration.

---

## 7. Sample requests

```http
POST /api/v1/auth/login
Content-Type: application/json

{ "email": "superadmin@hms.local", "password": "SuperAdmin@123" }
```

```http
GET /api/v1/users?page=1&limit=20&sortBy=createdAt&sortOrder=desc
Authorization: Bearer <accessToken>
```

---

## 8. Sample responses

Success (login):

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "…", "email": "superadmin@hms.local",
      "roles": ["SUPER_ADMIN"], "permissions": ["user.create", "…"]
    },
    "accessToken": "eyJhbGciOi…"
  },
  "meta": {}
}
```

Paginated list:

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [ { "id": "…", "email": "…" } ],
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1,
            "hasNextPage": false, "hasPreviousPage": false }
}
```

Error:

```json
{
  "success": false,
  "message": "Request validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "statusCode": 400,
    "details": [ { "field": "password", "message": "Password must contain a symbol" } ]
  },
  "meta": { "timestamp": "2026-07-07T10:00:00.000Z", "path": "/api/v1/auth/register" }
}
```

---

## 9. Flow diagram — request authorization

```
Request
   │
   ▼
ThrottlerGuard ──(rate exceeded)──► 429
   │
   ▼
JwtAuthGuard ──@Public?──► skip ─┐
   │ validate Bearer             │
   ▼                             │
PermissionsGuard ◄───────────────┘
   │ has @Permissions? ──no──► allow
   │ user.permissions ⊇ required? ──no──► 403
   ▼ yes
Controller → Service → Repository → Prisma → PostgreSQL
   │
   ▼
TransformInterceptor → { success, message, data, meta }
```

---

## 10. Sequence diagram — login + refresh

```
Client            AuthController        AuthService        TokenService      DB
  │  POST /login      │                     │                   │            │
  │──────────────────►│                     │                   │            │
  │                   │  login(dto,ctx)     │                   │            │
  │                   │────────────────────►│  findByEmail      │            │
  │                   │                     │──────────────────────────────►│
  │                   │                     │  argon2.verify    │            │
  │                   │                     │  issueAccess      │            │
  │                   │                     │──────────────────►│            │
  │                   │                     │  issueRefresh(hash)│──────────►│
  │                   │  Set-Cookie hms_rt  │                   │            │
  │◄──────────────────│  { user, access }   │                   │            │
  │                                                                          │
  │  POST /refresh (cookie hms_rt)                                           │
  │──────────────────►│  rotate(raw)        │                   │            │
  │                   │────────────────────►│  find + validate  │──────────►│
  │                   │                     │  revoke old + new │──────────►│
  │◄──────────────────│  Set-Cookie (new)   │  { user, access } │            │
```
