#!/usr/bin/env node
// draft — SubagentStart hook
// SessionStart context is parent-thread only and never reaches subagents.
// Inject the same behavioral rules into each subagent so they respect cached scripts/notes.

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
  process.exit(0);
}

if (!catalog) process.exit(0);

const rules = 'DRAFT plugin is active. Cached scripts/notes exist — check before re-implementing any task. ' +
  'Run: node "' + scanScript + '" --all to see the catalog.';

// SubagentStart needs hookSpecificOutput JSON form
const isCopilot = Boolean(process.env.COPILOT_PLUGIN_DATA);
const isCodex = !isCopilot && Boolean(process.env.PLUGIN_DATA);

if (isCopilot) {
  process.stdout.write(JSON.stringify({ additionalContext: rules }));
} else if (isCodex) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'SubagentStart', additionalContext: rules },
  }));
} else {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'SubagentStart', additionalContext: rules },
  }));
}
