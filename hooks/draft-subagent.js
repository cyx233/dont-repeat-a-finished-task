#!/usr/bin/env node
// draft — SubagentStart hook

const { emit, scanCatalog } = require('./draft-runtime');

const items = scanCatalog();
if (!items.length) process.exit(0);

emit('SubagentStart', 'DRAFT plugin is active. Cached scripts/notes exist — you MUST use them instead of re-implementing. If a script needs fixing, fix it in-place first.');
