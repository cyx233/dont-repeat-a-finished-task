# DRAFT -- DontRepeatAFinishedTask

A caching layer for agent workflows.

## The Problem: Three Storage Tiers, One Gap

Agent workflows have two storage extremes:

```
Tier        Analogy       Lifetime        Token cost per use
----------- ------------- --------------- -------------------
Harness     Disk          Permanent       Zero (always loaded)
Memory      Registers     Per-convo       High (re-parsed, re-derived)
```

Harness (CLAUDE.md, hooks, settings) is permanent but expensive to
add/remove -- you only put things there that are truly forever. Memory
(.claude/memory/) is ephemeral -- recalled per-conversation, costs tokens to
re-parse and re-execute every time.

The gap: patterns that repeat frequently over days or weeks but are not
permanent enough for harness. Too expensive to re-derive from memory each
session. Too transient to hardcode.

## DRAFT: The Missing Middle

```
Tier        Analogy       Lifetime        Token cost per use
----------- ------------- --------------- -------------------
Harness     Disk          Permanent       Zero
DRAFT       CPU cache     Auto-evicting   Zero (subprocess)
Memory      Registers     Per-convo       High
```

DRAFT is an LRU cache for proven agent work:

- **Cache write** (`/draft-sketch`): agent solves a task, solution is captured
  as a deterministic bash/python script
- **Cache hit** (`/draft-stroke`): script runs as a subprocess -- zero LLM
  tokens, instant, deterministic
- **Cache eviction**: unused scripts silently expire past TTL -- no manual
  cleanup, no rot
- **Hot path**: each stroke refreshes the timestamp, keeping active scripts alive
- **Promotion**: if a script proves permanently useful, move it to harness
- **Demotion**: if it stops being used, it disappears on its own

Cache hit = zero tokens. Cache miss = normal agent work.

## Commands

| Command | Purpose |
|---------|---------|
| `/draft-sketch` | Capture current work as a reusable script (cache write) |
| `/draft-stroke <name> [params]` | Execute a saved script (cache hit) |
| `/draft-gallery` | List all cached scripts |
| `/draft-find <desc>` | Find a script by task description |
| `/draft-erase <name>` | Delete a script manually |
| `/draft-trace-start` | Begin tracing work for auto-sketch |
| `/draft-trace-end` | End trace, auto-generate script from recorded work |

## Script Format

Plain bash or python with `@draft` metadata:

```bash
#!/bin/bash
# @draft
# @name add-license-header
# @description Add license header to source files
# @param file_pattern string "File glob pattern" *.ts

set -euo pipefail
# ... deterministic steps, no LLM involved ...
```

Human-readable. Parameters explicit. Diffable. No magic.

## Architecture

```
hooks/prompt-match.sh        Injects script catalog; agent judges relevance
scripts/lib/scan.sh          Discovers @draft scripts, parses metadata
skills/*/SKILL.md            Slash command definitions
agents/draft.md              Agent that checks cache before doing work
```

Scripts live in `.claude/scripts/` (project) or `~/.claude/scripts/` (global).

## Install

```bash
claude plugin marketplace add github:cyx233/dont-repeat-a-finished-task
claude plugin install draft
```

## Uninstall

```bash
claude plugin uninstall draft
claude plugin marketplace remove dont-repeat-a-finished-task
```

## License

MIT
