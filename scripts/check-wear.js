import fs from 'node:fs';
import {
  WEAR_ARCHETYPES,
  WEAR_DIMENSIONS,
  WEAR_MODES,
  WEAR_QUESTIONS
} from '../wear-data.js';

if (WEAR_DIMENSIONS.length !== 10) throw new Error('Wear must use ten domain-specific dimensions.');
if (WEAR_QUESTIONS.length !== 8) throw new Error('Wear should remain an eight-choice experience.');
if (WEAR_ARCHETYPES.length !== 12) throw new Error('Wear must define twelve archetypes.');
if (WEAR_MODES.length !== 8) throw new Error('Wear must define eight dressing modes.');

for (const [questionIndex, question] of WEAR_QUESTIONS.entries()) {
  if (!question.title || !question.subtitle || question.options.length !== 4) {
    throw new Error(`Wear question ${questionIndex + 1} is incomplete.`);
  }
  for (const option of question.options) {
    const delta = option[3];
    if (!delta || typeof delta !== 'object') throw new Error(`Wear question ${questionIndex + 1} has an option without scoring.`);
    for (const key of Object.keys(delta)) {
      if (!WEAR_DIMENSIONS.includes(key)) throw new Error(`Unknown Wear score dimension: ${key}`);
    }
  }
}

for (const item of [...WEAR_ARCHETYPES, ...WEAR_MODES]) {
  for (const key of WEAR_DIMENSIONS) {
    if (!Number.isFinite(item.vector?.[key])) throw new Error(`${item.name} is missing ${key}.`);
  }
}

const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));
const distance = (scores, vector) => Math.sqrt(WEAR_DIMENSIONS.reduce((sum, key) => sum + (scores[key] - vector[key]) ** 2, 0) / WEAR_DIMENSIONS.length);
let seed = 424242;
const random = () => {
  seed = (1664525 * seed + 1013904223) >>> 0;
  return seed / 4294967296;
};
const counts = new Map(WEAR_ARCHETYPES.map((item) => [item.name, 0]));
const samples = 30000;
for (let sample = 0; sample < samples; sample += 1) {
  const scores = Object.fromEntries(WEAR_DIMENSIONS.map((key) => [key, 50]));
  for (const question of WEAR_QUESTIONS) {
    const option = question.options[Math.floor(random() * question.options.length)];
    for (const [key, delta] of Object.entries(option[3])) scores[key] = clamp(scores[key] + delta);
  }
  const winner = WEAR_ARCHETYPES
    .map((item) => ({ item, distance: distance(scores, item.vector) }))
    .sort((a, b) => a.distance - b.distance)[0].item.name;
  counts.set(winner, counts.get(winner) + 1);
}

const represented = [...counts.values()].filter((count) => count > 0).length;
const maxShare = Math.max(...counts.values()) / samples;
if (represented < 11) throw new Error(`Wear synthetic coverage is too narrow: ${represented}/12 archetypes represented.`);
if (maxShare > 0.20) throw new Error(`Wear synthetic distribution is too concentrated: ${(maxShare * 100).toFixed(1)}% max share.`);

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
for (const asset of ['wear.css', 'wear.js']) {
  if (!html.includes(asset)) throw new Error(`index.html is not loading ${asset}.`);
}
const runtime = fs.readFileSync(new URL('../wear.js', import.meta.url), 'utf8');
for (const marker of ["params.get('module') === 'wear'", 'tasteprint:module-complete', 'Story card preview', 'data-wear-option', 'Open Passport']) {
  if (!runtime.includes(marker)) throw new Error(`Wear runtime is missing ${marker}.`);
}

const summary = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => `${name} ${(count / samples * 100).toFixed(1)}%`).join(' · ');
console.log(`Wear OK — 8 choices, 12 archetypes, 8 modes, ${represented}/12 archetypes represented. ${summary}`);
