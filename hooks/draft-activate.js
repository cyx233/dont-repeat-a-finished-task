#!/usr/bin/env node
// draft — SessionStart activation hook
// Scans cache, injects behavioral rules + catalog into session context.

const { emit, scanCatalog } = require('./draft-runtime');

const items = scanCatalog();

if (!items.length) {
  const rules = [
    'DRAFT plugin is active. No cached scripts or notes yet.',
    'After completing a repeatable file-changing task, offer to run /draft-save.',
  ].join('\n');
  emit('SessionStart', rules);
  process.exit(0);
}

const scripts = items.filter(i => i.type === 'script');
const notes = items.filter(i => i.type === 'note');

let output = `DRAFT plugin is active.

## Cached scripts (run via: bash "<path>" [params])
`;

if (scripts.length) {
  scripts.forEach(s => {
    output += `- ${s.name}: ${s.desc} → \`${s.path}\`\n`;
  });
} else {
  output += '(none)\n';
}

output += `\n## Cached notes (read with: cat "<path>")
`;

if (notes.length) {
  notes.forEach(n => {
    output += `- ${n.name}: ${n.desc} → \`${n.path}\`\n`;
  });
} else {
  output += '(none)\n';
}

output += `
## Rules

1. When a user's task matches a cached script by name or description, RUN that script directly instead of re-implementing the work. Use \`bash "<path>"\` — no need to call /draft-find first.
2. When a task matches a cached note, READ that note before proceeding.
3. After completing a repeatable file-changing task that has no cached script, offer to run /draft-save.
4. Do NOT re-derive work that a cached script already handles.`;

emit('SessionStart', output);
