#!/usr/bin/env node
"use strict";

const fs = require('fs');
const { parseInput, getCacheMode } = require('./draft-runtime');

parseInput().then(data => {
  if (getCacheMode(data.cwd) === 'never') process.exit(0);
  if (data.stop_hook_active) process.exit(0);

  // Gate: skip if session too short
  if (data.transcript_path) {
    try {
      const content = fs.readFileSync(data.transcript_path, 'utf8');
      const turns = (content.match(/"type":"assistant"/g) || []).length;
      if (turns < 3) process.exit(0);
    } catch {}
  }

  const mode = getCacheMode(data.cwd);
  process.stderr.write(`Invoke /draft-auto-cache --mode ${mode === 'always' ? 'always' : 'ask'}\n`);
  process.exit(2);
}).catch(() => process.exit(0));
