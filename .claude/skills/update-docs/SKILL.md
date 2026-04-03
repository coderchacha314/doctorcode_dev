---
name: update-docs
description: End-of-session documentation sync. Invoke when the user asks to update docs, finish a session, or run /update-docs.
user-invocable: true
allowed-tools: [Read, Edit, Write, Glob, Grep, Bash]
---

# Update Docs

Review everything changed this session and bring all reference documents up to date.

## Steps

1. **Review changes made this session**
   - Run `git diff HEAD` (or `git status` if no commits yet) to see what changed
   - Identify which categories of change occurred: schema, API routes, components, services, env vars

2. **Update TODO.md**
   - Mark completed tasks `✅ DONE`
   - For any `🔄 IN PROGRESS` task that's still unfinished, add a brief note: what's left
   - Add any newly discovered tasks to the appropriate phase
   - Add a row to the Session Log table at the bottom with today's date and summary

3. **Update docs/ files based on what changed**

   | If you changed... | Update this file |
   |---|---|
   | `prisma/schema.prisma` | `docs/DATA-MODEL.md` — sync schema section |
   | Any `app/api/*` route | `docs/API-SPEC.md` — add/update route definition |
   | A new component | `docs/UI-GUIDELINES.md` — add component pattern |
   | `.env.example` or service config | `docs/SERVICES.md` — add env var to table |
   | `middleware.ts` or auth flow | `docs/SECURITY.md` — update auth/RLS section |
   | Routing structure | `docs/ARCHITECTURE.md` — update route map |
   | MCP server config | `docs/MCP.md` — update server section |

4. **Update CLAUDE.md if needed**
   - Add a gotcha discovered this session (one line, under relevant section)
   - Add a new common command if one was frequently used
   - Keep CLAUDE.md under 300 lines — if it's growing too long, move content to a docs/ file

5. **Confirm**
   - Report which files were updated and what was added
   - If nothing changed that requires doc updates, say so explicitly

## Rules
- Keep doc updates brief and factual — no padding
- Don't remove existing accurate content
- Preserve the "Keeping This Document Current" section in each doc
