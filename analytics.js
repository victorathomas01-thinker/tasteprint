import { ANALYTICS_VERSION, EVENTS, EVENT_NAMES } from './analytics-contract.js';

const LOCAL_EVENTS_KEY = 'tasteprint.events.v1';
const INSTALL_ID_KEY = 'tasteprint.install-id.v1';
const SESSION_ID_KEY = 'tasteprint.session-id.v1';
const REFERRAL_TOKEN_KEY = 'tasteprint.referral-token.v1';
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
  const bytes = crypto.getRandomValues(new Uint8Array(7));
  return [...bytes].map((b) => b.toString(36).padStart(2, '0')).join('').slice(0, 12);
}

function getPersistentId(storage, key) {
  try {
    let value = storage.getItem(key);
    if (!value) {
      value = randomId();
      storage.setItem(key, value);
    }
    return value;
  } catch {
    return randomId();
  }
}

function getReferralToken() {
  try {
    let value = sessionStorage.getItem(REFERRAL_TOKEN_KEY);
    if (!value) {
      value = shortToken();
      sessionStorage.setItem(REFERRAL_TOKEN_KEY, value);
    }
    return value;
  } catch {
    return shortToken();
  }
}

const installId = getPersistentId(localStorage, INSTALL_ID_KEY);
const sessionId = getPersistentId(sessionStorage, SESSION_ID_KEY);
const referralToken = getReferralToken();
const url = new URL(location.href);
const inboundReferral = url.searchParams.get('ref')?.slice(0, 64) || null;
const routeKind = url.searchParams.has('challenge') ? 'challenge' : url.searchParams.has('result') ? 'result' : 'standard';

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

async function postRows(table, rows) {
  if (!REMOTE_ENABLED) return false;
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(rows)
    });
    return response.ok;
  } catch (error) {
    console.warn('Tasteprint analytics transport unavailable', error);
    return false;
  }
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
    referral_id: inboundReferral,
    route_kind: routeKind,
    properties: safeProperties(properties)
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
    referral_id: inboundReferral,
    source,
    archetype: String(archetype || '').slice(0, 100),
    travel_mode: String(travelMode || '').slice(0, 100),
    scores
  };
  await postRows('tasteprint_profiles', [profile]);
  return profile.id;
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
  if (action === 'start') track(EVENTS.QUIZ_START, { challenge: routeKind === 'challenge' });

  const option = event.target.closest('[data-option]');
  if (option) {
    const step = currentStep();
    if (step) track(EVENTS.QUIZ_STEP, { step: step.step, total: step.total });
  }

  if (event.target.closest('.share-result')) track(EVENTS.STORY_SHARE);
  if (event.target.closest('.download-result')) track(EVENTS.STORY_DOWNLOAD);
  if (event.target.closest('.copy-result')) track(EVENTS.RESULT_LINK_COPY);
  if (event.target.closest('.send-challenge')) track(EVENTS.CHALLENGE_CREATE, { referral_token: referralToken });
}, true);

const observer = new MutationObserver(inspectRenderedState);
observer.observe(document.querySelector('#app'), { childList: true, subtree: true });

if (routeKind === 'challenge') track(EVENTS.CHALLENGE_RECEIVE, { referral_id: inboundReferral });
track(EVENTS.PAGE_VIEW, { path: location.pathname, route_kind: routeKind, remote_enabled: REMOTE_ENABLED });
inspectRenderedState();

window.TasteprintAnalytics = Object.freeze({
  track,
  persistProfile,
  referralToken: () => referralToken,
  sessionId: () => sessionId,
  installId: () => installId,
  remoteEnabled: () => REMOTE_ENABLED,
  localEvents: () => readLocalEvents(),
  clearLocalData: () => {
    localStorage.removeItem(LOCAL_EVENTS_KEY);
    localStorage.removeItem(INSTALL_ID_KEY);
  }
});
