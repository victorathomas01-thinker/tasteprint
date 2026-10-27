import {recoverAuthSession} from './auth-session-core.js';
import {
  mergePassportHistories,
  remoteRowsToSnapshots,
  snapshotsToRemoteRows,
  syncSummary
} from './account-core.js';
import {
  AUTH_STORAGE_KEY,
  supabaseAuthClient as client
} from './supabase-auth.js';
import {
  SUPABASE_PUBLIC_ENABLED as REMOTE_ENABLED,
  SUPABASE_PUBLIC_KEY,
  SUPABASE_URL as SUPABASE_PUBLIC_URL
} from './supabase-public.js';

import { authenticatedSocialRequest } from './social-request.js';

const TABLE = 'tasteprint_passport_snapshots';
const PROFILE_MODE = new URL(location.href).searchParams.get('profile') === '1';

let session = null;
let actorEpoch = 0;
let destructiveOperation = null;
let authRevision = 0;
const route = new URL(location.href).searchParams;
const AUTO_SYNC_BLOCKED_ROUTE = route.has('updates') || route.has('saved') || route.has('plans') || route.has('friends') || (route.has('together') && route.has('connection')) || ['workspace','campaignAdmin','campaignReport','catalogTeam','catalogAdmin','companyAdmin','business','stats','growth'].some(key=>route.has(key));
const send = authenticatedSocialRequest({ url: SUPABASE_PUBLIC_URL, publicKey: SUPABASE_PUBLIC_KEY, getSession: async () => { const { data, error } = await client.auth.getSession(); if (error) throw error; return data.session; }, label: 'Passport operations' });
function operation() {
  const actor = session?.user?.id, epoch = actorEpoch;
  return { actor, current: () => Boolean(actor) && actor === session?.user?.id && epoch === actorEpoch };
}
function acceptSession(next) {
  if (session?.user?.id !== next?.user?.id) { actorEpoch++; syncPromise = null; destructiveOperation = null; clearTimeout(syncTimer); lastSync = null; lastSummary = null; }
  session = next || null;
}
let state = 'idle';
let message = '';
let lastSync = null;
let lastSummary = null;
let syncTimer = null;
let applyingRemote = false;
let syncPromise = null;
let confirmationTimer = null;

function passport() {
  return window.TasteprintPassport;
}

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatSyncTime(value) {
  if (!value) return 'Not synced yet';
  try {
    return `Last synced ${new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(value))}`;
  } catch {
    return 'Recently synced';
  }
}

function redirectURL() {
  const target = new URL(location.href);
  target.search = '?profile=1&auth=return';
  target.hash = '';
  return target.toString();
}

function dispatchState() {
  window.dispatchEvent(new CustomEvent('tasteprint:account-state', {
    detail: {
      remoteEnabled: REMOTE_ENABLED,
      signedIn: Boolean(session?.user),
      email: session?.user?.email || '',
      state,
      lastSync,
      summary: lastSummary
    }
  }));
}

function setState(next, nextMessage = '') {
  state = next;
  message = nextMessage;
  mount();
  dispatchState();
}

async function fetchRemoteHistory(op = operation()) {
  if (!client || !op.actor) return [];
  const data = await send(`${TABLE}?select=snapshot_version,module_id,created_at,source,archetype,mode,module_scores,master_scores,signature,client_key&user_id=eq.${encodeURIComponent(op.actor)}&order=created_at.asc&limit=120`, { method: 'GET', expectedActor: op.actor, guard: op.current });
  return remoteRowsToSnapshots(data || []);
}

function replaceLocalHistory(history) {
  if (!passport()?.replaceHistory) return false;
  applyingRemote = true;
  try {
    return passport().replaceHistory(history);
  } finally {
    applyingRemote = false;
  }
}

