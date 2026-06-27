#!/usr/bin/env node
// draft — SessionStart activation hook
// Scans cache, injects behavioral rules + catalog into session context.

const { execSync } = require('child_process');
const path = require('path');

const scanScript = path.join(__dirname, '..', 'scripts', 'lib', 'scan.js');

let catalog = '';
try {
  catalog = execSync(`node "${scanScript}" --all`, {
    encoding: 'utf8',
    timeout: 3000,
    cwd: process.env.CLAUDE_CWD || process.cwd(),
  }).trim();
} catch (e) {
  // scan failed or empty — no cache
}

if (!catalog) {
  // Empty cache — still inject rules so model knows to /draft-save after work
  const rules = [
    'DRAFT plugin is active. No cached scripts or notes yet.',
    'After completing a repeatable file-changing task, offer to run /draft-save.',
  ].join('\n');
  emit(rules);
  process.exit(0);
}

// Parse catalog into readable list
const items = catalog.split('\n').filter(Boolean).map(line => {
  const parts = line.split('\t');
  if (parts.length >= 4) {
    return { type: parts[0], name: parts[1], path: parts[2], desc: parts[3] };
  }
  return null;
}).filter(Boolean);

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

emit(output);

// ponytail: runtime detection — adapts output format per host environment
function emit(text) {
  if (process.env.COPILOT_PLUGIN_DATA) {
    process.stdout.write(JSON.stringify({ additionalContext: text }));
  } else if (process.env.PLUGIN_DATA) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: text,
      },
    }));
  } else {
    process.stdout.write(text);
  }
}
