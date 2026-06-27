#!/bin/bash
# Hook: UserPromptSubmit
# Reads user prompt from stdin, matches against @draw scripts
# If match found, injects a system message suggesting the script

set -euo pipefail

HOOK_INPUT=$(cat)
PROMPT=$(echo "$HOOK_INPUT" | jq -r '.prompt // ""')

if [[ -z "$PROMPT" ]]; then
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MATCH_OUTPUT=$("$SCRIPT_DIR/../scripts/lib/match.sh" "$PROMPT" 2>/dev/null || true)

if [[ -z "$MATCH_OUTPUT" ]]; then
  exit 0
fi

# Take the top match
TOP=$(echo "$MATCH_OUTPUT" | head -1)
SCORE=$(echo "$TOP" | cut -f1)
NAME=$(echo "$TOP" | cut -f2)
PATH_=$(echo "$TOP" | cut -f3)
DESC=$(echo "$TOP" | cut -f4)

# Only suggest if score >= 2 (at least 2 keyword hits)
if [[ "$SCORE" -lt 2 ]]; then
  exit 0
fi

# Extract params from the script
PARAMS=$(grep "^# @param " "$PATH_" 2>/dev/null | sed 's/^# @param /  /' || true)

MSG="Found existing script: $NAME"
if [[ -n "$DESC" ]]; then
  MSG="$MSG — $DESC"
fi
MSG="$MSG\nRun: /draw-stroke $NAME"
if [[ -n "$PARAMS" ]]; then
  MSG="$MSG\nParams:\n$PARAMS"
fi

jq -n --arg msg "$MSG" '{"systemMessage": $msg}'
