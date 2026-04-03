# Architecture — DoctorCode

## System Overview

```
Browser (mobile-first)
    │
    ▼
Next.js 14 App Router (Render)
    ├── Server Components  ──── Supabase Auth session check
    ├── API Routes         ──── Prisma → Supabase PostgreSQL
    ├── Middleware         ──── Protects routes by role
    └── Client Components ──── Forms, charts (Recharts)
         │
         ├── Supabase Auth  (email/password, magic link)
         ├── Prisma ORM     (type-safe DB queries)
         ├── Resend         (transactional email)
         └── Cloudinary     (profile photos, attachments)
```

## Environments

| Env | Branch | DB | Host |
|-----|--------|----|------|
| local | feature/* | doctorcode-dev Supabase | localhost:3000 |
| dev | develop | doctorcode-dev Supabase | Render dev service |
| prod | main | doctorcode-prod Supabase | Render prod service |

GitHub → Render auto-deploy: `develop` → dev, `main` → prod.

## Route Map

```
/                          → redirect to /dashboard or /login
/(auth)/login              → Login page (Supabase email/password)
/(auth)/register           → Register (role selection: patient/doctor)
/(auth)/forgot-password    → Password reset via Resend

/dashboard                 → Patient: recent readings + quick-add button
/readings/new              → Log blood sugar or blood pressure
/readings/history          → Paginated reading history + filter by type/date
/readings/[id]             → Single reading detail + edit/delete

/doctor                    → Doctor: list of linked patients + summary cards
/doctor/patients/[id]      → Patient detail: all readings, trend charts
/doctor/patients/[id]/notes → Doctor notes on a patient

/settings                  → Profile, notification preferences, linked doctor
/settings/profile          → Name, photo (Cloudinary upload)
```

All routes under `/dashboard`, `/readings`, `/doctor`, `/settings` are protected by `middleware.ts`.

## Data Flow: Submitting a Reading

```
1. Patient fills ReadingForm (client component)
2. Form submits to POST /api/readings/blood-sugar (or /blood-pressure)
3. API route:
   a. Verifies Supabase session (getUser)
   b. Validates input with Zod schema
   c. Writes to DB via Prisma (BloodSugarReading / BloodPressureReading)
   d. If value is out of normal range → trigger Resend alert email to linked doctor
4. Returns saved reading; client updates UI optimistically
5. TrendChart re-fetches latest readings via SWR
```

## Data Flow: Doctor Viewing a Patient

```
1. Doctor opens /doctor/patients/[id]
2. Server Component fetches patient + readings via Prisma
3. RLS policy enforced at Supabase level:
   - doctor_id must match current user's id on the patient record
4. Readings rendered in TrendChart (Recharts) + paginated table
```

## Key Design Decisions

| Decision | Why |
|----------|-----|
| Next.js App Router | Single repo fullstack; server components reduce client JS |
| Supabase | Managed Postgres + built-in RLS for row-level security on medical data |
| Prisma over raw Supabase client | Type-safe queries; easier migrations; works with any Postgres |
| Tailwind + shadcn/ui | Pre-built accessible components; fast to customize for mobile-first |
| SQLite → Supabase | No local SQLite; Supabase dev project used for local dev to keep parity |
| Separate Supabase projects per env | Hard isolation; no risk of dev data in prod |
| Recharts | Lightweight, composable, good mobile support |

## Component Architecture

```
app/
  layout.tsx              # Root layout: font, theme, Supabase provider
  (auth)/layout.tsx       # Unauthenticated layout (centered card)
  dashboard/
    page.tsx              # Server component: fetch recent readings
    QuickAddButton.tsx    # Client: opens reading type selector

components/
  readings/
    ReadingCard.tsx       # Displays one reading (value, time, status badge)
    ReadingForm.tsx       # Client: controlled form for new/edit reading
    ReadingList.tsx       # Server: paginated list with filter controls
  charts/
    TrendChart.tsx        # Recharts LineChart wrapper, responsive
    RangeIndicator.tsx    # Shows normal/borderline/high band
  doctor/
    PatientCard.tsx       # Summary card for doctor's patient list
    PatientReadings.tsx   # Full reading history for one patient
  ui/
    StatusBadge.tsx       # Green/amber/red badge based on reading value
    ConfirmDialog.tsx     # Reusable confirm-before-delete dialog
```

## Keeping This Document Current

- After changing the routing structure → update the Route Map section
- After adding a major new data flow → add a new "Data Flow" section
- After a significant architecture decision → add a row to the Key Design Decisions table
- Commit with: `docs: update ARCHITECTURE.md — <what changed>`
