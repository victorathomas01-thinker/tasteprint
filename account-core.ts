import { PLATFORM_HISTORY_LIMIT, sanitizeHistory } from './platform-core.js';

export const PASSPORT_SYNC_VERSION = 1;

export interface PassportSnapshot {
  version: number;
  module_id: string;
  created_at: string;
  source: string;
  archetype: string;
  mode: string;
  // Legacy exports may contain arrays; runtime sanitization remains authoritative.
  module_scores: object;
  master_scores: Record<string, number>;
  signature: string;
}

export interface PassportRemoteRow extends Omit<PassportSnapshot, 'version'> {
  user_id: string;
  client_key: string;
  sync_version: number;
  snapshot_version: number;
}

export interface SyncSummary {
  local: number;
  remote: number;
  merged: number;
  uploaded: number;
  downloaded: number;
}

type SnapshotKeyInput = {
  [key in 'module_id' | 'moduleId' | 'signature' | 'created_at' | 'createdAt' | 'archetype' | 'mode']?: unknown;
};

function clean(value: unknown, max = 160): string {
  return String(value ?? '').trim().slice(0, max);
}

export function passportClientKey(snapshot: SnapshotKeyInput = {}): string {
  const moduleId = clean(snapshot.module_id || snapshot.moduleId || 'unknown', 40).toLowerCase();
  const signature = clean(snapshot.signature, 160);
  if (signature) return `${moduleId}:${signature}`.slice(0, 220);

  const createdAt = clean(snapshot.created_at || snapshot.createdAt || 'unknown', 64);
  const archetype = clean(snapshot.archetype, 80);
  const mode = clean(snapshot.mode, 80);
  return `${moduleId}:${createdAt}:${archetype}:${mode}`.slice(0, 220);
}

export function mergePassportHistories(localHistory: unknown = [], remoteHistory: unknown = [], limit = PLATFORM_HISTORY_LIMIT): PassportSnapshot[] {
  const merged = new Map<string, PassportSnapshot>();
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

export function snapshotsToRemoteRows(history: unknown = [], userId: unknown = ''): PassportRemoteRow[] {
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

export function remoteRowsToSnapshots(rows: unknown = []): PassportSnapshot[] {
  if (!Array.isArray(rows)) return [];
  const records = rows.filter((row): row is Record<string, unknown> => row !== null && typeof row === 'object' && !Array.isArray(row));
  return sanitizeHistory(records.map((row) => ({
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

export function syncSummary(localHistory: unknown = [], remoteHistory: unknown = []): SyncSummary {
  const local = sanitizeHistory(localHistory);
  const remote = sanitizeHistory(remoteHistory);
  const merged = mergePassportHistories(local, remote);
  const localKeys = new Set(local.map(passportClientKey));
  const remoteKeys = new Set(remote.map(passportClientKey));
  const uploaded = merged.filter((item) => !remoteKeys.has(passportClientKey(item))).length;
  const downloaded = merged.filter((item) => !localKeys.has(passportClientKey(item))).length;
  return { local: local.length, remote: remote.length, merged: merged.length, uploaded, downloaded };
}
