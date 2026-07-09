"use strict";

const fs = require('fs');
const path = require('path');

const scanScript = path.join(__dirname, '..', 'scripts', 'lib', 'scan.js');

function emit(event, text) {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext: text } }));
}

function scanCatalog(cwd) {
  const { execSync } = require('child_process');
  try {
    const raw = execSync(`node "${scanScript}" --all`, {
      encoding: 'utf8', timeout: 3000,
      cwd: cwd || process.env.CLAUDE_CWD || process.cwd(),
    }).trim();
    if (!raw) return [];
    return raw.split('\n').filter(Boolean).flatMap(line => {
      const p = line.split('\t');
      return p.length >= 4 ? [{ type: p[0], name: p[1], path: p[2], desc: p[3] }] : [];
    });
  } catch { return []; }
}

function parseInput() {
  return new Promise((resolve, reject) => {
    let input = '';
    process.stdin.on('data', chunk => { input += chunk; });
    process.stdin.on('end', () => {
      try { resolve(JSON.parse(input.replace(/^﻿/, ''))); }
      catch (e) { reject(e); }
    });
    process.stdin.on('error', reject);
  });
}

function getModeFile(cwd) {
  return path.join(cwd || process.env.CLAUDE_CWD || process.cwd(), '.claude', '.draft-cache-mode');
}

function getCacheMode(cwd) {
  try { return JSON.parse(fs.readFileSync(getModeFile(cwd), 'utf8'))[process.ppid] || ''; }
  catch { return ''; }
}

function setCacheMode(mode, cwd) {
  let modes = {};
  try { modes = JSON.parse(fs.readFileSync(getModeFile(cwd), 'utf8')); } catch {}
  if (mode) modes[process.ppid] = mode; else delete modes[process.ppid];
  const f = getModeFile(cwd);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(modes));
}

function autoCache() {
  parseInput().then(data => {
    if (getCacheMode(data.cwd) === 'never') process.exit(0);
    if (data.stop_hook_active) process.exit(0);
    if (data.transcript_path) {
      try {
        const markFile = path.join(require('os').tmpdir(), `draft-offset-${data.session_id || process.ppid}`);
        let offset = 0;
        try { offset = parseInt(fs.readFileSync(markFile, 'utf8')) || 0; } catch {}
        const fd = fs.openSync(data.transcript_path, 'r');
        const size = fs.fstatSync(fd).size;
        if (size <= offset) { fs.closeSync(fd); process.exit(0); }
        const buf = Buffer.alloc(size - offset);
        fs.readSync(fd, buf, 0, buf.length, offset);
        fs.closeSync(fd);
        const turns = (buf.toString('utf8').match(/"type":"assistant"/g) || []).length;
        fs.writeFileSync(markFile, String(size));
        if (turns < 3) process.exit(0);
      } catch {}
    }
    const mode = getCacheMode(data.cwd);
    process.stderr.write(`Invoke /draft-auto-cache --mode ${mode === 'always' ? 'always' : 'ask'}\n`);
    process.exit(2);
  }).catch(() => process.exit(0));
}

module.exports = { emit, scanCatalog, parseInput, getCacheMode, setCacheMode, autoCache };
