import { RAW_DATA_RETENTION_DAYS } from './analytics-contract.js';

const analytics = () => window.TasteprintAnalytics;
const passport = () => window.TasteprintPassport;
const account = () => window.TasteprintAccount;

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

      <p class="lede privacy-intro">Tasteprint works without an account. Anonymous product data, optional account-backed Passport sync, and campaign contact details are deliberately separate data paths with separate controls.</p>

      <div class="privacy-grid">
        <section class="privacy-card">
          <div class="eyebrow">Anonymous data mode</div>
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
          <span>preference score vectors</span>
          <span>archetype + mode labels</span>
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
        <p class="small">If you separately opt into Passport sync, Supabase Auth uses your email to authenticate that account. The sync table stores the Auth user ID plus Passport snapshots, not the email itself. A branded campaign can separately ask for contact details after your result only with explicit consent.</p>
      </section>

      <section class="privacy-section privacy-account">
        <div class="eyebrow">Optional Passport account</div>
        <h3 class="privacy-account-title">Checking account sync…</h3>
        <p class="small privacy-account-copy"></p>
        <div class="privacy-actions">
          <a class="secondary privacy-account-manage" href="?profile=1">Manage Passport sync</a>
          <button type="button" class="danger privacy-account-delete" hidden>Delete account + synced Passport</button>
        </div>
      </section>

      <section class="privacy-section privacy-local">
        <div>
          <div class="eyebrow">On this device</div>
          <h3><span class="privacy-event-count">0</span> recent analytics events · <span class="privacy-passport-count">0</span> Passport entries</h3>
          <p class="small">The analytics fallback keeps at most 200 recent events. Passport keeps recent module score snapshots locally whether or not you choose account sync.</p>
        </div>
        <div class="privacy-actions">
          <button type="button" class="secondary privacy-export">Export local activity</button>
          <button type="button" class="secondary privacy-clear-local">Clear local analytics</button>
        </div>
      </section>

      <section class="privacy-danger">
        <div>
          <div class="eyebrow">Anonymous delete / reset</div>
          <h3>Delete anonymous data tied to this browser</h3>
          <p class="small privacy-delete-copy"></p>
        </div>
        <button type="button" class="privacy-delete">Delete anonymous browser data</button>
      </section>

      <p class="small privacy-status" role="status" aria-live="polite"></p>
      <p class="small privacy-footnote">Anonymous browser deletion and optional account deletion are intentionally separate. This prevents a reset of analytics identifiers from silently deleting a Passport you explicitly chose to sync across devices.</p>
    </div>`;

  document.body.append(trigger, dialog);
  return { trigger, dialog };
}

const { trigger, dialog } = createUI();
let confirmTimer = null;
let awaitingDeleteConfirm = false;
let awaitingAccountDeleteConfirm = false;

function refresh() {
  const api = analytics();
  const accountApi = account();
  const remote = Boolean(api?.remoteEnabled?.());
  const accountEnabled = Boolean(accountApi?.remoteEnabled?.());
  const signedIn = Boolean(accountApi?.signedIn?.());
  const accountUser = accountApi?.user?.();
  const count = api?.localEvents?.().length || 0;
  const passportCount = passport()?.history?.().length || 0;

  dialog.querySelector('.privacy-event-count').textContent = String(count);
  dialog.querySelector('.privacy-passport-count').textContent = String(passportCount);
  dialog.querySelector('.privacy-mode').textContent = remote ? 'Anonymous remote analytics enabled' : 'Local-only anonymous mode';
  dialog.querySelector('.privacy-mode-copy').textContent = remote
    ? 'Completed score vectors and product events can be sent to the configured Tasteprint database. Raw answer selections and account identity are not part of the anonymous schema.'
    : 'No production database is configured in this build. Anonymous analytics stay in this browser.';

  const accountTitle = dialog.querySelector('.privacy-account-title');
  const accountCopy = dialog.querySelector('.privacy-account-copy');
  const accountDelete = dialog.querySelector('.privacy-account-delete');
  if (!accountEnabled) {
    accountTitle.textContent = 'Account sync is not activated in this deployment.';
    accountCopy.textContent = 'The local Passport still works normally. The code path for optional account sync requires the production Supabase project and Passport sync schema.';
    accountDelete.hidden = true;
  } else if (!signedIn) {
    accountTitle.textContent = 'No synced account on this browser.';
    accountCopy.textContent = 'You can keep using Tasteprint locally or opt into passwordless Passport sync from My Tasteprint. Signup is never required before a result.';
    accountDelete.hidden = true;
  } else {
    accountTitle.textContent = accountUser?.email ? `Signed in as ${accountUser.email}` : 'Passport sync is signed in.';
    accountCopy.textContent = 'Synced Passport snapshots are account-backed and persist until you clear the synced Passport or delete the optional account. They are not subject to the anonymous 180-day analytics retention rule.';
    accountDelete.hidden = false;
  }

  dialog.querySelector('.privacy-delete-copy').textContent = remote
    ? signedIn
      ? `This uses the browser's private deletion token to remove its anonymous profile/event rows. Your signed-in Passport account is separate and will remain unless you use the account deletion control above.`
      : `Remote anonymous rows can be deleted using this browser's private deletion token. The reset also clears the unsynced local Passport. Raw anonymous rows have a ${RAW_DATA_RETENTION_DAYS}-day retention target.`
    : signedIn
      ? 'This resets anonymous local analytics identifiers. Your signed-in Passport account and its local synced copy are separate and will remain.'
      : 'There is no remote anonymous database connected in this build. Resetting removes local analytics identifiers, activity and the unsynced Passport from this browser.';
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
    note: 'Local Tasteprint anonymous analytics and the current browser Passport copy. Raw quiz answers and campaign contact details are not included.',
    events,
    passport: {
      master: passport()?.master?.() || null,
      history
    },
    account_sync_active: Boolean(account()?.signedIn?.())
  });
  dialog.querySelector('.privacy-status').textContent = 'Local analytics and current Passport copy exported.';
});

