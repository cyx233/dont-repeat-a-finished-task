#!/usr/bin/env node
// draft — SessionStart activation hook
// Scans cache, injects behavioral rules + catalog into session context.

const { emit, scanCatalog } = require('./draft-runtime');

const items = scanCatalog();

let output = `DRAFT plugin is active.${items.length ? ` ${items.length} cached items.` : ''}

## Rules

1. Cached script matches your task → run it (\`bash "<path>"\`). Cached note matches → read it first. Do not re-derive.
2. If a cached script fails, fix it in-place — do not rewrite or work around.
3. End responses with a /draft-save or /draft-note offer. Skip only if purely conversational.`;

emit('SessionStart', output);
