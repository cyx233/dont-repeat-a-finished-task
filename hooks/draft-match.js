#!/usr/bin/env node
"use strict";

const fs = require('fs');
const { scanCatalog, parseInput, setCacheMode, emit } = require('./draft-runtime');
const { matchByVector } = require('../lib/embedder');
const { getSessionCwd } = require('../lib/agent-hook');

parseInput().then(async data => {
  const prompt = (data.user_prompt || data.prompt || '').trim();
  if (!prompt) process.exit(0);

  const lower = prompt.toLowerCase();
  if (/\b(never cache|stop offering saves)\b/.test(lower)) { setCacheMode('never', data.cwd); process.exit(0); }
  if (/\b(always cache)\b/.test(lower)) { setCacheMode('always', data.cwd); process.exit(0); }

  const items = scanCatalog(getSessionCwd({ transcriptPath: data.transcript_path }) || data.cwd);
  if (!items.length) process.exit(0);

  const names = await matchByVector(prompt, items) || [];
  const matched = items.filter(m => names.includes(m.name));
  if (!matched.length) process.exit(0);

  const sections = matched.map(m => {
    const content = fs.readFileSync(m.path, 'utf8');
    const cmd = m.type === 'script' ? `bash "${m.path}"` : '(note)';
    return `## ${m.name} ${cmd}\n\`\`\`\n${content}\n\`\`\``;
  });

  emit('UserPromptSubmit',
    `DRAFT MATCH:\n\n${sections.join('\n\n')}\n\nUse matched scripts/notes above instead of re-implementing.`);
}).catch(() => process.exit(0));
