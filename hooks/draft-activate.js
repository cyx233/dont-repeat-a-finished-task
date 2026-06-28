#!/usr/bin/env node
// draft — SessionStart activation hook
// Scans cache, injects behavioral rules + catalog into session context.

const { emit, scanCatalog } = require('./draft-runtime');

const items = scanCatalog();

let output = `DRAFT plugin is active.${items.length ? ` ${items.length} cached items.` : ''}

## Rules

1. When a user's task matches a cached script by name or description, RUN that script directly instead of re-implementing the work. Use \`bash "<path>" [params]\`.
2. When a task matches a cached note, READ that note before proceeding.
3. After completing a repeatable file-changing task, offer to run /draft-save. After producing reusable context (architecture overview, conventions, exploration findings), offer to run /draft-note.
4. Do NOT re-derive work that a cached script already handles.
5. When a cached script FAILS: fix the script in-place (edit the file), do NOT rewrite from scratch or work around it. The script is the source of truth for that task.`;

emit('SessionStart', output);
