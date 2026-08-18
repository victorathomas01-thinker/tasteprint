import {
  MASTER_DIMENSIONS,
  MASTER_DIMENSION_COPY,
  MODULES,
  addSnapshot,
  aggregateMaster,
  changeSummary,
  crossModuleBadges,
  makeSnapshot,
  masterBadges,
  masterTitle,
  moduleProgress,
  sanitizeHistory
} from './platform-core.js';

const HISTORY_KEY = 'tasteprint.platform-history.v1';
const params = new URL(location.href).searchParams;
const PROFILE_MODE = params.get('profile') === '1';
const MODULE_MODE = params.get('modules') === '1';
const ACTIVE_MODULE = params.get('module')?.trim().toLowerCase() || 'escape';
const app = document.querySelector('#app');
let lastRecordedSignature = '';

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function readHistory() {
  try {
    return sanitizeHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'));
  } catch {
    return [];
  }
}

function writeHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(sanitizeHistory(history)));
    window.dispatchEvent(new CustomEvent('tasteprint:passport-updated'));
    return true;
  } catch {
    return false;
  }
}

function replaceHistory(history) {
  return writeHistory(sanitizeHistory(history));
}

function clearHistory() {
  try { localStorage.removeItem(HISTORY_KEY); } catch {}
  window.dispatchEvent(new CustomEvent('tasteprint:passport-updated'));
}

