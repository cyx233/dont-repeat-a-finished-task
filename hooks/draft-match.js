#!/usr/bin/env node
// draft — UserPromptSubmit hook
// Matches user prompt against cached scripts/notes; nudges when a hit is found.

const { emit, scanCatalog, parseInput } = require('./draft-runtime');

parseInput().then(data => {
  const prompt = (data.prompt || '').trim().toLowerCase();
  if (!prompt) process.exit(0);

  const items = scanCatalog();
  if (!items.length) process.exit(0);

  // Match: check if any script/note name or description words appear in the prompt
  const matches = items.filter(item => {
    const keywords = [
      ...item.name.split(/[-_]+/),
      ...item.desc.toLowerCase().split(/\s+/),
    ].filter(w => w.length > 3);
    const hitCount = keywords.filter(k => prompt.includes(k)).length;
    // Require at least 2 keyword hits or an exact name match
    return prompt.includes(item.name) || hitCount >= 2;
  });

  if (!matches.length) process.exit(0);

  const lines = matches.map(m => {
    const verb = m.type === 'script' ? `run via: bash "${m.path}"` : `read via: cat "${m.path}"`;
    return `- **${m.name}** (${m.type}): ${m.desc} → ${verb}`;
  });

  const output = `DRAFT MATCH: Cached ${matches.length === 1 ? 'item' : 'items'} may cover this task:\n` +
    lines.join('\n') + '\n' +
    'Use the cached version instead of re-implementing.';

  emit('UserPromptSubmit', output);
}).catch(() => {
  // Silent fail — no stdin or bad JSON
});
