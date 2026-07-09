#!/usr/bin/env node
"use strict";

const fs = require('fs');
const path = require('path');
const { parseInput, getCacheMode, setCacheMode } = require('./draft-runtime');
const { forkQueryStrict, detectHost } = require('../lib/agent-hook');

parseInput().then(data => {
  fs.writeFileSync('/tmp/draft-stop-debug.json', JSON.stringify(data, null, 2));
  if (getCacheMode(data.cwd) === 'never') { fs.appendFileSync('/tmp/draft-stop-debug.json', '\nEXIT: never mode'); process.exit(0); }
  if (data.stop_hook_active) { fs.appendFileSync('/tmp/draft-stop-debug.json', '\nEXIT: stop_hook_active'); process.exit(0); }

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

  // Fork hack: inline prompt (no --agent) to preserve parent cache prefix
  let decision;
  try {
    decision = forkQueryStrict(
      'You are the DRAFT evaluator. Decide if this session produced cacheable work (repeatable scripts or reusable context notes). NOT cacheable: one-off Q&A, trivial config, mode toggling, already-cached work replay. When uncertain return cache:false. Return ONLY valid JSON: {"cache":true,"type":"script"|"note","name":"kebab-name","description":"one line"} or {"cache":false}',
      {
        sessionId: data.session_id,
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
