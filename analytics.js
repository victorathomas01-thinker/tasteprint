import { ANALYTICS_VERSION, EVENTS, EVENT_NAMES } from './analytics-contract.js';

const LOCAL_EVENTS_KEY = 'tasteprint.events.v1';
const INSTALL_ID_KEY = 'tasteprint.install-id.v1';
const SESSION_ID_KEY = 'tasteprint.session-id.v1';
const REFERRAL_TOKEN_KEY = 'tasteprint.referral-token.v1';
const DELETE_TOKEN_KEY = 'tasteprint.delete-token.v1';
const MAX_LOCAL_EVENTS = 200;

const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '');
const REMOTE_ENABLED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

function randomId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return [...bytes].map((b, i) => `${[4,6,8,10].includes(i) ? '-' : ''}${b.toString(16).padStart(2, '0')}`).join('');
}

function shortToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return [...bytes].map((b) => b.toString(36).padStart(2, '0')).join('').slice(0, 24);
}

function getPersistentId(storage, key, factory = randomId) {
  try {
    let value = storage.getItem(key);
    if (!value) {
      value = factory();
      storage.setItem(key, value);
    }
    return value;
  } catch {
    return factory();
  }
}

function getReferralToken() {
  return getPersistentId(sessionStorage, REFERRAL_TOKEN_KEY, () => shortToken().slice(0, 12));
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

const installId = getPersistentId(localStorage, INSTALL_ID_KEY);
const sessionId = getPersistentId(sessionStorage, SESSION_ID_KEY);
const referralToken = getReferralToken();
const deletionToken = getPersistentId(localStorage, DELETE_TOKEN_KEY, shortToken);
const ownerHashPromise = sha256Hex(deletionToken);
const url = new URL(location.href);
const activeModule = url.searchParams.get('module')?.trim().toLowerCase() || 'escape';
const inboundReferral = url.searchParams.get('ref')?.slice(0, 64) || null;
const routeKind = (url.searchParams.has('challenge') || url.searchParams.has('c'))
  ? 'challenge'
  : (url.searchParams.has('result') || url.searchParams.has('p'))
    ? 'result'
    : 'standard';

function safeProperties(properties = {}) {
  const output = {};
  for (const [key, value] of Object.entries(properties)) {
    if (value === undefined || typeof value === 'function') continue;
    if (typeof value === 'string') output[key] = value.slice(0, 160);
    else if (typeof value === 'number' || typeof value === 'boolean' || value === null) output[key] = value;
    else if (Array.isArray(value)) output[key] = value.slice(0, 20);
    else if (typeof value === 'object') output[key] = value;
  }
  return output;
}

function readLocalEvents() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_EVENTS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalEvent(event) {
  try {
    const events = readLocalEvents();
    events.push(event);
    localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(events.slice(-MAX_LOCAL_EVENTS)));
  } catch {
    // Analytics should never block the product experience.
  }
}

async function request(path, { method = 'POST', body, prefer = 'return=minimal' } = {}) {
  if (!REMOTE_ENABLED) return { ok: false, data: null };
  try {
    const headers = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    };
    if (prefer) headers.Prefer = prefer;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    let data = null;
    const text = await response.text();
    if (text) {
      try { data = JSON.parse(text); } catch { data = text; }
    }
    return { ok: response.ok, data };
  } catch (error) {
    console.warn('Tasteprint data transport unavailable', error);
    return { ok: false, data: null };
  }
}

async function postRows(table, rows) {
  const result = await request(table, { body: rows, prefer: 'return=minimal' });
  return result.ok;
}

async function rpc(name, args = {}) {
  return request(`rpc/${name}`, { body: args, prefer: '' });
}

export async function track(name, properties = {}) {
  if (!EVENT_NAMES.includes(name)) {
    console.warn(`Unknown Tasteprint analytics event: ${name}`);
    return false;
  }

  const event = {
    id: randomId(),
    analytics_version: ANALYTICS_VERSION,
    created_at: new Date().toISOString(),
    event_name: name,
    session_id: sessionId,
    install_id: installId,
    owner_hash: await ownerHashPromise,
    referral_id: inboundReferral,
    route_kind: routeKind,
    properties: safeProperties({ module: activeModule, ...properties })
  };

  writeLocalEvent(event);
  window.dispatchEvent(new CustomEvent('tasteprint:analytics', { detail: event }));
  await postRows('tasteprint_events', [event]);
  return true;
}

export async function persistProfile({ scores, archetype, travelMode, source = 'quiz' }) {
  if (!scores || typeof scores !== 'object') return null;

  const profile = {
    id: randomId(),
    created_at: new Date().toISOString(),
    session_id: sessionId,
    install_id: installId,
    owner_hash: await ownerHashPromise,
    referral_id: inboundReferral,
    source,
    archetype: String(archetype || '').slice(0, 100),
    travel_mode: String(travelMode || '').slice(0, 100),
    scores
  };

  let shortCode = null;
  if (REMOTE_ENABLED) {
    const remote = await rpc('tasteprint_create_profile', {
      p_id: profile.id,
      p_session_id: profile.session_id,
      p_install_id: profile.install_id,
      p_owner_hash: profile.owner_hash,
      p_referral_id: profile.referral_id,
      p_source: profile.source,
      p_archetype: profile.archetype,
      p_travel_mode: profile.travel_mode,
      p_scores: profile.scores
    });
    if (remote.ok && remote.data && typeof remote.data === 'object') {
      shortCode = remote.data.short_code || null;
    }
  }

  window.dispatchEvent(new CustomEvent('tasteprint:profile-persisted', {
    detail: { id: profile.id, shortCode }
  }));

  return { id: profile.id, shortCode };
}

