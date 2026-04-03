# API Spec — DoctorCode

All routes are Next.js App Router API routes under `app/api/`.
All routes require an authenticated Supabase session (checked via `getUser()` in each handler).
Input is validated with Zod. Errors return `{ error: string }` with appropriate HTTP status.

## Auth

Authentication is handled entirely by **Supabase Auth** — no custom auth routes needed.

- Login / logout / password reset → Supabase Auth SDK (`@supabase/ssr`)
- Session cookie managed by `middleware.ts`
- Role (`PATIENT` | `DOCTOR`) stored in `Profile.role` and readable from session metadata

Protected route middleware (`middleware.ts`):
```
/dashboard*      → requires PATIENT or DOCTOR
/readings*       → requires PATIENT
/doctor*         → requires DOCTOR
/settings*       → requires PATIENT or DOCTOR
```

---

## Readings — Blood Sugar

### `GET /api/readings/blood-sugar`

Returns blood sugar readings for the authenticated patient.

**Auth**: PATIENT role required

**Query params**:
```
limit?    number   default 20, max 100
offset?   number   default 0
from?     ISO date filter start
to?       ISO date filter end
context?  FASTING | POST_MEAL | BEFORE_MEAL | RANDOM | BEDTIME
```

**Response 200**:
```ts
{
  readings: Array<{
    id: string
    value: number
    unit: 'MMOL' | 'MGDL'
    context: ReadingContext
    notes: string | null
    recordedAt: string   // ISO 8601
    status: 'normal' | 'borderline' | 'high' | 'low'  // computed
  }>
  total: number
}
```

---

### `POST /api/readings/blood-sugar`

Logs a new blood sugar reading for the authenticated patient.

**Auth**: PATIENT role required

**Request body**:
```ts
{
  value: number           // required
  unit?: 'MMOL' | 'MGDL' // default MMOL
  context?: ReadingContext // default FASTING
  notes?: string
  recordedAt?: string     // ISO 8601, defaults to now()
}
```

**Response 201**:
```ts
{
  reading: { id, value, unit, context, notes, recordedAt, status }
  alertSent: boolean   // true if doctor was emailed due to out-of-range value
}
```

---

### `GET /api/readings/blood-sugar/[id]`

**Auth**: PATIENT (own reading) or DOCTOR (linked patient's reading)

**Response 200**: Single reading object (same shape as above)

---

### `PATCH /api/readings/blood-sugar/[id]`

Update notes or context on an existing reading.

**Auth**: PATIENT (own reading only)

**Request body**: `{ notes?: string, context?: ReadingContext }`

**Response 200**: Updated reading object

---

### `DELETE /api/readings/blood-sugar/[id]`

**Auth**: PATIENT (own reading only)

**Response 204**: No content

---

## Readings — Blood Pressure

### `GET /api/readings/blood-pressure`

**Auth**: PATIENT role required. Same query params as blood sugar.

**Response 200**:
```ts
{
  readings: Array<{
    id: string
    systolic: number
    diastolic: number
    pulse: number | null
    arm: 'LEFT' | 'RIGHT'
    notes: string | null
    recordedAt: string
    status: 'normal' | 'elevated' | 'stage1' | 'stage2' | 'crisis'  // computed
  }>
  total: number
}
```

---

### `POST /api/readings/blood-pressure`

**Auth**: PATIENT role required

**Request body**:
```ts
{
  systolic: number    // required
  diastolic: number   // required
  pulse?: number
  arm?: 'LEFT' | 'RIGHT'  // default LEFT
  notes?: string
  recordedAt?: string
}
```

**Response 201**: Created reading + `alertSent: boolean`

---

### `GET /api/readings/blood-pressure/[id]`
### `PATCH /api/readings/blood-pressure/[id]`
### `DELETE /api/readings/blood-pressure/[id]`

Same pattern as blood sugar equivalents.

---

## Doctor Routes

### `GET /api/doctor/patients`

Returns all patients linked to the authenticated doctor.

**Auth**: DOCTOR role required

**Response 200**:
```ts
{
  patients: Array<{
    id: string
    fullName: string
    avatarUrl: string | null
    lastBloodSugarReading: { value, unit, recordedAt, status } | null
    lastBpReading: { systolic, diastolic, recordedAt, status } | null
    alertCount: number   // out-of-range readings in last 7 days
  }>
}
```

---

### `GET /api/doctor/patients/[id]/readings`

Returns all readings for a specific linked patient.

**Auth**: DOCTOR role required + must be linked to this patient (enforced by Supabase RLS)

**Query params**: `type? = 'blood-sugar' | 'blood-pressure' | 'all'` (default `all`), `limit`, `offset`, `from`, `to`

**Response 200**:
```ts
{
  bloodSugar: BloodSugarReading[]
  bloodPressure: BloodPressureReading[]
  patient: { id, fullName, dateOfBirth, avatarUrl }
}
```

---

## Settings

### `GET /api/settings/profile`

**Auth**: Any authenticated user

**Response 200**: `{ id, fullName, email, role, avatarUrl, dateOfBirth? }`

---

### `PATCH /api/settings/profile`

**Auth**: Any authenticated user (own profile only)

**Request body**:
```ts
{
  fullName?: string
  dateOfBirth?: string  // ISO date
  avatarUrl?: string    // Cloudinary URL — upload via Cloudinary MCP first
}
```

**Response 200**: Updated profile

---

### `POST /api/settings/link-doctor`

Links a patient to a doctor by doctor's invite code or email.

**Auth**: PATIENT role required

**Request body**: `{ doctorEmail: string }`

**Response 200**: `{ doctorId, doctorName }`

---

## Error Format

All error responses:
```ts
{
  error: string          // human-readable message
  code?: string          // machine-readable code (e.g. "READING_NOT_FOUND")
  details?: unknown      // Zod validation errors when applicable
}
```

## Keeping This Document Current

- After adding a new API route → add it here with request/response types
- After changing a request/response shape → update the relevant section
- After adding a new error code → document it in the Error Format section
- Commit with: `docs: update API-SPEC.md — <what changed>`
