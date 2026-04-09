# TODO — DoctorCode

Status: `⬜ TODO` · `🔄 IN PROGRESS` · `✅ DONE` · `🚫 BLOCKED`

Last updated: 2026-04-01

---

## Phase 1: Project Setup

- ✅ Create reference documentation (CLAUDE.md, docs/, .claude/)
- ✅ Initialize Next.js 14 app with TypeScript (manual scaffold, Node 18.10 workaround)
- ✅ Configure Tailwind CSS (dark navy theme per wireframes)
- ⬜ Install and configure Prisma
- ⬜ Create `.env.local` from `.env.example`
- ⬜ Create Supabase dev project (`doctorcode-dev`)
- ⬜ Create Supabase prod project (`doctorcode-prod`)
- ⬜ Configure Supabase connection in `prisma/schema.prisma`
- ⬜ Create GitHub repository
- ⬜ Push initial commit to `main` + create `develop` branch
- ⬜ Create Render dev service (branch: `develop`)
- ⬜ Create Render prod service (branch: `main`)
- ⬜ Configure `.gitignore` (env files, node_modules, .next)
- ⬜ Set up ESLint + Prettier config
- ⬜ Set up TypeScript strict mode in `tsconfig.json`

---

## Phase 2: Database Schema

- ⬜ Write initial Prisma schema (Profile, Doctor, Patient, DoctorPatient)
- ⬜ Add BloodSugarReading model with enums
- ⬜ Add BloodPressureReading model with enums
- ⬜ Run first migration (`prisma migrate dev --name init`)
- ⬜ Enable RLS on all tables in Supabase dev
- ⬜ Apply RLS policies from `docs/SECURITY.md`
- ⬜ Verify RLS policies block cross-user access
- ⬜ Apply same schema + RLS to Supabase prod

---

## Phase 3: Authentication

- ⬜ Install `@supabase/ssr` package
- ⬜ Create Supabase server client helper (`lib/supabase/server.ts`)
- ⬜ Create Supabase browser client helper (`lib/supabase/client.ts`)
- ⬜ Implement `middleware.ts` for protected routes
- ✅ Build login page (`app/(auth)/login/page.tsx`)
- ✅ Build registration page (`app/(auth)/register/page.tsx`)
- ✅ Build OTP verify page (`app/(auth)/verify/page.tsx`)
- ⬜ Build forgot password page (`app/(auth)/forgot-password/page.tsx`)
- ⬜ Create Profile row on successful registration (Supabase auth hook or API route)
- ⬜ Test login → redirect to dashboard
- ⬜ Test wrong-role route redirect
- ⬜ Configure Resend for Supabase Auth password reset emails

---

## Phase 4: Patient Features

- ✅ Build patient dashboard (`app/(patient)/dashboard/page.tsx`) — metric cards + trend chart
- ✅ Build blood sugar metrics page (`app/(patient)/metrics/blood-sugar/page.tsx`)
- ⬜ Build `ReadingForm` component for blood pressure
- ⬜ Build `POST /api/readings/blood-sugar` route
- ⬜ Build `POST /api/readings/blood-pressure` route
- ⬜ Build `GET /api/readings/blood-sugar` route with filters
- ⬜ Build `GET /api/readings/blood-pressure` route with filters
- ⬜ Build reading history page (`app/readings/history/page.tsx`)
- ⬜ Build `ReadingCard` component
- ⬜ Build `StatusBadge` component with range logic
- ⬜ Build `TrendChart` component (Recharts) for blood sugar
- ⬜ Build `TrendChart` component for blood pressure
- ⬜ Build single reading detail page (`app/readings/[id]/page.tsx`)
- ⬜ Add edit reading functionality (notes, context)
- ⬜ Add delete reading with `ConfirmDialog`
- ⬜ Link patient to doctor (`/settings` + `POST /api/settings/link-doctor`)

---

## Phase 5: Doctor Features

