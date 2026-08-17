import fs from 'node:fs';
import {
  EAT_ARCHETYPES,
  EAT_BADGES,
  EAT_DIMENSIONS,
  EAT_MODES,
  EAT_QUESTIONS
} from '../eat-data.js';

if (EAT_DIMENSIONS.length !== 10) throw new Error('Eat must use ten hidden dimensions.');
if (EAT_QUESTIONS.length !== 8) throw new Error('Eat must have eight forced-choice questions.');
if (EAT_ARCHETYPES.length !== 12) throw new Error('Eat must define twelve archetypes.');
if (EAT_MODES.length !== 8) throw new Error('Eat must define eight dining modes.');
if (EAT_BADGES.length < 8) throw new Error('Eat badge pool is unexpectedly small.');

for (const [index, question] of EAT_QUESTIONS.entries()) {
  if (question.options.length !== 4) throw new Error(`Eat question ${index + 1} must have four options.`);
  for (const option of question.options) {
    if (!option[0] || !option[1] || !option[2] || !option[3]) throw new Error(`Eat question ${index + 1} has an incomplete option.`);
    for (const key of Object.keys(option[3])) {
      if (!EAT_DIMENSIONS.includes(key)) throw new Error(`Eat question ${index + 1} writes unknown dimension ${key}.`);
    }
  }
}

const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));
const distance = (scores, vector) => Math.sqrt(EAT_DIMENSIONS.reduce((sum, key) => sum + (scores[key] - vector[key]) ** 2, 0) / EAT_DIMENSIONS.length);
const closest = (scores, list) => [...list].sort((a, b) => distance(scores, a.vector) - distance(scores, b.vector))[0];
const archetypes = new Map(EAT_ARCHETYPES.map((item) => [item.name, 0]));
const modes = new Map(EAT_MODES.map((item) => [item.name, 0]));
let paths = 0;

function visit(step, scores) {
  if (step === EAT_QUESTIONS.length) {
    paths += 1;
    const archetype = closest(scores, EAT_ARCHETYPES);
    const mode = closest(scores, EAT_MODES);
    archetypes.set(archetype.name, archetypes.get(archetype.name) + 1);
    modes.set(mode.name, modes.get(mode.name) + 1);
    return;
  }

  for (const option of EAT_QUESTIONS[step].options) {
    const next = { ...scores };
    for (const [key, value] of Object.entries(option[3])) next[key] = clamp(next[key] + value);
    visit(step + 1, next);
  }
}

visit(0, Object.fromEntries(EAT_DIMENSIONS.map((key) => [key, 50])));
if (paths !== 65536) throw new Error(`Expected 65,536 Eat response paths, got ${paths}.`);

for (const [name, count] of archetypes) {
  const share = count / paths;
  if (count === 0) throw new Error(`Eat archetype ${name} is unreachable.`);
  if (share < 0.04) throw new Error(`Eat archetype ${name} is under 4% of valid paths (${(share * 100).toFixed(1)}%).`);
  if (share > 0.16) throw new Error(`Eat archetype ${name} exceeds 16% of valid paths (${(share * 100).toFixed(1)}%).`);
}
for (const [name, count] of modes) {
  const share = count / paths;
  if (count === 0) throw new Error(`Eat mode ${name} is unreachable.`);
  if (share < 0.07) throw new Error(`Eat mode ${name} is under 7% of valid paths (${(share * 100).toFixed(1)}%).`);
  if (share > 0.20) throw new Error(`Eat mode ${name} exceeds 20% of valid paths (${(share * 100).toFixed(1)}%).`);
}

const runtime = fs.readFileSync(new URL('../eat.js', import.meta.url), 'utf8');
for (const marker of ["params.get('module') === 'eat'", "moduleId: 'eat'", "module: 'eat'", 'Tasteprint · Eat', 'does not account for allergies']) {
  if (!runtime.includes(marker)) throw new Error(`Eat runtime is missing ${marker}.`);
}
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
for (const asset of ['eat.css', 'eat.js']) {
  if (!html.includes(asset)) throw new Error(`index.html is not loading ${asset}.`);
}

const sortedA = [...archetypes].sort((a, b) => b[1] - a[1]);
const sortedM = [...modes].sort((a, b) => b[1] - a[1]);
console.log(`Eat OK — 8 choices, 12 archetypes, 8 modes, ${paths.toLocaleString()} valid response paths checked.`);
console.log(sortedA.map(([name, count]) => `${name} ${(count / paths * 100).toFixed(1)}%`).join(' · '));
console.log('Modes — ' + sortedM.map(([name, count]) => `${name} ${(count / paths * 100).toFixed(1)}%`).join(' · '));
