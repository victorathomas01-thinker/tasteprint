export const INTELLIGENCE_VERSION = 1;
export const INTELLIGENCE_FEEDBACK_MINIMUM = 50;

export const FEEDBACK_SCALE = Object.freeze([
  Object.freeze({ value: 4, key: 'nailed', label: 'Nailed it' }),
  Object.freeze({ value: 3, key: 'mostly', label: 'Mostly me' }),
  Object.freeze({ value: 2, key: 'mixed', label: 'Mixed' }),
  Object.freeze({ value: 1, key: 'missed', label: 'Missed me' })
]);

export const SENSITIVE_ATTRIBUTE_TERMS = Object.freeze([
  'age',
  'race',
  'ethnicity',
  'religion',
  'sex',
  'gender',
  'sexuality',
  'orientation',
  'disability',
  'health',
  'medical',
  'pregnancy',
  'income',
  'politics',
  'precise_location',
  'zipcode',
  'postal_code',
  'biometric',
  'contacts'
]);

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));
const clamp01 = (value) => clamp(value, 0, 1);
const cleanText = (value, max = 160) => String(value ?? '').trim().slice(0, max);

export function vectorDistance(scores = {}, vector = {}, dimensions = []) {
  if (!dimensions.length) return 100;
  const meanSquared = dimensions.reduce((sum, key) => {
    const a = clamp(scores?.[key] ?? 50);
    const b = clamp(vector?.[key] ?? 50);
    return sum + (a - b) ** 2;
  }, 0) / dimensions.length;
  return Math.sqrt(meanSquared);
}

export function rankByFit(scores, items = [], dimensions = []) {
  return items
    .map((item, index) => ({ item, index, distance: vectorDistance(scores, item?.vector || {}, dimensions) }))
    .sort((a, b) => a.distance - b.distance || a.index - b.index);
}

export function stableResultKey(snapshot = {}) {
  const signature = cleanText(snapshot.signature, 180);
  if (signature) return signature;
  return [
    cleanText(snapshot.module_id || snapshot.moduleId, 40),
    cleanText(snapshot.created_at || snapshot.createdAt, 48),
    cleanText(snapshot.archetype, 80),
    cleanText(snapshot.mode, 80)
  ].join(':');
}

export function sanitizeScoreVector(scores = {}, dimensions = []) {
  return Object.fromEntries(dimensions.map((key) => [key, Math.round(clamp(scores?.[key] ?? 50))]));
}

function averageAbsoluteDifference(a = {}, b = {}, dimensions = []) {
  if (!dimensions.length) return 0;
  return dimensions.reduce((sum, key) => sum + Math.abs(clamp(a?.[key] ?? 50) - clamp(b?.[key] ?? 50)), 0) / dimensions.length;
}

export function experienceState(history = [], moduleId, currentKey = '') {
  const cleanModule = cleanText(moduleId, 40).toLowerCase();
  const prior = (Array.isArray(history) ? history : [])
    .filter((item) => item && typeof item === 'object')
    .filter((item) => !currentKey || stableResultKey(item) !== currentKey);
  const sameModule = prior.filter((item) => cleanText(item.module_id || item.moduleId, 40).toLowerCase() === cleanModule);

  const kind = sameModule.length
    ? 'module_returning'
    : prior.length
      ? 'cross_domain_returning'
      : 'cold_start';

  return {
    kind,
    returning: kind !== 'cold_start',
    priorPlatformCount: prior.length,
    priorModuleCount: sameModule.length,
    previousModule: sameModule.at(-1) || null
  };
}

export function recommendationProfile(scores, dimensions, experience) {
  const current = sanitizeScoreVector(scores, dimensions);
  const previous = experience?.previousModule?.module_scores;
  if (!previous || typeof previous !== 'object') return current;

  // Retakes use the current result as the dominant signal while carrying a small amount
  // of the user's immediately previous module result into recommendation ranking only.
  // Archetype/result scoring itself is never rewritten by this function.
  return Object.fromEntries(dimensions.map((key) => [
    key,
    Math.round(clamp(current[key] * 0.82 + clamp(previous[key] ?? 50) * 0.18))
  ]));
}

