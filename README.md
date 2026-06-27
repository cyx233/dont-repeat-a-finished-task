# DRAFT — Don't Repeat A Finished Task

A caching layer for agent workflows.

## The Problem: Three Storage Tiers, One Gap

```
Tier        Analogy       Lifetime        Token cost per use
----------- ------------- --------------- -------------------
Harness     Disk          Permanent       Zero (always loaded)
Memory      Registers     Per-convo       High (re-parsed, re-derived)
```

Harness (CLAUDE.md, hooks, settings) is permanent but expensive to
add/remove. Memory (.claude/memory/) is ephemeral — costs tokens to re-parse
every conversation. The gap: patterns that repeat over days/weeks but aren't
permanent enough for harness. Too expensive to re-derive from memory each time.

## DRAFT: The Missing Middle

```
Tier        Analogy       Lifetime        Token cost per use
----------- ------------- --------------- -------------------
Harness     Disk          Permanent       Zero
DRAFT       CPU cache     Auto-evicting   Zero (script) / Low (note)
Memory      Registers     Per-convo       High
```

DRAFT caches two kinds of things:

| Type | Caches | On hit | Example |
|------|--------|--------|---------|
| **Script** | An action | Zero tokens (subprocess) | "sort imports and lint" |
| **Note** | A context | Low tokens (injected, no re-derivation) | "we're using X pattern this sprint" |

Both auto-evict when cold (LRU/TTL). Both save the agent from re-deriving
what it already proved last time.

## Commands

| Command | Purpose |
|---------|---------|
| `/draft-save` | Cache an action as a reusable script |
| `/draft-note` | Cache a context/pattern/convention as a note |
| `/draft-run <name> [params]` | Execute a cached script (zero tokens) |
| `/draft-recall <name>` | Load a cached note into context |
| `/draft-list` | List all cached scripts and notes |
| `/draft-find <desc>` | Find a cached item by task description |
| `/draft-rm <name>` | Delete a cached item |

## Script Format

```bash
#!/bin/bash
# @draft
# @name add-license-header
# @description Add license header to source files
# @param file_pattern string "File glob pattern" *.ts

set -euo pipefail
# ...
```

## Note Format

```markdown
---
draft: note
name: migration-pattern
description: Current module migration convention (Q1 2025)
---

All new modules use barrel exports. Import paths change from
@app/module/internal to @app/module. Update both source and test files.
```

## Architecture

```
hooks/prompt-match.sh        Injects script + note catalog; agent judges relevance
scripts/lib/scan.sh          Discovers @draft scripts and notes, parses metadata
skills/*/SKILL.md            Slash command definitions
agents/draft.md              Agent that checks cache before doing work
```

Storage:
- `.claude/scripts/` — cached actions (project or global)
- `.claude/notes/` — cached context (project or global)

## Install

```bash
claude plugin marketplace add cyx233/dont-repeat-a-finished-task
claude plugin install draft
```

## Uninstall

```bash
claude plugin uninstall draft
claude plugin marketplace remove dont-repeat-a-finished-task
```

## License

MIT
