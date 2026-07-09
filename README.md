<h1 align="center">DRAFT</h1>

<p align="center"><em>Don't Repeat A Finished Task</em></p>

<p align="center"><strong>Programmatic <code>/btw</code></strong> for AI coding agent hooks</p>

<p align="center">
  <img src="https://img.shields.io/npm/v/@cyx233/draft?style=flat-square" alt="npm">
  <img src="https://img.shields.io/github/stars/cyx233/dont-repeat-a-finished-task?style=flat-square" alt="Stars">
  <img src="https://img.shields.io/badge/license-MIT-333?style=flat-square" alt="MIT">
</p>

---

## The Problem

Agent hooks can run shell commands on events — but they can't *think*. You need LLM judgment inside hooks (semantic matching, decision-making), but spawning a cold `claude -p` loses all context and cache.

## The Solution

**Programmatic `/btw`** — call the host LLM from within a hook, reusing the parent session's full context and KV cache. Like `/btw` but invoked by code, not a human.

```javascript
const { forkQueryStrict } = require('@cyx233/draft');

// Inside a hook: ask the parent session a side-question
// Full context visible, doesn't pollute conversation history
const result = forkQueryStrict(
  'You are the DRAFT matcher. User task: "set up eslint". Catalog: eslint-setup (script): Set up ESLint. Return {"matches":["name"]} or {"matches":[]}',
  { sessionId: data.session_id }
);
// result = { matches: ["eslint-setup"] }
```

Under the hood: `claude --resume <session> --fork-session -p` — same auth, same context, same cache. The forked query sees everything the main agent sees, but its output never enters the conversation.

## How It Works

```
Hook starts (deterministic, <10ms)
  → Programmatic /btw: "which cached scripts match this task?"
  → Sub-agent answers (shares parent KV cache, warm)
  → Answer returns to hook JS
  → Hook injects matched content into context
  → exit 0
Main agent continues (warm, with injected context)
```

No cold starts. No context loss. No history pollution.

## Built-in: Task Caching

The plugin ships a task cache built on programmatic `/btw`:

```
You: "set up ESLint"
  → Hook /btw: "does any cached script match?"
  → Sub-agent: "eslint-setup"
  → Hook injects the script
  → Main agent runs it. 2 seconds, not 45.
```

Scripts live in `.claude/scripts/`, notes in `.claude/notes/`.

At response end, a lightweight Stop hook hands off to the main agent to evaluate and cache the work (no fork needed — the main agent already has full context).

## Install

```bash
# Claude Code plugin
/plugin install draft

# npm (for library use)
npm install @cyx233/draft
```

## API

### `forkQueryStrict(prompt, opts?)`

Forks the parent session, asks a side-question, retries on malformed JSON. Returns parsed object or throws.

| Option | Default | Description |
|--------|---------|-------------|
| `sessionId` | — | Session to fork (falls back to `--continue`) |
| `agent` | — | Agent to invoke in the fork |
| `transcriptPath` | — | Path to session transcript (for cwd lookup) |
| `timeout` | 15000 | ms |
| `maxRetries` | 2 | Retry on parse failure |
| `validate` | — | `(parsed) => bool` — custom validation |

### `detectHost()`

Returns `'claude'` if CLI is available, otherwise `null`.

## Commands

| Command | Description |
|---------|-------------|
| `/draft-save` | Save session work as a reusable script |
| `/draft-note` | Save context as a reusable note |
| `/draft-rm` | Delete a cached item |

## License

[MIT](LICENSE)