export async function syncPassport({ quiet = false } = {}) {
  if (!client || !session?.user || !passport()?.history) return null;
  if (destructiveOperation?.current()) return null;
  if (syncPromise) return syncPromise;

  const op = operation();
  const task = (async () => {
    if (!quiet) setState('syncing', 'Merging this browser with your synced Passport…');
    try {
      const remoteHistory = await fetchRemoteHistory(op);
      if (!op.current()) return null;
      const localHistory = passport().history();
      const summary = syncSummary(localHistory, remoteHistory);
      const merged = mergePassportHistories(localHistory, remoteHistory);
      const rows = snapshotsToRemoteRows(merged, op.actor);
      if (rows.length) await send(`${TABLE}?on_conflict=user_id,client_key`, { body: rows, headers: { Prefer: 'resolution=merge-duplicates' }, empty: true, expectedActor: op.actor, guard: op.current });
      await send('rpc/tasteprint_prune_my_passport', { body: { p_keep: 60 }, empty: true, expectedActor: op.actor, guard: op.current });
      if (!op.current()) return null;
      // A quiz completed during the upload must survive; schedule its own upload.
      const current = passport().history();
      const finalHistory = mergePassportHistories(current, remoteHistory);
      if (JSON.stringify(current) !== JSON.stringify(finalHistory)) replaceLocalHistory(finalHistory);
      if (JSON.stringify(current) !== JSON.stringify(localHistory)) scheduleSync();
      lastSync = new Date().toISOString();
      lastSummary = { ...summary, merged: finalHistory.length };
      setState('ready', `Synced ${finalHistory.length} Passport entries.`);
      return { history: finalHistory, summary: lastSummary };
    } catch {
      if (op.current()) setState('error', 'Could not sync Passport data. Your local Passport was kept unchanged.');
      return null;
    }
  })();
  syncPromise = task;
  try { return await task; } finally { if (syncPromise === task) syncPromise = null; }
}

function scheduleSync() {
  if (!session?.user || applyingRemote || AUTO_SYNC_BLOCKED_ROUTE) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => syncPassport({ quiet: true }), 700);
}

export async function sendMagicLink(email) {
  if (!client) throw new Error('Account sync is not configured in this build.');
  const value = String(email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(value) || value.length > 254) throw new Error('Enter a valid email address.');

  setState('sending', 'Sending a secure sign-in link…');
  const { error } = await client.auth.signInWithOtp({
    email: value,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: redirectURL()
    }
  });
  if (error) {
    setState('error', error.message || 'Could not send the sign-in link.');
    throw error;
  }
  setState('link-sent', 'Check your email. The one-time link will return you to your Passport.');
  return true;
}

export async function signOut() {
  if (!client) return false;
  actorEpoch++; syncPromise = null; clearTimeout(syncTimer);
  const logoutActor = session?.user?.id;
  setState('syncing', 'Signing out on this browser…');
  const { error } = await client.auth.signOut({ scope: 'local' });
  if (session?.user?.id && session.user.id !== logoutActor) return false;
  if (error) {
    setState('error', 'Could not sign out. Try again.');
    return false;
  }
  acceptSession(null);
  lastSync = null;
  lastSummary = null;
  setState('idle', 'Signed out. Your local Passport stays on this browser.');
  return true;
}

function preferenceOperation(active){if(import.meta.env?.VITE_PRIVATE_PREFERENCES_ENABLED==='true')window.dispatchEvent(new CustomEvent('tasteprint:passport-account-operation',{detail:{active}}));}

export async function clearSyncedPassport() {
  if (!client || !session?.user) return false;
  if (destructiveOperation?.current()) return false;
  const pending = syncPromise;
  const op = operation();
  // Let an already dispatched upload settle before issuing deletion.
  actorEpoch++; syncPromise = null; clearTimeout(syncTimer);
  const clearOp = operation();
  destructiveOperation = clearOp;
  preferenceOperation(true);
  setState('syncing', 'Clearing synced and local Passport history…');
  try {
    await pending;
    if (!clearOp.current()) return false;
    if(import.meta.env?.VITE_PRIVATE_PREFERENCES_ENABLED==='true'){const cleared=await send('rpc/tasteprint_clear_my_passport_content',{body:{},expectedActor:clearOp.actor,guard:clearOp.current});if(cleared!==true)throw Error('Clear not confirmed.');}
    else await send(`${TABLE}?user_id=eq.${encodeURIComponent(op.actor)}`, { method: 'DELETE', empty: true, expectedActor: clearOp.actor, guard: clearOp.current });
    if (!clearOp.current()) return false;
    applyingRemote = true;
    try { passport()?.clear?.(); } finally { applyingRemote = false; }
    lastSync = new Date().toISOString();
    lastSummary = { local: 0, remote: 0, merged: 0, uploaded: 0, downloaded: 0 };
    setState('ready', 'Synced and local Passport history cleared. '+(import.meta.env?.VITE_PRIVATE_PREFERENCES_ENABLED==='true'?'Private account choices erased too. ':'')+'Your account remains active.');
    return true;
  } catch {
    if (clearOp.current()) setState('error', 'Could not clear the synced Passport. Nothing was cleared locally.');
    return false;
  } finally { if (destructiveOperation === clearOp) destructiveOperation = null;preferenceOperation(false); }
}

