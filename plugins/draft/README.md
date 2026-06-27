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
| **Created with** | `/draft-sketch` | `/draft-note` |
| **Used with** | `/draft-stroke <name> [params]` | `/draft-recall <name>` |
| **Good for** | File transforms, builds, scaffolding | Conventions, patterns, decisions |
| **Storage** | `.claude/scripts/` | `.claude/notes/` |

### When to script vs when to note

- The agent did a **concrete action** you want replayed exactly → script
- The agent applied **knowledge** you want it to have next time without re-deriving → note

---

## How the Cache Works

### Sketch / Note (cache write)

- `/draft-sketch` — agent distills session work into a deterministic script
- `/draft-note` — agent captures a pattern/convention/decision as a note

### Stroke / Recall (cache hit)

- `/draft-stroke` — runs script as subprocess, zero LLM tokens
- `/draft-recall` — reads note and applies as context

Each use refreshes the item's timestamp (keeps it hot).

### Auto-eviction (TTL / LRU)

Items unused past TTL are evicted. Keeps the cache fresh:

- **Hot** (used recently): stays
- **Cold** (past TTL): auto-evicted
- **Promoted**: if permanently useful, move to harness — it graduates out

Design intent: TTL-based eviction is the target. Current implementation
tracks timestamps; eviction sweep will enforce configurable TTL (default: 30
days).

---

## Quick Start

### 1. Cache an action

```
# Do work, then:
/draft-sketch --name sort-imports
```

Next time:
```
/draft-stroke sort-imports
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
/draft-gallery          # list everything
/draft-find "imports"   # semantic search
/draft-erase old-thing  # manual eviction
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
| `@name` | Yes | Unique identifier for `/draft-stroke <name>` |
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
every match. One note = one concept.

---

## Storage

```
.claude/scripts/      ← cached actions (project-level, committed)
.claude/notes/        ← cached context (project-level, committed)
~/.claude/scripts/    ← cached actions (global, personal)
~/.claude/notes/      ← cached context (global, personal)
```

Project-level takes precedence over global when names collide.

---

## Auto-Matching Hook

`hooks/prompt-match.sh` runs on every prompt. It:

1. Scans all four directories for scripts and notes
2. Parses frontmatter from each
3. Injects the catalog into the agent's context

The agent decides whether anything matches. Semantic matching, not keywords.

---

## Design Decisions

### Why two types?

Actions and context are fundamentally different:
- A script replaces LLM work entirely (subprocess, deterministic)
- A note augments LLM work (provides context, agent still reasons)

Conflating them means either notes can't be rich enough (forced into
bash-comment format) or scripts carry dead weight (markdown that never
executes). Separate storage, separate format, unified discovery.

### Why bash/python for scripts?

Auditable, editable, debuggable, portable. No custom DSL overhead.

### Why markdown for notes?

The reader is an LLM. Markdown is what it understands best. No parsing
overhead, no format conversion.

### Why LLM-driven matching?

Semantic (understands intent), zero maintenance (no triggers to curate),
already available (the agent IS the matcher).

### Why auto-eviction?

Cache entries that aren't manually pruned rot. TTL makes unused items
disappear. If something proves permanent, promote it to harness.

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
│    Match script → /draft-stroke (zero tokens)        │
│    Match note   → /draft-recall (inject context)     │
│    No match     → normal work                        │
└──────────┬──────────────────────────┬───────────────┘
           |                          |
           v                          v
┌──────────────────────┐   ┌──────────────────────────┐
│  /draft-stroke        │   │  /draft-sketch            │
│    subprocess exec    │   │    cache action           │
└──────────────────────┘   └──────────────────────────┘
┌──────────────────────┐   ┌──────────────────────────┐
│  /draft-recall        │   │  /draft-note              │
│    inject context     │   │    cache context          │
└──────────────────────┘   └──────────────────────────┘
```

---

## Contributing

1. Clone: `git clone github:cyx233/dont-repeat-a-finished-task`
2. Edit under `plugins/draft/`
3. Test: `claude --plugin-dir ./plugins/draft`
4. Submit a PR
