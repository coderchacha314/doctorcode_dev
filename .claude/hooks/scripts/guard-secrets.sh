#!/bin/bash
# guard-secrets.sh — PreToolUse hook for Write|Edit
# Blocks writes to production secrets; warns on sensitive files

# Read tool input JSON from stdin
INPUT=$(cat)

# Extract file_path from JSON (works for both Write and Edit tool inputs)
FILE_PATH=$(echo "$INPUT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
# Write tool uses 'file_path', Edit uses 'file_path' too
print(data.get('file_path', data.get('path', '')))
" 2>/dev/null)

if [[ -z "$FILE_PATH" ]]; then
  # Can't determine file path — allow through
  exit 0
fi

FILENAME=$(basename "$FILE_PATH")

# BLOCK: .env.production (production secrets must only be set in Render dashboard)
if [[ "$FILENAME" == ".env.production" ]] || [[ "$FILE_PATH" == *"/.env.production" ]]; then
  echo '{"continue": false, "suppressOutput": false}' >&1
  echo "BLOCKED: .env.production must not be written directly." >&2
  echo "Set production secrets in the Render dashboard instead." >&2
  echo "See docs/SERVICES.md for details." >&2
  exit 2
fi

# BLOCK: files that look like they contain raw secrets
if [[ "$FILENAME" =~ (secret|credential|private_key|id_rsa|id_ed25519)$ ]]; then
  echo '{"continue": false, "suppressOutput": false}' >&1
  echo "BLOCKED: File name suggests it contains secrets: $FILENAME" >&2
  echo "Use environment variables instead of files for credentials." >&2
  exit 2
fi

# WARN: .env.local (allowed but remind about gitignore)
if [[ "$FILENAME" == ".env.local" ]] || [[ "$FILE_PATH" == *"/.env.local" ]]; then
  echo "WARNING: Writing to .env.local — ensure this file is in .gitignore and contains no production secrets." >&1
  exit 0
fi

# WARN: any .env file other than .env.example and .env.development
if [[ "$FILENAME" == .env* ]] && [[ "$FILENAME" != ".env.example" ]] && [[ "$FILENAME" != ".env.development" ]]; then
  echo "WARNING: Writing to $FILENAME — double-check this file is gitignored if it contains real credentials." >&1
  exit 0
fi

# All other files — allow through
exit 0
