<h1 align="center">DRAFT</h1>

<p align="center"><em>Don't Repeat A Finished Task</em></p>

<p align="center"><strong>Agent Injection Hooks</strong> for AI coding agents</p>

<p align="center">
  <img src="https://img.shields.io/npm/v/@cyx233/draft?style=flat-square" alt="npm">
  <img src="https://img.shields.io/github/stars/cyx233/dont-repeat-a-finished-task?style=flat-square" alt="Stars">
  <img src="https://img.shields.io/badge/license-MIT-333?style=flat-square" alt="MIT">
</p>

---

## The Problem

AI coding agents have hooks (shell commands on events). But hooks can't *think* — they match strings, not intent. You can't reliably inject context, route tasks, or guard actions without LLM judgment.

## The Solution

**Agent Hooks** let any hook invoke the host's own LLM as a sub-agent — one function call, zero API keys, zero infinite loops.

```javascript
const { query } = require('@cyx233/draft');

const result = query('Which cached scripts match this task?', {
  schema: { type: 'object', properties: { matches: { type: 'array', items: { type: 'string' } } } }
});
```

The hook calls the host CLI (`claude -p`, `codex exec`, `gemini -p`, `q chat`) under the hood. Same auth, same model, same session isolation.

## What This Enables

| Pattern | How |
|---------|-----|
| **Semantic routing** | Match user intent to cached scripts — not keywords |
| **Pre-flight checks** | Validate before the main agent acts |
| **Smart context injection** | Load only relevant docs into context |
| **Guard rails** | Block dangerous operations with LLM judgment |

## Built-in: DRAFT Agent

The repo ships a **DRAFT agent** (Don't Repeat A Finished Task) — a task caching layer built on agent hooks:

```
You: "set up ESLint"
→ Hook invokes LLM: "does any cached script match?"
→ LLM returns: eslint-setup
→ Hook injects script content
→ Agent runs it. 2 seconds, not 45.
```

Scripts live in `.claude/scripts/`, notes in `.claude/notes/`.

## Install

```bash
# Claude Code
/plugin install draft

# npm (for library use)
npm install @cyx233/draft
```

## API

### `query(prompt, opts?)`

| Option | Default | Description |
|--------|---------|-------------|
| `schema` | — | JSON Schema → structured output |
| `timeout` | 15000 | ms |
| `host` | auto | `'claude'` \| `'codex'` \| `'gemini'` \| `'q'` |

### `detectHost()`

Returns the first available host CLI, or `null`.

## Host Support

| Host | Binary | One-shot syntax |
|------|--------|----------------|
| Claude Code | `claude` | `claude -p --output-format json` |
| Codex | `codex` | `codex exec` |
| Gemini CLI | `gemini` | `gemini -p` |
| Amazon Q | `q` | `q chat --no-interactive` |

## DRAFT Commands

| Command | Description |
|---------|-------------|
| `/draft-save` | Save session work as a reusable script |
| `/draft-note` | Save context as a reusable note |
| `/draft-rm` | Delete a cached item |

## License

[MIT](LICENSE)
