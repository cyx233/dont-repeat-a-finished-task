# DRAW — DontRepeatAgentWork

A Claude Code plugin that solidifies repetitive agent work into reusable bash/python scripts.

## Problem

Every time an agent does a repeated task, it burns tokens re-discovering the same steps. DRAW captures that work once, then replays it at zero token cost.

## Install

**Option A: Per-session (try it out)**
```bash
claude --plugin-dir /path/to/draw
```

**Option B: Persistent (shell alias)**
```bash
# Add to ~/.zshrc or ~/.bashrc
alias claude='claude --plugin-dir /path/to/draw'
```

**Option C: Local marketplace (multi-plugin)**
```bash
# Create a directory with draw/ inside, then:
claude plugin marketplace add /path/to/my-plugins
claude plugin install draw
```

## Commands

| Command | What it does | Token cost |
|---------|-------------|------------|
| `/draw-sketch` | Solidify current work into a script | One-time (agent generates) |
| `/draw-stroke <name>` | Execute a script | Zero |
| `/draw-gallery` | List all scripts | Zero |
| `/draw-find <desc>` | Match scripts by description | Zero |
| `/draw-erase <name>` | Delete a script | Zero |

## How it works

1. **Do work normally** — agent completes a task as usual
2. **Sketch** — `/draw-sketch --name my-task` solidifies it into `.claude/scripts/my-task.sh`
3. **Next time** — hook auto-detects matching tasks, or you run `/draw-stroke my-task`
4. **Zero tokens** — the script runs as a subprocess, no LLM involved

## Script format

Scripts live in `.claude/scripts/` (project) or `~/.claude/scripts/` (global):

```bash
#!/bin/bash
# @draw
# @name add-license-header
# @description Add license header to source files
# @triggers license header, add license, copyright
# @param file_pattern string "File glob pattern" *.ts
# @param header_file path "Header text file" LICENSE_HEADER.txt

set -euo pipefail
# ... your logic ...
```

## Auto-matching

The `UserPromptSubmit` hook scans your prompt against `@triggers` keywords. If a strong match is found (2+ keyword hits), it suggests the script before the agent starts reasoning.
