<h1 align="center">DRAFT</h1>

<p align="center"><em>Don't Repeat A Finished Task</em></p>

<p align="center">
  <img src="https://img.shields.io/npm/v/@cyx233/draft?style=flat-square" alt="npm">
  <img src="https://img.shields.io/github/stars/cyx233/dont-repeat-a-finished-task?style=flat-square" alt="Stars">
  <img src="https://img.shields.io/badge/license-MIT-333?style=flat-square" alt="MIT">
</p>

---

## Core Concept

You solved a task once. The agent remembers. Next time it matches, the cached script runs in seconds — no re-thinking, no re-implementing.

```
You: "set up ESLint"
  → draft-match skill finds cached "eslint-setup"
  → Agent runs the cached script
  → Done. 2 seconds, not 45.
```

## How It Works

1. **When a task starts** — the `draft-match` skill scans `~/.claude/{scripts,notes}/` and the agent matches the task against the cached names and descriptions. Matched scripts/notes are used instead of re-implementing.
2. **When work wraps up** — the `/draft-auto-cache` skill evaluates whether the session produced cacheable work and offers to save it as a script (repeatable action) or note (reusable context).

These are model-triggered skills, not hooks — the agent invokes them based on their descriptions, so triggering is not guaranteed automatic. You can always invoke `/draft-match` or `/draft-auto-cache` explicitly.

Cache is global (`~/.claude/`) — shared across all projects.

## Install

### Claude Code

```
/plugin marketplace add cyx233/dont-repeat-a-finished-task
```
```
/plugin install draft
```

(Two separate prompts.)

## Commands

| Command | Description |
|---------|-------------|
| `/draft-match` | Check the cache for scripts/notes matching the current task |
| `/draft-auto-cache` | Evaluate and offer to cache this session's work |
| `/draft-save` | Save session work as a reusable script |
| `/draft-note` | Save context as a reusable note |
| `/draft-rm` | Delete a cached item |

## License

[MIT](LICENSE)
