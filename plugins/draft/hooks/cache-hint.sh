#!/bin/bash
# Hook: UserPromptSubmit
# One-line nudge when cache is non-empty. No catalog, no noise.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT=$("$SCRIPT_DIR/../scripts/lib/scan.sh" --all 2>/dev/null || true)

if [[ -z "$OUTPUT" ]]; then
  exit 0
fi

jq -n '{"systemMessage": "DRAFT cache has items — invoke /draft-find before file-changing tasks."}'
