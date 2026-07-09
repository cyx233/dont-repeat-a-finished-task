"use strict";

const fs = require('fs');
const path = require('path');
const os = require('os');

const DIM = 384;
const VECTORS_DIR = path.join(os.homedir(), '.claude', '.draft-vectors');
const INDEX_PATH = path.join(VECTORS_DIR, 'index.json');
const BIN_PATH = path.join(VECTORS_DIR, 'vectors.bin');
let _pipeline = null;

async function getPipeline() {
  if (_pipeline) return _pipeline;
  const { pipeline, env } = await import('@huggingface/transformers');
  env.cacheDir = path.join(os.homedir(), '.claude', '.draft-model-cache');
  _pipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  return _pipeline;
}

async function embed(text) {
  const extractor = await getPipeline();
  const out = await extractor(text, { pooling: 'mean', normalize: true });
  return new Float32Array(out.data);
}

function cosine(a, b) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

// Binary store: index.json maps name → slot number, vectors.bin is packed Float32[DIM] per slot
function loadStore() {
  try {
    const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
    const buf = fs.readFileSync(BIN_PATH);
    const data = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
    return { index, data };
  } catch { return { index: {}, data: null }; }
}

function saveStore(index, vectors) {
  fs.mkdirSync(VECTORS_DIR, { recursive: true });
  const slots = Object.keys(index).length;
  const buf = Buffer.alloc(slots * DIM * 4);
  const view = new Float32Array(buf.buffer);
  for (const [name, slot] of Object.entries(index)) {
    const vec = vectors[name];
    if (vec) view.set(vec, slot * DIM);
  }
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index));
  fs.writeFileSync(BIN_PATH, buf);
}

function getVec(data, slot) {
  return data.subarray(slot * DIM, (slot + 1) * DIM);
}

async function matchByVector(prompt, catalog, opts = {}) {
  const k = opts.k || 3;
  const minScore = opts.minScore || 0.3;
  let { index, data } = loadStore();

  const missing = catalog.filter(item => !(item.name in index));
  if (missing.length) {
    const vectors = {};
    // Load existing vectors into map
    if (data) {
      for (const [name, slot] of Object.entries(index)) {
        vectors[name] = getVec(data, slot);
      }
    }
    // Embed missing
    for (const item of missing) {
      const text = `${item.name.replace(/-/g, ' ')} ${item.desc || item.description || ''}`;
      vectors[item.name] = await embed(text);
      index[item.name] = Object.keys(index).length;
    }
    saveStore(index, vectors);
    // Reload clean
    ({ index, data } = loadStore());
  }

  if (!data) return null;
  const available = catalog.filter(item => item.name in index);
  if (!available.length) return null;

  const promptVec = await embed(prompt);
  return available
    .map(item => ({ name: item.name, score: cosine(promptVec, getVec(data, index[item.name])) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .filter(r => r.score >= minScore)
    .map(r => r.name);
}

module.exports = { embed, cosine, matchByVector, VECTORS_DIR, INDEX_PATH, BIN_PATH, DIM };
