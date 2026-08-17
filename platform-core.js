export const PLATFORM_VERSION = 1;
export const PLATFORM_HISTORY_LIMIT = 60;

export const MASTER_DIMENSIONS = Object.freeze([
  'novelty',
  'structure',
  'social',
  'aesthetic',
  'comfort',
  'energy',
  'serenity',
  'sentiment',
  'curiosity',
  'spontaneity'
]);

export const MASTER_DIMENSION_COPY = Object.freeze({
  novelty: ['Familiar', 'Novel', 'Novelty'],
  structure: ['Flexible', 'Structured', 'Structure'],
  social: ['Private', 'Social', 'Social energy'],
  aesthetic: ['Practical', 'Aesthetic', 'Aesthetic sensitivity'],
  comfort: ['Rugged', 'Comfort-led', 'Comfort'],
  energy: ['Low-key', 'High-energy', 'Energy'],
  serenity: ['Stimulating', 'Restorative', 'Serenity'],
  sentiment: ['Matter-of-fact', 'Sentimental', 'Sentiment'],
  curiosity: ['Familiar-depth', 'Curiosity-led', 'Curiosity'],
  spontaneity: ['Planned', 'Spontaneous', 'Spontaneity']
});

export const MODULES = Object.freeze([
  { id: 'escape', icon: '✈️', name: 'Escape', status: 'live', copy: 'Travel, atmosphere, pace, comfort and how you want a trip to feel.' },
  { id: 'wear', icon: '🧥', name: 'Wear', status: 'planned', copy: 'Personal style, silhouettes, polish, risk and what you actually reach for.' },
  { id: 'watch', icon: '🎬', name: 'Watch', status: 'planned', copy: 'Stories, pacing, tone, worlds and the kind of entertainment that sticks.' },
  { id: 'move', icon: '🏋️', name: 'Move', status: 'planned', copy: 'Training style, structure, competition, intensity and how you like to progress.' },
  { id: 'eat', icon: '🍜', name: 'Eat', status: 'planned', copy: 'Flavor, novelty, ritual, indulgence and what makes a meal feel worth it.' },
  { id: 'live', icon: '🏡', name: 'Live', status: 'planned', copy: 'Home, city, rhythm, social density and the environment that fits you.' }
]);

const MODULE_MAPPINGS = Object.freeze({
  escape: Object.freeze({
    novelty: 'novelty',
    structure: 'structure',
    social: 'social',
    aesthetic: 'aesthetic',
    comfort: 'comfort',
    energy: 'activity',
    serenity: 'serenity',
    sentiment: 'romance',
    curiosity: 'culture',
    spontaneity: 'spontaneity'
  })
});

const clamp = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

export function normalizeScores(scores, dimensions = MASTER_DIMENSIONS) {
  return Object.fromEntries(dimensions.map((key) => [key, clamp(scores?.[key] ?? 50)]));
}

export function mapModuleScores(moduleId, scores) {
  const mapping = MODULE_MAPPINGS[moduleId];
  if (!mapping) return normalizeScores(scores);
  return Object.fromEntries(MASTER_DIMENSIONS.map((key) => [key, clamp(scores?.[mapping[key]] ?? 50)]));
}

export function makeSnapshot({ moduleId, scores, archetype = '', mode = '', source = 'quiz', createdAt = new Date().toISOString(), signature = '' }) {
  const id = String(moduleId || '').trim().toLowerCase();
  if (!MODULES.some((module) => module.id === id)) throw new Error(`Unknown Tasteprint module: ${id || '(empty)'}`);
  return {
    version: PLATFORM_VERSION,
    module_id: id,
    created_at: createdAt,
    source: String(source || 'quiz').slice(0, 60),
    archetype: String(archetype || '').slice(0, 120),
    mode: String(mode || '').slice(0, 120),
    module_scores: { ...scores },
    master_scores: mapModuleScores(id, scores),
    signature: String(signature || '').slice(0, 160)
  };
}

export function sanitizeHistory(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === 'object' && MODULES.some((module) => module.id === item.module_id))
    .map((item) => ({
      version: Number(item.version || PLATFORM_VERSION),
      module_id: item.module_id,
      created_at: item.created_at || new Date(0).toISOString(),
      source: String(item.source || 'quiz').slice(0, 60),
      archetype: String(item.archetype || '').slice(0, 120),
      mode: String(item.mode || '').slice(0, 120),
      module_scores: item.module_scores && typeof item.module_scores === 'object' ? item.module_scores : {},
      master_scores: normalizeScores(item.master_scores || mapModuleScores(item.module_id, item.module_scores || {})),
      signature: String(item.signature || '').slice(0, 160)
    }))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .slice(-PLATFORM_HISTORY_LIMIT);
}

export function addSnapshot(history, snapshot) {
  const current = sanitizeHistory(history);
  const last = current.at(-1);
  if (snapshot.signature && last?.signature === snapshot.signature && last?.module_id === snapshot.module_id) return current;
  return sanitizeHistory([...current, snapshot]);
}

