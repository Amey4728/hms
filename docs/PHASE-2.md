# Phase 2 — Hospital / Branch / Department Management

Full CRUD for the organisation entities. Establishes the reusable module
template (`Controller → Service → Repository → Prisma`) used by all later modules.

---

## 1. Folder structure

```
apps/api/src/
├── common/utils/optimistic.ts        # assertUpdatable / assertWritten (shared lock logic)
└── modules/
    ├── hospitals/   { controller, service, repository, module, dto/hospital.dto.ts, *.spec.ts }
    ├── branches/    { controller, service, repository, module, dto/branch.dto.ts }
    └── departments/ { controller, service, repository, module, dto/department.dto.ts }

packages/shared/src/org/schemas.ts     # create/update Zod schemas (reused by the web app)
```

## 2. Database schema

No migration needed — `hospitals`, `branches`, `departments` were created in the
Phase 1 `init` migration. Relevant constraints:

- `hospitals.code` unique.
- `branches` unique `(hospitalId, code)`; FK → hospital (cascade).
- `departments` unique `(hospitalId, code)`; FK → hospital (cascade), optional FK → branch (set null).
- All three: `version Int` (optimistic lock), `deletedAt` (soft delete), `createdBy`/`updatedBy`.

## 3. API endpoints (`/api/v1`)

| Method | Path | Permission |
| ------ | ---- | ---------- |
| POST | `/hospitals` | `hospital.create` |
| GET | `/hospitals?page&limit&search&sortBy&sortOrder` | `hospital.read` |
| GET | `/hospitals/:id` | `hospital.read` |
| PATCH | `/hospitals/:id` | `hospital.update` |
| DELETE | `/hospitals/:id` | `hospital.delete` |
| POST | `/branches` | `branch.create` |
| GET | `/branches?hospitalId&…` | `branch.read` |
| GET/PATCH/DELETE | `/branches/:id` | `branch.read/update/delete` |
| POST | `/departments` | `department.create` |
| GET | `/departments?hospitalId&branchId&type&…` | `department.read` |
| GET/PATCH/DELETE | `/departments/:id` | `department.read/update/delete` |

## 4. Validation (Zod, in `@hms/shared`)

- `name` 2–150; `code` 2–20 uppercased `[A-Z0-9_-]`; contact/address fields optional.
- Department `type ∈ {CLINICAL, DIAGNOSTIC, SUPPORT, ADMINISTRATIVE}`.
- **Update DTOs require `version`** (integer) for optimistic locking; other fields optional.
- Department update accepts `branchId: null` to detach from a branch.

## 5. Business rules

- Codes normalised to uppercase; uniqueness enforced per parent (DB → 409).
- **Optimistic lock:** update writes with `WHERE id = ? AND version = ? AND deletedAt IS NULL`
  and `version = version + 1`; stale version → **409** (`expected vs current`).
- **Referential integrity:** a branch must reference an existing hospital; a department's
  branch must belong to its hospital (else **400**).
- **Soft-delete guards:** a hospital with active branches/departments cannot be deleted;
  a branch with active departments cannot be deleted (**409**).
- Every list filters `deletedAt IS NULL`.

## 6. Security considerations

Permission-gated per action (no role-name checks). Audit columns stamped from the
authenticated principal. Prisma parameterises all queries. Optimistic locking prevents
lost updates under concurrent staff edits.

## 7–8. Sample request / response

```http
PATCH /api/v1/departments/e300…  Authorization: Bearer <token>
{ "version": 1, "name": "Cardiology & Vascular" }
```
```json
{ "success": true, "message": "Department updated successfully",
  "data": { "id": "e300…", "name": "Cardiology & Vascular", "version": 2 }, "meta": {} }
```
Stale retry:
```json
{ "success": false,
  "message": "Department was modified by someone else (expected version 1, current 2). Reload and try again.",
  "error": { "code": "CONFLICT", "statusCode": 409 } }
```

## 9. Flow — create department

```
POST /departments
   │ PermissionsGuard: department.create
   ▼
DepartmentsService.create
   ├─ HospitalsRepository.findActiveById(hospitalId)  ──not found──► 404
   ├─ BranchesRepository.findActiveById(branchId)     ──not found──► 404
   │     └─ branch.hospitalId !== hospitalId          ──mismatch──► 400
   ▼
DepartmentsRepository.create (stamps createdBy/updatedBy)
   ▼  unique (hospitalId, code) violated ──► 409
{ success, data: department }
```

## 10. Sequence — optimistic update

```
Client         Controller        Service                 Repository        DB
  │ PATCH {version:1}│                │                        │            │
  │─────────────────►│ update(id,dto) │                        │            │
  │                  │───────────────►│ findActiveById ───────►│───────────►│  version=2
  │                  │                │ assertUpdatable(2 vs 1) │            │
  │◄─────────────────┤ 409 CONFLICT   │ (throws before write)  │            │
```
