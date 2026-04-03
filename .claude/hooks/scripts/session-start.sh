#!/bin/bash
# session-start.sh — Runs at the start of every Claude session
# Shows in-progress TODO items and current git context

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
TODO_FILE="$PROJECT_DIR/TODO.md"

echo "=== DoctorCode Session Start ==="
echo ""

# Show current git branch if in a git repo
if git -C "$PROJECT_DIR" rev-parse --is-inside-work-tree &>/dev/null 2>&1; then
  BRANCH=$(git -C "$PROJECT_DIR" branch --show-current 2>/dev/null)
  echo "📌 Branch: $BRANCH"

  # Detect environment from branch
  if [[ "$BRANCH" == "main" ]]; then
    echo "🌐 Environment: PROD — be careful with changes"
  elif [[ "$BRANCH" == "develop" ]]; then
    echo "🧪 Environment: DEV"
  else
    echo "💻 Environment: LOCAL (feature branch)"
  fi
  echo ""
fi

# Show in-progress tasks from TODO.md
if [[ -f "$TODO_FILE" ]]; then
  IN_PROGRESS=$(grep "🔄" "$TODO_FILE" 2>/dev/null)
  if [[ -n "$IN_PROGRESS" ]]; then
    echo "🔄 In-progress tasks from last session:"
    echo "$IN_PROGRESS" | sed 's/^/   /'
    echo ""
  else
    echo "✅ No in-progress tasks from last session."
    echo ""
  fi

  # Show count of remaining TODO items
  TODO_COUNT=$(grep -c "^- ⬜" "$TODO_FILE" 2>/dev/null || echo 0)
  DONE_COUNT=$(grep -c "^- ✅" "$TODO_FILE" 2>/dev/null || echo 0)
  echo "📋 TODO.md: $TODO_COUNT remaining, $DONE_COUNT done"
  echo ""
fi

echo "Tip: Run /update-docs at session end to sync docs with changes made."
echo "================================"

exit 0