export function latestByModule(history) {
  const latest = new Map();
  for (const snapshot of sanitizeHistory(history)) latest.set(snapshot.module_id, snapshot);
  return latest;
}

export function aggregateMaster(history) {
  const latest = [...latestByModule(history).values()];
  if (!latest.length) return { scores: normalizeScores({}), modules: 0, moduleIds: [] };
  const scores = {};
  for (const key of MASTER_DIMENSIONS) {
    scores[key] = Math.round(latest.reduce((sum, snapshot) => sum + (snapshot.master_scores?.[key] ?? 50), 0) / latest.length);
  }
  return { scores: normalizeScores(scores), modules: latest.length, moduleIds: latest.map((item) => item.module_id) };
}

export function masterBadges(master, { crossModuleOnly = false } = {}) {
  const scores = normalizeScores(master?.scores || master || {});
  const coverage = Number(master?.modules || 1);
  if (crossModuleOnly && coverage < 2) return [];

  const candidates = [
    ['🧭', 'Novelty Magnet', scores.novelty],
    ['🎨', 'Aesthetic First', scores.aesthetic],
    ['🫧', 'Soft-Life Bias', Math.round((scores.comfort + scores.serenity) / 2)],
    ['🧠', 'Curious by Default', scores.curiosity],
    ['⚡', 'High-Energy Taste', scores.energy],
    ['💫', 'Sentimental Lens', scores.sentiment],
    ['🎲', 'Freeform Instinct', scores.spontaneity],
    ['🗓️', 'Needs an Anchor', scores.structure]
  ].filter(([, , score]) => score >= 72);

  if (scores.social <= 32 && scores.serenity >= 68) candidates.push(['🌙', 'Low-Noise Loyalist', Math.round((100 - scores.social + scores.serenity) / 2)]);
  if (scores.novelty >= 72 && scores.structure >= 64) candidates.push(['🗺️', 'Structured Explorer', Math.round((scores.novelty + scores.structure) / 2)]);

  return candidates.sort((a, b) => b[2] - a[2]).slice(0, 4).map(([icon, label]) => ({ icon, label }));
}

export function masterTitle(master) {
  const scores = normalizeScores(master?.scores || master || {});
  const ranked = MASTER_DIMENSIONS
    .map((key) => ({ key, distance: Math.abs(scores[key] - 50), value: scores[key] }))
    .sort((a, b) => b.distance - a.distance);
  const primary = ranked[0];
  const secondary = ranked.find((entry) => entry.key !== primary.key && entry.distance >= 12) || ranked[1];

  const words = {
    novelty: ['Familiar', 'Explorer'],
    structure: ['Freeform', 'Planner'],
    social: ['Private', 'Social'],
    aesthetic: ['Practical', 'Aesthetic'],
    comfort: ['Rugged', 'Comfort-led'],
    energy: ['Low-key', 'High-energy'],
    serenity: ['Stimulus-seeking', 'Restorative'],
    sentiment: ['Grounded', 'Sentimental'],
    curiosity: ['Selective', 'Curious'],
    spontaneity: ['Anchored', 'Spontaneous']
  };
  const word = (entry) => words[entry.key][entry.value >= 50 ? 1 : 0];
  return `${word(primary)} ${word(secondary)}`;
}

export function changeSummary(history, moduleId = 'escape') {
  const matches = sanitizeHistory(history).filter((snapshot) => snapshot.module_id === moduleId);
  if (matches.length < 2) {
    return {
      kind: 'new',
      title: 'Your baseline is saved.',
      detail: 'Take this module again later and Tasteprint can show what actually moved.'
    };
  }

  const previous = matches.at(-2);
  const current = matches.at(-1);
  const diffs = MASTER_DIMENSIONS
    .map((key) => ({ key, delta: (current.master_scores?.[key] ?? 50) - (previous.master_scores?.[key] ?? 50) }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const biggest = diffs[0];
  const label = MASTER_DIMENSION_COPY[biggest.key][2];

  if (Math.abs(biggest.delta) < 5) {
    return {
      kind: 'stable',
      title: 'Pretty stable.',
      detail: 'Your strongest preferences barely moved from your previous result.'
    };
  }

  const direction = biggest.delta > 0 ? 'more' : 'less';
  return {
    kind: biggest.delta > 0 ? 'up' : 'down',
    title: `${direction === 'more' ? 'More' : 'Less'} ${label.toLowerCase()} than last time.`,
    detail: `${label} moved ${Math.abs(biggest.delta)} points. This is a comparison between your own results, not a population claim.`,
    key: biggest.key,
    delta: biggest.delta
  };
}

export function moduleProgress(history) {
  const latest = latestByModule(history);
  return MODULES.map((module) => ({ ...module, completed: latest.has(module.id), latest: latest.get(module.id) || null }));
}
