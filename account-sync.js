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
  supabasePublicURL
} from './supabase-public.js';

const TABLE = 'tasteprint_passport_snapshots';
const PROFILE_MODE = new URL(location.href).searchParams.get('profile') === '1';

let session = null;
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

async function fetchRemoteHistory() {
  if (!client || !session?.user) return [];
  const { data, error } = await client
    .from(TABLE)
    .select('snapshot_version,module_id,created_at,source,archetype,mode,module_scores,master_scores,signature,client_key')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: true })
    .limit(120);
  if (error) throw error;
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
  if (syncPromise) return syncPromise;

  syncPromise = (async () => {
    if (!quiet) setState('syncing', 'Merging this browser with your synced Passport…');
    try {
      const localHistory = passport().history();
      const remoteHistory = await fetchRemoteHistory();
      const summary = syncSummary(localHistory, remoteHistory);
      const merged = mergePassportHistories(localHistory, remoteHistory);
      const rows = snapshotsToRemoteRows(merged, session.user.id);

      if (rows.length) {
        const { error: upsertError } = await client
          .from(TABLE)
          .upsert(rows, { onConflict: 'user_id,client_key' });
        if (upsertError) throw upsertError;
      }

      const { error: pruneError } = await client.rpc('tasteprint_prune_my_passport', { p_keep: 60 });
      if (pruneError) throw pruneError;

      if (JSON.stringify(localHistory) !== JSON.stringify(merged)) replaceLocalHistory(merged);
      lastSync = new Date().toISOString();
      lastSummary = { ...summary, merged: merged.length };
      setState('ready', merged.length
        ? `Synced ${merged.length} Passport entr${merged.length === 1 ? 'y' : 'ies'}.`
        : 'Your account is ready. Complete a module and it will sync here.');
      return { history: merged, summary: lastSummary };
    } catch (error) {
      console.warn('Tasteprint Passport sync failed', error);
      setState('error', 'Could not sync Passport data. Your local Passport was kept unchanged.');
      return null;
    } finally {
      syncPromise = null;
    }
  })();

  return syncPromise;
}

function scheduleSync() {
  if (!session?.user || applyingRemote) return;
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
  setState('syncing', 'Signing out on this browser…');
  const { error } = await client.auth.signOut({ scope: 'local' });
  if (error) {
    setState('error', 'Could not sign out. Try again.');
    return false;
  }
  session = null;
  lastSync = null;
  lastSummary = null;
  setState('idle', 'Signed out. Your local Passport stays on this browser.');
  return true;
}

export async function clearSyncedPassport() {
  if (!client || !session?.user) return false;
  setState('syncing', 'Clearing synced and local Passport history…');
  const { error } = await client.from(TABLE).delete().eq('user_id', session.user.id);
  if (error) {
    setState('error', 'Could not clear the synced Passport. Nothing was cleared locally.');
    return false;
  }

  applyingRemote = true;
  try { passport()?.clear?.(); } finally { applyingRemote = false; }
  lastSync = new Date().toISOString();
  lastSummary = { local: 0, remote: 0, merged: 0, uploaded: 0, downloaded: 0 };
  setState('ready', 'Synced and local Passport history cleared. Your account remains active.');
  return true;
}

export async function deleteAccount() {
  if (!client || !session?.access_token) return false;
  setState('deleting', 'Deleting your optional account and synced Passport…');

  try {
    const response = await fetch(supabasePublicURL('functions/v1/delete-account'), {
      method: 'POST',
      headers: {
        apikey: SUPABASE_PUBLIC_KEY,
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: '{}'
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 409 && payload?.error === 'workspace_ownership_exists') {
        setState('error', 'This account still owns a Campaign Workspace. Transfer ownership or delete that workspace first so Tasteprint does not orphan a team.');
        return false;
      }
      throw new Error(payload?.message || 'Account deletion endpoint rejected the request.');
    }

    applyingRemote = true;
    try { passport()?.clear?.(); } finally { applyingRemote = false; }
    try { await client.auth.signOut({ scope: 'local' }); } catch {}
    try { localStorage.removeItem(AUTH_STORAGE_KEY); } catch {}
    session = null;
    lastSync = null;
    lastSummary = null;
    setState('idle', 'Account and synced Passport deleted. Anonymous browser data is controlled separately in Privacy & data.');
    return true;
  } catch (error) {
    console.warn('Tasteprint account deletion failed', error);
    setState('error', 'Could not delete the account. Nothing was cleared locally so you can try again.');
    return false;
  }
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
      <p class="small">Clearing Passport removes the synced history and this browser's local copy but keeps your account. Deleting the account removes the Auth user and its synced Passport. Anonymous browser analytics are a separate data path controlled in Privacy & data. If this account owns a Campaign Workspace, transfer or delete that workspace first.</p>
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

  try {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    session = data.session || null;
    if (session?.user) await syncPassport({ quiet: true });
    else setState('idle');
  } catch (error) {
    console.warn('Tasteprint account session initialization failed', error);
    setState('error', 'Account session could not be initialized. Local Passport still works normally.');
  }

  client.auth.onAuthStateChange((event, nextSession) => {
    session = nextSession || null;
    if (event === 'SIGNED_IN' && session?.user) {
      setTimeout(() => syncPassport({ quiet: true }), 0);
    } else if (event === 'SIGNED_OUT') {
      lastSync = null;
      lastSummary = null;
      setState('idle', 'Signed out. Your local Passport stays on this browser.');
    } else {
      mount();
      dispatchState();
    }
  });
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
