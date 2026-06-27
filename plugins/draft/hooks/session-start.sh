#!/bin/bash
# Hook: SessionStart
# One-time nudge if cache is non-empty. Injected as session context.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT=$("$SCRIPT_DIR/../scripts/lib/scan.sh" --all 2>/dev/null || true)

if [[ -z "$OUTPUT" ]]; then
  exit 0
fi

echo "DRAFT cache is active — invoke /draft-find before file-changing tasks to check for reusable scripts or notes."
