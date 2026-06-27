#!/usr/bin/env node
// Hook: Stop (asyncRewake)
// Checks if meaningful work was done this session; if so, triggers
// the agent to silently evaluate whether to cache it as a script or note.

const { execSync } = require('child_process');

try {
  execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });

  const stat = (() => {
    try { return execSync('git diff --stat HEAD', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim(); }
    catch { try { return execSync('git diff --stat', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim(); } catch { return ''; } }
  })();

  const untracked = (() => {
    try { return execSync('git ls-files --others --exclude-standard', { encoding: 'utf8' }).split('\n').slice(0, 5).join('\n').trim(); }
    catch { return ''; }
  })();

  if (!stat && !untracked) process.exit(0);

  console.log('{"draft":"auto-cache"}');
} catch {
  process.exit(0);
}
