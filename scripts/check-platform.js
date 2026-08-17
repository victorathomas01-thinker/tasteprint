import fs from 'node:fs';
import {
  MODULES,
  MASTER_DIMENSIONS,
  addSnapshot,
  aggregateMaster,
  changeSummary,
  makeSnapshot,
  masterBadges,
  moduleProgress
} from '../platform-core.js';

if (MODULES.length !== 6) throw new Error('Tasteprint platform must define six product modules.');
if (MODULES.filter((module) => module.status === 'live').map((module) => module.id).join(',') !== 'escape') {
  throw new Error('Escape should be the only live consumer module in this platform batch.');
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

let history = addSnapshot([], first);
history = addSnapshot(history, first);
if (history.length !== 1) throw new Error('Duplicate Passport snapshots should be deduplicated.');
history = addSnapshot(history, second);
if (history.length !== 2) throw new Error('Distinct Passport snapshots should be retained.');

const master = aggregateMaster(history);
if (master.modules !== 1 || master.scores.novelty !== 82) throw new Error('Master aggregation should use the latest result once per module.');
if (!masterBadges(master).length) throw new Error('Master badges should generate from a sufficiently strong profile.');

const change = changeSummary(history, 'escape');
if (change.kind === 'new' || !/Novelty|spontaneity|aesthetic|curiosity/i.test(`${change.title} ${change.detail}`)) {
  throw new Error('Preference-history change summary is not comparing saved results.');
}

const progress = moduleProgress(history);
if (!progress.find((module) => module.id === 'escape')?.completed) throw new Error('Escape completion is missing from module progress.');
if (progress.find((module) => module.id === 'wear')?.completed) throw new Error('Planned modules must not appear completed.');

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
for (const asset of ['platform.css', 'platform.js']) {
  if (!html.includes(asset)) throw new Error(`index.html is not loading ${asset}.`);
}
const platform = fs.readFileSync(new URL('../platform.js', import.meta.url), 'utf8');
for (const marker of ['tasteprint.platform-history.v1', "params.get('profile')", 'TasteprintPassport', 'deriveEscapeSnapshot', 'What changed?']) {
  if (!platform.includes(marker)) throw new Error(`Platform runtime is missing ${marker}.`);
}

console.log(`Platform OK — ${MODULES.length} modules registered, ${MASTER_DIMENSIONS.length}D master profile, local Passport/history/change summaries wired.`);
