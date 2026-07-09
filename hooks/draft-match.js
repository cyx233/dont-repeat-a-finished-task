#!/usr/bin/env node
"use strict";

const fs = require('fs');
const { scanCatalog, parseInput, setCacheMode, emit } = require('./draft-runtime');
const { getSessionCwd } = require('../lib/agent-hook');

parseInput().then(data => {
  const prompt = (data.user_prompt || data.prompt || '').trim();
  if (!prompt) process.exit(0);

  const lower = prompt.toLowerCase();
  if (/\b(never cache|stop offering saves)\b/.test(lower)) { setCacheMode('never', data.cwd); process.exit(0); }
  if (/\b(always cache)\b/.test(lower)) { setCacheMode('always', data.cwd); process.exit(0); }

  const items = scanCatalog(getSessionCwd({ transcriptPath: data.transcript_path }) || data.cwd);
  if (!items.length) process.exit(0);

  // Inject catalog — main agent has context + LLM judgment to match
  const lines = items.map(m => `- ${m.name} (${m.type}): ${m.desc} → ${m.path}`);
  emit('UserPromptSubmit', `DRAFT CATALOG:\n${lines.join('\n')}\nUse matching items instead of re-implementing.`);
}).catch(() => process.exit(0));
