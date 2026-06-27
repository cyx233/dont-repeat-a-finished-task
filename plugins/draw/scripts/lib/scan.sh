#!/bin/bash
# Scan .claude/scripts/ directories for @draw scripts
# Usage:
#   scan.sh              — list all scripts (tab-separated: name, path, description, triggers)
#   scan.sh --find NAME  — find a script by name, print its path

set -euo pipefail

SCRIPT_DIRS=()
if [[ -d ".claude/scripts" ]]; then
  SCRIPT_DIRS+=(".claude/scripts")
fi
if [[ -d "$HOME/.claude/scripts" ]]; then
  SCRIPT_DIRS+=("$HOME/.claude/scripts")
fi

if [[ ${#SCRIPT_DIRS[@]} -eq 0 ]]; then
  exit 0
fi

parse_frontmatter() {
  local file="$1"
  local name="" description=""

  while IFS= read -r line; do
    case "$line" in
      "# @draw") ;;
      "# @name "*)       name="${line#\# @name }" ;;
      "# @description "*)description="${line#\# @description }" ;;
      "# @param "*)      ;;
      "#!"*)             ;;
      "#"*)              ;;
      *)                 break ;;
    esac
  done < "$file"

  if [[ -n "$name" ]]; then
    printf '%s\t%s\t%s\n' "$name" "$file" "$description"
  fi
}

MODE="list"
FIND_NAME=""

if [[ "${1:-}" == "--find" ]]; then
  MODE="find"
  FIND_NAME="${2:-}"
fi

for dir in "${SCRIPT_DIRS[@]}"; do
  for file in "$dir"/*; do
    [[ -f "$file" ]] || continue
    if head -5 "$file" | grep -q "@draw"; then
      if [[ "$MODE" == "find" ]]; then
        name=$(head -20 "$file" | grep "^# @name " | head -1 | sed 's/^# @name //')
        if [[ "$name" == "$FIND_NAME" ]]; then
          echo "$file"
          exit 0
        fi
      else
        parse_frontmatter "$file"
      fi
    fi
  done
done

if [[ "$MODE" == "find" ]]; then
  exit 1
fi