export function confidenceModel({ scores, dimensions, archetypes, history = [], moduleId, currentKey = '' }) {
  const cleanScores = sanitizeScoreVector(scores, dimensions);
  const ranked = rankByFit(cleanScores, archetypes, dimensions);
  const first = ranked[0];
  const second = ranked[1] || first;
  const separationRatio = first && second
    ? Math.max(0, second.distance - first.distance) / Math.max(second.distance, 1)
    : 0;
  const separation = clamp01(separationRatio / 0.16);
  const signal = clamp01(
    dimensions.reduce((sum, key) => sum + Math.abs(cleanScores[key] - 50), 0)
      / Math.max(dimensions.length * 24, 1)
  );

  const experience = experienceState(history, moduleId, currentKey);
  const priorScores = experience.previousModule?.module_scores;
  const stability = priorScores
    ? clamp01(1 - averageAbsoluteDifference(cleanScores, priorScores, dimensions) / 32)
    : null;

  const raw = Math.round(clamp(
    34 + separation * 38 + signal * 18 + (stability === null ? 5 : stability * 10),
    0,
    100
  ));

  let level = 'Blended read';
  if (raw >= 86) level = 'Very clear read';
  else if (raw >= 70) level = 'Clear read';
  else if (raw >= 55) level = 'Moderate read';

  const reasons = [];
  if (separation < 0.35) reasons.push('Your two closest archetypes are fairly close together.');
  else if (separation > 0.72) reasons.push('One archetype separates cleanly from the nearest alternative.');
  else reasons.push('There is a lead archetype, with a meaningful nearby alternative.');

  if (signal < 0.35) reasons.push('Several dimensions stayed near the middle, so this result has more room to move.');
  else if (signal > 0.72) reasons.push('Your choices created several strong directional signals.');
  else reasons.push('Your profile mixes a few strong pulls with several flexible ones.');

  if (stability !== null) {
    if (stability >= 0.72) reasons.push('Your latest retake is broadly consistent with your previous result in this module.');
    else if (stability <= 0.4) reasons.push('This retake moved meaningfully from your previous result, so recommendations should stay flexible.');
    else reasons.push('Your previous result agrees on some preferences and moved on others.');
  }

  return {
    raw,
    level,
    separation,
    separationRatio,
    signal,
    stability,
    experience,
    reasons,
    nearest: ranked.slice(0, 2).map((entry) => ({
      name: cleanText(entry.item?.name, 100),
      distance: entry.distance
    })),
    scope: 'Model-fit confidence only. It is not confidence about a person, diagnosis, or population percentile.'
  };
}

function itemName(item) {
  return cleanText(item?.name || item?.id || 'mode', 100);
}

export function recommendationId(item) {
  return itemName(item)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'mode';
}

export function diverseModeSet({ scores, dimensions, modes, history = [], moduleId, currentKey = '', count = 3 }) {
  const experience = experienceState(history, moduleId, currentKey);
  const effectiveScores = recommendationProfile(scores, dimensions, experience);
  const ranked = rankByFit(effectiveScores, modes, dimensions);
  if (!ranked.length) return { experience, effectiveScores, recommendations: [] };

  const diversityWeight = experience.kind === 'module_returning'
    ? 0.3
    : experience.kind === 'cross_domain_returning'
      ? 0.23
      : 0.16;

  const selected = [ranked[0]];
  const pool = ranked.slice(1);
  while (selected.length < Math.min(count, ranked.length) && pool.length) {
    let winnerIndex = 0;
    let winnerScore = -Infinity;

    pool.forEach((candidate, index) => {
      const relevance = 1 - clamp01(candidate.distance / 100);
      const vector = candidate.item?.vector || {};
      const nearestSelectedDistance = Math.min(...selected.map((entry) => vectorDistance(vector, entry.item?.vector || {}, dimensions)));
      const diversity = clamp01(nearestSelectedDistance / 60);
      const originalRank = ranked.findIndex((entry) => entry.item === candidate.item);
      const rankPenalty = Math.max(0, originalRank - 5) * 0.025;
      const score = relevance * (1 - diversityWeight) + diversity * diversityWeight - rankPenalty;
      if (score > winnerScore) {
        winnerScore = score;
        winnerIndex = index;
      }
    });

    selected.push(pool.splice(winnerIndex, 1)[0]);
  }

  const labels = ['Best fit', 'Same energy', experience.returning ? 'Fresh lane' : 'Curveball lane'];
  return {
    experience,
    effectiveScores,
    diversityWeight,
    recommendations: selected.map((entry, index) => ({
      id: recommendationId(entry.item),
      label: labels[index] || `Option ${index + 1}`,
      name: itemName(entry.item),
      icon: cleanText(entry.item?.icon, 12),
      copy: cleanText(entry.item?.copy, 220),
      distance: entry.distance,
      sourceRank: ranked.findIndex((candidate) => candidate.item === entry.item) + 1
    }))
  };
}

export function topAdjustmentDimensions(scores, dimensions, limit = 3) {
  const cleanScores = sanitizeScoreVector(scores, dimensions);
  return dimensions
    .map((key) => ({ key, value: cleanScores[key], strength: Math.abs(cleanScores[key] - 50) }))
    .sort((a, b) => b.strength - a.strength || a.key.localeCompare(b.key))
    .slice(0, Math.max(1, limit));
}

