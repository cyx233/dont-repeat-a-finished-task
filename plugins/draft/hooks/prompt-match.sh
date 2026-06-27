#!/bin/bash
# Hook: UserPromptSubmit
# Injects available @draft scripts and notes catalog into context.
# The agent (already an LLM) decides whether to reuse.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ALL_OUTPUT=$("$SCRIPT_DIR/../scripts/lib/scan.sh" --all 2>/dev/null || true)

if [[ -z "$ALL_OUTPUT" ]]; then
  exit 0
fi

SCRIPTS=""
NOTES=""

while IFS=$'\t' read -r type name path description; do
  case "$type" in
    script)
      PARAMS=$(grep "^# @param " "$path" 2>/dev/null | sed 's/^# @param //' || true)
      ENTRY="- $name: $description"
      if [[ -n "$PARAMS" ]]; then
        ENTRY="$ENTRY (params: $PARAMS)"
      fi
      SCRIPTS="$SCRIPTS$ENTRY\n"
      ;;
    note)
      NOTES="$NOTES- $name: $description\n"
      ;;
  esac
done <<< "$ALL_OUTPUT"

MSG=""
if [[ -n "$SCRIPTS" ]]; then
  MSG="Available DRAFT scripts (use /draft-stroke <name> if one fits):\n$SCRIPTS"
fi
if [[ -n "$NOTES" ]]; then
  MSG="${MSG}Available DRAFT notes (use /draft-recall <name> to inject context):\n$NOTES"
fi

if [[ -z "$MSG" ]]; then
  exit 0
fi

jq -n --arg msg "$(printf "$MSG")" '{"systemMessage": $msg}'