export async function resolveSharedProfile(shortCode) {
  const code = String(shortCode || '').trim().toLowerCase();
  if (!REMOTE_ENABLED || !/^[a-f0-9]{10}$/.test(code)) return null;
  const result = await rpc('tasteprint_shared_profile', { p_short_code: code });
  return result.ok ? result.data : null;
}

export async function deleteMyData() {
  if (!REMOTE_ENABLED) {
    clearLocalData();
    return { remote: false, deleted: true, profiles: 0, events: 0 };
  }

  const result = await rpc('tasteprint_delete_my_data', {
    p_install_id: installId,
    p_owner_token: deletionToken
  });

  if (!result.ok) return { remote: true, deleted: false };
  clearLocalData();
  return {
    remote: true,
    deleted: true,
    profiles: Number(result.data?.profiles || 0),
    events: Number(result.data?.events || 0)
  };
}

export function clearLocalEvents() {
  try { localStorage.removeItem(LOCAL_EVENTS_KEY); } catch {}
}

export function clearLocalData() {
  try {
    localStorage.removeItem(LOCAL_EVENTS_KEY);
    localStorage.removeItem(INSTALL_ID_KEY);
    localStorage.removeItem(DELETE_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_ID_KEY);
    sessionStorage.removeItem(REFERRAL_TOKEN_KEY);
  } catch {}
}

function textOf(selector, root = document) {
  return root.querySelector(selector)?.textContent?.trim() || '';
}

function currentStep() {
  const match = [...document.querySelectorAll('.small')]
    .map((node) => node.textContent || '')
    .find((text) => /Choice\s+\d+\s+of\s+\d+/i.test(text))
    ?.match(/Choice\s+(\d+)\s+of\s+(\d+)/i);
  return match ? { step: Number(match[1]), total: Number(match[2]) } : null;
}

const seen = new Set();
function once(key, callback) {
  if (seen.has(key)) return;
  seen.add(key);
  callback();
}

function inspectRenderedState() {
  // Escape has legacy result-link/profile persistence. Other modules emit their own module-aware analytics.
  if (activeModule !== 'escape') return;

  const soloStory = [...document.querySelectorAll('.story')].find((story) => !/together/i.test(textOf('.eyebrow', story)));
  if (soloStory) {
    const archetype = textOf('h2', soloStory);
    const travelMode = textOf('h3', soloStory);
    once(`result:${archetype}:${routeKind}`, async () => {
      await track(EVENTS.RESULT_VIEW, { archetype, travel_mode: travelMode, shared: routeKind === 'result' });

      if (routeKind !== 'result' && window.TasteprintLinks?.resultURL) {
        try {
          const result = new URL(window.TasteprintLinks.resultURL());
          const payload = result.searchParams.get('result');
          const scores = window.TasteprintLinks.decodeScores?.(payload);
          if (scores) {
            await persistProfile({ scores, archetype, travelMode, source: routeKind === 'challenge' ? 'challenge_recipient' : 'quiz' });
            await track(EVENTS.QUIZ_COMPLETE, { archetype, travel_mode: travelMode });
            if (routeKind === 'challenge') await track(EVENTS.CHALLENGE_COMPLETE, { archetype, travel_mode: travelMode });
          }
        } catch (error) {
          console.warn('Could not persist Tasteprint profile', error);
        }
      }
    });
  }

  const remoteMatch = document.querySelector('.remote-match');
  if (remoteMatch) {
    once('remote-match', () => track(EVENTS.REMOTE_MATCH_UNLOCK, {
      match: textOf('.remote-score', remoteMatch),
      pair_archetype: textOf('.remote-match-head .eyebrow', remoteMatch),
      destination: textOf('.remote-grid .card:nth-child(3) h3', remoteMatch)
    }));
  }
}

document.addEventListener('click', (event) => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (activeModule === 'escape' && action === 'start') track(EVENTS.QUIZ_START, { challenge: routeKind === 'challenge' });

  const option = activeModule === 'escape' ? event.target.closest('[data-option]') : null;
  if (option) {
    const step = currentStep();
    if (step) track(EVENTS.QUIZ_STEP, { step: step.step, total: step.total });
  }

  if (event.target.closest('.share-result')) track(EVENTS.STORY_SHARE);
  if (event.target.closest('.download-result')) track(EVENTS.STORY_DOWNLOAD);
  if (activeModule === 'escape' && event.target.closest('.copy-result')) track(EVENTS.RESULT_LINK_COPY);
  if (activeModule === 'escape' && event.target.closest('.send-challenge')) track(EVENTS.CHALLENGE_CREATE, { referral_token: referralToken });
}, true);

const observer = new MutationObserver(inspectRenderedState);
observer.observe(document.querySelector('#app'), { childList: true, subtree: true });

if (activeModule === 'escape' && routeKind === 'challenge') track(EVENTS.CHALLENGE_RECEIVE, { referral_id: inboundReferral });
track(EVENTS.PAGE_VIEW, { path: location.pathname, route_kind: routeKind, remote_enabled: REMOTE_ENABLED, module: activeModule });
inspectRenderedState();

window.TasteprintAnalytics = Object.freeze({
  track,
  persistProfile,
  resolveSharedProfile,
  deleteMyData,
  clearLocalEvents,
  clearLocalData,
  referralToken: () => referralToken,
  sessionId: () => sessionId,
  installId: () => installId,
  remoteEnabled: () => REMOTE_ENABLED,
  localEvents: () => readLocalEvents()
});
