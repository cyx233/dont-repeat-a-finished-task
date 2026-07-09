"use strict";

const fs = require('fs');
const path = require('path');
const os = require('os');

const VECTORS_PATH = path.join(os.homedir(), '.claude', '.draft-vectors.json');
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
  return out.data; // Float32Array(384)
}

function cosine(a, b) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot; // already normalized
}

function loadVectors() {
  try { return JSON.parse(fs.readFileSync(VECTORS_PATH, 'utf8')); }
  catch { return null; }
}

async function matchByVector(prompt, catalog, opts = {}) {
  const k = opts.k || 3;
  const minScore = opts.minScore || 0.3;
  const vectors = loadVectors();
  if (!vectors) return null;

  const available = catalog.filter(item => vectors[item.name]);
  if (!available.length) return null;

  const promptVec = await embed(prompt);
  return available
    .map(item => ({ name: item.name, score: cosine(promptVec, vectors[item.name]) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .filter(r => r.score >= minScore)
    .map(r => r.name);
}

module.exports = { embed, cosine, matchByVector, VECTORS_PATH };
