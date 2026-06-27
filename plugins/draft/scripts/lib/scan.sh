#!/bin/bash
# Scan .claude/scripts/ and .claude/notes/ directories for @draft items
# Usage:
#   scan.sh                    — list all scripts (tab-separated: name, path, description)
#   scan.sh --notes            — list all notes (tab-separated: name, path, description)
#   scan.sh --all              — list both scripts and notes (type\tname\tpath\tdescription)
#   scan.sh --find NAME        — find a script by name, print its path
#   scan.sh --find-note NAME   — find a note by name, print its path

set -euo pipefail

scan_scripts() {
  local dirs=()
  [[ -d ".claude/scripts" ]] && dirs+=(".claude/scripts")
  [[ -d "$HOME/.claude/scripts" ]] && dirs+=("$HOME/.claude/scripts")

  for dir in "${dirs[@]}"; do
    for file in "$dir"/*; do
      [[ -f "$file" ]] || continue
      if head -5 "$file" | grep -q "@draft"; then
        parse_script_frontmatter "$file"
      fi
    done
  done
}

scan_notes() {
  local dirs=()
  [[ -d ".claude/notes" ]] && dirs+=(".claude/notes")
  [[ -d "$HOME/.claude/notes" ]] && dirs+=("$HOME/.claude/notes")

  for dir in "${dirs[@]}"; do
    for file in "$dir"/*; do
      [[ -f "$file" ]] || continue
      if head -5 "$file" | grep -q "draft: note"; then
        parse_note_frontmatter "$file"
      fi
    done
  done
}

parse_script_frontmatter() {
  local file="$1"
  local name="" description=""

  while IFS= read -r line; do
    case "$line" in
      "# @draft") ;;
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

parse_note_frontmatter() {
  local file="$1"
  local name="" description="" in_frontmatter=0

  while IFS= read -r line; do
    if [[ "$line" == "---" ]]; then
      if [[ $in_frontmatter -eq 1 ]]; then
        break
      fi
      in_frontmatter=1
      continue
    fi
    if [[ $in_frontmatter -eq 1 ]]; then
      case "$line" in
        "name: "*)        name="${line#name: }" ;;
        "description: "*) description="${line#description: }" ;;
      esac
    fi
  done < "$file"

  if [[ -n "$name" ]]; then
    printf '%s\t%s\t%s\n' "$name" "$file" "$description"
  fi
}

MODE="scripts"
FIND_NAME=""

case "${1:-}" in
  --notes)     MODE="notes" ;;
  --all)       MODE="all" ;;
  --find)      MODE="find-script"; FIND_NAME="${2:-}" ;;
  --find-note) MODE="find-note"; FIND_NAME="${2:-}" ;;
esac

case "$MODE" in
  scripts)
    scan_scripts
    ;;
  notes)
    scan_notes
    ;;
  all)
    while IFS=$'\t' read -r name path desc; do
      printf 'script\t%s\t%s\t%s\n' "$name" "$path" "$desc"
    done < <(scan_scripts)
    while IFS=$'\t' read -r name path desc; do
      printf 'note\t%s\t%s\t%s\n' "$name" "$path" "$desc"
    done < <(scan_notes)
    ;;
  find-script)
    while IFS=$'\t' read -r name path desc; do
      if [[ "$name" == "$FIND_NAME" ]]; then
        echo "$path"
        exit 0
      fi
    done < <(scan_scripts)
    exit 1
    ;;
  find-note)
    while IFS=$'\t' read -r name path desc; do
      if [[ "$name" == "$FIND_NAME" ]]; then
        echo "$path"
        exit 0
      fi
    done < <(scan_notes)
    exit 1
    ;;
esac
