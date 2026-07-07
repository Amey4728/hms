# Phase 3 — Patient Registration & Profile

Clinical foundation: **Patient** + child collections **Emergency Contacts**,
**Allergies**, **Medical History**.

---

## 1. Folder structure

```
apps/api/src/modules/patients/
├── patients.{controller,service,repository,mapper,module}.ts
├── patients.mapper.spec.ts
├── dto/patient.dto.ts
├── emergency-contacts/  { controller, service, repository, dto }
├── allergies/           { controller, service, repository, dto }
└── medical-history/     { controller, service, repository, dto }

packages/shared/src/clinical/patient.schemas.ts   # Zod schemas + enums + formatMrn()
```

## 2. Database schema (migration `patients`)

New tables: `patients`, `emergency_contacts`, `allergies`, `medical_histories`.
New enums: `Gender`, `BloodGroup`, `MaritalStatus`, `PatientStatus`,
`AllergySeverity`, `MedicalConditionStatus`.

- `patients.patientNumber Int @unique @default(autoincrement())` → drives the MRN.
- `patients.userId` nullable **unique** FK → optional portal account (one-to-one).
- `patients.hospitalId/branchId` nullable FKs (set null on parent delete).
- Children: FK → patient `onDelete: Cascade`; each has `version`, `deletedAt`, audit cols.

## 3. API endpoints (`/api/v1`)

| Method | Path | Permission |
| ------ | ---- | ---------- |
| POST/GET | `/patients` | `patient.create` / `patient.read` |
| GET/PATCH/DELETE | `/patients/:id` | `patient.read/update/delete` |
| POST/GET | `/patients/:pid/emergency-contacts` | `patient.update` / `patient.read` |
| PATCH/DELETE | `/patients/:pid/emergency-contacts/:id` | `patient.update` |
| POST/GET/PATCH/DELETE | `/patients/:pid/allergies[/:id]` | read=`patient.read`, mutate=`patient.update` |
| POST/GET/PATCH/DELETE | `/patients/:pid/medical-history[/:id]` | read=`patient.read`, mutate=`patient.update` |

`GET /patients/:id` returns the **full profile** (patient + MRN + active child collections).
`GET /patients` returns lightweight rows (no children).

## 4. Validation (Zod, `@hms/shared`)

- Names 1–80; `phone` required (regex); `dateOfBirth` required, **must be in the past**.
- Typed enums for gender / blood group / marital status / status / severity / condition status.
- Update DTOs require `version` (optimistic lock).
- `diagnosedAt` optional past date.

## 5. Business rules

- **MRN** derived from the DB `autoincrement()` sequence → `MRN-000001` (atomic, collision-free).
- Optional hospital/branch/user links validated to exist before connect.
- Optimistic locking on every update; stale version → **409**.
- Child rows are **scoped by `patientId`** in every query → a contact/allergy/history from
  another patient is invisible (**404**), preventing cross-patient access.
- Soft delete throughout; cascade FK ensures children go with a hard-deleted patient,
  while normal deletes are soft.

## 6. Security considerations

Permission-gated (read vs mutate). Patient PII returned only to `patient.read` holders.
Child-resource queries always include `patientId` in the `WHERE`, so IDs can't be used to
reach another patient's data. Audit columns + `recordedBy` on clinical entries. MRN leaks
no PII.

## 7–8. Sample request / response

```http
POST /api/v1/patients            Authorization: Bearer <token>
{ "firstName":"Alice","lastName":"Walker","dateOfBirth":"1990-05-14",
  "gender":"FEMALE","phone":"+1 555 0101","bloodGroup":"O_POSITIVE" }
```
```json
{ "success": true, "message": "Patient registered successfully",
  "data": { "id":"2620…","patientNumber":1,"mrn":"MRN-000001",
            "firstName":"Alice","gender":"FEMALE","version":1 }, "meta": {} }
```

## 9. Flow — register patient + build profile

```
POST /patients (patient.create)
   └─ validate DOB in past, enums, optional hospital/branch/user exist
   └─ INSERT → patientNumber = nextval(sequence) → mrn = MRN-000001
POST /patients/:id/allergies (patient.update)  ── scoped to patient
GET  /patients/:id (patient.read)
   └─ SELECT patient + active contacts + allergies + histories → embedded profile
```

## 10. Sequence — child create with patient guard

```
Client        ContactsController     ContactsService      PatientsService   Repo/DB
  │ POST .../emergency-contacts │            │                  │             │
  │────────────────────────────►│ create(pid)│                  │             │
  │                             │───────────►│ assertPatientExists(pid)──────►│  count?
  │                             │            │◄── 404 if absent │             │
  │                             │            │ repo.create(connect pid)──────►│
  │◄────────────────────────────┤ contact    │                  │             │
```
