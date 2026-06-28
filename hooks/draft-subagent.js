#!/usr/bin/env node
// draft — SubagentStart hook

const { emit, scanCatalog, parseInput } = require('./draft-runtime');

parseInput().then(data => {
  const items = scanCatalog(data.cwd);
  if (!items.length) process.exit(0);

  emit('SubagentStart', 'DRAFT plugin is active. Cached scripts/notes exist — you MUST use them instead of re-implementing. If a script needs fixing, fix it in-place first.');
}).catch(() => {});
