#!/usr/bin/env node
"use strict";

const fs = require('fs');
const path = require('path');

async function main() {
  const { execSync } = require('child_process');
  const scanScript = path.join(__dirname, '..', 'scripts', 'lib', 'scan.js');
  const raw = execSync(`node "${scanScript}" --all`, { encoding: 'utf8' }).trim();
  if (!raw) { console.log('No catalog items found.'); return; }

  const catalog = raw.split('\n').filter(Boolean).map(line => {
    const p = line.split('\t');
    return p.length >= 4 ? { name: p[1], desc: p[3] } : null;
  }).filter(Boolean);

  const { embed, VECTORS_PATH } = require('./embedder');
  const vectors = {};
  for (const item of catalog) {
    const text = `${item.name.replace(/-/g, ' ')} ${item.desc || ''}`;
    vectors[item.name] = Array.from(await embed(text));
    process.stderr.write(`  embedded: ${item.name}\n`);
  }

  fs.mkdirSync(path.dirname(VECTORS_PATH), { recursive: true });
  fs.writeFileSync(VECTORS_PATH, JSON.stringify(vectors));
  console.log(`Wrote ${Object.keys(vectors).length} vectors to ${VECTORS_PATH}`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
