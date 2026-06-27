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

### Why the gap matters

1. **Repeated action** — Every PR needs imports sorted a particular way. The
   agent can do it, but costs 2000+ tokens each time. A cached script does it
   in zero tokens.

2. **Repeated context** — This sprint you're migrating to a new module pattern.
   The agent re-derives the pattern from memory each conversation. A cached
   note injects it directly — no re-derivation needed.

3. **Both are transient** — Next quarter the pattern changes. Unlike harness,
   DRAFT entries auto-evict. No manual cleanup, no rot.

---

## Two Cache Types

| | Script | Note |
|-|--------|------|
| **Caches** | An action (bash/python) | A context (markdown) |
| **On hit** | Zero tokens — subprocess execution | Low tokens — injected into prompt |
| **Created with** | `/draft-save` | `/draft-note` |
| **Used with** | `/draft-run <name> [params]` | `/draft-recall <name>` |
| **Good for** | File transforms, builds, scaffolding | Conventions, patterns, decisions |
| **Storage** | `.claude/scripts/` | `.claude/notes/` |

### When to script vs when to note

- The agent did a **concrete action** you want replayed exactly → script
- The agent applied **knowledge** you want it to have next time without re-deriving → note

---

## How the Cache Works

### Save / Note (cache write)

- `/draft-save` — agent distills session work into a deterministic script
- `/draft-note` — agent captures a pattern/convention/decision as a note

Write path is human-triggered: agent may suggest saving after finishing work,
but the user decides. This keeps the cache clean.

### Run / Recall (cache hit)

- `/draft-run` — runs script as subprocess, zero LLM tokens
- `/draft-recall` — reads note and applies as context

Read path is automatic: the hook injects the catalog, the agent matches
semantically. Each use refreshes the item's timestamp (keeps it hot).

### Auto-eviction (TTL / LRU)

Items unused past TTL are evicted. Keeps the cache fresh:

- **Hot** (used recently): stays
- **Cold** (past TTL): auto-evicted
- **Promoted**: if permanently useful, move to harness — it graduates out

Design intent: TTL-based eviction is the target. Current implementation
tracks timestamps via mtime; eviction sweep enforces configurable TTL
(default: 30 days) on global items. Project-level items (committed to git)
are not auto-evicted.

---

## Quick Start

### 1. Cache an action

```
# Do work, then:
/draft-save --name sort-imports
```

Next time:
```
/draft-run sort-imports
```

### 2. Cache a context

```
/draft-note --name barrel-exports
```

Next time the agent auto-detects the note is relevant (via the hook), or:
```
/draft-recall barrel-exports
```

### 3. Browse the cache

```
/draft-list             # list everything
/draft-find "imports"   # semantic search
/draft-rm old-thing     # manual eviction
```

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

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `@draft` | Yes | Marks file as DRAFT-managed |
| `@name` | Yes | Unique identifier for `/draft-run <name>` |
| `@description` | Yes | One-line summary, used for matching |
| `@param` | No | Repeatable. Positional parameter declaration |

### Parameter Types

| Type | Meaning |
|------|---------|
| `string` | Any text value |
| `path` | File or directory path |
| `number` | Numeric value |
| `bool` | true/false flag |

---

## Note Format

```markdown
---
draft: note
name: <name>
description: <one-line summary -- used for matching>
---

<note content -- concise, actionable>
```

Notes are plain markdown. Keep them short — they get injected into context on
match. One note = one concept.

---

## Storage

```
.claude/scripts/      ← cached actions (project-level, committed)
.claude/notes/        ← cached context (project-level, committed)
~/.claude/scripts/    ← cached actions (global, personal, auto-evictable)
~/.claude/notes/      ← cached context (global, personal, auto-evictable)
```

Project-level takes precedence over global when names collide.

---

## Auto-Matching Hook

`hooks/prompt-match.sh` runs on every prompt. It:

1. Scans all directories for scripts and notes
2. Parses frontmatter from each
3. Injects the catalog into the agent's context

The agent decides whether anything matches. Semantic matching, not keywords.
Cache hit = automatic. Cache write = human-triggered.

---

## Design Decisions

### Why two types?

Actions and context are fundamentally different:
- A script replaces LLM work entirely (subprocess, deterministic)
- A note augments LLM work (provides context, agent still reasons)

### Why human-triggered writes, automatic reads?

Auto-saving everything would flood the cache with one-off work. The user
knows what repeats. The agent knows what's cached. Division of labor.

### Why bash/python for scripts?

Auditable, editable, debuggable, portable. No custom DSL overhead.

### Why markdown for notes?

The reader is an LLM. Markdown is what it understands best.

### Why LRU auto-eviction?

Cache entries that aren't pruned rot. Temporal locality predicts future use
better than manual curation. If something proves permanent, promote to harness.

---

## When NOT to Use DRAFT

- One-off tasks (won't repeat — YAGNI)
- Heavy-judgment tasks (answer changes each time)
- Security-sensitive operations (use audited harness-level tooling)

---

## Architecture

```
                         User prompt
                              |
                              v
┌─────────────────────────────────────────────────────┐
│  hooks/prompt-match.sh  (UserPromptSubmit)            │
│    Scans scripts/ and notes/ directories             │
│    Injects catalog into agent context                │
└──────────────────────────┬──────────────────────────┘
                           |
                           v
┌─────────────────────────────────────────────────────┐
│  Agent (LLM)                                         │
│    Match script → /draft-run (zero tokens)           │
│    Match note   → /draft-recall (inject context)     │
│    No match     → normal work                        │
│    After work   → suggest /draft-save or /draft-note │
└──────────────────────────────────────────────────────┘
```

---

## Contributing

1. Clone: `git clone github:cyx233/dont-repeat-a-finished-task`
2. Edit under `plugins/draft/`
3. Test: `claude --plugin-dir ./plugins/draft`
4. Submit a PR
