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

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function mount() {
  const dialog = document.querySelector('.privacy-dialog');
  const shell = dialog?.querySelector('.privacy-shell');
  if (!shell || shell.querySelector('[data-privacy-extension]')) return;
  const footnote = shell.querySelector('.privacy-footnote');
  const host = document.createElement('section');
  host.className = 'privacy-section';
  host.dataset.privacyExtension = '1';
  const moves = window.TasteprintNextMoves?.list?.() || [];
  const workspaceRemote = Boolean(window.TasteprintWorkspace?.remoteEnabled?.());
  host.innerHTML = `
    <div class="eyebrow">Decision memory + team workspace</div>
    <h3>Extra data surfaces stay deliberately narrow.</h3>
    <div class="privacy-grid">
      <div class="privacy-card">
        <strong>Next Moves · ${moves.length}</strong>
        <p class="small">Local recommendation choices only: module, result key, recommendation label/copy and Saved/Trying/Done status. No free-text journal, contacts, location history or demographic profile.</p>
        <div class="privacy-actions"><button type="button" class="secondary" data-export-next ${moves.length ? '' : 'disabled'}>Export Next Moves</button><button type="button" class="secondary" data-clear-next ${moves.length ? '' : 'disabled'}>Clear Next Moves</button></div>
      </div>
      <div class="privacy-card">
        <strong>Campaign Workspace · ${workspaceRemote ? 'backend-ready' : 'local demo'}</strong>
        <p class="small">Workspace membership is an authenticated admin-side feature. Team tables avoid member email/name columns, invite links store only token hashes, and Workspace does not expose raw campaign lead contacts or anonymous consumer rows.</p>
      </div>
    </div>
    <p class="small" data-privacy-extension-status role="status" aria-live="polite"></p>`;
  if (footnote) footnote.before(host); else shell.appendChild(host);

  host.querySelector('[data-export-next]')?.addEventListener('click', () => {
    const current = window.TasteprintNextMoves?.list?.() || [];
    downloadJSON('tasteprint-next-moves.json', {
      exported_at: new Date().toISOString(),
      note: 'Local Tasteprint Next Moves only. No Auth session, account email, raw answers or campaign lead contacts are included.',
      next_moves: current
    });
    host.querySelector('[data-privacy-extension-status]').textContent = 'Next Moves exported.';
  });

  host.querySelector('[data-clear-next]')?.addEventListener('click', (event) => {
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
    window.TasteprintNextMoves?.clear?.();
    button.disabled = true;
    button.textContent = 'Cleared';
    host.querySelector('[data-privacy-extension-status]').textContent = 'Local Next Moves cleared.';
  });
}

const observer = new MutationObserver(mount);
observer.observe(document.body, { childList: true, subtree: true });
mount();
