import { RAW_DATA_RETENTION_DAYS } from './analytics-contract.js';

const analytics = () => window.TasteprintAnalytics;

function escapeHTML(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function createUI() {
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'privacy-trigger';
  trigger.textContent = 'Privacy & data';
  trigger.setAttribute('aria-haspopup', 'dialog');

  const dialog = document.createElement('dialog');
  dialog.className = 'privacy-dialog';
  dialog.setAttribute('aria-labelledby', 'privacy-title');
  dialog.innerHTML = `
    <div class="privacy-shell">
      <div class="privacy-head">
        <div>
          <div class="eyebrow">Tasteprint · Data controls</div>
          <h2 id="privacy-title">Your choices should not become a mystery database.</h2>
        </div>
        <button type="button" class="privacy-close" aria-label="Close privacy and data controls">×</button>
      </div>

      <p class="lede privacy-intro">Tasteprint is designed to work before you create an account. The first data layer uses random browser IDs, keeps raw quiz answers out of the database, and gives this browser a private deletion token.</p>

      <div class="privacy-grid">
        <section class="privacy-card">
          <div class="eyebrow">Current mode</div>
          <h3 class="privacy-mode">Checking…</h3>
          <p class="small privacy-mode-copy"></p>
        </section>
        <section class="privacy-card">
          <div class="eyebrow">Raw-data retention</div>
          <h3>${RAW_DATA_RETENTION_DAYS} days maximum</h3>
          <p class="small">The production schema is designed to prune anonymous profile and event rows after ${RAW_DATA_RETENTION_DAYS} days. Aggregate counts can outlive individual rows because they do not identify a browser.</p>
        </section>
      </div>

      <section class="privacy-section">
        <h3>What Tasteprint may store</h3>
        <div class="privacy-list">
          <span>10 preference scores</span>
          <span>archetype + travel mode</span>
          <span>anonymous session/browser IDs</span>
          <span>basic product events</span>
          <span>referral token for friend challenges</span>
        </div>
      </section>

      <section class="privacy-section">
        <h3>What this version deliberately does not store</h3>
        <div class="privacy-list privacy-list-good">
          <span>your name</span>
          <span>email address</span>
          <span>account identity</span>
          <span>raw answer selections</span>
          <span>contacts or location history</span>
        </div>
      </section>

      <section class="privacy-section privacy-local">
        <div>
          <div class="eyebrow">On this device</div>
          <h3><span class="privacy-event-count">0</span> recent analytics events stored locally</h3>
          <p class="small">The local fallback keeps at most 200 recent events so development and analytics failures never break the quiz.</p>
        </div>
        <div class="privacy-actions">
          <button type="button" class="secondary privacy-export">Export local activity</button>
          <button type="button" class="secondary privacy-clear-local">Clear local activity</button>
        </div>
      </section>

      <section class="privacy-danger">
        <div>
          <div class="eyebrow">Delete / reset</div>
          <h3>Delete data tied to this browser</h3>
          <p class="small privacy-delete-copy">When remote storage is connected, deletion requires both this browser's random install ID and its private deletion token. The raw token is not stored in the database.</p>
        </div>
        <button type="button" class="privacy-delete">Delete my Tasteprint data</button>
      </section>

      <p class="small privacy-status" role="status" aria-live="polite"></p>
      <p class="small privacy-footnote">Deletion applies to this browser identity. If you use Tasteprint from another browser or device, that device has its own anonymous identity and deletion token.</p>
    </div>
  `;

  document.body.append(trigger, dialog);
  return { trigger, dialog };
}

const { trigger, dialog } = createUI();
let confirmTimer = null;
let awaitingDeleteConfirm = false;

function refresh() {
  const api = analytics();
  const remote = Boolean(api?.remoteEnabled?.());
  const count = api?.localEvents?.().length || 0;

  dialog.querySelector('.privacy-event-count').textContent = String(count);
  dialog.querySelector('.privacy-mode').textContent = remote ? 'Anonymous remote analytics enabled' : 'Local-only mode';
  dialog.querySelector('.privacy-mode-copy').textContent = remote
    ? 'Completed score vectors and product events can be sent to the configured Tasteprint database. Raw answer selections are not part of the current schema.'
    : 'No production database is configured in this build. Analytics stays in this browser only.';
  dialog.querySelector('.privacy-delete-copy').textContent = remote
    ? `Remote rows can be deleted from this browser using its private deletion token. Raw anonymous rows also have a ${RAW_DATA_RETENTION_DAYS}-day retention target.`
    : 'There is no remote database connected in this build. Resetting removes Tasteprint analytics identifiers and local activity from this browser.';
}

function openDialog() {
  refresh();
  if (!dialog.open) dialog.showModal();
}

trigger.addEventListener('click', openDialog);
dialog.querySelector('.privacy-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

function downloadJSON(filename, value) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}

dialog.querySelector('.privacy-export').addEventListener('click', () => {
  const events = analytics()?.localEvents?.() || [];
  downloadJSON('tasteprint-local-activity.json', {
    exported_at: new Date().toISOString(),
    note: 'Local Tasteprint analytics fallback. Raw quiz answer selections are not included.',
    events
  });
  dialog.querySelector('.privacy-status').textContent = 'Local activity exported.';
});

dialog.querySelector('.privacy-clear-local').addEventListener('click', () => {
  analytics()?.clearLocalEvents?.();
  refresh();
  dialog.querySelector('.privacy-status').textContent = 'Local analytics history cleared. Your anonymous deletion credential was kept.';
});

const deleteButton = dialog.querySelector('.privacy-delete');
deleteButton.addEventListener('click', async () => {
  if (!awaitingDeleteConfirm) {
    awaitingDeleteConfirm = true;
    deleteButton.textContent = 'Click again to confirm deletion';
    dialog.querySelector('.privacy-status').textContent = 'This removes data tied to this browser identity and resets its local IDs.';
    clearTimeout(confirmTimer);
    confirmTimer = setTimeout(() => {
      awaitingDeleteConfirm = false;
      deleteButton.textContent = 'Delete my Tasteprint data';
    }, 5000);
    return;
  }

  clearTimeout(confirmTimer);
  awaitingDeleteConfirm = false;
  deleteButton.disabled = true;
  deleteButton.textContent = 'Deleting…';
  dialog.querySelector('.privacy-status').textContent = '';

  try {
    const result = await analytics()?.deleteMyData?.();
    if (!result?.deleted) throw new Error('Deletion request failed');
    const detail = result.remote
      ? ` Deleted ${result.profiles} profile row(s) and ${result.events} event row(s).`
      : '';
    dialog.querySelector('.privacy-status').textContent = `Tasteprint data for this browser was reset.${detail} Reloading with a fresh anonymous identity…`;
    setTimeout(() => {
      const next = new URL(location.href);
      next.searchParams.delete('privacy');
      location.replace(next.toString());
    }, 1300);
  } catch (error) {
    console.warn('Tasteprint deletion failed', error);
    deleteButton.disabled = false;
    deleteButton.textContent = 'Delete my Tasteprint data';
    dialog.querySelector('.privacy-status').textContent = 'Could not complete the remote deletion request. Nothing was cleared locally so you can try again.';
  }
});

if (new URL(location.href).searchParams.get('privacy') === '1') {
  requestAnimationFrame(openDialog);
}

window.addEventListener('tasteprint:analytics', () => {
  if (dialog.open) refresh();
});
