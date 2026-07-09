#!/usr/bin/env node
"use strict";

const fs = require('fs');
const path = require('path');
const { parseInput, getCacheMode, setCacheMode } = require('./draft-runtime');
const { forkQueryStrict, detectHost } = require('../lib/agent-hook');

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

  if (!detectHost()) {
    // No CLI — fall back to exit 2 with generic invoke
    process.stderr.write(`Invoke /draft-auto-cache --mode ${mode === 'always' ? 'always' : 'ask'}\n`);
    process.exit(2);
  }

  // Fork with agent — --bare at end preserves session lookup
  let decision;
  try {
    decision = forkQueryStrict(
      'Review this session. Is the work worth caching as a reusable script or note? JSON only.',
      {
        sessionId: data.session_id,
        agent: 'draft-evaluator',
        timeout: 30000,
        cwd: data.cwd,
        validate: r => r && typeof r.cache === 'boolean',
      }
    );
  } catch {
    process.exit(0);
  }

  if (!decision || !decision.cache) process.exit(0);

  // Decision made — now hand off to main agent for execution via exit 2
  const skill = decision.type === 'note' ? '/draft-note' : '/draft-save';
  const nameArg = decision.name ? ` --name ${decision.name}` : '';

  if (mode === 'always') {
    process.stderr.write(`Invoke ${skill}${nameArg}\n`);
    process.exit(2);
  }

  // Ask mode: write decision to tmp, let skill read it
  const decisionFile = path.join(require('os').tmpdir(), `draft-decision-${data.session_id || process.ppid}.json`);
  fs.writeFileSync(decisionFile, JSON.stringify(decision));
  process.stderr.write(`Invoke /draft-auto-cache --mode ask\n`);
  process.exit(2);
}).catch(() => process.exit(0));
