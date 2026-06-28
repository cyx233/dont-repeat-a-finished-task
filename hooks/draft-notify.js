#!/usr/bin/env node
// draft — Notification/PostToolUse hook
// Re-injects save-offer nudge when background work completes.

const { emit, getCacheMode, parseInput, getSaveNudge } = require('./draft-runtime');

parseInput().then(data => {
  const cacheMode = getCacheMode(data.cwd);
  if (cacheMode === 'never') process.exit(0);

  const event = data.hook_event_name || 'Notification';
  emit(event, getSaveNudge(cacheMode, 'notification'));
}).catch(() => {});
