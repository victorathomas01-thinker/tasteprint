import { recommendationId } from './intelligence-core.js';

export const NEXT_MOVES_VERSION = 1;
export const NEXT_MOVE_STATUSES = Object.freeze(['saved', 'trying', 'done', 'dismissed']);
export const NEXT_MOVES_LIMIT = 30;

const clean = (value, max = 180) => String(value ?? '').trim().slice(0, max);
const cleanStatus = (value) => NEXT_MOVE_STATUSES.includes(value) ? value : 'saved';

export function nextMoveId(moduleId, resultKey, recommendation) {
  const module = clean(moduleId, 40).toLowerCase();
  const result = clean(resultKey, 180) || 'result';
  const recommendationKey = clean(recommendation, 80) || 'recommendation';
  let hash = 2166136261;
  const input = `${module}|${result}|${recommendationKey}`;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${module}-${(hash >>> 0).toString(36)}`;
}

export function sanitizeNextMove(value = {}) {
  const module = clean(value.module, 40).toLowerCase();
  const recommendation = clean(value.recommendation_id || value.recommendationId, 80);
  const resultKey = clean(value.result_key || value.resultKey, 180);
  if (!module || !recommendation || !resultKey) return null;
  return {
    version: NEXT_MOVES_VERSION,
    id: clean(value.id, 100) || nextMoveId(module, resultKey, recommendation),
    module,
    result_key: resultKey,
    recommendation_id: recommendation,
    name: clean(value.name, 120),
    icon: clean(value.icon, 12),
    copy: clean(value.copy, 260),
    status: cleanStatus(value.status),
    created_at: clean(value.created_at || value.createdAt, 48) || new Date().toISOString(),
    updated_at: clean(value.updated_at || value.updatedAt, 48) || new Date().toISOString()
  };
}

export function moveFromFeedback(record = {}, moduleConfig = {}) {
  const selected = clean(record.selected_recommendation, 80);
  if (!selected || !record.result_key || !record.module) return null;
  const mode = (moduleConfig.modes || []).find((item) => recommendationId(item) === selected);
  if (!mode) return null;
  return sanitizeNextMove({
    module: record.module,
    result_key: record.result_key,
    recommendation_id: selected,
    name: mode.name,
    icon: mode.icon,
    copy: mode.copy,
    status: 'saved'
  });
}

export function normalizeNextMoves(values = []) {
  const map = new Map();
  for (const value of Array.isArray(values) ? values : []) {
    const move = sanitizeNextMove(value);
    if (!move) continue;
    const existing = map.get(move.id);
    if (!existing || String(move.updated_at).localeCompare(String(existing.updated_at)) >= 0) map.set(move.id, move);
  }
  return [...map.values()]
    .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
    .slice(-NEXT_MOVES_LIMIT);
}

export function upsertNextMove(values = [], nextValue = {}) {
  const next = sanitizeNextMove(nextValue);
  const current = normalizeNextMoves(values);
  if (!next) return current;

  // One active decision per module keeps the feature useful instead of becoming another
  // backlog. Older active ideas from the same domain become dismissed, but completed
  // history is preserved.
  const updated = current.map((item) => {
    if (item.module !== next.module || item.id === next.id || !['saved', 'trying'].includes(item.status)) return item;
    return { ...item, status: 'dismissed', updated_at: new Date().toISOString() };
  });
  const index = updated.findIndex((item) => item.id === next.id);
  if (index >= 0) {
    updated[index] = {
      ...updated[index],
      ...next,
      status: ['done', 'dismissed'].includes(updated[index].status) ? 'saved' : updated[index].status,
      updated_at: new Date().toISOString()
    };
  } else {
    updated.push(next);
  }
  return normalizeNextMoves(updated);
}

export function transitionNextMove(values = [], id, status) {
  const nextStatus = cleanStatus(status);
  const now = new Date().toISOString();
  return normalizeNextMoves(values).map((item) => item.id === id
    ? { ...item, status: nextStatus, updated_at: now }
    : item);
}

export function activeNextMoves(values = []) {
  return normalizeNextMoves(values).filter((item) => ['saved', 'trying'].includes(item.status));
}

export function nextMoveSummary(values = []) {
  const all = normalizeNextMoves(values);
  return {
    total: all.length,
    active: all.filter((item) => ['saved', 'trying'].includes(item.status)).length,
    trying: all.filter((item) => item.status === 'trying').length,
    done: all.filter((item) => item.status === 'done').length,
    dismissed: all.filter((item) => item.status === 'dismissed').length,
    modules: [...new Set(all.filter((item) => ['saved', 'trying'].includes(item.status)).map((item) => item.module))]
  };
}
