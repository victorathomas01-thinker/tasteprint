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
if (MODULES.filter((module) => module.status === 'live').map((module) => module.id).join(',') !== 'escape,wear,watch,move,eat,live') {
  throw new Error('All six Tasteprint consumer modules should be live in this platform batch.');
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
const watch = makeSnapshot({
  moduleId: 'watch',
  scores: { surprise: 80, coherence: 76, ensemble: 68, visuality: 84, accessibility: 72, momentum: 66, gentleness: 64, emotion: 86, complexity: 82, discovery: 74 },
  archetype: 'Emotional Worldbuilder',
  mode: 'Epic Immersion',
  signature: 'watch-one',
  createdAt: '2026-04-01T00:00:00.000Z'
});
const move = makeSnapshot({
  moduleId: 'move',
  scores: { variety: 76, structure: 68, social: 54, craft: 82, recovery: 72, intensity: 70, calm: 74, identity: 76, learning: 86, flexibility: 62 },
  archetype: 'Craft Athlete',
  mode: 'Skill Practice',
  signature: 'move-one',
  createdAt: '2026-05-01T00:00:00.000Z'
});
const eat = makeSnapshot({
  moduleId: 'eat',
  scores: { adventure: 78, ritual: 64, sharing: 72, presentation: 80, comfort: 74, intensity: 68, ease: 70, nostalgia: 76, curiosity: 88, spontaneity: 66 },
  archetype: 'Thoughtful Taster',
  mode: 'Curious Comfort',
  signature: 'eat-one',
  createdAt: '2026-06-01T00:00:00.000Z'
});
const live = makeSnapshot({
  moduleId: 'live',
  scores: { discovery: 72, routine: 64, community: 70, aesthetic: 78, comfort: 76, pace: 62, quiet: 68, rootedness: 74, access: 86, flexibility: 66 },
  archetype: 'Rooted Connector',
  mode: 'Rooted Walkable',
  signature: 'live-one',
  createdAt: '2026-07-01T00:00:00.000Z'
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
if (wearMapped.novelty !== 78 || wearMapped.aesthetic !== 88 || wearMapped.curiosity !== 82) throw new Error('Wear is not mapping correctly into the shared master vocabulary.');
const watchMapped = mapModuleScores('watch', watch.module_scores);
if (watchMapped.novelty !== 80 || watchMapped.aesthetic !== 84 || watchMapped.curiosity !== 82 || watchMapped.sentiment !== 86) throw new Error('Watch is not mapping correctly into the shared master vocabulary.');
const moveMapped = mapModuleScores('move', move.module_scores);
if (moveMapped.novelty !== 76 || moveMapped.aesthetic !== 82 || moveMapped.comfort !== 72 || moveMapped.energy !== 70 || moveMapped.curiosity !== 86) throw new Error('Move is not mapping correctly into the shared master vocabulary.');
const eatMapped = mapModuleScores('eat', eat.module_scores);
if (eatMapped.novelty !== 78 || eatMapped.structure !== 64 || eatMapped.social !== 72 || eatMapped.aesthetic !== 80 || eatMapped.sentiment !== 76 || eatMapped.curiosity !== 88) throw new Error('Eat is not mapping correctly into the shared master vocabulary.');
const liveMapped = mapModuleScores('live', live.module_scores);
if (liveMapped.novelty !== 72 || liveMapped.structure !== 64 || liveMapped.social !== 70 || liveMapped.aesthetic !== 78 || liveMapped.serenity !== 68 || liveMapped.sentiment !== 74 || liveMapped.curiosity !== 86 || liveMapped.spontaneity !== 66) throw new Error('Live is not mapping correctly into the shared master vocabulary.');

history = addSnapshot(history, wear);
master = aggregateMaster(history);
if (master.modules !== 2) throw new Error('Passport should aggregate Escape and Wear as two module votes.');
if (master.scores.aesthetic !== Math.round((86 + 88) / 2)) throw new Error('Cross-domain master aggregation is not giving modules equal weight.');
if (!crossModuleBadges(history).some((badge) => /Aesthetic/.test(badge.label))) throw new Error('Cross-module badges should unlock when a preference repeats across Escape and Wear.');

history = addSnapshot(history, watch);
master = aggregateMaster(history);
if (master.modules !== 3) throw new Error('Passport should aggregate Escape, Wear and Watch as three equal module votes.');
if (master.scores.aesthetic !== Math.round((86 + 88 + 84) / 3)) throw new Error('Three-domain aggregation is not weighting modules equally.');

history = addSnapshot(history, move);
master = aggregateMaster(history);
if (master.modules !== 4) throw new Error('Passport should aggregate Escape, Wear, Watch and Move as four equal module votes.');
if (master.scores.aesthetic !== Math.round((86 + 88 + 84 + 82) / 4)) throw new Error('Four-domain aggregation is not weighting modules equally.');

history = addSnapshot(history, eat);
master = aggregateMaster(history);
if (master.modules !== 5) throw new Error('Passport should aggregate five equal module votes after Eat.');
if (master.scores.aesthetic !== Math.round((86 + 88 + 84 + 82 + 80) / 5)) throw new Error('Five-domain aggregation is not weighting modules equally.');

history = addSnapshot(history, live);
master = aggregateMaster(history);
if (master.modules !== 6) throw new Error('Passport should aggregate all six modules as six equal votes.');
if (master.scores.aesthetic !== Math.round((86 + 88 + 84 + 82 + 80 + 78) / 6)) throw new Error('Six-domain aggregation is not weighting modules equally.');
for (const id of ['escape', 'wear', 'watch', 'move', 'eat', 'live']) {
  if (!master.moduleIds.includes(id)) throw new Error(`${id} is missing from the master module ID set.`);
}

const change = changeSummary(history, 'escape');
if (change.kind === 'new' || !/Novelty|spontaneity|aesthetic|curiosity/i.test(`${change.title} ${change.detail}`)) throw new Error('Preference-history change summary is not comparing saved results.');

const progress = moduleProgress(history);
for (const id of ['escape', 'wear', 'watch', 'move', 'eat', 'live']) {
  if (!progress.find((module) => module.id === id)?.completed) throw new Error(`${id} completion is missing from module progress.`);
}

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
for (const asset of ['platform.css', 'platform.js', 'wear.css', 'wear.js', 'watch.css', 'watch.js', 'move.css', 'move.js', 'eat.css', 'eat.js', 'live.css', 'live.js']) {
  if (!html.includes(asset)) throw new Error(`index.html is not loading ${asset}.`);
}
const platform = fs.readFileSync(new URL('../platform.js', import.meta.url), 'utf8');
for (const marker of ['tasteprint.platform-history.v1', "params.get('profile')", 'TasteprintPassport', 'deriveEscapeSnapshot', 'tasteprint:module-complete', 'crossModuleBadges']) {
  if (!platform.includes(marker)) throw new Error(`Platform runtime is missing ${marker}.`);
}

console.log(`Platform OK — ${MODULES.length} modules registered, all six live, ${MASTER_DIMENSIONS.length}D master profile, six-domain Passport aggregation wired.`);
