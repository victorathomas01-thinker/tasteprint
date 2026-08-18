import { PLATFORM_HISTORY_LIMIT, sanitizeHistory } from './platform-core.js';

export const PASSPORT_SYNC_VERSION = 1;

function clean(value, max = 160) {
  return String(value ?? '').trim().slice(0, max);
}

export function passportClientKey(snapshot = {}) {
  const moduleId = clean(snapshot.module_id || snapshot.moduleId || 'unknown', 40).toLowerCase();
  const signature = clean(snapshot.signature, 160);
  if (signature) return `${moduleId}:${signature}`.slice(0, 220);

  const createdAt = clean(snapshot.created_at || snapshot.createdAt || 'unknown', 64);
  const archetype = clean(snapshot.archetype, 80);
  const mode = clean(snapshot.mode, 80);
  return `${moduleId}:${createdAt}:${archetype}:${mode}`.slice(0, 220);
}

export function mergePassportHistories(localHistory = [], remoteHistory = [], limit = PLATFORM_HISTORY_LIMIT) {
  const merged = new Map();
  const candidates = [...sanitizeHistory(localHistory), ...sanitizeHistory(remoteHistory)];

  for (const snapshot of candidates) {
    const key = passportClientKey(snapshot);
    const previous = merged.get(key);
    if (!previous) {
      merged.set(key, snapshot);
      continue;
    }

    const previousTime = new Date(previous.created_at || 0).getTime() || 0;
    const nextTime = new Date(snapshot.created_at || 0).getTime() || 0;
    if (nextTime >= previousTime) merged.set(key, snapshot);
  }

  return sanitizeHistory([...merged.values()]).slice(-Math.max(1, Number(limit) || PLATFORM_HISTORY_LIMIT));
}

export function snapshotsToRemoteRows(history = [], userId = '') {
  const user = clean(userId, 80);
  if (!user) return [];

  return sanitizeHistory(history).map((snapshot) => ({
    user_id: user,
    client_key: passportClientKey(snapshot),
    sync_version: PASSPORT_SYNC_VERSION,
    snapshot_version: Number(snapshot.version || 1),
    module_id: clean(snapshot.module_id, 40).toLowerCase(),
    created_at: snapshot.created_at,
    source: clean(snapshot.source || 'quiz', 60),
    archetype: clean(snapshot.archetype, 120),
    mode: clean(snapshot.mode, 120),
    module_scores: snapshot.module_scores || {},
    master_scores: snapshot.master_scores || {},
    signature: clean(snapshot.signature, 160)
  }));
}

export function remoteRowsToSnapshots(rows = []) {
  if (!Array.isArray(rows)) return [];
  return sanitizeHistory(rows.map((row) => ({
    version: Number(row.snapshot_version || 1),
    module_id: row.module_id,
    created_at: row.created_at,
    source: row.source || 'sync',
    archetype: row.archetype || '',
    mode: row.mode || '',
    module_scores: row.module_scores || {},
    master_scores: row.master_scores || {},
    signature: row.signature || ''
  })));
}

export function syncSummary(localHistory = [], remoteHistory = []) {
  const local = sanitizeHistory(localHistory);
  const remote = sanitizeHistory(remoteHistory);
  const merged = mergePassportHistories(local, remote);
  const localKeys = new Set(local.map(passportClientKey));
  const remoteKeys = new Set(remote.map(passportClientKey));
  const uploaded = merged.filter((item) => !remoteKeys.has(passportClientKey(item))).length;
  const downloaded = merged.filter((item) => !localKeys.has(passportClientKey(item))).length;
  return { local: local.length, remote: remote.length, merged: merged.length, uploaded, downloaded };
}
