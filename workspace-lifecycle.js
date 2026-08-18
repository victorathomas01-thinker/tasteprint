import { createClient } from '@supabase/supabase-js';

const params = new URL(location.href).searchParams;
const WORKSPACE_ROUTE = params.get('workspace') === '1';
const DEMO = params.get('demo') === '1';
const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_PUBLIC_KEY = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '');
const AUTH_STORAGE_KEY = 'tasteprint.auth.v1';
const client = SUPABASE_URL && SUPABASE_PUBLIC_KEY
  ? createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: AUTH_STORAGE_KEY }
    })
  : null;

let transferConfirm = null;
let deleteConfirm = false;

function selectedWorkspace() {
  return window.TasteprintWorkspace?.selected?.() || null;
}

function setStatus(message) {
  const node = document.querySelector('[data-workspace-status]');
  if (node) node.textContent = String(message || '');
}

function workspaceURL() {
  const url = new URL(location.href);
  url.search = '';
  url.searchParams.set('workspace', '1');
  return url.toString();
}

async function transferOwnership(memberRef, button) {
  const workspace = selectedWorkspace();
  if (!client || !workspace || workspace.role !== 'owner') return;

  if (transferConfirm !== memberRef) {
    transferConfirm = memberRef;
    button.textContent = 'Click again to transfer';
    setStatus('Ownership transfer makes that member the Owner and changes you to Admin.');
    setTimeout(() => {
      if (transferConfirm === memberRef) transferConfirm = null;
      if (button.isConnected) button.textContent = 'Make owner';
    }, 5000);
    return;
  }

  transferConfirm = null;
  button.disabled = true;
  button.textContent = 'Transferring…';
  const { error } = await client.rpc('tasteprint_transfer_workspace_ownership', {
    p_workspace_id: workspace.id,
    p_member_ref: memberRef
  });
  if (error) {
    button.disabled = false;
    button.textContent = 'Make owner';
    setStatus(error.message || 'Could not transfer ownership.');
    return;
  }

  setStatus('Ownership transferred. Reloading your updated workspace permissions…');
  setTimeout(() => location.replace(workspaceURL()), 550);
}

async function deleteWorkspace(button) {
  const workspace = selectedWorkspace();
  if (!client || !workspace || workspace.role !== 'owner') return;

  if (!deleteConfirm) {
    deleteConfirm = true;
    button.textContent = 'Click again to permanently delete';
    setStatus('This removes the private workspace, hosted drafts, invites and its public campaign manifests. Consumer analytics remain separate.');
    setTimeout(() => {
      deleteConfirm = false;
      if (button.isConnected) button.textContent = 'Delete workspace';
    }, 6000);
    return;
  }

  deleteConfirm = false;
  button.disabled = true;
  button.textContent = 'Deleting workspace…';
  const { error } = await client.rpc('tasteprint_delete_workspace', { p_workspace_id: workspace.id });
  if (error) {
    button.disabled = false;
    button.textContent = 'Delete workspace';
    setStatus(error.message || 'Could not delete workspace.');
    return;
  }
  location.replace(workspaceURL());
}

function inject() {
  if (!WORKSPACE_ROUTE || DEMO || !client) return;
  const workspace = selectedWorkspace();
  const shell = document.querySelector('.workspace-shell');
  if (!workspace || !shell || workspace.role !== 'owner') return;

  document.querySelectorAll('[data-member-role]').forEach((select) => {
    const row = select.closest('.workspace-member-row');
    if (!row || row.querySelector('[data-member-owner]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'secondary';
    button.dataset.memberOwner = select.dataset.memberRole || '';
    button.textContent = 'Make owner';
    button.addEventListener('click', () => transferOwnership(button.dataset.memberOwner, button));
    select.insertAdjacentElement('afterend', button);
  });

  if (!shell.querySelector('[data-workspace-lifecycle]')) {
    const section = document.createElement('details');
    section.className = 'card workspace-section account-danger-zone';
    section.dataset.workspaceLifecycle = '1';
    section.innerHTML = `<summary>Workspace ownership & deletion</summary>
      <p class="small">Before deleting the Auth account that owns this workspace, transfer ownership to another member or delete the workspace. Tasteprint will not silently orphan a team or destroy it during account deletion.</p>
      <p class="small">Deleting this workspace removes its private team/draft data and its public campaign registry manifests. Anonymous consumer analytics and explicit-consent lead records are separate data zones and follow their own retention/deletion rules.</p>
      <button class="danger" type="button" data-delete-workspace>Delete workspace</button>`;
    shell.appendChild(section);
    section.querySelector('[data-delete-workspace]')?.addEventListener('click', (event) => deleteWorkspace(event.currentTarget));
  }
}

if (WORKSPACE_ROUTE) {
  const observer = new MutationObserver(() => requestAnimationFrame(inject));
  observer.observe(document.querySelector('#app'), { childList: true, subtree: true });
  window.addEventListener('tasteprint:account-state', () => requestAnimationFrame(inject));
  requestAnimationFrame(inject);
}
