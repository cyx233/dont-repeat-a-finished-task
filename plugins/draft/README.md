# DRAFT -- DontRepeatAFinishedTask

Agent output is non-deterministic. Scripts are not. DRAFT is a caching layer
for agent work: sketch once, stroke deterministically, auto-evict when cold.

---

## The Three-Tier Problem

Agent workflows have three storage tiers today:

| Tier | Analogy | What lives here | Cost to change |
|------|---------|-----------------|----------------|
| Harness (CLAUDE.md, hooks, settings.json) | Disk | Permanent rules, project conventions | High -- manual add/remove, affects every session |
| Memory (.claude/memory/) | Registers | Per-conversation recall, ephemeral notes | Low to write, but re-parsed every conversation (token cost on each load) |
| **DRAFT** (.claude/scripts/) | **CPU cache / LRU** | **Proven execution patterns that repeat over days/weeks** | **Zero on hit (subprocess), auto-evicts when cold** |

### Why the gap matters

Consider these real scenarios:

1. **License headers** -- Your team adds MIT headers to new files weekly. Too
   frequent to re-derive from memory each time (the agent spends tokens
   figuring out the format, finding the header file, iterating). Too transient
   for harness (next quarter you switch to Apache-2.0).

2. **Import sorting** -- Every PR needs imports sorted a particular way. The
   agent can do it, but it costs 2000+ tokens each time to read the style
   guide and apply it. A 10-line bash script does it in zero tokens.

3. **Scaffold a new module** -- Your project has a convention: new modules
   need an index file, a test file, a types file. The agent derives this from
   context each time (expensive). A parameterized script stamps it out
   instantly.

DRAFT fills this gap:

```
First time:   Agent works --> /draft-sketch --> script saved     (one-time token cost)
Every after:  /draft-stroke --> script runs                      (zero tokens, pure subprocess)
Cold script:  Auto-evicts past TTL                               (no rot, no manual cleanup)
```

---

## How the Cache Works

### Sketch (cache write)

The agent does work in a session. When the work is done, `/draft-sketch`
captures the proven execution as a deterministic bash or python script. The
agent reverse-engineers its own actions into a reusable, parameterized script.

You can also sketch from a past commit:

```
/draft-sketch --commit abc123 --name fix-imports
```

Or sketch from a trace (start recording before work, auto-sketch at the end):

```
/draft-trace-start
... do work ...
/draft-trace-end
```

### Stroke (cache hit)

`/draft-stroke <name> [params]` executes the script as a subprocess. No LLM
involved. Zero tokens consumed. The output goes straight to stdout/stderr.

Each stroke refreshes the script's last-used timestamp, keeping it "hot" in
the cache.

### Auto-eviction (TTL / LRU)

Scripts that have not been stroked within the TTL window are candidates for
eviction. This prevents script rot -- the silent accumulation of stale
automation that no one remembers or maintains.

- **Hot scripts** (stroked recently): stay indefinitely
- **Cold scripts** (untouched past TTL): auto-evicted on next cache sweep
- **Promoted scripts**: if a script proves permanently useful, promote it to
  harness (CLAUDE.md hook or permanent tooling) -- it graduates out of DRAFT

Design intent: TTL-based eviction is the target architecture. Current
implementation tracks last-used timestamps; the eviction sweep will enforce a
configurable TTL (default: 30 days). Scripts below the threshold are removed
automatically.

---

## Quick Start

### Install

```bash
claude plugin marketplace add github:cyx233/dont-repeat-a-finished-task
claude plugin install draft
```

### 1. Do work as usual

Ask the agent to do any task -- add license headers, scaffold components, fix
import order, run a migration, anything repetitive.

### 2. Sketch it

```
/draft-sketch --name add-license-header
```

The agent reviews the current session and generates a reusable script:

```bash
#!/bin/bash
# @draft
# @name add-license-header
# @description Add MIT license header to source files missing one
# @param file_pattern string "File glob pattern" *.ts
# @param header_file path "Path to header text file" LICENSE_HEADER.txt

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
/draft-stroke add-license-header "*.py" ./MIT_HEADER.txt
```

Zero tokens. Pure subprocess. Deterministic output.

### 4. Browse your cache

```
/draft-gallery          # list all scripts with descriptions
/draft-find "license"   # semantic search by task description
/draft-erase old-thing  # manual eviction
```

### Uninstall

```bash
claude plugin uninstall draft
claude plugin marketplace remove dont-repeat-a-finished-task
```

---

## Script Format Specification

