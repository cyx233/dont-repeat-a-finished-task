#!/usr/bin/env node
// Hook: Stop (asyncRewake)
// ponytail: only rewakes if THIS turn produced cacheable tool calls (Write/Edit/Bash).

const fs = require('fs');
const path = require('path');
const { parseInput, setCacheMode, getCacheMode } = require('./draft-runtime');

parseInput().then(data => {
  setCacheMode('', data.cwd);
  if (getCacheMode(data.cwd) === 'never') process.exit(0);

  const txPath = data.transcript_path;
  if (!txPath || !fs.existsSync(txPath)) process.exit(0);

  // Track scan offset per session transcript
  const stateFile = txPath + '.draft-offset';
  let offset = 0;
  try { offset = parseInt(fs.readFileSync(stateFile, 'utf8'), 10) || 0; } catch {}

  const content = fs.readFileSync(txPath, 'utf8');
  const lines = content.split('\n');
  const newLines = lines.slice(offset).filter(Boolean);

  // Persist new offset
  fs.writeFileSync(stateFile, String(lines.length));

  if (!newLines.length) process.exit(0);

  const CACHEABLE_TOOLS = new Set(['Write', 'Edit', 'Bash', 'NotebookEdit']);
  let hasSubstantiveWork = false;

  for (const line of newLines) {
    try {
      const entry = JSON.parse(line);
      if (entry.type === 'tool_use' && CACHEABLE_TOOLS.has(entry.name)) {
        hasSubstantiveWork = true;
        break;
      }
      if (entry.role === 'assistant' && Array.isArray(entry.content)) {
        for (const block of entry.content) {
          if (block.type === 'tool_use' && CACHEABLE_TOOLS.has(block.name)) {
            hasSubstantiveWork = true;
            break;
          }
        }
        if (hasSubstantiveWork) break;
      }
    } catch {}
  }

  if (!hasSubstantiveWork) process.exit(0);

  console.log('{"draft":"auto-cache"}');
}).catch(() => process.exit(0));
