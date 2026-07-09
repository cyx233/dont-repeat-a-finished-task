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
      const markFile = path.join(require('os').tmpdir(), `draft-offset-${data.session_id || process.ppid}`);
      let offset = 0;
      try { offset = parseInt(fs.readFileSync(markFile, 'utf8')) || 0; } catch {}
      const fd = fs.openSync(data.transcript_path, 'r');
      const size = fs.fstatSync(fd).size;
      if (size <= offset) { fs.closeSync(fd); process.exit(0); }
      const buf = Buffer.alloc(size - offset);
      fs.readSync(fd, buf, 0, buf.length, offset);
      fs.closeSync(fd);
      const turns = (buf.toString('utf8').match(/"type":"assistant"/g) || []).length;
      fs.writeFileSync(markFile, String(size));
      if (turns < 3) process.exit(0);
    } catch {}
  }

  const mode = getCacheMode(data.cwd);

  if (!detectHost()) {
    // No CLI — fall back to exit 2 with generic invoke
    process.stderr.write(`Invoke /draft-auto-cache --mode ${mode === 'always' ? 'always' : 'ask'}\n`);
    process.exit(2);
  }

  // Fork hack: sub-agent evaluates cacheability using full session context
  let decision;
  try {
    decision = forkQueryStrict(
      'Review this session. Is the work worth caching as a reusable script or note? JSON only.',
      {
        sessionId: data.session_id,
        agent: 'draft-evaluator',
        timeout: 12000,
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