export function containsSensitiveKey(value) {
  if (!value || typeof value !== 'object') return false;
  const stack = [value];
  while (stack.length) {
    const current = stack.pop();
    for (const [key, child] of Object.entries(current)) {
      const normalized = key.toLowerCase().replace(/[^a-z0-9_]+/g, '_');
      if (SENSITIVE_ATTRIBUTE_TERMS.some((term) => normalized === term || normalized.includes(`${term}_`) || normalized.includes(`_${term}`))) return true;
      if (child && typeof child === 'object') stack.push(child);
    }
  }
  return false;
}

export function buildLearningRecord(input = {}, dimensions = []) {
  const rating = Number(input.rating);
  const stage = ['rating', 'adjustment', 'lane'].includes(input.stage) ? input.stage : 'rating';
  const direction = ['higher', 'lower'].includes(input.mismatchDirection) ? input.mismatchDirection : null;
  const mismatchDimension = dimensions.includes(input.mismatchDimension) ? input.mismatchDimension : null;
  const confidenceLevel = ['Blended read', 'Moderate read', 'Clear read', 'Very clear read'].includes(input.confidenceLevel)
    ? input.confidenceLevel
    : 'Blended read';
  const experienceMode = ['cold_start', 'cross_domain_returning', 'module_returning'].includes(input.experienceMode)
    ? input.experienceMode
    : 'cold_start';

  const record = {
    intelligence_version: INTELLIGENCE_VERSION,
    created_at: cleanText(input.createdAt || new Date().toISOString(), 48),
    result_key: cleanText(input.resultKey, 180),
    module: cleanText(input.module, 40).toLowerCase(),
    stage,
    rating: Number.isInteger(rating) && rating >= 1 && rating <= 4 ? rating : null,
    archetype: cleanText(input.archetype, 100),
    mode: cleanText(input.mode, 100),
    confidence_level: confidenceLevel,
    experience_mode: experienceMode,
    mismatch_dimension: mismatchDimension,
    mismatch_direction: direction,
    selected_recommendation: cleanText(input.selectedRecommendation, 80) || null,
    recommendation_ids: Array.isArray(input.recommendationIds)
      ? input.recommendationIds.map((value) => cleanText(value, 80)).filter(Boolean).slice(0, 5)
      : [],
    module_scores: sanitizeScoreVector(input.scores, dimensions)
  };

  // The record is built from a fixed allowlist. Arbitrary input keys, free text, identity
  // fields and demographic/sensitive attributes are intentionally ignored.
  return record;
}

export function feedbackSummary(records = [], { minimum = INTELLIGENCE_FEEDBACK_MINIMUM } = {}) {
  const finalByResult = new Map();
  for (const record of Array.isArray(records) ? records : []) {
    if (!record || typeof record !== 'object') continue;
    const rating = Number(record.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 4) continue;
    const key = cleanText(record.result_key, 180) || `${cleanText(record.module, 40)}:${finalByResult.size}`;
    finalByResult.set(key, record);
  }

  const rows = [...finalByResult.values()];
  const distribution = Object.fromEntries(FEEDBACK_SCALE.map((item) => [item.key, 0]));
  const mismatch = {};
  let total = 0;
  for (const row of rows) {
    total += Number(row.rating);
    const scale = FEEDBACK_SCALE.find((item) => item.value === Number(row.rating));
    if (scale) distribution[scale.key] += 1;
    if (row.mismatch_dimension && row.mismatch_direction) {
      const key = `${row.mismatch_dimension}:${row.mismatch_direction}`;
      mismatch[key] = (mismatch[key] || 0) + 1;
    }
  }

  return {
    sample_size: rows.length,
    minimum,
    learning_ready: rows.length >= minimum,
    average_rating: rows.length ? Math.round((total / rows.length) * 100) / 100 : null,
    distribution,
    mismatch
  };
}

export function learningReview(records = [], { minimum = INTELLIGENCE_FEEDBACK_MINIMUM } = {}) {
  const summary = feedbackSummary(records, { minimum });
  if (!summary.learning_ready) {
    return {
      available: false,
      ...summary,
      note: 'Collect more real structured feedback before proposing scoring changes.'
    };
  }

  const pressure = {};
  for (const [key, count] of Object.entries(summary.mismatch)) {
    const [dimension, direction] = key.split(':');
    pressure[dimension] ||= { higher: 0, lower: 0 };
    pressure[dimension][direction] += count;
  }

  return {
    available: true,
    ...summary,
    pressure,
    note: 'These are review signals, not automatic weight updates. Any scoring change should be versioned, simulated, and manually approved.'
  };
}
