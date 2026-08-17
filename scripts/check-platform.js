import fs from 'node:fs';
import {
  MODULES,
  MASTER_DIMENSIONS,
  addSnapshot,
  aggregateMaster,
  changeSummary,
  crossModuleBadges,
  makeSnapshot,
  mapModuleScores,
  masterBadges,
  moduleProgress
} from '../platform-core.js';

if (MODULES.length !== 6) throw new Error('Tasteprint platform must define six product modules.');
if (MODULES.filter((module) => module.status === 'live').map((module) => module.id).join(',') !== 'escape,wear') {
  throw new Error('Escape and Wear should be the live consumer modules in this platform batch.');
}
if (MASTER_DIMENSIONS.length !== 10) throw new Error('Master Tasteprint must use ten shared dimensions.');

const first = makeSnapshot({
  moduleId: 'escape',
  scores: { romance: 80, novelty: 70, comfort: 65, structure: 40, social: 45, activity: 60, culture: 75, serenity: 70, aesthetic: 82, spontaneity: 68 },
  archetype: 'Golden Hour Romantic',
  mode: 'Coastal Romantic',
  signature: 'one',
  createdAt: '2026-01-01T00:00:00.000Z'
});
const second = makeSnapshot({
  moduleId: 'escape',
  scores: { romance: 82, novelty: 82, comfort: 70, structure: 42, social: 46, activity: 62, culture: 78, serenity: 72, aesthetic: 86, spontaneity: 76 },
  archetype: 'Golden Hour Romantic',
  mode: 'City + Coast',
  signature: 'two',
  createdAt: '2026-02-01T00:00:00.000Z'
});
const wear = makeSnapshot({
  moduleId: 'wear',
  scores: { experimentation: 78, coordination: 74, visibility: 62, styling: 88, ease: 80, edge: 64, calm: 72, nostalgia: 70, detail: 82, impulse: 70 },
  archetype: 'Modern Traditionalist',
  mode: 'Tailored Clean',
  signature: 'wear-one',
  createdAt: '2026-03-01T00:00:00.000Z'
});

let history = addSnapshot([], first);
history = addSnapshot(history, first);
if (history.length !== 1) throw new Error('Duplicate Passport snapshots should be deduplicated.');
history = addSnapshot(history, second);
if (history.length !== 2) throw new Error('Distinct Passport snapshots should be retained.');

let master = aggregateMaster(history);
if (master.modules !== 1 || master.scores.novelty !== 82) throw new Error('Master aggregation should use the latest result once per module.');
if (!masterBadges(master).length) throw new Error('Master badges should generate from a sufficiently strong profile.');
if (crossModuleBadges(history).length) throw new Error('Cross-module badges must stay locked with one completed module.');

const wearMapped = mapModuleScores('wear', wear.module_scores);
if (wearMapped.novelty !== 78 || wearMapped.aesthetic !== 88 || wearMapped.curiosity !== 82) {
  throw new Error('Wear is not mapping correctly into the shared master vocabulary.');
}

history = addSnapshot(history, wear);
master = aggregateMaster(history);
if (master.modules !== 2) throw new Error('Passport should aggregate Escape and Wear as two module votes.');
if (master.scores.aesthetic !== Math.round((86 + 88) / 2)) throw new Error('Cross-domain master aggregation is not giving modules equal weight.');
if (!crossModuleBadges(history).some((badge) => /Aesthetic/.test(badge.label))) {
  throw new Error('Cross-module badges should unlock when a preference repeats across Escape and Wear.');
}

const change = changeSummary(history, 'escape');
if (change.kind === 'new' || !/Novelty|spontaneity|aesthetic|curiosity/i.test(`${change.title} ${change.detail}`)) {
  throw new Error('Preference-history change summary is not comparing saved results.');
}

const progress = moduleProgress(history);
if (!progress.find((module) => module.id === 'escape')?.completed) throw new Error('Escape completion is missing from module progress.');
if (!progress.find((module) => module.id === 'wear')?.completed) throw new Error('Wear completion is missing from module progress.');
if (progress.find((module) => module.id === 'watch')?.completed) throw new Error('Planned modules must not appear completed.');

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
for (const asset of ['platform.css', 'platform.js', 'wear.css', 'wear.js']) {
  if (!html.includes(asset)) throw new Error(`index.html is not loading ${asset}.`);
}
const platform = fs.readFileSync(new URL('../platform.js', import.meta.url), 'utf8');
for (const marker of ['tasteprint.platform-history.v1', "params.get('profile')", 'TasteprintPassport', 'deriveEscapeSnapshot', 'tasteprint:module-complete', 'crossModuleBadges']) {
  if (!platform.includes(marker)) throw new Error(`Platform runtime is missing ${marker}.`);
}

console.log(`Platform OK — ${MODULES.length} modules registered, Escape + Wear live, ${MASTER_DIMENSIONS.length}D master profile, cross-module Passport badges/history wired.`);