export async function deleteAccount() {
  if (!client || !session?.access_token || destructiveOperation?.current()) return false;
  const pending = syncPromise;
  actorEpoch++; syncPromise = null; clearTimeout(syncTimer);
  const op = operation();
  destructiveOperation = op;
  preferenceOperation(true);
  setState('deleting', 'Deleting your optional account and synced Passport…');
  try {
    await pending;
    if (!op.current()) return false;
    await send('delete-account', { api: 'functions/v1', body: {}, empty: true, expectedActor: op.actor, guard: op.current });
    if (!op.current()) return false;
    applyingRemote = true;
    try { passport()?.clear?.(); } finally { applyingRemote = false; }
    // Do not call asynchronous SDK signOut here: it could sign out a new account.
    try { localStorage.removeItem(AUTH_STORAGE_KEY); } catch {}
    acceptSession(null);
    setState('idle', 'Account and synced Passport deleted. Reload before signing in again. Anonymous browser data is controlled separately in Privacy & data.');
    location.reload();
    return true;
  } catch (error) {
    if (op.current()) setState('error', error.code === 'workspace_ownership_exists'
      ? 'This account still owns a Campaign Workspace. Transfer ownership or delete that workspace first so Tasteprint does not orphan a team.'
      : 'Could not delete the account. Nothing was cleared locally so you can try again.');
    return false;
  } finally { if (destructiveOperation === op) destructiveOperation = null;preferenceOperation(false); }
}

function signedOutMarkup() {
  return `<section class="card account-card">
    <div class="account-head"><div><div class="eyebrow">Optional account sync</div><h2>Take your Passport with you.</h2></div><span class="account-pill">Optional</span></div>
    <p class="small">Tasteprint still works without an account. If you want cross-device history, enter an email and we will send a one-time sign-in link. No password wall before results.</p>
    <form class="account-form" data-account-form>
      <label><span>Email for Passport sync</span><input type="email" name="email" autocomplete="email" inputmode="email" maxlength="254" placeholder="you@example.com" required /></label>
      <button class="primary" type="submit" ${state === 'sending' ? 'disabled' : ''}>${state === 'sending' ? 'Sending…' : 'Email me a sign-in link'}</button>
    </form>
    <p class="small account-fineprint">The email belongs to your optional Supabase Auth account. It is not copied into anonymous Tasteprint analytics, result links, or campaign conversion events.</p>
    <p class="small account-status" role="status" aria-live="polite">${esc(message)}</p>
  </section>`;
}

function signedInMarkup() {
  const count = passport()?.history?.().length || 0;
  const summary = lastSummary;
  const syncDetail = summary
    ? `${summary.downloaded || 0} pulled from other devices · ${summary.uploaded || 0} new local entr${summary.uploaded === 1 ? 'y' : 'ies'} merged on the last sync.`
    : 'Local and cloud history merge by snapshot identity; the newest result from each module still gets one equal Passport vote.';

  return `<section class="card account-card account-signed-in">
    <div class="account-head"><div><div class="eyebrow">Passport sync · signed in</div><h2>${esc(session.user.email || 'Tasteprint account')}</h2></div><span class="account-pill account-pill-live">Synced</span></div>
    <div class="account-sync-stats"><div><strong>${count}</strong><span>local entries</span></div><div><strong>6</strong><span>supported modules</span></div></div>
    <p class="small">${esc(syncDetail)}</p>
    <div class="account-actions">
      <button class="secondary" type="button" data-account-sync ${state === 'syncing' ? 'disabled' : ''}>${state === 'syncing' ? 'Syncing…' : 'Sync now'}</button>
      <button class="secondary" type="button" data-account-signout>Sign out here</button>
    </div>
    <div class="account-subtle"><span>${esc(formatSyncTime(lastSync))}</span><span>Local-first: sign-out does not erase this browser's Passport.</span></div>
    <details class="account-danger-zone">
      <summary>Account data controls</summary>
      <p class="small">Clearing Passport removes the synced history and this browser's local copy but keeps your account. ${import.meta.env?.VITE_PRIVATE_PREFERENCES_ENABLED==='true'?'This also erases the private account choice copy. Other devices can retain local copies.':''} Deleting the account removes the Auth user and its synced Passport. Anonymous browser analytics are a separate data path controlled in Privacy & data. If this account owns a Campaign Workspace, transfer or delete that workspace first.</p>
      <div class="account-actions"><button class="secondary" type="button" data-account-clear>Clear synced + local Passport</button><button class="danger" type="button" data-account-delete>Delete account</button></div>
    </details>
    <p class="small account-status" role="status" aria-live="polite">${esc(message)}</p>
  </section>`;
}