function downloadPassport() {
  const history = readHistory();
  const payload = {
    exported_at: new Date().toISOString(),
    note: 'Tasteprint Passport export from this browser. No raw answer selections are included.',
    master: aggregateMaster(history),
    history
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = 'tasteprint-passport.json';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}

function textOf(selector, root = document) {
  return root.querySelector(selector)?.textContent?.trim() || '';
}

function soloStory() {
  return [...document.querySelectorAll('.story')].find((story) => !/together/i.test(textOf('.eyebrow', story))) || null;
}

function sourceLabel() {
  const campaignId = params.get('campaign')?.trim().toLowerCase();
  if (campaignId) return `campaign:${campaignId}`;
  if (params.has('challenge') || params.has('c')) return 'challenge';
  return 'quiz';
}

function deriveEscapeSnapshot() {
  if (ACTIVE_MODULE !== 'escape' || params.has('result') || params.has('p') || PROFILE_MODE || MODULE_MODE) return null;
  const story = soloStory();
  if (!story || !window.TasteprintLinks?.resultURL || !window.TasteprintLinks?.decodeScores) return null;

  try {
    const resultURL = new URL(window.TasteprintLinks.resultURL());
    const payload = resultURL.searchParams.get('result');
    const scores = window.TasteprintLinks.decodeScores(payload);
    if (!scores) return null;
    const archetype = textOf('h2', story);
    const mode = textOf('h3', story).replace(/^\S+\s+/, '').trim() || textOf('h3', story);
    const signature = `escape:${payload}:${archetype}:${mode}`;
    return makeSnapshot({
      moduleId: 'escape',
      scores,
      archetype,
      mode,
      source: sourceLabel(),
      signature
    });
  } catch {
    return null;
  }
}

function storeSnapshot(snapshot) {
  if (!snapshot) return false;
  const history = readHistory();
  const next = addSnapshot(history, snapshot);
  if (next.length === history.length && next.at(-1)?.signature === history.at(-1)?.signature) return false;
  writeHistory(next);
  return true;
}

function recordModule(detail = {}) {
  try {
    const snapshot = makeSnapshot({
      moduleId: detail.moduleId,
      scores: detail.scores,
      archetype: detail.archetype,
      mode: detail.mode,
      source: detail.source || 'quiz',
      signature: detail.signature || ''
    });
    return storeSnapshot(snapshot);
  } catch (error) {
    console.warn('Could not add module result to Tasteprint Passport', error);
    return false;
  }
}

function recordRenderedResult() {
  const snapshot = deriveEscapeSnapshot();
  if (!snapshot || snapshot.signature === lastRecordedSignature) return;
  lastRecordedSignature = snapshot.signature;
  storeSnapshot(snapshot);
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Saved result';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function masterBars(master) {
  return MASTER_DIMENSIONS.map((key) => {
    const [left, right, label] = MASTER_DIMENSION_COPY[key];
    const value = master.scores[key];
    return `<div class="passport-axis">
      <div class="passport-axis-head"><strong>${esc(label)}</strong><span>${value}</span></div>
      <div class="passport-axis-labels"><span>${esc(left)}</span><span>${esc(right)}</span></div>
      <div class="passport-track"><div class="passport-track-fill" style="width:${value}%"></div><span class="passport-marker" style="left:${value}%"></span></div>
    </div>`;
  }).join('');
}

function moduleHref(moduleId) {
  if (moduleId === 'escape') return '?';
  return `?module=${encodeURIComponent(moduleId)}`;
}

function modulesMarkup(history) {
  return moduleProgress(history).map((module) => {
    const latest = module.latest;
    const action = module.status === 'live'
      ? `<a class="${latest ? 'secondary' : 'primary'}" href="${moduleHref(module.id)}">${latest ? `Retake ${esc(module.name)}` : `Take ${esc(module.name)}`}</a>`
      : '<span class="passport-soon">Planned</span>';
    return `<article class="card passport-module ${module.completed ? 'completed' : ''}">
      <div class="passport-module-icon">${module.icon}</div>
      <div class="eyebrow">Tasteprint · ${esc(module.name)}</div>
      <h3>${esc(module.name)}</h3>
      <p class="small">${esc(module.copy)}</p>
      ${latest ? `<div class="passport-module-result"><strong>${esc(latest.archetype || latest.mode || 'Completed')}</strong><span>${esc(formatDate(latest.created_at))}</span></div>` : ''}
      <div class="passport-module-action">${action}</div>
    </article>`;
  }).join('');
}

function historyMarkup(history) {
  if (!history.length) return '<p class="small">No saved module results yet.</p>';
  return [...history].reverse().slice(0, 12).map((item) => {
    const module = MODULES.find((entry) => entry.id === item.module_id);
    return `<div class="passport-history-row">
      <span class="passport-history-icon">${module?.icon || '•'}</span>
      <div><strong>${esc(item.archetype || item.mode || module?.name || item.module_id)}</strong><div class="small">${esc(module?.name || item.module_id)} · ${esc(item.mode || 'Saved profile')}</div></div>
      <time>${esc(formatDate(item.created_at))}</time>
    </div>`;
  }).join('');
}

function renderPassport() {
  const history = readHistory();
  const master = aggregateMaster(history);
  const badges = masterBadges(master);
  const crossBadges = crossModuleBadges(history);
  const latestModuleId = history.at(-1)?.module_id || 'escape';
  const latestModule = MODULES.find((module) => module.id === latestModuleId);
  const changes = changeSummary(history, latestModuleId);
  const coverage = master.modules;
  const accountSignedIn = Boolean(window.TasteprintAccount?.signedIn?.());
  document.title = 'My Tasteprint Passport';

  app.innerHTML = `<section class="panel pad passport-view">
    <div class="passport-hero">
      <div>
        <div class="eyebrow">Tasteprint Passport · local first</div>
        <h1>Your tastes should become more useful every time you answer.</h1>
        <p class="lede">Passport sits above individual modules. It keeps your latest results on this device, translates them into a shared taste map, and remembers how your preferences change. Optional account sync can merge the same history across devices without making signup a prerequisite.</p>
      </div>
      <a class="secondary" href="?modules=1">Explore modules</a>
    </div>

    ${history.length ? `<div class="passport-master">
      <div class="passport-master-copy">
        <div class="eyebrow">Current master pattern</div>
        <h2>${esc(masterTitle(master))}</h2>
        <p class="small">Built from ${coverage} of ${MODULES.length} modules. ${coverage < 2 ? 'This is provisional while only one module is represented.' : coverage === MODULES.length ? 'All six original domains are represented, with one equal vote each.' : 'Each completed module gets one equal vote, so one category cannot overpower the others.'}</p>
        <div class="badges">${badges.map((badge) => `<span class="badge">${badge.icon} ${esc(badge.label)}</span>`).join('')}</div>
        ${crossBadges.length ? `<div class="passport-cross"><div class="eyebrow">Cross-module badges</div><div class="badges">${crossBadges.map((badge) => `<span class="badge passport-cross-badge">${badge.icon} ${esc(badge.label)}</span>`).join('')}</div><p class="small">These unlock only when the same pattern appears across at least two different modules.</p></div>` : ''}
      </div>
      <div class="passport-change card">
        <div class="eyebrow">What changed? · ${esc(latestModule?.name || latestModuleId)}</div>
        <h3>${esc(changes.title)}</h3>
        <p class="small">${esc(changes.detail)}</p>
      </div>
    </div>
    <div class="passport-axis-grid">${masterBars(master)}</div>` : `<div class="callout passport-empty"><div class="eyebrow">No passport yet</div><h2>One module can create your first entry.</h2><p class="small">Finish any Tasteprint module once. Your result is saved locally and becomes the first piece of your master Tasteprint.</p><div class="row"><a class="primary" href="?">Start Escape</a><a class="secondary" href="?module=wear">Start Wear</a><a class="secondary" href="?module=watch">Start Watch</a><a class="secondary" href="?module=move">Start Move</a><a class="secondary" href="?module=eat">Start Eat</a><a class="secondary" href="?module=live">Start Live</a></div></div>`}

    <div class="passport-section-head"><div><div class="eyebrow">Modules</div><h2>One identity, different decisions.</h2></div><span class="badge">${coverage}/${MODULES.length} completed</span></div>
    <div class="passport-module-grid">${modulesMarkup(history)}</div>

    <div class="passport-grid">
      <section class="card passport-history"><div class="eyebrow">Preference history</div><h2>Your recent Tasteprints</h2><div>${historyMarkup(history)}</div></section>
      <section class="callout passport-privacy"><div class="eyebrow">Local first</div><h2>${accountSignedIn ? 'This browser is one synced copy.' : 'No account required.'}</h2><p class="small">${accountSignedIn ? 'Your Passport still has a local copy here. Signed-in sync merges it with your account-backed history; signing out does not erase this browser.' : 'Passport works entirely in this browser. If account sync is configured, you can opt in below after you have already received value from the product.'}</p><div class="row"><button class="secondary" data-passport-export>Export Passport</button>${history.length && !accountSignedIn ? '<button class="danger" data-passport-clear>Clear local Passport</button>' : ''}</div><p class="small passport-status" role="status" aria-live="polite"></p></section>
    </div>
  </section>`;

  app.querySelector('[data-passport-export]')?.addEventListener('click', () => {
    downloadPassport();
    const status = app.querySelector('.passport-status');
    if (status) status.textContent = 'Passport exported as JSON.';
  });

  app.querySelector('[data-passport-clear]')?.addEventListener('click', (event) => {
    const button = event.currentTarget;
    if (button.dataset.confirm !== '1') {
      button.dataset.confirm = '1';
      button.textContent = 'Click again to clear';
      const status = app.querySelector('.passport-status');
      if (status) status.textContent = 'This clears only the local Passport history on this browser.';
      setTimeout(() => {
        if (button.isConnected) {
          button.dataset.confirm = '0';
          button.textContent = 'Clear local Passport';
        }
      }, 5000);
      return;
    }
    clearHistory();
    renderPassport();
  });
}

function renderModuleHub() {
  const history = readHistory();
  const coverage = aggregateMaster(history).modules;
  const liveCount = MODULES.filter((module) => module.status === 'live').length;
  document.title = 'Tasteprint Modules';
  app.innerHTML = `<section class="panel pad passport-view">
    <div class="passport-hero"><div><div class="eyebrow">Tasteprint modules</div><h1>Different questions. One growing map of your taste.</h1><p class="lede">Escape, Wear, Watch, Move, Eat and Live are all live. Each domain keeps its own language, then contributes one equal vote to the shared Tasteprint Passport.</p></div><a class="secondary" href="?profile=1">My Passport</a></div>
    <div class="passport-module-grid">${modulesMarkup(history)}</div>
    <div class="callout" style="margin-top:22px"><strong>${coverage}/${MODULES.length} modules represented in your Passport · ${liveCount} live.</strong><p class="small">Complete all six to build the full original Tasteprint map. Retakes update that domain's latest vote without giving it extra weight.</p></div>
  </section>`;
}

function injectPassportNav() {
  if (PROFILE_MODE || MODULE_MODE || params.get('campaignAdmin') === '1' || params.has('campaignReport') || params.get('stats') === '1') return;
  if (document.querySelector('.passport-trigger')) return;
  const anchor = document.createElement('a');
  anchor.className = 'passport-trigger';
  anchor.href = '?profile=1';
  const count = aggregateMaster(readHistory()).modules;
  anchor.innerHTML = `<span aria-hidden="true">◎</span> My Tasteprint${count ? `<b>${count}</b>` : ''}`;
  document.body.appendChild(anchor);
}

window.addEventListener('tasteprint:module-complete', (event) => recordModule(event.detail));

if (PROFILE_MODE) renderPassport();
else if (MODULE_MODE) renderModuleHub();
else {
  const observer = new MutationObserver(() => {
    recordRenderedResult();
    injectPassportNav();
  });
  observer.observe(app, { childList: true, subtree: true });
  recordRenderedResult();
  injectPassportNav();
}

window.addEventListener('tasteprint:passport-updated', () => {
  if (PROFILE_MODE) renderPassport();
});
window.addEventListener('tasteprint:account-state', () => {
  if (PROFILE_MODE) renderPassport();
});

window.TasteprintPassport = Object.freeze({
  history: () => readHistory(),
  master: () => aggregateMaster(readHistory()),
  recordModule,
  replaceHistory,
  clear: clearHistory,
  export: downloadPassport,
  storageKey: HISTORY_KEY
});
