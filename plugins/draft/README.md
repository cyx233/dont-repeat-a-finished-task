# DRAFT — Don't Repeat A Finished Task

A caching layer for agent work. Two kinds of cache entries: **scripts**
(actions) and **notes** (context). Both auto-evict when cold.

---

## The Three-Tier Problem

| Tier | Analogy | What lives here | Cost to change |
|------|---------|-----------------|----------------|
| Harness (CLAUDE.md, hooks, settings) | Disk | Permanent rules, project conventions | High — manual add/remove, affects every session |
| Memory (.claude/memory/) | Registers | Per-conversation recall | Low to write, but re-parsed every conversation |
| **DRAFT** (.claude/scripts/, .claude/notes/) | **CPU cache** | **Proven patterns that repeat over days/weeks** | **Zero on script hit, low on note hit, auto-evicts** |

---

## Two Cache Types

| | Script | Note |
|-|--------|------|
| **Caches** | An action (bash/python) | A context (markdown) |
| **On hit** | Zero tokens — subprocess execution | Low tokens — injected into prompt |
| **Created with** | `/draft-save` or auto-cache | `/draft-note` or auto-cache |
| **Used with** | `/draft-run <name> [params]` | `/draft-recall <name>` |
| **Good for** | File transforms, builds, scaffolding | Conventions, patterns, decisions |
| **Storage** | `.claude/scripts/` | `.claude/notes/` |

---

## How the Cache Works

### Write (auto on Stop)

When a session ends with file changes, the `Stop` hook triggers an
`asyncRewake`. The agent silently evaluates whether the work is worth
caching and invokes `/draft-save` (script) or `/draft-note` (note).
User sees nothing.

Manual write is also available: `/draft-save` and `/draft-note`.

### Read (SessionStart hint + skills)

On `SessionStart`, if the cache is non-empty, a one-line hint is injected
into context: the agent knows to check `/draft-find` before file-changing
tasks. Users can also explicitly use `/draft-find`, `/draft-run`, or
`/draft-recall`.

### Auto-eviction (TTL)

Items unused for 30 days are evicted by a sweep in `auto-cache.sh`.
Project-level items (committed to git) are not auto-evicted.

---

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

---

## Script Format

```bash
#!/bin/bash
# @draft
# @name <name>
# @description <one-line summary>
# @param <name> <type> "<description>" [default]

set -euo pipefail
# script body
```

## Note Format

```markdown
---
draft: note
name: <name>
description: <one-line summary -- used for matching>
---

<note content -- concise, actionable>
```

---

## Storage

```
.claude/scripts/      ← project-level actions (committed)
.claude/notes/        ← project-level context (committed)
~/.claude/scripts/    ← global actions (personal, auto-evictable)
~/.claude/notes/      ← global context (personal, auto-evictable)
```

---

## Architecture

```
Session start
    │
    ▼
hooks/session-start.sh (SessionStart)
    Cache non-empty → inject one-line hint
    │
    ▼
Agent works normally
    LLM decides whether to /draft-find before acting
    │
    ▼
hooks/auto-cache.sh (Stop, asyncRewake)
    git diff non-empty → rewake agent
    Agent silently invokes /draft-save or /draft-note
```

---

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
