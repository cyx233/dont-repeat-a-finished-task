# DRAFT — Don't Repeat A Finished Task

A caching layer for agent workflows. Scripts (actions) and notes (context).

## How It Works

On **SessionStart**, the plugin scans `.claude/scripts/` and `.claude/notes/`, injects the full catalog and behavioral rules into session context. The model sees what's cached and matches tasks to scripts/notes directly — no intermediate skill call needed.

| Type | Caches | On hit | Storage |
|------|--------|--------|---------|
| **Script** | An action (bash/python) | Direct subprocess execution | `.claude/scripts/` |
| **Note** | A context (markdown) | Read into prompt | `.claude/notes/` |

## Commands

| Command | Purpose |
|---------|---------|
| `/draft-save` | Save work as a reusable script |
| `/draft-note` | Save context as a reusable note |
| `/draft-rm <name>` | Delete a cached item |

## Script Format

Any language. Frontmatter in comments:

```
# @draft
# @name <name>
# @description <one-line summary>
# @param <name> <type> "<description>" [default]
```

## Note Format

```markdown
---
draft: note
name: <name>
description: <one-line summary>
---

<note content>
```

## Install

```bash
claude plugin marketplace add cyx233/dont-repeat-a-finished-task
claude plugin install draft
```

## License

MIT
