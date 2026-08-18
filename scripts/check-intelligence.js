import fs from 'node:fs';
import { EVENT_NAMES } from '../analytics-contract.js';
import {
  INTELLIGENCE_FEEDBACK_MINIMUM,
  buildLearningRecord,
  confidenceModel,
  containsSensitiveKey,
  diverseModeSet,
  experienceState,
  feedbackSummary,
  learningReview,
  stableResultKey
} from '../intelligence-core.js';
import { INTELLIGENCE_MODULES } from '../intelligence-registry.js';

const moduleIds = Object.keys(INTELLIGENCE_MODULES);
if (moduleIds.join(',') !== 'escape,wear,watch,move,eat,live') {
  throw new Error(`Recommendation intelligence must cover all six modules, got ${moduleIds.join(',')}.`);
}

for (const [id, config] of Object.entries(INTELLIGENCE_MODULES)) {
  if (config.dimensions.length !== 10) throw new Error(`${id} intelligence model must expose 10 dimensions.`);
  if (config.archetypes.length !== 12) throw new Error(`${id} intelligence model must expose 12 archetypes.`);
  if (config.modes.length !== 8) throw new Error(`${id} intelligence model must expose 8 modes.`);
  for (const item of [...config.archetypes, ...config.modes]) {
    for (const dimension of config.dimensions) {
      if (!Number.isFinite(Number(item.vector?.[dimension]))) throw new Error(`${id} vector is missing ${dimension}.`);
    }
  }
}

const watch = INTELLIGENCE_MODULES.watch;
const current = {
  module_id: 'watch',
  created_at: '2026-08-17T22:00:00.000Z',
  archetype: watch.archetypes[0].name,
  mode: watch.modes[0].name,
  module_scores: { ...watch.archetypes[0].vector },
  signature: 'watch:current'
};
const previousWatch = {
  module_id: 'watch',
  created_at: '2026-08-01T22:00:00.000Z',
  archetype: watch.archetypes[0].name,
  mode: watch.modes[0].name,
  module_scores: Object.fromEntries(watch.dimensions.map((key) => [key, Math.max(0, Math.min(100, watch.archetypes[0].vector[key] - 2))])),
  signature: 'watch:previous'
};
const otherDomain = {
  module_id: 'wear',
  created_at: '2026-07-01T22:00:00.000Z',
  archetype: 'Example',
  mode: 'Example',
  module_scores: {},
  signature: 'wear:previous'
};

if (experienceState([current], 'watch', stableResultKey(current)).kind !== 'cold_start') {
  throw new Error('Current result must not count as prior history for cold-start classification.');
}
if (experienceState([otherDomain, current], 'watch', stableResultKey(current)).kind !== 'cross_domain_returning') {
  throw new Error('Cross-domain returning state is not detected.');
}
if (experienceState([previousWatch, current], 'watch', stableResultKey(current)).kind !== 'module_returning') {
  throw new Error('Same-module returning state is not detected.');
}

const coldConfidence = confidenceModel({
  scores: current.module_scores,
  dimensions: watch.dimensions,
  archetypes: watch.archetypes,
  history: [current],
  moduleId: 'watch',
  currentKey: stableResultKey(current)
});
if (!coldConfidence.level || coldConfidence.raw < 0 || coldConfidence.raw > 100 || coldConfidence.reasons.length < 2) {
  throw new Error('Confidence model did not produce bounded qualitative output.');
}
if (!/Model-fit confidence/i.test(coldConfidence.scope)) {
  throw new Error('Confidence output must state its limited scope.');
}

const returningConfidence = confidenceModel({
  scores: current.module_scores,
  dimensions: watch.dimensions,
  archetypes: watch.archetypes,
  history: [previousWatch, current],
  moduleId: 'watch',
  currentKey: stableResultKey(current)
});
if (returningConfidence.stability === null || returningConfidence.experience.kind !== 'module_returning') {
  throw new Error('Returning confidence must incorporate same-module stability.');
}

const coldSet = diverseModeSet({
  scores: current.module_scores,
  dimensions: watch.dimensions,
  modes: watch.modes,
  history: [current],
  moduleId: 'watch',
  currentKey: stableResultKey(current),
  count: 3
});
const returningSet = diverseModeSet({
  scores: current.module_scores,
  dimensions: watch.dimensions,
  modes: watch.modes,
  history: [previousWatch, current],
  moduleId: 'watch',
  currentKey: stableResultKey(current),
  count: 3
});
if (coldSet.recommendations.length !== 3 || new Set(coldSet.recommendations.map((item) => item.id)).size !== 3) {
  throw new Error('Recommendation diversity must return three unique lanes.');
}
if (coldSet.recommendations[0].sourceRank !== 1) throw new Error('Diverse ranking must preserve the best-fit mode as lane one.');
if (!(returningSet.diversityWeight > coldSet.diversityWeight)) {
  throw new Error('Returning users should receive a broader recommendation mix than cold-start users.');
}

