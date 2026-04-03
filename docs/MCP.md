# MCP Servers — DoctorCode

Claude should **prefer MCP tools over CLI commands or direct API calls** whenever a server is available for the operation.

## Configured Servers

| Server | Status | Config Location |
|--------|--------|-----------------|
| Supabase | ✅ Global (HTTP remote) | `~/.claude/` |
| GitHub | ✅ Global (HTTP remote) | `~/.claude/` |
| Resend | ⚙️ Project-level (npx) | `.claude/settings.json` |
| Cloudinary | ⚙️ Project-level (npx) | `.claude/settings.json` |
| Render | ⚙️ Project-level (npx) | `.claude/settings.json` |

---

## Supabase MCP

**Endpoint**: `https://mcp.supabase.com/mcp` (HTTP remote, already configured globally)

**Requires**: Supabase access token (set in `~/.claude/` global config)

### Use for
- Creating and modifying tables, columns, indexes
- Running SQL queries against dev or prod
- Managing auth users (create, list, update roles)
- Checking and applying RLS policies
- Viewing migration history
- Inspecting table data during debugging

### Do NOT use for
- Running `prisma migrate` — use the Bash tool + Prisma CLI for migrations (keeps Prisma schema in sync)
- Anything that should be version-controlled as a Prisma migration

### Example tasks
```
"Create the Profile table in Supabase dev project"
"Show me the last 10 BloodSugarReadings for patient X"
"Enable RLS on the Patient table"
"List all auth users with role=DOCTOR"
```

---

## GitHub MCP

**Endpoint**: `https://api.githubcopilot.com/mcp/` (HTTP remote, already configured globally)

**Requires**: `GITHUB_PERSONAL_ACCESS_TOKEN` environment variable with `repo` scope

### Use for
- Creating the GitHub repository
- Creating and switching branches
- Creating, reviewing, and merging pull requests
- Committing files directly from Claude
- Creating and managing issues
- Searching across the codebase

### Example tasks
```
"Create a GitHub repo named doctorcode"
"Create a branch feature/add-bp-chart from develop"
"Open a PR from develop into main"
"Create an issue: Blood pressure form missing pulse field"
```

---

## Resend MCP

**Package**: `resend-mcp` (installed via npx, configured in `.claude/settings.json`)

**Requires env vars**:
- `RESEND_API_KEY`
- `SENDER_EMAIL_ADDRESS` (e.g. `no-reply@doctorcode.app`)

### Use for
- Sending transactional emails during development/testing
- Creating and managing email templates
- Checking email delivery status
- Managing contacts and broadcast lists

### Do NOT use for
- Sending emails in production app code — use the Resend SDK in API routes
- Sending to real patients during dev — use test email addresses

### Example tasks
```
"Send a test welcome email to test@example.com"
"Check delivery status of the last 5 emails sent"
"List all email domains configured in Resend"
```

---

## Cloudinary MCP

**Package**: `@cloudinary/asset-management-mcp` (installed via npx, configured in `.claude/settings.json`)

**Requires env vars**:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Use for
- Uploading profile photos and report attachments
- Searching and managing existing assets
- Generating optimized image URLs with transformations
- Organizing assets into folders
- Deleting unused assets

### Example tasks
```
"Upload this profile photo to /prod/profiles/user-123"
"List all images in /dev/profiles/"
"Generate a 200x200 cropped thumbnail URL for asset xyz"
```

---

## Render MCP

**Package**: `render-mcp` (installed via npx, configured in `.claude/settings.json`)

**Requires env vars**:
- `RENDER_API_KEY` (from Render dashboard → Account Settings → API Keys)

### Use for
- Creating web services for dev and prod
- Adding and updating environment variables on services
- Viewing real-time logs from deployments
- Checking deployment status and history
- Monitoring CPU, memory, and HTTP metrics

### Limitations
- Cannot delete services or databases
- Cannot trigger manual deploys (push to GitHub branch instead)
- Cannot modify scaling settings

### Example tasks
```
"Create a Render web service named doctorcode-dev pointing to the develop branch"
"Set NEXT_PUBLIC_SUPABASE_URL on the prod service"
"Show me the last 50 lines of logs from doctorcode-dev"
"What's the current deployment status of doctorcode-prod?"
```

---

## Decision Guide: MCP vs Other Approaches

| Task | Use |
|------|-----|
| Create/alter DB table | Supabase MCP |
| Run Prisma migration | `Bash` → `npx prisma migrate dev` |
| Create GitHub repo | GitHub MCP |
| Git commit/push | `Bash` → `git` commands |
| Send test email | Resend MCP |
| Send email in app code | Resend SDK in API route |
| Upload an asset | Cloudinary MCP |
| Upload in app code | Cloudinary SDK / upload preset |
| Set Render env var | Render MCP |
| Deploy to Render | Git push to branch (triggers auto-deploy) |

---

## Keeping This Document Current

- After configuring a new MCP server → add a section here
- After discovering useful MCP tools for this project → document them in the relevant "Use for" section
- After finding a limitation → add it to the "Do NOT use for" or "Limitations" section
- Commit with: `docs: update MCP.md — <what changed>`
