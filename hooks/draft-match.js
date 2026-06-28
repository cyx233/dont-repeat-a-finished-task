#!/usr/bin/env node
// draft — UserPromptSubmit hook
// Matches user prompt against cached scripts/notes; nudges when a hit is found.

const { emit, scanCatalog, parseInput, getCacheMode, setCacheMode, getSaveNudge } = require('./draft-runtime');

parseInput().then(data => {
  const prompt = (data.prompt || '').trim().toLowerCase();
  if (!prompt) process.exit(0);

  // Hard session override detection
  if (/\b(never cache|stop offering saves|no more saves)\b/.test(prompt)) {
    setCacheMode('never', data.cwd);
    process.exit(0);
  }
  if (/\b(always cache|auto.?save everything)\b/.test(prompt)) {
    setCacheMode('always', data.cwd);
    process.exit(0);
  }

  const cacheMode = getCacheMode(data.cwd);

  const items = scanCatalog(data.cwd);
  if (!items.length) process.exit(0);

  // Match: triggers first (exact phrase match), then fallback to name/description keywords
  const matches = items.filter(item => {
    // Trigger phrases are the strongest signal
    if (item.triggers) {
      const phrases = item.triggers.split(',').map(t => t.trim().toLowerCase());
      if (phrases.some(p => p && prompt.includes(p))) return true;
    }
    const keywords = [
      ...item.name.split(/[-_]+/),
      ...item.desc.toLowerCase().split(/\s+/),
    ].filter(w => w.length > 3);
    const hitCount = keywords.filter(k => prompt.includes(k)).length;
    return prompt.includes(item.name) || hitCount >= 2;
  });

  const nudgeText = getSaveNudge(cacheMode, 'prompt');
  const SAVE_NUDGE = nudgeText ? '\n' + nudgeText : '';

  if (!matches.length) {
    if (cacheMode !== 'never') emit('UserPromptSubmit', nudgeText);
    process.exit(0);
  }

  const lines = matches.map(m => {
    let verb;
    if (m.type === 'script') {
      verb = `run via: bash "${m.path}"`;
      if (m.params) verb += `\n  Parameters: ${m.params}`;
    } else {
      verb = `read via: cat "${m.path}"`;
    }
    return `- **${m.name}** (${m.type}): ${m.desc} → ${verb}`;
  });

  const output = `DRAFT MATCH: Cached items may cover this task:\n` +
    lines.join('\n') + '\n' +
    'Use the cached version instead of re-implementing.\n' +
    'REQUIREMENT: If a cached script matches, you MUST use it instead of re-implementing manually. Present the match to the user first (name, description, command), then run it. If the script needs changes, fix the script first, then run it.' + SAVE_NUDGE;

  emit('UserPromptSubmit', output);
}).catch(() => {
  // Silent fail — no stdin or bad JSON
});