const learningRecord = buildLearningRecord({
  resultKey: 'watch:current',
  module: 'watch',
  stage: 'adjustment',
  rating: 2,
  archetype: current.archetype,
  mode: current.mode,
  confidenceLevel: returningConfidence.level,
  experienceMode: 'module_returning',
  mismatchDimension: watch.dimensions[0],
  mismatchDirection: 'higher',
  recommendationIds: returningSet.recommendations.map((item) => item.id),
  scores: { ...current.module_scores, age: 25, race: 99 },
  age: 25,
  email: 'should-not-survive@example.com',
  precise_location: 'should-not-survive'
}, watch.dimensions);

for (const forbidden of ['age', 'email', 'precise_location', 'race']) {
  if (Object.prototype.hasOwnProperty.call(learningRecord, forbidden)) throw new Error(`Learning record leaked forbidden field ${forbidden}.`);
  if (Object.prototype.hasOwnProperty.call(learningRecord.module_scores, forbidden)) throw new Error(`Score allowlist leaked forbidden dimension ${forbidden}.`);
}
if (containsSensitiveKey(learningRecord)) throw new Error('Sanitized learning record still contains a sensitive attribute key.');

const makeFeedback = (index) => ({
  ...learningRecord,
  result_key: `result-${index}`,
  rating: index % 4 + 1,
  mismatch_dimension: index % 3 === 0 ? watch.dimensions[0] : null,
  mismatch_direction: index % 3 === 0 ? 'higher' : null
});
const belowMinimum = Array.from({ length: INTELLIGENCE_FEEDBACK_MINIMUM - 1 }, (_, index) => makeFeedback(index));
const atMinimum = Array.from({ length: INTELLIGENCE_FEEDBACK_MINIMUM }, (_, index) => makeFeedback(index));
if (feedbackSummary(belowMinimum).learning_ready) throw new Error('Learning gate opened before the minimum real-feedback sample.');
if (!feedbackSummary(atMinimum).learning_ready) throw new Error('Learning gate did not open at the configured review minimum.');
const review = learningReview(atMinimum);
if (!review.available || !/not automatic weight updates|review signals/i.test(review.note)) {
  throw new Error('Learning review must remain advisory rather than self-modifying.');
}

for (const event of ['recommendation_intelligence_view', 'recommendation_feedback', 'recommendation_lane_select']) {
  if (!EVENT_NAMES.includes(event)) throw new Error(`Analytics contract is missing ${event}.`);
}

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
for (const asset of ['intelligence.css', 'intelligence.js']) {
  if (!html.includes(asset)) throw new Error(`index.html is not loading ${asset}.`);
}

const runtime = fs.readFileSync(new URL('../intelligence.js', import.meta.url), 'utf8');
for (const marker of ['tasteprint.intelligence-feedback.v1', 'confidenceModel', 'diverseModeSet', 'RECOMMENDATION_FEEDBACK', 'RECOMMENDATION_LANE_SELECT']) {
  if (!runtime.includes(marker)) throw new Error(`Recommendation runtime is missing ${marker}.`);
}
for (const forbiddenRuntime of ['navigator.geolocation', 'navigator.contacts', '<textarea', 'demographicProfile']) {
  if (runtime.includes(forbiddenRuntime)) throw new Error(`Recommendation runtime must not use sensitive/free-text input path: ${forbiddenRuntime}`);
}

const privacy = fs.readFileSync(new URL('../privacy.js', import.meta.url), 'utf8');
if (!privacy.includes('recommendation_intelligence') || !privacy.includes('clearLocalFeedback')) {
  throw new Error('Privacy export/reset does not include recommendation intelligence feedback.');
}

const sql = fs.readFileSync(new URL('../supabase/intelligence.sql', import.meta.url), 'utf8');
for (const marker of ['tasteprint_intelligence_summary', "event_name = 'recommendation_feedback'", 'automatic_weight_updates', 'service_role']) {
  if (!sql.includes(marker)) throw new Error(`Intelligence SQL is missing ${marker}.`);
}
if (/grant execute on function public\.tasteprint_intelligence_summary\(text\) to (anon|authenticated)/i.test(sql)) {
  throw new Error('Intelligence aggregate must not be publicly executable.');
}

console.log(`Recommendation intelligence OK — ${moduleIds.length} modules, confidence + diversity + returning logic + structured feedback + sensitive-feature guardrails wired; weight changes remain manually gated.`);
