<h1 align="center">DRAFT</h1>

<p align="center">
  <em>Don't Repeat A Finished Task.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/github/stars/cyx233/dont-repeat-a-finished-task?style=flat-square&label=stars" alt="Stars">
  <img src="https://img.shields.io/github/v/release/cyx233/dont-repeat-a-finished-task?style=flat-square&label=release" alt="Release">
  <img src="https://img.shields.io/npm/v/@cyx233/draft?style=flat-square&label=npm" alt="npm">
  <img src="https://img.shields.io/badge/works%20with-10%20agents-333?style=flat-square" alt="Works with 10 agents">
  <img src="https://img.shields.io/badge/license-MIT-333?style=flat-square" alt="MIT license">
</p>

---

A caching layer for AI agent workflows. You do the work once; next time, the agent replays it.

## Before / after

You ask the agent to set up ESLint. It spends 45 seconds reading your config, installing packages, and writing rules — for the third time this week.

With draft:

```
$ Session starts → "DRAFT: cached script 'eslint-setup' matches this task"
$ bash .claude/scripts/eslint-setup.sh
$ Done in 2 seconds.
```

## How it works

| Type | Caches | On hit | Storage |
|------|--------|--------|---------|
| **Script** | An action (bash/python/any) | Direct subprocess execution | `.claude/scripts/` |
| **Note** | A context (markdown) | Read into prompt | `.claude/notes/` |

On **SessionStart**, draft scans your scripts and notes directories, builds a catalog, and injects it into the session context. The model sees what's cached and matches tasks to scripts/notes directly — no intermediate command needed.

On **Stop** (Claude Code only), draft evaluates whether the session's work is worth caching and silently offers to save it.

On **SubagentStart**, draft injects the same rules into subagents so they don't re-implement cached work either.

## Script format

Any language. Frontmatter in comments:

```bash
#!/bin/bash
# @draft
# @name eslint-setup
# @description Install and configure ESLint for TypeScript projects
# @param style string "Airbnb or Standard" airbnb
```

## Note format

```markdown
---
draft: note
name: deploy-process
description: Steps and gotchas for deploying to production
---

1. Run migrations first...
```

## Commands

| Command | What it does |
|---------|--------------|
| `/draft-save` | Save this session's work as a reusable script |
| `/draft-note` | Save context as a reusable note |
| `/draft-rm <name>` | Delete a cached item |

Commands need a skill-capable host (Claude Code, Codex, Devin CLI, OpenCode, Gemini). The instruction-only adapters (Cursor, Windsurf, Cline, Copilot, Kiro) load the always-on rules without commands.

## Platform support

| Platform | Integration | Hooks | Commands |
|----------|-------------|-------|----------|
| **Claude Code** (macOS/Linux/Windows) | `hooks.json` + `commandWindows` | Full lifecycle | Yes |
| **Codex** | `claude-codex-hooks.json` | SessionStart + SubagentStart + Stop | Yes |
| **GitHub Copilot CLI** | `copilot-hooks.json` | SessionStart | Yes |
| **Gemini CLI / Antigravity** | `gemini-extension.json` + `AGENTS.md` | Static context | No |
| **OpenCode** | `.opencode/plugins/draft.mjs` | System prompt injection | No |
| **Cursor** | `.cursor/rules/draft.mdc` | Always-on rule | No |
| **Windsurf** | `.windsurf/rules/draft.md` | Always-on rule | No |
| **Cline** | `.clinerules/draft.md` | Always-on rule | No |
| **Kiro** | `.kiro/steering/draft.md` | Always-on rule | No |
| **Devin** | `.devin-plugin/plugin.json` | Plugin manifest | No |

All core logic (scanning, git detection) uses Node.js for cross-platform compatibility.

## Install

### Claude Code

```
/plugin marketplace add cyx233/dont-repeat-a-finished-task
```
```
/plugin install draft
```

### Codex

```bash
codex plugin marketplace add cyx233/dont-repeat-a-finished-task
```

Open `/plugins`, select the marketplace, and install draft. Then open `/hooks`, review and trust the lifecycle hooks, and start a new thread.

### GitHub Copilot CLI

```bash
copilot plugin marketplace add cyx233/dont-repeat-a-finished-task
copilot plugin install draft
```

### Gemini CLI / Antigravity

```bash
gemini extensions install https://github.com/cyx233/dont-repeat-a-finished-task
```

Or with Antigravity:

```bash
agy plugin install https://github.com/cyx233/dont-repeat-a-finished-task
```

### OpenCode

```json
{ "plugin": ["@cyx233/draft"] }
```

Or install from npm: `npm install @cyx233/draft`

### Cursor / Windsurf / Cline / Kiro / Copilot (editor)

Copy the matching rules file from this repo into your project:

- Cursor: [`.cursor/rules/draft.mdc`](.cursor/rules/draft.mdc)
- Windsurf: [`.windsurf/rules/draft.md`](.windsurf/rules/draft.md)
- Cline: [`.clinerules/draft.md`](.clinerules/draft.md)
- Kiro: [`.kiro/steering/draft.md`](.kiro/steering/draft.md)
- GitHub Copilot: [`.github/copilot-instructions.md`](.github/copilot-instructions.md)

### Devin CLI

```bash
devin plugins install cyx233/dont-repeat-a-finished-task
```

### Uninstall

| Host | Command |
|------|---------|
| Claude Code | `/plugin remove draft` |
| Codex | `codex plugin remove draft` |
| Devin CLI | `devin plugins remove draft` |
| Cursor / Windsurf / Cline / etc. | Delete the copied rule file |

Cached scripts (`.claude/scripts/`) and notes (`.claude/notes/`) are **not** deleted — they're your content.

## Development

```bash
node --test tests/*.test.js
```

## FAQ

**Where are my scripts stored?**
`.claude/scripts/` (project-local) and `~/.claude/scripts/` (global). Same for notes in `.claude/notes/`.

**Can I use scripts across projects?**
Yes. Scripts in `~/.claude/scripts/` are global and available in every session.

**What if I don't want auto-caching?**
The auto-cache hook only triggers on session stop in Claude Code, and even then it asks before saving. Remove the `Stop` hook from `hooks.json` to disable it entirely.

**Does it work without Node.js?**
The instruction-only adapters (Cursor, Windsurf, etc.) are pure markdown and need nothing. The hook-based adapters (Claude Code, Codex, Copilot CLI) need `node` on PATH.

## License

[MIT](LICENSE)
