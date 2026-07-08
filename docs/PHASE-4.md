# Phase 4 — Appointments

Scheduling with a status **state machine**, doctor availability, slot generation,
and a **token/queue** system.

---

## 1. Folder structure

```
apps/api/src/modules/appointments/
├── appointments.{controller,service,repository,mapper,module}.ts
├── appointment.state.ts          # transition table + guards + toDateOnly
├── appointment.state.spec.ts
├── slots.service.ts              # free-slot generation
├── scheduling-validation.service.ts  # doctor/patient/org-scope validation
├── dto/appointment.dto.ts
└── availability/                 # doctor availability CRUD
    { controller, service, repository, dto }

packages/shared/src/scheduling/appointment.schemas.ts   # Zod schemas + enums
```

## 2. Database (migration `appointments`)

New tables `doctor_availabilities`, `appointments`; enums `AppointmentStatus`,
`AppointmentType`.

- `appointments.appointmentNumber` autoincrement → `APT-000001`.
- `@@unique([doctorId, tokenDate, tokenNumber])` guards concurrent token issue.
- Indexes on `(doctorId, scheduledStart)`, `patientId`, `status`, `tokenDate`.
- FKs to patient, doctor (User), hospital, branch, department; soft delete +
  audit + `version`.

## 3. API endpoints (`/api/v1`)

| Method | Path | Permission |
| ------ | ---- | ---------- |
| POST | `/appointments` | `appointment.create` |
| POST | `/appointments/walk-in` | `appointment.create` |
| GET | `/appointments?doctorId&patientId&status&from&to` | `appointment.read` |
| GET | `/appointments/slots?doctorId&date` | `appointment.read` |
| GET | `/appointments/queue?doctorId&date` | `appointment.read` |
| GET | `/appointments/:id` | `appointment.read` |
| PATCH | `/appointments/:id/reschedule` | `appointment.update` |
| PATCH | `/appointments/:id/check-in` | `appointment.update` |
| PATCH | `/appointments/:id/start` | `appointment.update` |
| PATCH | `/appointments/:id/complete` | `appointment.update` |
| PATCH | `/appointments/:id/no-show` | `appointment.update` |
| PATCH | `/appointments/:id/cancel` | `appointment.cancel` |
| POST/GET/PATCH/DELETE | `/availability` | `doctor.schedule` (read = `appointment.read`) |

## 4. State machine

```
BOOKED ──check-in──► CHECKED_IN ──start──► IN_PROGRESS ──complete──► COMPLETED
  │                       │
  ├─ reschedule (BOOKED only, new slot validated)
  ├─ cancel ─► CANCELLED         └─ cancel ─► CANCELLED
  └─ no-show ─► NO_SHOW
```
`assertTransition(from, to)` rejects any edge not in the table with **409**.
Each transition stamps its timestamp and is optimistic-locked via `version`.

## 5. Business rules

- **No double-booking**: `countOverlaps(doctor, start, end)` over active statuses
  (BOOKED/CHECKED_IN/IN_PROGRESS) → 409 on conflict; reschedule excludes self.
- **Slots** = availability blocks stepped by `slotDurationMinutes`, minus active
  appointments and past times (UTC).
- **Token/queue**: check-in and walk-in assign the next `tokenNumber` per
  `(doctorId, tokenDate)` inside a transaction; queue = CHECKED_IN/IN_PROGRESS by token.
- **Walk-in** = create + check-in + token in one atomic step.
- **Doctor** must be an ACTIVE user holding the `DOCTOR` role (DOCTOR role gained
  `appointment.update` this phase; re-seed applied).

## 6. Security considerations

Permission-gated per action; cancel is a separate permission from update.
Overlap + unique-token constraints enforce integrity at the DB. Optimistic
locking prevents lost updates on concurrent status changes. All queries filter
`deletedAt IS NULL`.

## 7–8. Sample request / response

```http
POST /api/v1/appointments        Authorization: Bearer <token>
{ "patientId":"…","doctorId":"…","hospitalId":"…",
  "scheduledStart":"2026-07-10T10:00:00.000Z","durationMinutes":30 }
```
```json
{ "success": true, "message": "Appointment booked successfully",
  "data": { "appointmentRef":"APT-000003","status":"BOOKED","tokenNumber":null,"version":1 } }
```
Check-in:
```json
{ "success": true, "message": "Appointment checked in",
  "data": { "status":"CHECKED_IN","tokenNumber":1,"checkedInAt":"…" } }
```

## 9. Flow — book → serve

```
GET /appointments/slots?doctorId&date        (from availability, minus booked)
POST /appointments (appointment.create)      → BOOKED (overlap-checked)
PATCH /:id/check-in (appointment.update)     → CHECKED_IN + token (txn)
GET /appointments/queue?doctorId&date        → ordered by token
PATCH /:id/start → IN_PROGRESS → PATCH /:id/complete → COMPLETED
```

## 10. Sequence — check-in with token

```
Client        Controller        Service              Repository/DB
  │ PATCH /:id/check-in {version} │                       │
  │──────────────────────────────►│ load + assertUpdatable│──► SELECT
  │                               │ assertTransition(BOOKED→CHECKED_IN)
  │                               │ transitionWithToken ──► BEGIN
  │                               │   MAX(tokenNumber)+1     txn
  │                               │   UPDATE ... version+1   COMMIT
  │◄──────────────────────────────┤ { status, tokenNumber } │
```
