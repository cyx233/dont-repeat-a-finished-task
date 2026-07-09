#!/usr/bin/env node
"use strict";

const fs = require('fs');
const { scanCatalog, parseInput, setCacheMode, emit } = require('./draft-runtime');
const { forkQueryStrict, detectHost, getSessionCwd } = require('../lib/agent-hook');

parseInput().then(data => {
  const prompt = (data.user_prompt || data.prompt || '').trim();
  if (!prompt) process.exit(0);

  const lower = prompt.toLowerCase();
  if (/\b(never cache|stop offering saves)\b/.test(lower)) { setCacheMode('never', data.cwd); process.exit(0); }
  if (/\b(always cache)\b/.test(lower)) { setCacheMode('always', data.cwd); process.exit(0); }

  const items = scanCatalog(getSessionCwd({ transcriptPath: data.transcript_path }) || data.cwd);
  if (!items.length) process.exit(0);

  if (!detectHost()) {
    // No CLI available — inject full catalog as fallback
    const lines = items.map(m => `- ${m.name} (${m.type}): ${m.desc} → ${m.path}`);
    emit('UserPromptSubmit', `DRAFT CATALOG:\n${lines.join('\n')}\nUse matching items instead of re-implementing.`);
    process.exit(0);
  }

  // Fork: needs session context for ambiguous prompts ("repeat", "again", etc.)
  const catalog = items.map(m => `${m.name} (${m.type}): ${m.desc}`).join('\n');
  const result = forkQueryStrict(
    `User task: "${prompt}"\n\nCatalog:\n${catalog}\n\nReturn names of items that match this task. JSON only: {"matches": ["name1"]}`,
    {
      sessionId: data.session_id,
      agent: 'draft-matcher',
      timeout: 12000,
      transcriptPath: data.transcript_path,
      validate: r => Array.isArray(r && r.matches),
    }
  );

  const names = (result && result.matches) || [];
  const matched = items.filter(m => names.includes(m.name));
  if (!matched.length) process.exit(0);

  // Remaining hook: inject matched script/note content
  const sections = matched.map(m => {
    const content = fs.readFileSync(m.path, 'utf8');
    const cmd = m.type === 'script' ? `bash "${m.path}"` : '(note)';
    return `## ${m.name} ${cmd}\n\`\`\`\n${content}\n\`\`\``;
  });

  emit('UserPromptSubmit',
    `DRAFT MATCH:\n\n${sections.join('\n\n')}\n\nUse matched scripts/notes above instead of re-implementing.`);
}).catch(() => process.exit(0));
