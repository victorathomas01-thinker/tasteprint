import fs from 'node:fs';
import {
  LIVE_ARCHETYPES,
  LIVE_BADGES,
  LIVE_DIMENSIONS,
  LIVE_MODES,
  LIVE_QUESTIONS
} from '../live-data.js';

if (LIVE_DIMENSIONS.length !== 10) throw new Error('Live must define ten hidden dimensions.');
if (LIVE_QUESTIONS.length !== 8) throw new Error('Live must define eight forced-choice questions.');
if (LIVE_ARCHETYPES.length !== 12) throw new Error('Live must define twelve archetypes.');
if (LIVE_MODES.length !== 8) throw new Error('Live must define eight living modes.');
if (LIVE_BADGES.length < 8) throw new Error('Live badge set is unexpectedly small.');
for (const [index, question] of LIVE_QUESTIONS.entries()) {
  if (question.options.length !== 4) throw new Error(`Live question ${index + 1} must have four options.`);
}

const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));
const distance = (scores, vector) => Math.sqrt(LIVE_DIMENSIONS.reduce((sum, key) => sum + (scores[key] - vector[key]) ** 2, 0) / LIVE_DIMENSIONS.length);
const nearest = (scores, list) => list
  .map((item) => ({ item, distance: distance(scores, item.vector) }))
  .sort((a, b) => a.distance - b.distance)[0].item.name;

const archetypeCounts = new Map(LIVE_ARCHETYPES.map((item) => [item.name, 0]));
const modeCounts = new Map(LIVE_MODES.map((item) => [item.name, 0]));
let paths = 0;

for (let code = 0; code < 4 ** LIVE_QUESTIONS.length; code += 1) {
  let cursor = code;
  const scores = Object.fromEntries(LIVE_DIMENSIONS.map((key) => [key, 50]));
  for (const question of LIVE_QUESTIONS) {
    const choice = cursor % 4;
    cursor = Math.floor(cursor / 4);
    const delta = question.options[choice][3] || {};
    for (const [key, value] of Object.entries(delta)) {
      if (key in scores) scores[key] = clamp(scores[key] + value);
    }
  }
  const archetype = nearest(scores, LIVE_ARCHETYPES);
  const mode = nearest(scores, LIVE_MODES);
  archetypeCounts.set(archetype, archetypeCounts.get(archetype) + 1);
  modeCounts.set(mode, modeCounts.get(mode) + 1);
  paths += 1;
}

if (paths !== 65536) throw new Error(`Expected 65,536 Live response paths, checked ${paths}.`);
for (const [name, count] of archetypeCounts) {
  const share = count / paths;
  if (!count) throw new Error(`Live archetype ${name} is unreachable.`);
  if (share < 0.02 || share > 0.20) throw new Error(`Live archetype ${name} covers ${(share * 100).toFixed(1)}% of response paths; expected 2–20%.`);
}
for (const [name, count] of modeCounts) {
  const share = count / paths;
  if (!count) throw new Error(`Live mode ${name} is unreachable.`);
  if (share < 0.05 || share > 0.25) throw new Error(`Live mode ${name} covers ${(share * 100).toFixed(1)}% of response paths; expected 5–25%.`);
}

const runtime = fs.readFileSync(new URL('../live.js', import.meta.url), 'utf8');
for (const marker of ["params.get('module') === 'live'", "moduleId: 'live'", "module: 'live'", 'tasteprint:module-complete', 'Environment signals, not a housing verdict.', 'Six domains complete']) {
  if (!runtime.includes(marker)) throw new Error(`Live runtime is missing ${marker}.`);
}
const css = fs.readFileSync(new URL('../live.css', import.meta.url), 'utf8');
if (!css.includes('html[data-module="live"]') || !css.includes('@media(max-width:620px)')) throw new Error('Live responsive theme is missing.');

const archetypeSummary = [...archetypeCounts.entries()]
  .sort((a, b) => b[1] - a[1])
  .map(([name, count]) => `${name} ${(count / paths * 100).toFixed(1)}%`)
  .join(' · ');
const modeSummary = [...modeCounts.entries()]
  .sort((a, b) => b[1] - a[1])
  .map(([name, count]) => `${name} ${(count / paths * 100).toFixed(1)}%`)
  .join(' · ');

console.log(`Live OK — 8 choices, 12 archetypes, 8 modes, ${paths.toLocaleString()} valid response paths checked.`);
console.log(archetypeSummary);
console.log(`Modes — ${modeSummary}`);
