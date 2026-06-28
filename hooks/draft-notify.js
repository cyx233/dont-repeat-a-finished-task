#!/usr/bin/env node
// draft — Notification hook
// Re-injects save-offer nudge when background work completes (workflow/task notifications).

const { emit, getCacheMode, parseInput } = require('./draft-runtime');

parseInput().then(data => {
  const cacheMode = getCacheMode(data.cwd);
  if (cacheMode === 'never') process.exit(0);

  const nudge = cacheMode === 'always'
    ? 'DRAFT: Auto-cache is ON. You MUST offer /draft-save (repeatable action) or /draft-note (reusable context) at the end of your response.'
    : 'DRAFT SAVE OFFER: If this notification delivered substantial results (architecture summary, codebase exploration, multi-file analysis, troubleshooting findings), you MUST offer /draft-note. If it produced a repeatable action, offer /draft-save.';

  emit('Notification', nudge);
}).catch(() => {});
