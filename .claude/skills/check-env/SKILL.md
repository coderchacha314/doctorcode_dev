---
name: check-env
description: Verify all required environment variables are present for a given environment. Invoke when user says /check-env or asks to verify env vars.
argument-hint: [local|dev|prod]
user-invocable: true
allowed-tools: [Bash, Read]
---

# Check Env — DoctorCode

Verify that all required environment variables are set for the target environment.

**Usage**: `/check-env local` or `/check-env dev` or `/check-env prod`

## Steps

1. **Determine target environment**
   - Argument: `$ARGUMENTS`
   - If not provided, check current branch to infer:
     - `main` → prod
     - `develop` → dev
     - feature branch → local

2. **Read required keys from `.env.example`**
   ```bash
   cat .env.example
   ```
   Extract all key names (lines before the `=` sign, excluding comments).

3. **Check the appropriate env file**

   For `local`: check `.env.local`
   ```bash
   cat .env.local 2>/dev/null || echo "FILE NOT FOUND"
   ```

   For `dev`: check `.env.development`
   ```bash
   cat .env.development 2>/dev/null || echo "FILE NOT FOUND"
   ```

   For `prod`: check with Render MCP
   - Use Render MCP: "List all environment variables on the doctorcode-prod service"
   - Compare against required keys from `.env.example`

4. **Report results**

   For each required key, report one of:
   - ✅ `KEY_NAME` — set
   - ⚠️  `KEY_NAME` — present but empty (placeholder)
   - ❌ `KEY_NAME` — missing entirely

5. **For any missing/empty keys**, link to where the value can be found:
   - Supabase keys → Supabase dashboard → Project Settings → API
   - Resend API key → Resend dashboard → API Keys
   - Cloudinary keys → Cloudinary dashboard → Settings → Access Keys
   - Render API key → Render dashboard → Account Settings → API Keys
   - See `docs/SERVICES.md` for full reference

## Safety Rules
- Never print actual secret values — only report whether they're set or missing
- For prod, use Render MCP to check (don't read `.env.production` directly)
- If `.env.production` file exists with real values, warn: "Production secrets should be stored in Render dashboard, not in this file."
