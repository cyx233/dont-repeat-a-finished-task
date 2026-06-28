#!/usr/bin/env node
// draft — SessionStart activation hook
// Scans cache, injects behavioral rules + catalog into session context.

const { emit, scanCatalog, setCacheMode } = require('./draft-runtime');

// Reset session cache mode on new session
setCacheMode('');

const items = scanCatalog();

let output = `DRAFT plugin is active.${items.length ? ` ${items.length} cached items.` : ''}

## Rules

1. Cached script matches your task → run it (\`bash "<path>"\`). Cached note matches → read it first. Do not re-derive.
2. If a cached script fails, fix it in-place — do not rewrite or work around.
3. After completing a repeatable task, offer /draft-save. After producing reusable context (architecture overview, conventions, exploration findings), offer /draft-note.
4. Session overrides: if the user says "never cache" or "stop offering saves" — suppress all save/note offers for the rest of the session. If "always cache" — auto-save without asking. These override the per-turn nudge.`;

emit('SessionStart', output);
