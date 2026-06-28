#!/usr/bin/env node
// draft — SubagentStart hook
// SessionStart context is parent-thread only and never reaches subagents.
// Inject the same behavioral rules into each subagent so they respect cached scripts/notes.

const path = require('path');
const { emit, scanCatalog } = require('./draft-runtime');

const scanScript = path.join(__dirname, '..', 'scripts', 'lib', 'scan.js');

const items = scanCatalog();
if (!items.length) process.exit(0);

const rules = 'DRAFT plugin is active. Cached scripts/notes exist — check before re-implementing any task. ' +
  'Run: node "' + scanScript + '" --all to see the catalog.';

emit('SubagentStart', rules);