Scripts are plain bash or python with `@draft` metadata in comments.

### Bash

```bash
#!/bin/bash
# @draft
# @name <unique-identifier>
# @description <one-line summary of what this script does>
# @param <name> <type> "<description>" [default_value]

set -euo pipefail
# script body
```

### Python

```python
#!/usr/bin/env python3
# @draft
# @name <unique-identifier>
# @description <one-line summary of what this script does>
# @param <name> <type> "<description>" [default_value]

import sys
# script body
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `@draft` | Yes | Marks this file as DRAFT-managed. Must appear before other fields. |
| `@name` | Yes | Unique identifier, used in `/draft-stroke <name>`. Lowercase, hyphens allowed. |
| `@description` | Yes | One-line human-readable summary. Used by auto-matching and `/draft-find`. |
| `@param` | No | Repeatable. Declares a positional parameter. |

### Parameter Types

| Type | Meaning | Example values |
|------|---------|----------------|
| `string` | Any text value | `"*.ts"`, `"hello world"` |
| `path` | File or directory path (resolved relative to cwd) | `./src/components`, `/tmp/out.json` |
| `number` | Numeric value (integer or float) | `80`, `3.14` |
| `bool` | Boolean flag | `true`, `false` |

Parameters with a default value are optional at invocation time. Parameters
without a default are required -- `/draft-stroke` will error if they are
missing.

---

## Storage Locations

```
.claude/scripts/      <-- project-level (commit to repo, shared with team)
~/.claude/scripts/    <-- global (personal, shared across all projects)
```

Both locations are scanned by:
- `/draft-gallery` -- lists all available scripts
- `/draft-find` -- semantic search across all scripts
- `prompt-match.sh` hook -- injects catalog into agent context

### Project vs Global

| Scope | Use case | Example |
|-------|----------|---------|
| Project | Codebase-specific automation | "Add our company's license header" |
| Global | Cross-project personal automation | "Scaffold a React component", "Format a changelog entry" |

When names collide, project-level takes precedence over global.

---

## Auto-Matching Hook Behavior

A `UserPromptSubmit` hook (`hooks/prompt-match.sh`) runs before every agent
turn. It:

1. Scans both script directories for all `@draft`-annotated scripts
2. Parses frontmatter (name, description, params) from each
3. Injects the full catalog as structured context into the agent's prompt

The agent -- already an LLM -- then decides whether any existing script
matches the user's request. This is semantic matching, not keyword heuristics:

- "Add headers to all TypeScript files" matches `add-license-header` even
  though the words differ
- "Set up a new service module" matches `scaffold-module` by intent
- No scoring thresholds to tune, no trigger phrases to maintain

If the agent identifies a match, it suggests (or directly invokes)
`/draft-stroke` with the appropriate parameters. If no match, the agent
proceeds normally -- the hook adds negligible overhead (a directory scan and
frontmatter parse).

---

## Design Decisions

### Why bash/python, not a custom DSL?

- **Auditable**: anyone can read the script without learning a new language
- **Editable**: modify with any text editor, no special tooling
- **Debuggable**: standard shell debugging (`set -x`, `pdb`)
- **Portable**: runs anywhere with a bash or python interpreter
- **Versionable**: plain text files in git, standard diffs

A custom DSL adds a parser, a runtime, documentation, and a learning curve --
all for no functional gain over what bash already provides.

### Why LLM-driven matching instead of keyword search?

- **Semantic**: understands intent ("tidy up imports" matches "sort-imports")
- **Zero maintenance**: no per-script triggers or aliases to curate
- **Already available**: the agent IS an LLM -- matching is a side effect of
  comprehension, not an extra API call
- **Graceful degradation**: if matching fails, the agent just does the work
  normally (no hard failure mode)

### Why not Claude Code Workflows?

Workflow scripts still call `agent()` at each step -- every call burns tokens
and introduces non-determinism. DRAFT generates real bash/python that runs as
a subprocess:

| | Workflows | DRAFT |
|-|-----------|-------|
| Token cost per execution | Proportional to task complexity | Zero |
| Determinism | Non-deterministic (LLM at each step) | Deterministic (same input = same output) |
| Requires LLM at runtime | Yes | No |
| Suitable for | Multi-step tasks requiring judgment | Repetitive tasks with known-good solutions |

DRAFT and Workflows are complementary, not competing. Use Workflows when each
execution genuinely needs LLM judgment. Use DRAFT when the solution is proven
and should be replayed exactly.

### Why auto-eviction instead of manual cleanup?

Manually curated script libraries rot. Nobody deletes the script they wrote
three months ago for a project that's since been archived. Auto-eviction
treats scripts as cache entries:

- If you keep using it, it stays (LRU refresh on each stroke)
- If you stop using it, it disappears (TTL expiry)
- If it proves permanent, promote it out of DRAFT into harness

This is the same principle behind CPU caches, DNS TTLs, and browser storage:
temporal locality predicts future use better than manual curation.

---

## When NOT to Use DRAFT

DRAFT is wrong for:

- **One-off tasks** -- if it will not repeat, sketching wastes effort (YAGNI)
- **Heavy-judgment tasks** -- debugging a novel bug, writing a design doc,
  anything where the "right answer" depends on context that changes each time
- **Wildly variable inputs** -- if the parameter space is so large that no
  fixed script covers it, the agent needs to reason each time
- **Security-sensitive operations** -- prefer audited, reviewed harness-level
  tooling over auto-generated scripts for anything touching credentials,
  production deployments, or access control

DRAFT is right for:

- Repetitive file transformations (headers, formatting, scaffolding)
- Build/deploy incantations that are the same every time
- Data extraction with fixed schemas
- Any task where you catch yourself saying "the agent did this perfectly last
  time, I wish it would just do the same thing again"

---

## Architecture

```
                         User prompt
                              |
                              v
