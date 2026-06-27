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

## Platform Support

| Platform | Integration | Notes |
|----------|-------------|-------|
| **Claude Code** (macOS/Linux/Windows) | `hooks.json` with `commandWindows` | Full hook lifecycle |
| **GitHub Copilot** | `copilot-hooks.json` | SessionStart only |
| **Gemini CLI** | `gemini-extension.json` + `AGENTS.md` | Static context (no hooks) |
| **OpenCode** | `opencode.json` + `.opencode/plugins/draft.mjs` | System prompt injection |

All core logic (scanning, git detection) uses Node.js for cross-platform compatibility. Bash scripts retained for backwards compat.

## Install

### Claude Code (macOS / Linux / Windows)

```bash
claude plugin marketplace add cyx233/dont-repeat-a-finished-task
claude plugin install draft
```

### GitHub Copilot

Copy the plugin directory into your Copilot extensions folder, or symlink it. The `copilot-hooks.json` is auto-detected.

### Gemini CLI

Place the plugin directory where Gemini reads extensions, or add to your project root. Gemini reads `gemini-extension.json` → loads `AGENTS.md` as context.

### OpenCode

Add to your project's `opencode.json`:

```json
{ "plugin": ["path/to/draft/.opencode/plugins/draft.mjs"] }
```

Or install via npm if published.

## Uninstall

### Claude Code

```bash
claude plugin uninstall draft
```

Cached scripts (`.claude/scripts/`) and notes (`.claude/notes/`) are **not** deleted — they're your content.

### Other platforms

Remove the plugin directory / config entry. No external state to clean up.

## License

MIT
