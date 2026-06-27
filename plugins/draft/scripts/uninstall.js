#!/usr/bin/env node
// draft — uninstall cleanup
// Removes any state files draft wrote outside its own directory.
// Plugin files are removed by the host's uninstall command; this only cleans
// what those commands can't see.
//
// Usage: node scripts/uninstall.js

const fs = require('fs');
const path = require('path');
const os = require('os');

const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');

// draft doesn't currently write state files outside its plugin directory,
// but this script exists as the conventional hook point for future cleanup.
// Cached scripts (.claude/scripts/) and notes (.claude/notes/) are user content
// and are deliberately NOT deleted.

console.log('Draft uninstall complete.');
console.log('Note: Your cached scripts (.claude/scripts/) and notes (.claude/notes/) were preserved.');
