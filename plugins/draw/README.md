# DRAW — DontRepeatAgentWork

Agent output is non-deterministic. Scripts are not.

## The Problem

Agent does a task. Next week, same task — you get a different result. No audit trail, no version control, no guarantee it does the same thing. DRAW breaks this: sketch once, stroke deterministically forever.

```
First time:   Agent works → /draw-sketch → script saved     (one-time token cost)
Every time after: /draw-stroke → script runs                 (zero tokens)
```

## Commands

| Command | What it does | Token cost |
|---------|-------------|------------|
| `/draw-sketch` | Solidify current work into a script | One-time |
| `/draw-stroke <name> [params]` | Execute a saved script | Zero |
| `/draw-gallery` | List all saved scripts | Zero |
| `/draw-find <description>` | Search scripts by task description | Zero |
| `/draw-erase <name>` | Delete a script | Zero |

## Quick Start

### 1. Do work as usual

Ask the agent to do any task — add license headers, scaffold components, fix import order, whatever.

### 2. Sketch it

```
/draw-sketch --name add-license-header
```

The agent reviews what it just did in this session and generates a reusable script:

```bash
#!/bin/bash
# @draw
# @name add-license-header
# @description Add license header to source files
# @triggers license header, add license, copyright
# @param file_pattern string "File glob pattern" *.ts
# @param header_file path "Header text file" LICENSE_HEADER.txt

set -euo pipefail

FILE_PATTERN="${1:-*.ts}"
HEADER=$(cat "${2:-LICENSE_HEADER.txt}")

find src -name "$FILE_PATTERN" | while read -r f; do
  if ! head -1 "$f" | grep -q "License"; then
    { echo "$HEADER"; echo; cat "$f"; } > "$f.tmp" && mv "$f.tmp" "$f"
  fi
done
```

### 3. Stroke it (next time)

```
/draw-stroke add-license-header "*.py" ./MIT_HEADER.txt
```

Zero tokens. Pure subprocess execution.

### Sketch from a commit

Don't need to sketch immediately. Come back anytime and point at a past commit:

```
/draw-sketch --commit abc123 --name fix-imports
```

The agent reads the git diff and reverse-engineers a reusable script.

## Auto-matching

A `UserPromptSubmit` hook runs before every agent turn. It injects the full script catalog (name + description + params) into context. The agent — already an LLM — decides whether any existing script fits the task. No keyword heuristics, no scoring thresholds.

## Script Format

Scripts are plain bash or python with `@draw` metadata in comments:

```bash
#!/bin/bash
# @draw
# @name <name>
# @description <one-line description>
# @param <name> <type> "<description>" [default]

set -euo pipefail
# ... script body ...
```

```python
#!/usr/bin/env python3
# @draw
# @name <name>
# @description <one-line description>
# @param <name> <type> "<description>" [default]

import sys
# ... script body ...
```

### Frontmatter fields

| Field | Required | Description |
|-------|----------|-------------|
| `@draw` | Yes | Marks this file as a DRAW-managed script |
| `@name` | Yes | Unique identifier (used in `/draw-stroke <name>`) |
| `@description` | Yes | One-line summary |
| `@param` | No | Repeatable. Format: `name type "description" [default]` |

### Param types

| Type | Meaning | Example |
|------|---------|---------|
| `string` | Any text value | `"*.ts"` |
| `path` | File or directory path | `./src/components` |
| `number` | Numeric value | `80` |
| `bool` | true/false flag | `true` |

Parameters with a default value are optional. Without a default, they are required.

## Storage

Scripts are stored as plain files:

```
.claude/scripts/      ← project-level (committed to repo)
~/.claude/scripts/    ← global (shared across projects)
```

Both locations are scanned by `/draw-gallery`, `/draw-find`, and the auto-match hook.

### Project vs Global

- **Project scripts**: specific to a codebase (e.g., "add our company's license header")
- **Global scripts**: reusable across projects (e.g., "scaffold a React component")

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│ hooks/prompt-match.sh                                    │
│   Runs on every prompt → injects script catalog         │
│   Agent decides whether to reuse (LLM-driven match)     │
└────────────────────────────┬────────────────────────────┘
                             │ uses
┌────────────────────────────▼────────────────────────────┐
│ scripts/lib/                                             │
│   scan.sh  — find all @draw scripts, parse frontmatter  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ commands/                                                │
│   draw-sketch.md — agent generates script from context  │
│   draw-stroke.md — execute script via subprocess        │
│   draw-gallery.md — list scripts (calls scan.sh)        │
│   draw-find.md — search scripts (agent judges relevance)│
│   draw-erase.md — delete a script                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ agents/draw.md                                           │
│   Agent type that checks for scripts before acting      │
└─────────────────────────────────────────────────────────┘
```

## Design Decisions

### Why not Workflow scripts?

Workflow scripts still call `agent()` — each call burns tokens. DRAW generates real bash/python that runs as a subprocess with zero LLM involvement.

### Why bash/python over a custom DSL?

- Auditable: anyone can read the script
- Editable: no special tools needed
- Debuggable: standard shell debugging
- Portable: runs anywhere with bash/python

### Why LLM-driven matching instead of keyword heuristics?

- Semantic: understands intent, not just substrings
- Zero maintenance: no triggers to curate per script
- Already available: the agent is an LLM, no extra API call needed

### When NOT to use DRAW

- One-off tasks that won't repeat
- Tasks requiring heavy context-dependent judgment (debugging novel bugs)
- Tasks where input varies wildly each time

## Contributing

1. Fork the repo
2. Add or modify files under `plugins/draw/`
3. Test with `claude --plugin-dir ./plugins/draw`
4. Submit a PR
