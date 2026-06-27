#!/bin/bash
# Match a user prompt against @triggers of all @draw scripts
# Usage: match.sh "user prompt text"
# Output: matching scripts sorted by relevance (most keyword hits first)

set -euo pipefail

PROMPT="${1:-}"
if [[ -z "$PROMPT" ]]; then
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCAN_OUTPUT=$("$SCRIPT_DIR/scan.sh" 2>/dev/null)

if [[ -z "$SCAN_OUTPUT" ]]; then
  exit 0
fi

PROMPT_LOWER=$(echo "$PROMPT" | tr '[:upper:]' '[:lower:]')

while IFS=$'\t' read -r name path description triggers; do
  score=0

  # Match against triggers (comma-separated)
  OLD_IFS="$IFS"
  IFS=','
  for trigger in $triggers; do
    IFS="$OLD_IFS"
    trigger=$(echo "$trigger" | tr '[:upper:]' '[:lower:]' | xargs)
    if [[ -n "$trigger" ]] && echo "$PROMPT_LOWER" | grep -qi "$trigger"; then
      score=$((score + 1))
    fi
  done
  IFS="$OLD_IFS"

  # Match against description words
  for word in $description; do
    word_lower=$(echo "$word" | tr '[:upper:]' '[:lower:]')
    if [[ ${#word_lower} -ge 3 ]] && echo "$PROMPT_LOWER" | grep -qi "$word_lower"; then
      score=$((score + 1))
    fi
  done

  if [[ $score -gt 0 ]]; then
    printf '%d\t%s\t%s\t%s\n' "$score" "$name" "$path" "$description"
  fi
done <<< "$SCAN_OUTPUT" | sort -t$'\t' -k1 -nr
