# Services — DoctorCode

Configuration for all external services across 3 environments.

## Environment Overview

| Env | Branch | Supabase Project | Render Service | URL |
|-----|--------|-----------------|----------------|-----|
| `local` | feature/* | doctorcode-dev (shared) | localhost:3000 | localhost:3000 |
| `dev` | develop | doctorcode-dev | doctorcode-dev | dev.doctorcode.app |
| `prod` | main | doctorcode-prod | doctorcode-prod | doctorcode.app |

## Environment Files

```
.env.example          # All keys, no values — committed to git
.env.local            # Local overrides — GITIGNORED
.env.development      # Dev env defaults (no secrets) — committed
.env.production       # Prod placeholders only — GITIGNORED (secrets in Render)
```

### `.env.example` (all required keys)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
DIRECT_URL=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_UPLOAD_PRESET=

# Render (optional — only needed for deploy webhook)
RENDER_DEPLOY_HOOK_DEV=
RENDER_DEPLOY_HOOK_PROD=

# App
NEXT_PUBLIC_APP_URL=
NODE_ENV=
```

---

## Supabase

**Two projects**: `doctorcode-dev` (shared local+dev) and `doctorcode-prod`

### Setup Steps
1. Create two projects on [supabase.com](https://supabase.com)
2. Enable Email Auth in Authentication → Providers
3. Set JWT expiry to 7 days (Authentication → Settings)
4. Enable RLS on all tables (see `docs/SECURITY.md` for policy SQL)
5. Enable daily backups on `doctorcode-prod`

### Env Vars per Environment

| Variable | local / dev | prod |
|----------|-------------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | dev project URL | prod project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | dev anon key | prod anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | dev service role | prod service role |
| `DATABASE_URL` | dev pooled connection string (port 6543) | prod pooled |
| `DIRECT_URL` | dev direct connection string (port 5432) | prod direct |

Connection strings format:
```
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

### Prisma + Supabase Notes
- Use `DATABASE_URL` (pooled) for all Prisma queries
- Use `DIRECT_URL` for `prisma migrate` (migrations need a direct connection)
- Both are in `datasource db` block in `prisma/schema.prisma`

---

## Render

**Two web services**: `doctorcode-dev` and `doctorcode-prod`

### Setup Steps
1. Connect GitHub repo in Render dashboard
2. Create web service for dev: branch `develop`, auto-deploy on push
3. Create web service for prod: branch `main`, auto-deploy on push
4. Set build command: `npm install && npx prisma generate && npm run build`
5. Set start command: `npm start`
6. Add all env vars in Render dashboard (Environment tab)
7. Set `NODE_ENV=production` on both services

### Env Vars to Set in Render Dashboard
All vars from `.env.example` — fill in actual values for each service.
Prod service must have `NEXT_PUBLIC_APP_URL=https://doctorcode.app`

### Deploy Hooks (optional)
Render provides webhook URLs to trigger deploys:
- Dev: stored in `RENDER_DEPLOY_HOOK_DEV`
- Prod: stored in `RENDER_DEPLOY_HOOK_PROD`
- Used by `/deploy` Claude skill

---

## GitHub

**Repository**: `doctorcode` (owner TBD)

### Branch Strategy
```
main        → production (protected branch, PR required)
develop     → dev/staging (default branch)
feature/*   → local feature branches → PR into develop
hotfix/*    → urgent fixes → PR into main + develop
```

### Workflow
1. Create `feature/my-feature` from `develop`
2. PR from `feature/*` → `develop` (triggers dev deploy)
3. PR from `develop` → `main` (triggers prod deploy)
4. Never commit directly to `main`

### GitHub MCP Setup
Requires `GITHUB_PERSONAL_ACCESS_TOKEN` with `repo` scope.
Set in your global `~/.claude/settings.json` or pass via env.

---

## Resend

**One account, two sending addresses**

### Setup Steps
1. Create account at [resend.com](https://resend.com)
2. Add and verify your domain
3. Create API key (full access)
4. Set `RESEND_API_KEY` in env

### Per-Environment Config

| Env | `RESEND_FROM_EMAIL` |
|-----|---------------------|
| local | `no-reply@dev.doctorcode.app` (or your dev subdomain) |
| dev | `no-reply@dev.doctorcode.app` |
| prod | `no-reply@doctorcode.app` |

### Email Templates Used
| Template | Trigger |
|----------|---------|
| Welcome | New patient/doctor registration |
| Out-of-range alert | Reading exceeds normal range |
| Password reset | User requests password reset |
| Doctor link request | Patient links to a doctor |

---

## Cloudinary

**One account, folders per environment**

### Setup Steps
1. Create account at [cloudinary.com](https://cloudinary.com)
2. Create an **unsigned upload preset** for profile photos
3. Set preset to restrict to `image/*`, max 5MB
4. Note your cloud name, API key, API secret

### Per-Environment Config

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Your cloud name (same for all envs) |
| `CLOUDINARY_API_KEY` | Same for all envs |
| `CLOUDINARY_API_SECRET` | Same for all envs |
| `CLOUDINARY_UPLOAD_PRESET` | `doctorcode_profiles` (unsigned) |

### Folder Structure
```
/doctorcode/
  /local/profiles/[userId]
  /dev/profiles/[userId]
  /prod/profiles/[userId]
```

Upload to the correct folder using `NEXT_PUBLIC_APP_ENV` prefix.

---

## Keeping This Document Current

- After creating/changing a service → update its section here
- After adding a new env var → add it to `.env.example` AND the table here
- After changing branch strategy → update the GitHub section
- Commit with: `docs: update SERVICES.md — <what changed>`