function unavailableMarkup() {
  return `<section class="card account-card account-disabled">
    <div class="account-head"><div><div class="eyebrow">Optional account sync</div><h2>Local Passport is active.</h2></div><span class="account-pill">Not connected</span></div>
    <p class="small">The account-sync client is built, but this deployment has no Supabase project credentials yet. Nothing changes about local Passport behavior. Once the backend is activated, this card becomes passwordless cross-device sync.</p>
  </section>`;
}

function bindCard(card) {
  card.querySelector('[data-account-form]')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try { await sendMagicLink(form.get('email')); } catch {}
  });

  card.querySelector('[data-account-sync]')?.addEventListener('click', () => syncPassport());
  card.querySelector('[data-account-signout]')?.addEventListener('click', () => signOut());

  card.querySelector('[data-account-clear]')?.addEventListener('click', (event) => {
    const button = event.currentTarget;
    if (button.dataset.confirm !== '1') {
      button.dataset.confirm = '1';
      button.textContent = 'Click again to clear both copies';
      clearTimeout(confirmationTimer);
      confirmationTimer = setTimeout(() => {
        if (button.isConnected) {
          button.dataset.confirm = '0';
          button.textContent = 'Clear synced + local Passport';
        }
      }, 5000);
      return;
    }
    clearTimeout(confirmationTimer);
    clearSyncedPassport();
  });

  card.querySelector('[data-account-delete]')?.addEventListener('click', (event) => {
    const button = event.currentTarget;
    if (button.dataset.confirm !== '1') {
      button.dataset.confirm = '1';
      button.textContent = 'Click again to delete account';
      clearTimeout(confirmationTimer);
      confirmationTimer = setTimeout(() => {
        if (button.isConnected) {
          button.dataset.confirm = '0';
          button.textContent = 'Delete account';
        }
      }, 5000);
      return;
    }
    clearTimeout(confirmationTimer);
    deleteAccount();
  });
}

function mount() {
  if (!PROFILE_MODE) return;
  const grid = document.querySelector('.passport-grid');
  if (!grid) return;

  let host = grid.querySelector('.account-sync-host');
  if (!host) {
    host = document.createElement('div');
    host.className = 'account-sync-host';
    grid.appendChild(host);
  }

  const html = !REMOTE_ENABLED ? unavailableMarkup() : session?.user ? signedInMarkup() : signedOutMarkup();
  if (host.dataset.renderKey === `${REMOTE_ENABLED}:${session?.user?.id || 'out'}:${state}:${message}:${lastSync || ''}:${passport()?.history?.().length || 0}`) return;
  host.dataset.renderKey = `${REMOTE_ENABLED}:${session?.user?.id || 'out'}:${state}:${message}:${lastSync || ''}:${passport()?.history?.().length || 0}`;
  host.innerHTML = html;
  bindCard(host);
}

async function initialize() {
  if (!client) {
    setState('disabled');
    return;
  }

  client.auth.onAuthStateChange((event, nextSession) => {
    authRevision++;
    acceptSession(event === 'SIGNED_OUT' ? null : nextSession);
    if (event === 'SIGNED_OUT') setState('idle', 'Signed out. Your local Passport stays on this browser.');
    else {
      mount(); dispatchState();
      if (session?.user && !AUTO_SYNC_BLOCKED_ROUTE) scheduleSync();
    }
  });
  const revision = authRevision;
  try {
    const nextSession = await recoverAuthSession(client.auth);
    if (revision !== authRevision) return;
    acceptSession(nextSession);
    if (session?.user && !AUTO_SYNC_BLOCKED_ROUTE) scheduleSync();
    else setState('idle');
  } catch {
    if (revision === authRevision) setState('error', 'Account session could not be initialized. Local Passport still works normally.');
  }
}

window.addEventListener('tasteprint:passport-updated', () => {
  mount();
  scheduleSync();
});

const observer = new MutationObserver(() => mount());
observer.observe(document.querySelector('#app'), { childList: true, subtree: true });

window.TasteprintAccount = Object.freeze({
  remoteEnabled: () => REMOTE_ENABLED,
  signedIn: () => Boolean(session?.user),
  user: () => session?.user ? { id: session.user.id, email: session.user.email || '' } : null,
  state: () => ({ state, message, lastSync, summary: lastSummary }),
  sync: syncPassport,
  signInWithEmail: sendMagicLink,
  signOut,
  clearSyncedPassport,
  deleteAccount,
  remoteHistory: fetchRemoteHistory
});

mount();
initialize();
