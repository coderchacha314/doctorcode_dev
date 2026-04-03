# Security — DoctorCode

Medical data requires careful handling. This document defines auth, authorization, RLS policies, and data protection rules.

## Roles

| Role | Description |
|------|-------------|
| `PATIENT` | Can log and view their own readings; linked to one doctor |
| `DOCTOR` | Can view readings of all linked patients; cannot modify patient data |

Role is stored in `Profile.role` and also set in Supabase Auth user metadata (`user_metadata.role`) at registration.

## Authentication

- Handled by **Supabase Auth** (email/password + optional magic link)
- Session stored in an httpOnly cookie managed by `@supabase/ssr`
- `middleware.ts` validates the session on every request to protected routes
- Password reset flow uses Resend to send the reset email via Supabase Auth webhook

### Protected Routes

```ts
// middleware.ts — routes requiring auth
const PROTECTED = ['/dashboard', '/readings', '/doctor', '/settings']
const DOCTOR_ONLY = ['/doctor']
const PATIENT_ONLY = ['/readings/new']
```

Unauthenticated users on protected routes → redirect to `/login?next=<path>`
Wrong-role users → redirect to their own home (`/dashboard` or `/doctor`)

## Authorization

### Rule: Patients Only See Their Own Data
A patient's readings are scoped by `patientId = currentUser.patientId` in every Prisma query. RLS enforces this at the DB layer as a second line of defense.

### Rule: Doctors Only See Linked Patients
A doctor can only access a patient if a `DoctorPatient` row links them. This is checked in API route middleware and enforced by RLS.

### Rule: No Cross-Role Data Access
Doctors cannot create, update, or delete readings. Patients cannot access other patients' data or doctor management features.

## Supabase Row Level Security (RLS) Policies

RLS must be **enabled** on all tables. Enable via Supabase dashboard or migration.

```sql
-- Enable RLS on all tables
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Doctor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Patient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DoctorPatient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BloodSugarReading" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BloodPressureReading" ENABLE ROW LEVEL SECURITY;

-- Profile: own profile only
CREATE POLICY "profile_own" ON "Profile"
  USING (auth.uid()::text = "supabaseId");

-- Patient: own record; linked doctor can read
CREATE POLICY "patient_own" ON "Patient"
  USING ("profileId" IN (
    SELECT id FROM "Profile" WHERE "supabaseId" = auth.uid()::text
  ));

CREATE POLICY "patient_doctor_read" ON "Patient"
  FOR SELECT USING (
    id IN (
      SELECT dp."patientId" FROM "DoctorPatient" dp
      JOIN "Doctor" d ON d.id = dp."doctorId"
      JOIN "Profile" p ON p.id = d."profileId"
      WHERE p."supabaseId" = auth.uid()::text
    )
  );

-- BloodSugarReading: patient CRUD; doctor READ
CREATE POLICY "bs_patient_crud" ON "BloodSugarReading"
  USING ("patientId" IN (
    SELECT p.id FROM "Patient" p
    JOIN "Profile" pr ON pr.id = p."profileId"
    WHERE pr."supabaseId" = auth.uid()::text
  ));

CREATE POLICY "bs_doctor_read" ON "BloodSugarReading"
  FOR SELECT USING (
    "patientId" IN (
      SELECT dp."patientId" FROM "DoctorPatient" dp
      JOIN "Doctor" d ON d.id = dp."doctorId"
      JOIN "Profile" p ON p.id = d."profileId"
      WHERE p."supabaseId" = auth.uid()::text
    )
  );

-- BloodPressureReading: same pattern as BloodSugarReading
CREATE POLICY "bp_patient_crud" ON "BloodPressureReading"
  USING ("patientId" IN (
    SELECT p.id FROM "Patient" p
    JOIN "Profile" pr ON pr.id = p."profileId"
    WHERE pr."supabaseId" = auth.uid()::text
  ));

CREATE POLICY "bp_doctor_read" ON "BloodPressureReading"
  FOR SELECT USING (
    "patientId" IN (
      SELECT dp."patientId" FROM "DoctorPatient" dp
      JOIN "Doctor" d ON d.id = dp."doctorId"
      JOIN "Profile" p ON p.id = d."profileId"
      WHERE p."supabaseId" = auth.uid()::text
    )
  );
```

## Environment Variable Rules

| Rule | Detail |
|------|--------|
| Never commit secrets | `.env.local` and `.env.production` are in `.gitignore` |
| Prod secrets in Render | Set via Render dashboard Environment tab, not in files |
| Service role key is secret | `SUPABASE_SERVICE_ROLE_KEY` — server-only, never in client code |
| Anon key is public | `NEXT_PUBLIC_SUPABASE_ANON_URL` — safe for browser bundle |
| `.env.example` has no values | All keys listed, no values — safe to commit |

Required env vars per environment — see `docs/SERVICES.md`.

## Medical Data Protection

- **No PII in logs** — never log `fullName`, `email`, reading values, or dates of birth
- **No client-side storage** — do not store readings in `localStorage` or `sessionStorage`
- **Supabase backups** — enable daily backups on the prod project
- **Data deletion** — when a user deletes their account, cascade-delete all readings (enforced by `onDelete: Cascade` in Prisma schema)
- **Audit trail** — all readings have `createdAt` + `recordedAt` — do not allow retroactive deletion of audit fields

## Keeping This Document Current

- After adding a new table → add its RLS policy here
- After changing role logic → update the Roles and Authorization sections
- After adding a new env var → note it here and in `docs/SERVICES.md`
- Commit with: `docs: update SECURITY.md — <what changed>`
