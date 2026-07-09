<h1 align="center">DRAFT</h1>

<p align="center"><em>Don't Repeat A Finished Task</em></p>

<p align="center">Task caching plugin for Claude Code</p>

<p align="center">
  <img src="https://img.shields.io/npm/v/@cyx233/draft?style=flat-square" alt="npm">
  <img src="https://img.shields.io/github/stars/cyx233/dont-repeat-a-finished-task?style=flat-square" alt="Stars">
  <img src="https://img.shields.io/badge/license-MIT-333?style=flat-square" alt="MIT">
</p>

---

## What it does

Caches your completed work (scripts and notes) and auto-injects them when a future task matches.

```
You: "set up ESLint"
  → Hook matches cached script "eslint-setup"
  → Injects it into context
  → Agent runs it. 2 seconds, not 45.
```

Scripts and notes live in `~/.claude/scripts/` and `~/.claude/notes/` — shared across all projects.

## How It Works

1. **On prompt** — a `UserPromptSubmit` hook scans your cache, uses a lightweight LLM fork to semantically match, and injects relevant scripts/notes into context.
2. **On stop** — a `Stop` hook evaluates whether the session produced cacheable work and offers to save it.

## Install

```bash
/plugin install draft
```

## Library

The fork primitive is also available as an npm package for building your own hooks:

```bash
npm install @cyx233/draft
```

```javascript
const { forkQueryStrict } = require('@cyx233/draft');

const result = forkQueryStrict('Return {"answer": 42}', {
  sessionId: data.session_id,
  timeout: 15000,
  validate: r => typeof r.answer === 'number',
});
```

## Commands

| Command | Description |
|---------|-------------|
| `/draft-save` | Save session work as a reusable script |
| `/draft-note` | Save context as a reusable note |
| `/draft-rm` | Delete a cached item |

## License

[MIT](LICENSE)
