import fs from 'node:fs';
import {
  mergePassportHistories,
  passportClientKey,
  remoteRowsToSnapshots,
  snapshotsToRemoteRows,
  syncSummary
} from '../account-core.js';

const snapshot = (moduleId, createdAt, signature, value) => ({
  version: 1,
  module_id: moduleId,
  created_at: createdAt,
  source: 'quiz',
  archetype: `${moduleId} archetype`,
  mode: `${moduleId} mode`,
  module_scores: { novelty: value },
  master_scores: { novelty: value, structure: 50, social: 50, aesthetic: 50, comfort: 50, energy: 50, serenity: 50, sentiment: 50, curiosity: 50, spontaneity: 50 },
  signature
});

const local = [
  snapshot('escape', '2026-01-01T00:00:00.000Z', 'escape-one', 70),
  snapshot('wear', '2026-02-01T00:00:00.000Z', 'wear-one', 80)
];
const remote = [
  snapshot('escape', '2026-01-01T00:00:00.000Z', 'escape-one', 70),
  snapshot('watch', '2026-03-01T00:00:00.000Z', 'watch-one', 65)
];

const merged = mergePassportHistories(local, remote);
if (merged.length !== 3) throw new Error('Account merge should union local and remote Passport snapshots without duplicating identical signatures.');
if (!merged.some((item) => item.module_id === 'watch')) throw new Error('Remote-only Passport entries must download into the merged history.');
if (!merged.some((item) => item.module_id === 'wear')) throw new Error('Local-only Passport entries must remain available for upload.');

const summary = syncSummary(local, remote);
if (summary.uploaded !== 1 || summary.downloaded !== 1 || summary.merged !== 3) throw new Error('Sync summary is not describing the bidirectional merge correctly.');

const userId = '11111111-1111-4111-8111-111111111111';
const rows = snapshotsToRemoteRows(merged, userId);
if (rows.length !== 3 || rows.some((row) => row.user_id !== userId)) throw new Error('Passport rows must be scoped to the authenticated user.');
if (!rows.every((row) => row.client_key === passportClientKey(remoteRowsToSnapshots([row])[0]))) throw new Error('Remote Passport rows must round-trip to stable client keys.');
if (rows.some((row) => 'email' in row || 'install_id' in row || 'owner_hash' in row || 'answers' in row)) throw new Error('Synced Passport rows must not mix account data with anonymous identifiers or raw answers.');

const platformCore = fs.readFileSync(new URL('../platform-core.js', import.meta.url), 'utf8');
for (const marker of ["{ id: 'escape'", "{ id: 'wear'", "{ id: 'watch'", "{ id: 'move'", "{ id: 'eat'", "{ id: 'live'"]) {
  if (!platformCore.includes(marker)) throw new Error(`Account sync expects the six-module registry marker ${marker}.`);
}

const index = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
for (const asset of ['account.css', 'account-sync.js']) {
  if (!index.includes(asset)) throw new Error(`index.html is not loading ${asset}.`);
}

const runtime = fs.readFileSync(new URL('../account-sync.js', import.meta.url), 'utf8');
for (const marker of ['signInWithOtp', 'emailRedirectTo', 'tasteprint_passport_snapshots', 'tasteprint_prune_my_passport', 'scope: \'local\'', 'delete-account', 'tasteprint:passport-updated']) {
  if (!runtime.includes(marker)) throw new Error(`Account runtime is missing ${marker}.`);
}
if (/TasteprintAnalytics\?\.track|\.track\(/.test(runtime)) throw new Error('Account email/auth actions must stay out of anonymous Tasteprint analytics.');

const sql = fs.readFileSync(new URL('../supabase/passport-sync.sql', import.meta.url), 'utf8');
for (const marker of ['tasteprint_passport_snapshots', 'references auth.users(id) on delete cascade', 'enable row level security', 'auth.uid()', 'to authenticated', 'tasteprint_prune_my_passport']) {
  if (!sql.toLowerCase().includes(marker.toLowerCase())) throw new Error(`Passport sync SQL is missing ${marker}.`);
}
if (/\bemail\s+text\b/i.test(sql)) throw new Error('Passport sync table should not duplicate Auth email addresses.');

const deletion = fs.readFileSync(new URL('../supabase/functions/delete-account/index.ts', import.meta.url), 'utf8');
for (const marker of ['SUPABASE_SERVICE_ROLE_KEY', 'auth.getUser(token)', 'auth.admin.deleteUser', 'authorization']) {
  if (!deletion.includes(marker)) throw new Error(`Account deletion Edge Function is missing ${marker}.`);
}

const platform = fs.readFileSync(new URL('../platform.js', import.meta.url), 'utf8');
if (!platform.includes('replaceHistory')) throw new Error('Passport runtime must expose a sanitized replaceHistory hook for account merges.');

console.log('Account sync OK — local/cloud merge, six-domain persistence, RLS schema, passwordless auth client and account deletion boundary wired.');
