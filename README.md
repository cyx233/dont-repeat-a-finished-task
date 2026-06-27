# DRAW — DontRepeatAgentWork

Claude Code plugin: solidify agent work into auditable, controllable, reusable scripts.

Agent output is non-deterministic. DRAW captures proven solutions as plain bash/python — you can read every line, version it in git, tune parameters, and rerun with confidence.

```
First time:    Agent works → /draw-sketch → script saved
Every time:    /draw-stroke → deterministic execution, same result every run
```

## Why

| Problem | DRAW's answer |
|---------|---------------|
| Agent output is a black box | Scripts are plain text — auditable by anyone |
| Re-running a prompt may give different results | Scripts are deterministic — same input, same output |
| Hard to enforce team standards via prompts | Scripts encode the exact steps — controllable and reviewable in PR |
| Good solutions get lost in chat history | Scripts persist in git — reusable across sessions, teammates, CI |

## Install

```bash
claude plugin marketplace add github:cyx233/dont-repeat-agent-work
claude plugin install draw
```

## Commands

| Command | What it does |
|---------|-------------|
| `/draw-sketch` | Solidify current work into a reusable script |
| `/draw-stroke <name> [params]` | Execute a saved script deterministically |
| `/draw-gallery` | List all saved scripts |
| `/draw-find <desc>` | Search scripts by task description |
| `/draw-erase <name>` | Delete a script |
| `/draw-trace-start` | Begin tracing work for auto-sketch |
| `/draw-trace-end` | End trace and generate script from changes |

## How it works

A `UserPromptSubmit` hook injects the full script catalog into context on every turn. The agent — already an LLM — decides whether an existing script fits the task. No keyword heuristics, no scoring thresholds, just semantic understanding.

Scripts live in `.claude/scripts/` (project, committed to git) or `~/.claude/scripts/` (global). Plain bash/python — auditable, editable, portable.

## Script format

```bash
#!/bin/bash
# @draw
# @name add-license-header
# @description Add license header to source files
# @param file_pattern string "File glob pattern" *.ts

set -euo pipefail
# ... deterministic steps, no LLM involved ...
```

Every field is human-readable. Parameters are explicit. Behavior is reviewable in a diff.

## Architecture

```
hooks/prompt-match.sh        ← injects script catalog, agent judges relevance
scripts/lib/scan.sh          ← discovers @draw scripts, parses metadata
commands/*.md                ← slash command definitions
agents/draw.md               ← agent that checks for existing scripts first
```

## Uninstall

```bash
claude plugin uninstall draw
claude plugin marketplace remove dont-repeat-agent-work
```

## License

MIT
