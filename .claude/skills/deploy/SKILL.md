---
name: deploy
description: Deploy the app to dev or prod via Render. Invoke when user says /deploy, "deploy to dev", or "deploy to prod".
argument-hint: <dev|prod>
user-invocable: true
allowed-tools: [Bash, Read, Grep]
---

# Deploy — DoctorCode

Deploy the application to the specified environment.

**Usage**: `/deploy dev` or `/deploy prod`

## Pre-flight Checks

1. **Confirm environment from argument**
   - Argument is: `$ARGUMENTS`
   - If not `dev` or `prod`, ask the user to clarify before continuing

2. **Check git status**
   ```bash
   git status --short
   git branch --show-current
   ```
   - For `dev`: must be on `develop` branch with clean working tree
   - For `prod`: must be on `main` branch with clean working tree
   - If uncommitted changes exist, warn the user and ask if they want to commit first

3. **Check correct branch**
   - `dev` deploys from `develop`
   - `prod` deploys from `main`
   - If on wrong branch, say so and stop

4. **Prod-only: confirm with user**
   - If deploying to prod, ask: "You're about to deploy to **production**. Type 'yes' to confirm."
   - Do not proceed until confirmed

## Deploy Steps

### For `dev`
1. Push current `develop` branch to GitHub (triggers Render auto-deploy):
   ```bash
   git push origin develop
   ```
2. Tell user: "Pushed to develop. Render will auto-deploy. Check logs with the Render MCP."
3. Optionally use Render MCP to tail logs: "Show me logs from doctorcode-dev"

### For `prod`
1. Push current `main` branch:
   ```bash
   git push origin main
   ```
2. Tell user: "Pushed to main. Render will auto-deploy to production."
3. Optionally use Render MCP to monitor deployment status

## Post-deploy

1. Update TODO.md — mark the relevant deploy task ✅
2. Remind user to smoke-test the live URL:
   - dev: `dev.doctorcode.app`
   - prod: `doctorcode.app`

## Safety Rules
- Never run `prisma migrate deploy` automatically — remind user to do this manually if migrations are pending
- Never force-push to `main` or `develop`
- Always confirm before prod deploy
