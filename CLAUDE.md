# CLAUDE.md — DoctorCode

Mobile-first doctor–patient webapp for tracking blood sugar and blood pressure readings.

## Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL) via Prisma ORM |
| Auth | Supabase Auth (email/password, roles via user metadata) |
| Email | Resend |
| Media | Cloudinary |
| Deployment | Render (auto-deploy from GitHub) |
| Charts | Recharts |

## Common Commands

```bash
npm install              # Install dependencies
npm run dev              # Start dev server → localhost:3000
npm run build            # Production build
npm run lint             # ESLint check
npm run typecheck        # TypeScript check (tsc --noEmit)
npx prisma migrate dev   # Create + apply a migration (local/dev)
npx prisma migrate deploy # Apply pending migrations (prod)
npx prisma studio        # Visual DB browser
npx prisma generate      # Regenerate Prisma client after schema change
```

## Quick Start

```bash
cp .env.example .env.local    # Fill in your local Supabase + service keys
npm install
npx prisma migrate dev
npm run dev
```

## Environments

| Env | Branch | Supabase Project | Render Service |
|-----|--------|-----------------|----------------|
| local | feature/* | doctorcode-dev (shared) | localhost:3000 |
| dev | develop | doctorcode-dev | doctorcode-dev.onrender.com |
| prod | main | doctorcode-prod | doctorcode.app |

See `docs/SERVICES.md` for full env var list.

## Key File Paths

```
app/                        # Next.js App Router pages
  (auth)/login/page.tsx     # Login page
  (auth)/register/page.tsx  # Registration
  dashboard/page.tsx        # Patient dashboard
  readings/new/page.tsx     # Log a reading
  readings/history/page.tsx # View reading history
  doctor/page.tsx           # Doctor overview
  doctor/patients/[id]/page.tsx  # Patient detail
  api/readings/             # API routes for readings
  api/doctor/               # API routes for doctor views
lib/
  supabase/                 # Supabase client (server + browser)
  prisma.ts                 # Prisma client singleton
  resend.ts                 # Resend client
  cloudinary.ts             # Cloudinary client
components/
  readings/ReadingCard.tsx
  readings/ReadingForm.tsx
  charts/TrendChart.tsx
  ui/StatusBadge.tsx
middleware.ts               # Auth-protected routes (Supabase session)
prisma/schema.prisma        # Database schema
```

## Code Conventions

- **TypeScript strict mode** — no `any`, explicit return types on exported functions
- **React** — functional components + hooks only; no class components
- **Styling** — Tailwind classes only; no inline styles; use `cn()` helper for conditionals
- **State** — server components by default; `use client` only when needed (forms, charts)
- **API routes** — validate input with Zod; always check auth session before queries
- **Prisma** — never use raw SQL unless Prisma cannot express the query
- **Error handling** — use `try/catch` at API route boundaries; return typed error responses

## MCP Preference

Prefer MCP tools over CLI/direct API where a server is available:
- DB, auth, RLS → **Supabase MCP**
- Repo, PRs, branches → **GitHub MCP**
- Emails → **Resend MCP**
- Images/uploads → **Cloudinary MCP**
- Deploy, logs, env vars → **Render MCP**

See `docs/MCP.md` for server setup and capabilities.

## Reference Docs

| Doc | Purpose |
|-----|---------|
| `docs/ARCHITECTURE.md` | System design, data flow, routing |
| `docs/DATA-MODEL.md` | Prisma schema, table relationships |
| `docs/API-SPEC.md` | All API routes, request/response types |
| `docs/UI-GUIDELINES.md` | Design system, component patterns |
| `docs/SECURITY.md` | Auth, roles, RLS, env var rules |
| `docs/SERVICES.md` | Per-environment service config |
| `docs/MCP.md` | MCP server setup and usage |
| `TODO.md` | Persistent task list with status |

## Session Rules

1. **Start every session** — check `TODO.md` for in-progress tasks
2. **During work** — update `TODO.md` status as tasks are completed
3. **End every session** — run `/update-docs` or manually update any docs/ files touched by changes
4. **Never leave** a `🔄 IN PROGRESS` task without a note explaining what's left
5. **Keep this file under 300 lines** — move detail into docs/ when sections grow

## Keeping This File Current

Found a gotcha? Discovered a new pattern? Add it here:
- Add under the relevant section (keep entries brief — one line)
- Commit with: `docs: update CLAUDE.md — <what changed>`
- If a section grows beyond 20 lines, split it into a new `docs/` file and link here