┌─────────────────────────────────────────────────────────────┐
│  hooks/prompt-match.sh  (UserPromptSubmit)                   │
│    Scans .claude/scripts/ and ~/.claude/scripts/             │
│    Parses @draft frontmatter from all scripts                │
│    Injects catalog (name + description + params) into prompt │
└──────────────────────────────┬──────────────────────────────┘
                               |
                               v
┌─────────────────────────────────────────────────────────────┐
│  Agent (LLM)                                                 │
│    Reads catalog, decides: match or no match?                │
│    Match    --> suggests/invokes /draft-stroke               │
│    No match --> proceeds with normal work                    │
└──────────────┬──────────────────────────────┬───────────────┘
               |                              |
               v                              v
┌──────────────────────────┐   ┌──────────────────────────────┐
│  /draft-stroke            │   │  /draft-sketch                │
│    Executes script as     │   │    Generates script from      │
│    subprocess (bash/py)   │   │    session context or commit  │
│    Zero tokens            │   │    One-time token cost        │
│    Refreshes timestamp    │   │    Saves to .claude/scripts/  │
└──────────────────────────┘   └──────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  /draft-trace-start + /draft-trace-end                       │
│    Records session work, auto-sketches at trace end          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  /draft-gallery  -- list all scripts                         │
│  /draft-find     -- semantic search (LLM judges relevance)   │
│  /draft-erase    -- manual eviction                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  scripts/lib/                                                │
│    scan.sh -- find all @draft scripts, parse frontmatter     │
│    Shared by hook and skill commands                         │
└─────────────────────────────────────────────────────────────┘

Storage:
  .claude/scripts/    (project-level, version-controlled)
  ~/.claude/scripts/  (global, personal)
```

---

## Command Reference

| Command | What it does | Token cost |
|---------|-------------|------------|
| `/draft-sketch` | Solidify current session work into a reusable script | One-time (agent generates script) |
| `/draft-stroke <name> [params]` | Execute a saved script as subprocess | Zero |
| `/draft-gallery` | List all saved scripts with descriptions | Zero |
| `/draft-find <description>` | Semantic search for scripts matching a task | Minimal (LLM judges relevance) |
| `/draft-erase <name>` | Delete a script | Zero |
| `/draft-trace-start` | Begin recording session work for later sketch | Zero |
| `/draft-trace-end` | End trace and auto-sketch the recorded work | One-time (agent generates script) |

---

## Contributing

1. Clone the repo: `git clone github:cyx233/dont-repeat-a-finished-task`
2. Make changes under `plugins/draft/`
3. Test locally: `claude --plugin-dir ./plugins/draft`
4. Verify hook behavior: ensure `prompt-match.sh` correctly parses your test scripts
5. Submit a PR

### Adding a new skill command

1. Create a directory under `plugins/draft/skills/<command-name>/`
2. Follow existing skill patterns (see `skills/draft-stroke/` as reference)
3. If the command interacts with stored scripts, use `scripts/lib/scan.sh`
   for consistent discovery and parsing

### Principles

- Zero-token execution is the primary design constraint
- Plain files over databases, subprocess over API calls
- The agent is the matching engine -- do not reinvent search
- If in doubt, do less: a script that does one thing well beats a framework