- ✅ Build doctor login page (`app/doctor/login/page.tsx`) — email/password auth
- ✅ Build doctor register page (`app/doctor/register/page.tsx`)
- ✅ Build doctor dashboard (`app/doctor/dashboard/page.tsx`) — patient list + MR search
- ✅ Build patient detail page (`app/doctor/patients/[id]/page.tsx`) — Overview/Prescriptions/Notes/Tests tabs
- ✅ Build `POST /api/doctor/auth/register` — create doctor account
- ✅ Build `POST /api/doctor/auth/ensure-profile` — verify doctor session
- ✅ Build `GET /api/doctor/patients` — list + search by MR number
- ✅ Build `POST /api/doctor/patients/[id]/link` — link patient to doctor
- ✅ Build `GET|POST /api/doctor/patients/[id]/prescriptions`
- ✅ Build `GET|POST /api/doctor/patients/[id]/notes`
- ✅ Build `GET|POST|PATCH /api/doctor/patients/[id]/tests`
- ✅ Add Prescription, MedicalNote, DoctorOrderedTest models to schema + migrated
- ⬜ Show blood sugar + blood pressure charts on patient detail
- ⬜ Out-of-range alert badge on PatientCard

---

## Phase 6: Email Integrations (Resend)

- ⬜ Create Resend client (`lib/resend.ts`)
- ⬜ Create welcome email template (HTML)
- ⬜ Send welcome email on patient/doctor registration
- ⬜ Create out-of-range alert email template
- ⬜ Trigger alert email to linked doctor when reading is out of range
- ⬜ Create doctor link request email template
- ⬜ Test all emails in dev environment via Resend MCP

---

## Phase 7: Media (Cloudinary)

- ⬜ Create Cloudinary client (`lib/cloudinary.ts`)
- ⬜ Add profile photo upload to settings page
- ⬜ Use upload preset for direct browser-to-Cloudinary upload
- ⬜ Display avatars in PatientCard and profile pages

---

## Phase 8: Settings & Profile

- ⬜ Build settings page (`app/settings/page.tsx`)
- ⬜ Build profile edit form (`app/settings/profile/page.tsx`)
- ⬜ `PATCH /api/settings/profile` route
- ⬜ `GET /api/settings/profile` route
- ⬜ Add notification preferences (email alerts on/off)

---

## Phase 9: Polish & Mobile UX

- ⬜ Add bottom nav bar (mobile)
- ⬜ Ensure all tap targets ≥ 44px
- ⬜ Test on 375px mobile viewport
- ⬜ Add loading skeletons for all data-fetching screens
- ⬜ Add empty states (no readings yet, no patients linked yet)
- ⬜ Add error boundaries for API failures
- ⬜ Accessibility audit (WCAG AA contrast, keyboard nav, labels)
- ⬜ Add `<head>` meta tags (viewport, theme-color, og:title)

---

## Phase 10: Deployment

- ⬜ Verify all env vars set on Render dev service
- ⬜ Verify all env vars set on Render prod service
- ⬜ Run `prisma migrate deploy` on dev Supabase
- ⬜ Run `prisma migrate deploy` on prod Supabase
- ⬜ Test full flow on dev Render URL
- ⬜ Set up custom domain on Render prod (`doctorcode.app`)
- ⬜ Enable HTTPS on Render prod
- ⬜ Smoke test prod: register, log reading, view history
- ⬜ Enable Supabase prod daily backups

---

## Backlog / Nice to Have

- ⬜ PDF export of reading history
- ⬜ Multiple doctor support per patient
- ⬜ Push notifications (PWA)
- ⬜ Unit conversion toggle (mmol/L ↔ mg/dL)
- ⬜ Dark mode

---

## Session Log

Use this section to track what was worked on each session.

| Date | Tasks worked on | Notes |
|------|----------------|-------|
| 2026-04-01 | Created all reference docs | Phase 1 docs complete |
| 2026-04-03 | Built full patient flow UI from wireframes | Login, Register, OTP, Dashboard, Blood Sugar, Medical Vault, Profile, Clinical Details — all build clean |
| 2026-04-09 | Built complete doctor module | Doctor login/register (email+password), dashboard with MR search, patient detail with Prescriptions/Notes/Tests tabs, 7 API routes, 3 new DB models migrated |

---

## Rules for Maintaining This File

- **Session start**: scan for any `🔄 IN PROGRESS` items from last session
- **During work**: mark task `🔄 IN PROGRESS` when starting it
- **Task done**: change to `✅ DONE`
- **Can't proceed**: mark `🚫 BLOCKED` with a note after the task explaining why
- **New task discovered**: add it to the appropriate phase
- **Session end**: add a row to Session Log; ensure no orphaned `🔄 IN PROGRESS` items
