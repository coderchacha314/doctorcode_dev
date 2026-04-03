---
name: new-feature
description: Scaffold a new feature following project conventions. Invoke when user says /new-feature or asks to add a new feature.
argument-hint: <feature-name>
user-invocable: true
allowed-tools: [Read, Write, Edit, Bash, Glob]
---

# New Feature — DoctorCode

Scaffold a new feature following the project's architecture and conventions.

**Usage**: `/new-feature doctor-notes`

## Steps

1. **Clarify the feature**
   - Feature name from argument: `$ARGUMENTS`
   - Ask the user 2-3 quick questions if needed:
     - Who uses this? (patient / doctor / both)
     - Is it a new page, new API route, or both?
     - Any new DB tables/fields needed?

2. **Create feature branch** (if not already on one)
   ```bash
   git checkout -b feature/$ARGUMENTS
   ```

3. **If DB changes needed**
   - Add new model(s) to `prisma/schema.prisma`
   - Remind user to run `/db-migrate <migration-name>` after

4. **Create the page** (if it's a UI feature)

   For a patient-facing page at `/readings/my-feature`:
   ```
   app/readings/$ARGUMENTS/page.tsx   (server component)
   app/readings/$ARGUMENTS/layout.tsx (optional)
   ```

   For a doctor-facing page at `/doctor/my-feature`:
   ```
   app/doctor/$ARGUMENTS/page.tsx
   ```

   Page template (server component):
   ```tsx
   import { createSupabaseServerClient } from '@/lib/supabase/server'
   import { redirect } from 'next/navigation'

   export default async function FeaturePage() {
     const supabase = createSupabaseServerClient()
     const { data: { user } } = await supabase.auth.getUser()
     if (!user) redirect('/login')

     return (
       <main className="px-4 py-6">
         <h1 className="text-3xl font-bold text-gray-900">Feature Title</h1>
       </main>
     )
   }
   ```

5. **Create the API route** (if needed)
   ```
   app/api/$ARGUMENTS/route.ts
   ```

   Route template:
   ```ts
   import { NextRequest, NextResponse } from 'next/server'
   import { createSupabaseServerClient } from '@/lib/supabase/server'
   import { z } from 'zod'
   import { prisma } from '@/lib/prisma'

   const schema = z.object({
     // define input shape
   })

   export async function GET(req: NextRequest) {
     const supabase = createSupabaseServerClient()
     const { data: { user }, error } = await supabase.auth.getUser()
     if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

     // ... query via prisma
   }

   export async function POST(req: NextRequest) {
     const supabase = createSupabaseServerClient()
     const { data: { user }, error } = await supabase.auth.getUser()
     if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

     const body = await req.json()
     const parsed = schema.safeParse(body)
     if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error }, { status: 400 })

     // ... create via prisma
   }
   ```

6. **Update docs/**
   - Add new route(s) to `docs/API-SPEC.md`
   - Add route to the route map in `docs/ARCHITECTURE.md`
   - If new component patterns added → `docs/UI-GUIDELINES.md`
   - If new RLS policy needed → note it in `docs/SECURITY.md`

7. **Update TODO.md**
   - Add tasks for this feature under the appropriate phase
   - Mark the scaffold task ✅

## Conventions Reminder
- Server components by default; add `'use client'` only for forms/charts
- Validate all API input with Zod
- Always check auth session in API routes before any DB query
- Use Tailwind + shadcn/ui — no inline styles
