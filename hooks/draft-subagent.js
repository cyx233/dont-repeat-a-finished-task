#!/usr/bin/env node
// draft — SubagentStart hook

const { emit, scanCatalog } = require('./draft-runtime');

const items = scanCatalog();
if (!items.length) process.exit(0);

emit('SubagentStart', 'DRAFT plugin is active. Cached scripts/notes exist — check before re-implementing any task.');
