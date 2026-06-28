#!/usr/bin/env node
// draft — UserPromptSubmit hook
// Matches user prompt against cached scripts/notes; nudges when a hit is found.

const { emit, scanCatalog, parseInput, getCacheMode, setCacheMode } = require('./draft-runtime');

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

  const SAVE_NUDGE = cacheMode === 'never' ? '' :
    cacheMode === 'always'
      ? '\nDRAFT: Auto-cache is ON. You MUST offer /draft-save (repeatable action) or /draft-note (reusable context) at the end of your response.'
      : '\nDRAFT SAVE OFFER: Offer /draft-save (repeatable action) or /draft-note (reusable context) at the end of your response if the work qualifies. Skip if purely conversational.';

  if (!matches.length) {
    // ponytail: no match = no saveable work signal, skip nudge
    const words = prompt.split(/\s+/).length;
    const actionVerbs = /\b(create|build|fix|write|implement|add|update|refactor|generate|deploy|migrate)\b/;
    if (words > 10 && actionVerbs.test(prompt)) {
      emit('UserPromptSubmit', 'DRAFT: No cached match.' + SAVE_NUDGE);
    }
    process.exit(0);
  }

  const lines = matches.map(m => {
    const verb = m.type === 'script' ? `run via: bash "${m.path}"` : `read via: cat "${m.path}"`;
    return `- **${m.name}** (${m.type}): ${m.desc} → ${verb}`;
  });

  const output = `DRAFT MATCH: Cached ${matches.length === 1 ? 'item' : 'items'} may cover this task:\n` +
    lines.join('\n') + '\n' +
    'Use the cached version instead of re-implementing.\n' +
    'REQUIREMENT: If a cached script matches, you MUST use it instead of re-implementing manually. Present the match to the user first (name, description, command), then run it. If the script needs changes, fix the script first, then run it.' + SAVE_NUDGE;

  emit('UserPromptSubmit', output);
}).catch(() => {
  // Silent fail — no stdin or bad JSON
});
