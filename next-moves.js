import { intelligenceModule } from './intelligence-registry.js';
import {
  activeNextMoves,
  moveFromFeedback,
  nextMoveSummary,
  normalizeNextMoves,
  transitionNextMove,
  upsertNextMove
} from './next-moves-core.js';

const STORAGE_KEY = 'tasteprint.next-moves.v1';
const params = new URL(location.href).searchParams;
const NEXT_MODE = params.get('next') === '1';
const app = document.querySelector('#app');

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function readMoves() {
  try {
    return normalizeNextMoves(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  } catch {
    return [];
  }
}

function writeMoves(values) {
  const moves = normalizeNextMoves(values);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(moves)); } catch {}
  window.dispatchEvent(new CustomEvent('tasteprint:next-moves', { detail: { summary: nextMoveSummary(moves) } }));
  return moves;
}

function clearMoves() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  window.dispatchEvent(new CustomEvent('tasteprint:next-moves', { detail: { summary: nextMoveSummary([]) } }));
  if (NEXT_MODE) render();
}

function saveFromLatestFeedback() {
  const records = window.TasteprintIntelligence?.localFeedback?.() || [];
  const record = [...records].reverse().find((item) => item?.selected_recommendation && item?.module);
  if (!record) return null;
  const config = intelligenceModule(record.module);
  if (!config) return null;
  const move = moveFromFeedback(record, config);
  if (!move) return null;
  const before = readMoves();
  const after = writeMoves(upsertNextMove(before, move));
  return after.find((item) => item.id === move.id) || move;
}

function statusCopy(status) {
  if (status === 'trying') return 'Trying';
  if (status === 'done') return 'Done';
  if (status === 'dismissed') return 'Not now';
  return 'Saved';
}

function moduleLabel(module) {
  return intelligenceModule(module)?.name || module;
}

function moveCard(move, active = true) {
  return `<article class="card next-move-card ${active ? '' : 'is-history'}">
    <div class="row spread">
      <div><div class="eyebrow">${esc(moduleLabel(move.module))} · ${esc(statusCopy(move.status))}</div><h2>${esc(move.icon)} ${esc(move.name)}</h2></div>
      <span class="next-move-state">${esc(statusCopy(move.status))}</span>
    </div>
    <p class="small">${esc(move.copy || 'A direction you marked as worth trying.')}</p>
    ${active ? `<div class="next-move-actions">
      ${move.status === 'saved' ? `<button class="primary" type="button" data-move-status="trying" data-move-id="${esc(move.id)}">I’m trying this</button>` : ''}
      <button class="secondary" type="button" data-move-status="done" data-move-id="${esc(move.id)}">Done</button>
      <button class="secondary" type="button" data-move-status="dismissed" data-move-id="${esc(move.id)}">Not for now</button>
    </div>` : ''}
  </article>`;
}

