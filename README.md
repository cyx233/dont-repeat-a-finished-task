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
  → Hook matches cached "eslint-setup"
  → Injects script into context
  → Done. 2 seconds, not 45.
```

## How It Works

1. **On prompt** — a `UserPromptSubmit` hook scans `~/.claude/{scripts,notes}/` and uses **programmatic `/btw`** (`claude --resume <session> --fork-session -p`) to semantically match. The fork shares the parent session's KV cache — no cold start, no history pollution. Matched content is injected into context.
2. **On stop** — a `Stop` hook evaluates whether the session produced cacheable work and offers to save it as a script (repeatable action) or note (reusable context).

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
| `/draft-save` | Save session work as a reusable script |
| `/draft-note` | Save context as a reusable note |
| `/draft-rm` | Delete a cached item |

## License

[MIT](LICENSE)
