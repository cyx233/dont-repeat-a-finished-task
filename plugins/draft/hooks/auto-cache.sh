#!/bin/bash
# Hook: Stop (asyncRewake)
# Checks if meaningful work was done this session; if so, triggers
# the agent to silently evaluate whether to cache it as a script or note.

set -euo pipefail

# Only trigger in git repos with uncommitted changes
git rev-parse --is-inside-work-tree &>/dev/null || exit 0

# Check if there are any changes worth caching
STAT=$(git diff --stat HEAD 2>/dev/null || git diff --stat 2>/dev/null || true)
UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null | head -5)

if [[ -z "$STAT" && -z "$UNTRACKED" ]]; then
  exit 0
fi

# Meaningful work detected — output triggers asyncRewake
echo '{"draft":"auto-cache"}'
