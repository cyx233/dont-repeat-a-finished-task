#!/bin/bash
# Hook: UserPromptSubmit
# Injects available @draw script catalog into context.
# The agent (already an LLM) decides whether to reuse a script.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCAN_OUTPUT=$("$SCRIPT_DIR/../scripts/lib/scan.sh" 2>/dev/null || true)

if [[ -z "$SCAN_OUTPUT" ]]; then
  exit 0
fi

# Format catalog: one line per script
CATALOG=""
while IFS=$'\t' read -r name path description triggers; do
  PARAMS=$(grep "^# @param " "$path" 2>/dev/null | sed 's/^# @param //' || true)
  ENTRY="- $name: $description"
  if [[ -n "$PARAMS" ]]; then
    ENTRY="$ENTRY (params: $PARAMS)"
  fi
  CATALOG="$CATALOG$ENTRY\n"
done <<< "$SCAN_OUTPUT"

MSG="Available DRAW scripts (use /draw-stroke <name> if one fits the task):\n$CATALOG"

jq -n --arg msg "$(printf "$MSG")" '{"systemMessage": $msg}'