function render() {
  if (!NEXT_MODE) return;
  document.title = 'Tasteprint · Next Moves';
  const moves = readMoves();
  const active = activeNextMoves(moves);
  const history = moves.filter((item) => !['saved', 'trying'].includes(item.status)).slice(-8).reverse();
  const summary = nextMoveSummary(moves);
  const focus = active.find((item) => item.status === 'trying') || active[0] || null;

  app.innerHTML = `<section class="panel pad next-moves-shell">
    <div class="next-moves-hero">
      <div><div class="eyebrow">Tasteprint · Next Moves</div><h1>Your Tasteprint should help you decide, not just describe you.</h1><p class="lede">When you mark a recommendation lane as something you would actually try, Tasteprint keeps one current move per domain. That turns a fun result into a lightweight decision memory instead of another personality card you forget tomorrow.</p></div>
      <div class="row"><a class="secondary" href="?profile=1">My Passport</a><a class="secondary" href="?modules=1">All modules</a></div>
    </div>

    ${focus ? `<div class="callout next-focus"><div class="eyebrow">One thing to do next</div><h2>${esc(focus.icon)} ${esc(focus.name)}</h2><p class="small">${esc(focus.copy)}</p><p class="small">You do not need to act on every recommendation. One current experiment is more useful than a giant aspirational backlog.</p></div>` : `<div class="callout next-focus"><div class="eyebrow">Nothing queued yet</div><h2>Take a module, then mark one lane you would actually try.</h2><p class="small">Tasteprint will save that choice here locally. No signup required.</p><div class="row" style="margin-top:12px"><a class="primary" href="?modules=1">Pick a module</a></div></div>`}

    <div class="grid-3 next-move-stats"><div class="card"><div class="eyebrow">Active</div><h2>${summary.active}</h2><p class="small">At most one current move per domain.</p></div><div class="card"><div class="eyebrow">Trying</div><h2>${summary.trying}</h2><p class="small">Ideas you moved from interesting to real.</p></div><div class="card"><div class="eyebrow">Completed</div><h2>${summary.done}</h2><p class="small">A simple record of what actually made it into your life.</p></div></div>

    <section class="next-moves-section"><div class="row spread"><div><div class="eyebrow">Current</div><h2>Small experiments</h2></div><span class="small">Stored only on this browser for now.</span></div><div class="next-moves-grid">${active.length ? active.map((item) => moveCard(item, true)).join('') : '<p class="small">No active moves yet.</p>'}</div></section>

    ${history.length ? `<details class="next-moves-history"><summary>Recent finished / dismissed ideas</summary><div class="next-moves-grid">${history.map((item) => moveCard(item, false)).join('')}</div></details>` : ''}

    <div class="callout next-moves-privacy"><strong>Why this is local-first</strong><p class="small">Next Moves stores only the recommendation you deliberately marked, its module/result key, and a status such as Saved/Trying/Done. There is no free-text diary, location history, contact list, account email or demographic profile.</p>${moves.length ? '<button class="secondary" type="button" data-clear-moves>Clear Next Moves</button>' : ''}</div>
    <p class="small" data-next-status role="status" aria-live="polite"></p>
  </section>`;

  app.querySelectorAll('[data-move-status]').forEach((button) => {
    button.addEventListener('click', () => {
      const next = transitionNextMove(readMoves(), button.dataset.moveId, button.dataset.moveStatus);
      writeMoves(next);
      render();
      const node = document.querySelector('[data-next-status]');
      if (node) node.textContent = button.dataset.moveStatus === 'done' ? 'Marked done.' : button.dataset.moveStatus === 'trying' ? 'Moved into “trying.”' : 'Moved out of your active list.';
    });
  });
  app.querySelector('[data-clear-moves]')?.addEventListener('click', (event) => {
    const button = event.currentTarget;
    if (button.dataset.confirm !== '1') {
      button.dataset.confirm = '1';
      button.textContent = 'Click again to clear';
      setTimeout(() => {
        if (button.isConnected) {
          button.dataset.confirm = '0';
          button.textContent = 'Clear Next Moves';
        }
      }, 4500);
      return;
    }
    clearMoves();
  });
}

function addShortcut() {
  if (NEXT_MODE) return;
  const summary = nextMoveSummary(readMoves());
  const intelligence = document.querySelector('.intelligence-panel');
  if (intelligence && !intelligence.querySelector('.next-moves-link')) {
    const link = document.createElement('a');
    link.className = 'secondary next-moves-link';
    link.href = '?next=1';
    link.textContent = summary.active ? `Next Moves · ${summary.active}` : 'Next Moves';
    const status = intelligence.querySelector('.intelligence-status');
    (status?.parentElement || intelligence).appendChild(link);
  }

  const passport = document.querySelector('.passport-grid');
  if (passport && !passport.querySelector('[data-next-moves-card]')) {
    const card = document.createElement('section');
    card.className = 'card';
    card.dataset.nextMovesCard = '1';
    card.innerHTML = `<div class="eyebrow">Next Moves</div><h3>${summary.active ? `${summary.active} idea${summary.active === 1 ? '' : 's'} worth trying` : 'Turn results into action'}</h3><p class="small">Keep one current recommendation per domain instead of collecting endless possibilities.</p><a class="secondary" href="?next=1">Open Next Moves</a>`;
    passport.appendChild(card);
  }
}

window.addEventListener('tasteprint:intelligence-feedback', () => {
  const move = saveFromLatestFeedback();
  if (!move) return;
  const panelStatus = document.querySelector('.intelligence-status');
  if (panelStatus) panelStatus.textContent = `${move.name} is also saved in Next Moves so this result has somewhere useful to go.`;
  addShortcut();
});
window.addEventListener('tasteprint:passport-updated', () => requestAnimationFrame(addShortcut));
window.addEventListener('tasteprint:next-moves', () => requestAnimationFrame(addShortcut));

if (NEXT_MODE) render();
else {
  const observer = new MutationObserver(() => requestAnimationFrame(addShortcut));
  observer.observe(app, { childList: true, subtree: true });
  requestAnimationFrame(addShortcut);
}

window.TasteprintNextMoves = Object.freeze({
  storageKey: STORAGE_KEY,
  list: () => readMoves(),
  summary: () => nextMoveSummary(readMoves()),
  clear: clearMoves
});
