import fs from 'node:fs';
import {
  WATCH_ARCHETYPES,
  WATCH_DIMENSIONS,
  WATCH_MODES,
  WATCH_QUESTIONS
} from '../watch-data.js';

if (WATCH_DIMENSIONS.length !== 10) throw new Error('Watch must use ten hidden dimensions.');
if (WATCH_QUESTIONS.length !== 8) throw new Error('Watch should have eight choices.');
if (WATCH_ARCHETYPES.length !== 12) throw new Error('Watch should define twelve archetypes.');
if (WATCH_MODES.length !== 8) throw new Error('Watch should define eight viewing modes.');
if (WATCH_QUESTIONS.some((question) => question.options?.length !== 4)) throw new Error('Each Watch question should expose exactly four choices.');

const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));
const apply = (scores, delta = {}) => {
  const next = { ...scores };
  for (const [key, value] of Object.entries(delta)) next[key] = clamp(next[key] + value);
  return next;
};
const distance = (scores, vector) => Math.sqrt(WATCH_DIMENSIONS.reduce((sum, key) => sum + (scores[key] - vector[key]) ** 2, 0) / WATCH_DIMENSIONS.length);
const closest = (scores, list) => list.map((item) => ({ item, distance: distance(scores, item.vector) })).sort((a, b) => a.distance - b.distance)[0].item;

const counts = new Map(WATCH_ARCHETYPES.map((item) => [item.name, 0]));
let paths = 0;

function walk(step, scores) {
  if (step === WATCH_QUESTIONS.length) {
    const archetype = closest(scores, WATCH_ARCHETYPES);
    counts.set(archetype.name, counts.get(archetype.name) + 1);
    paths += 1;
    return;
  }
  for (const option of WATCH_QUESTIONS[step].options) walk(step + 1, apply(scores, option[3]));
}

walk(0, Object.fromEntries(WATCH_DIMENSIONS.map((key) => [key, 50])));

const distribution = [...counts.entries()].map(([name, count]) => ({ name, count, share: count / paths }));
const missing = distribution.filter((item) => item.count === 0);
if (missing.length) throw new Error(`Watch archetypes unreachable: ${missing.map((item) => item.name).join(', ')}`);
const tiny = distribution.filter((item) => item.share < 0.01);
if (tiny.length) throw new Error(`Watch archetypes below 1% of valid response paths: ${tiny.map((item) => item.name).join(', ')}`);
const dominant = distribution.filter((item) => item.share > 0.25);
if (dominant.length) throw new Error(`Watch archetype dominates more than 25% of valid response paths: ${dominant.map((item) => item.name).join(', ')}`);

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
for (const asset of ['watch.css', 'watch.js']) {
  if (!html.includes(asset)) throw new Error(`index.html is not loading ${asset}.`);
}
const runtime = fs.readFileSync(new URL('../watch.js', import.meta.url), 'utf8');
for (const marker of ["params.get('module') === 'watch'", 'tasteprint:module-complete', "moduleId: 'watch'", 'Watch Tasteprint', 'story watch-story']) {
  if (!runtime.includes(marker)) throw new Error(`Watch runtime is missing ${marker}.`);
}

console.log(`Watch OK — ${WATCH_QUESTIONS.length} choices, ${WATCH_ARCHETYPES.length} archetypes, ${WATCH_MODES.length} modes, ${paths.toLocaleString()} valid response paths checked.`);
console.log(distribution.sort((a, b) => b.count - a.count).map((item) => `${item.name} ${(item.share * 100).toFixed(1)}%`).join(' · '));
