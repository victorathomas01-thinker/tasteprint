import fs from 'node:fs';
import {
  MOVE_ARCHETYPES,
  MOVE_BADGES,
  MOVE_DIMENSIONS,
  MOVE_MODES,
  MOVE_QUESTIONS
} from '../move-data.js';

if (MOVE_DIMENSIONS.length !== 10) throw new Error('Move must use ten domain dimensions.');
if (MOVE_QUESTIONS.length !== 8) throw new Error('Move should have eight consumer choices.');
if (MOVE_ARCHETYPES.length !== 12) throw new Error('Move should define twelve archetypes.');
if (MOVE_MODES.length !== 8) throw new Error('Move should define eight session modes.');
if (MOVE_BADGES.length < 8) throw new Error('Move should have a meaningful badge pool.');

for (const [index, question] of MOVE_QUESTIONS.entries()) {
  if (question.options?.length !== 4) throw new Error(`Move question ${index + 1} must have four forced-choice options.`);
  for (const option of question.options) {
    if (!option[3] || typeof option[3] !== 'object') throw new Error(`Move question ${index + 1} has an option without scoring.`);
    for (const key of Object.keys(option[3])) {
      if (!MOVE_DIMENSIONS.includes(key)) throw new Error(`Move question ${index + 1} uses unknown dimension ${key}.`);
    }
  }
}

const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));
const distance = (scores, vector) => Math.sqrt(MOVE_DIMENSIONS.reduce((sum, key) => sum + (scores[key] - vector[key]) ** 2, 0) / MOVE_DIMENSIONS.length);
const counts = new Map(MOVE_ARCHETYPES.map((item) => [item.name, 0]));
const modeCounts = new Map(MOVE_MODES.map((item) => [item.name, 0]));
let paths = 0;

function walk(step, scores) {
  if (step === MOVE_QUESTIONS.length) {
    paths += 1;
    const archetype = MOVE_ARCHETYPES
      .map((item) => ({ item, distance: distance(scores, item.vector) }))
      .sort((a, b) => a.distance - b.distance)[0].item;
    const mode = MOVE_MODES
      .map((item) => ({ item, distance: distance(scores, item.vector) }))
      .sort((a, b) => a.distance - b.distance)[0].item;
    counts.set(archetype.name, counts.get(archetype.name) + 1);
    modeCounts.set(mode.name, modeCounts.get(mode.name) + 1);
    return;
  }

  for (const option of MOVE_QUESTIONS[step].options) {
    const next = { ...scores };
    for (const [key, value] of Object.entries(option[3])) next[key] = clamp(next[key] + value);
    walk(step + 1, next);
  }
}

walk(0, Object.fromEntries(MOVE_DIMENSIONS.map((key) => [key, 50])));
if (paths !== 65536) throw new Error(`Expected 65,536 valid Move response paths, got ${paths}.`);

for (const [name, count] of counts) {
  const pct = count / paths * 100;
  if (!count) throw new Error(`Move archetype ${name} is unreachable.`);
  if (pct < 1 || pct > 20) throw new Error(`Move archetype ${name} has suspicious synthetic coverage: ${pct.toFixed(1)}%.`);
}
for (const [name, count] of modeCounts) {
  const pct = count / paths * 100;
  if (!count) throw new Error(`Move mode ${name} is unreachable.`);
  if (pct < 2 || pct > 30) throw new Error(`Move mode ${name} has suspicious synthetic coverage: ${pct.toFixed(1)}%.`);
}

const runtime = fs.readFileSync(new URL('../move.js', import.meta.url), 'utf8');
for (const marker of ["params.get('module') === 'move'", "moduleId: 'move'", 'tasteprint:module-complete', 'Session signals, not a training prescription.', 'data-move-option']) {
  if (!runtime.includes(marker)) throw new Error(`Move runtime is missing ${marker}.`);
}
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
for (const asset of ['move.css', 'move.js']) {
  if (!html.includes(asset)) throw new Error(`index.html is not loading ${asset}.`);
}

const archetypeSummary = [...counts.entries()]
  .sort((a, b) => b[1] - a[1])
  .map(([name, count]) => `${name} ${(count / paths * 100).toFixed(1)}%`)
  .join(' · ');
const modeSummary = [...modeCounts.entries()]
  .sort((a, b) => b[1] - a[1])
  .map(([name, count]) => `${name} ${(count / paths * 100).toFixed(1)}%`)
  .join(' · ');

console.log(`Move OK — ${MOVE_QUESTIONS.length} choices, ${MOVE_ARCHETYPES.length} archetypes, ${MOVE_MODES.length} modes, ${paths.toLocaleString()} valid response paths checked.`);
console.log(archetypeSummary);
console.log(`Modes — ${modeSummary}`);
