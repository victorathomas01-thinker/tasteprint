import { RAW_DATA_RETENTION_DAYS } from './analytics-contract.js';

const analytics = () => window.TasteprintAnalytics;
const passport = () => window.TasteprintPassport;

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

      <p class="lede privacy-intro">Tasteprint works before you create an account. Anonymous product data and your local Passport are kept separate from optional campaign contact details, which are collected only after explicit consent.</p>

      <div class="privacy-grid">
        <section class="privacy-card">
          <div class="eyebrow">Current mode</div>
          <h3 class="privacy-mode">Checking…</h3>
          <p class="small privacy-mode-copy"></p>
        </section>
        <section class="privacy-card">
          <div class="eyebrow">Anonymous raw-data retention</div>
          <h3>${RAW_DATA_RETENTION_DAYS} days maximum</h3>
          <p class="small">The production schema is designed to prune anonymous profile and event rows after ${RAW_DATA_RETENTION_DAYS} days. Aggregate counts can outlive individual rows because they do not identify a browser.</p>
        </section>
      </div>

      <section class="privacy-section">
        <h3>What the default Tasteprint experience may store</h3>
        <div class="privacy-list">
          <span>10 preference scores</span>
          <span>archetype + travel mode</span>
          <span>local Passport history</span>
          <span>anonymous session/browser IDs</span>
          <span>basic product events</span>
          <span>referral token for friend challenges</span>
        </div>
      </section>

      <section class="privacy-section">
        <h3>What anonymous Tasteprint analytics deliberately excludes</h3>
        <div class="privacy-list privacy-list-good">
          <span>your name</span>
          <span>email address</span>
          <span>account identity</span>
          <span>raw answer selections</span>
          <span>contacts or precise location history</span>
        </div>
        <p class="small">A branded campaign can separately ask for contact details after your result. That requires an explicit consent checkbox and is not placed into Tasteprint analytics events.</p>
      </section>

      <section class="privacy-section privacy-local">
        <div>
          <div class="eyebrow">On this device</div>
          <h3><span class="privacy-event-count">0</span> recent analytics events · <span class="privacy-passport-count">0</span> Passport entries</h3>
          <p class="small">The analytics fallback keeps at most 200 recent events. Passport keeps your recent module score snapshots so your taste map can persist without an account.</p>
        </div>
        <div class="privacy-actions">
          <button type="button" class="secondary privacy-export">Export local activity</button>
          <button type="button" class="secondary privacy-clear-local">Clear local analytics</button>
        </div>
      </section>

      <section class="privacy-danger">
        <div>
          <div class="eyebrow">Delete / reset</div>
          <h3>Delete data tied to this browser</h3>
          <p class="small privacy-delete-copy"></p>
        </div>
        <button type="button" class="privacy-delete">Delete my Tasteprint data</button>
      </section>

      <p class="small privacy-status" role="status" aria-live="polite"></p>
      <p class="small privacy-footnote">Deletion applies to this browser identity. Another browser or device has its own anonymous identity, deletion token and local Passport unless you later choose to sync through an optional account.</p>
    </div>`;

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
  const passportCount = passport()?.history?.().length || 0;

  dialog.querySelector('.privacy-event-count').textContent = String(count);
  dialog.querySelector('.privacy-passport-count').textContent = String(passportCount);
  dialog.querySelector('.privacy-mode').textContent = remote ? 'Anonymous remote analytics enabled' : 'Local-only mode';
  dialog.querySelector('.privacy-mode-copy').textContent = remote
    ? 'Completed score vectors and product events can be sent to the configured Tasteprint database. Raw answer selections are not part of the anonymous schema. Passport history still stays local in this version.'
    : 'No production database is configured in this build. Anonymous analytics and Passport history stay in this browser.';
  dialog.querySelector('.privacy-delete-copy').textContent = remote
    ? `Remote anonymous rows can be deleted using this browser's private deletion token. Deletion also clears its local Passport. Raw anonymous rows have a ${RAW_DATA_RETENTION_DAYS}-day retention target.`
    : 'There is no remote anonymous database connected in this build. Resetting removes local analytics identifiers, activity and Passport history from this browser.';
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
  const history = passport()?.history?.() || [];
  downloadJSON('tasteprint-local-data.json', {
    exported_at: new Date().toISOString(),
    note: 'Local Tasteprint anonymous analytics and Passport history. Raw quiz answer selections and campaign contact details are not included.',
    events,
    passport: {
      master: passport()?.master?.() || null,
      history
    }
  });
  dialog.querySelector('.privacy-status').textContent = 'Local analytics and Passport data exported.';
});

dialog.querySelector('.privacy-clear-local').addEventListener('click', () => {
  analytics()?.clearLocalEvents?.();
  refresh();
  dialog.querySelector('.privacy-status').textContent = 'Local analytics history cleared. Passport history and the anonymous deletion credential were kept.';
});

const deleteButton = dialog.querySelector('.privacy-delete');
deleteButton.addEventListener('click', async () => {
  if (!awaitingDeleteConfirm) {
    awaitingDeleteConfirm = true;
    deleteButton.textContent = 'Click again to confirm deletion';
    dialog.querySelector('.privacy-status').textContent = 'This removes anonymous data tied to this browser identity and clears its local Passport.';
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
    passport()?.clear?.();
    const detail = result.remote
      ? ` Deleted ${result.profiles} anonymous profile row(s) and ${result.events} event row(s).`
      : '';
    dialog.querySelector('.privacy-status').textContent = `Tasteprint data for this browser was reset.${detail} Local Passport cleared. Reloading with a fresh anonymous identity…`;
    setTimeout(() => {
      const next = new URL(location.href);
      next.searchParams.delete('privacy');
      next.searchParams.delete('profile');
      location.replace(next.toString());
    }, 1300);
  } catch (error) {
    console.warn('Tasteprint deletion failed', error);
    deleteButton.disabled = false;
    deleteButton.textContent = 'Delete my Tasteprint data';
    dialog.querySelector('.privacy-status').textContent = 'Could not complete the remote deletion request. Nothing was cleared locally so you can try again.';
  }
});

if (new URL(location.href).searchParams.get('privacy') === '1') requestAnimationFrame(openDialog);

window.addEventListener('tasteprint:analytics', () => {
  if (dialog.open) refresh();
});
window.addEventListener('tasteprint:passport-updated', () => {
  if (dialog.open) refresh();
});