dialog.querySelector('.privacy-clear-local').addEventListener('click', () => {
  analytics()?.clearLocalEvents?.();
  refresh();
  dialog.querySelector('.privacy-status').textContent = 'Local analytics history cleared. Passport history and deletion credentials were kept.';
});

const accountDeleteButton = dialog.querySelector('.privacy-account-delete');
accountDeleteButton.addEventListener('click', async () => {
  if (!awaitingAccountDeleteConfirm) {
    awaitingAccountDeleteConfirm = true;
    accountDeleteButton.textContent = 'Click again to delete account';
    dialog.querySelector('.privacy-status').textContent = 'This deletes the optional Auth account and its synced Passport. Anonymous browser analytics are a separate deletion path.';
    clearTimeout(confirmTimer);
    confirmTimer = setTimeout(() => {
      awaitingAccountDeleteConfirm = false;
      accountDeleteButton.textContent = 'Delete account + synced Passport';
    }, 5000);
    return;
  }

  clearTimeout(confirmTimer);
  awaitingAccountDeleteConfirm = false;
  accountDeleteButton.disabled = true;
  accountDeleteButton.textContent = 'Deleting account…';
  const deleted = await account()?.deleteAccount?.();
  accountDeleteButton.disabled = false;
  accountDeleteButton.textContent = 'Delete account + synced Passport';
  if (deleted) {
    dialog.querySelector('.privacy-status').textContent = 'Optional account and synced Passport deleted. Anonymous browser data is unchanged until you reset it separately.';
    refresh();
  } else {
    dialog.querySelector('.privacy-status').textContent = 'Could not delete the account. Nothing was cleared locally so you can try again.';
  }
});

const deleteButton = dialog.querySelector('.privacy-delete');
deleteButton.addEventListener('click', async () => {
  if (!awaitingDeleteConfirm) {
    awaitingDeleteConfirm = true;
    deleteButton.textContent = 'Click again to confirm reset';
    dialog.querySelector('.privacy-status').textContent = account()?.signedIn?.()
      ? 'This removes anonymous data tied to this browser identity. Your optional synced Passport account remains.'
      : 'This removes anonymous data tied to this browser identity and clears its unsynced local Passport.';
    clearTimeout(confirmTimer);
    confirmTimer = setTimeout(() => {
      awaitingDeleteConfirm = false;
      deleteButton.textContent = 'Delete anonymous browser data';
    }, 5000);
    return;
  }

  clearTimeout(confirmTimer);
  awaitingDeleteConfirm = false;
  deleteButton.disabled = true;
  deleteButton.textContent = 'Deleting…';
  dialog.querySelector('.privacy-status').textContent = '';

  try {
    const signedIn = Boolean(account()?.signedIn?.());
    const result = await analytics()?.deleteMyData?.();
    if (!result?.deleted) throw new Error('Deletion request failed');
    if (!signedIn) passport()?.clear?.();
    const detail = result.remote
      ? ` Deleted ${result.profiles} anonymous profile row(s) and ${result.events} event row(s).`
      : '';
    const passportDetail = signedIn
      ? ' Synced Passport was kept because it belongs to your optional account.'
      : ' Unsynced local Passport cleared.';
    dialog.querySelector('.privacy-status').textContent = `Anonymous Tasteprint data for this browser was reset.${detail}${passportDetail} Reloading with a fresh anonymous identity…`;
    setTimeout(() => {
      const next = new URL(location.href);
      next.searchParams.delete('privacy');
      next.searchParams.delete('profile');
      location.replace(next.toString());
    }, 1400);
  } catch (error) {
    console.warn('Tasteprint deletion failed', error);
    deleteButton.disabled = false;
    deleteButton.textContent = 'Delete anonymous browser data';
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
window.addEventListener('tasteprint:account-state', () => {
  if (dialog.open) refresh();
});
