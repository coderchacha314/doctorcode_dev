---
name: db-migrate
description: Create and apply a Prisma database migration. Invoke when user says /db-migrate or asks to run a migration.
argument-hint: <migration-name>
user-invocable: true
allowed-tools: [Bash, Read, Edit]
---

# DB Migrate — DoctorCode

Create and apply a Prisma migration safely.

**Usage**: `/db-migrate add-pulse-field`

## Steps

1. **Determine environment**
   - Check current branch:
     ```bash
     git branch --show-current
     ```
   - `main` = prod (very dangerous — confirm carefully)
   - `develop` = dev
   - `feature/*` = local

2. **Prod warning**
   - If on `main`, warn: "You are on the **main** branch. Running `migrate deploy` will affect production. Are you sure? Type 'yes' to continue."

3. **Check migration name**
   - Argument: `$ARGUMENTS`
   - Migration name should be snake_case and describe what changed (e.g. `add_pulse_field`, `create_doctor_patient`)
   - If no argument given, ask the user for one

4. **Run the migration**

   For local/dev (creates a new migration file):
   ```bash
   npx prisma migrate dev --name $ARGUMENTS
   ```

   For prod (applies pending migrations only, no new file):
   ```bash
   npx prisma migrate deploy
   ```

5. **Regenerate Prisma client**
   ```bash
   npx prisma generate
   ```

6. **Update DATA-MODEL.md**
   - Read the updated `prisma/schema.prisma`
   - Update the Prisma Schema section in `docs/DATA-MODEL.md` to match
   - If new tables/enums were added, add them with descriptions

7. **Update TODO.md**
   - Mark the migration task ✅

## Rules
- Never run `migrate dev` on prod — only `migrate deploy`
- If migration fails, show the error and suggest next steps (don't retry blindly)
- After every migration, `prisma generate` must be run to keep the client in sync
