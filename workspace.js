import { createClient } from '@supabase/supabase-js';
import { getCampaign } from './campaign-config.js';
import {
  DEMO_WORKSPACE,
  WORKSPACE_ROLES,
  canWorkspace,
  normalizeWorkspaceRole,
  reviewCampaignExperience,
  safeCampaignId,
  safeWorkspaceSlug,
  sanitizeWorkspaceRecord,
  workspaceCapabilities,
  workspaceRoleLabel
} from './workspace-core.js';

const params = new URL(location.href).searchParams;
const WORKSPACE_MODE = params.get('workspace') === '1';
const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_PUBLIC_KEY = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '');
const REMOTE_ENABLED = Boolean(SUPABASE_URL && SUPABASE_PUBLIC_KEY);
const AUTH_STORAGE_KEY = 'tasteprint.auth.v1';
const DEMO_ROLE_KEY = 'tasteprint.workspace-demo-role.v1';

const client = REMOTE_ENABLED
  ? createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: AUTH_STORAGE_KEY
      }
    })
  : null;

let session = null;
let workspaces = [];
let selectedWorkspace = null;
let campaigns = [];
let members = [];
let status = '';
let inviteURL = '';
let demoRole = readDemoRole();

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function readDemoRole() {
  try {
    return normalizeWorkspaceRole(sessionStorage.getItem(DEMO_ROLE_KEY) || 'owner');
  } catch {
    return 'owner';
  }
}

function setDemoRole(role) {
  demoRole = normalizeWorkspaceRole(role);
  try { sessionStorage.setItem(DEMO_ROLE_KEY, demoRole); } catch {}
  renderDemo();
}

function currentURL(extra = {}) {
  const url = new URL(location.href);
  url.search = '';
  url.searchParams.set('workspace', '1');
  for (const [key, value] of Object.entries(extra)) {
    if (value != null && value !== '') url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function authRedirectURL() {
  return currentURL({ auth: 'return' });
}

function studioURL(workspaceId, campaignId = '') {
  const url = new URL(location.href);
  url.search = '';
  url.searchParams.set('campaignAdmin', '1');
  if (workspaceId) url.searchParams.set('workspace', workspaceId);
  if (campaignId) url.searchParams.set('hosted', campaignId);
  return url.toString();
}

function setStatus(message) {
  status = String(message || '');
  const node = document.querySelector('[data-workspace-status]');
  if (node) node.textContent = status;
}

async function copyText(value) {
  if (!value) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {}
  return false;
}

function reviewMarkup(manifest) {
  const review = reviewCampaignExperience(manifest || {});
  const passed = review.checks.filter((item) => item.passed).length;
  return `<section class="card workspace-value-card">
    <div class="row spread workspace-value-head">
      <div><div class="eyebrow">Experience QA</div><h2>${esc(review.grade)}</h2></div>
      <div class="workspace-value-score" aria-label="Experience quality score ${review.score} out of 100"><strong>${review.score}</strong><span>/100</span></div>
    </div>
    <p class="small">${esc(review.principle)}</p>
    <div class="workspace-checks">${review.checks.map((item) => `
      <div class="workspace-check ${item.passed ? 'is-good' : item.severity === 'privacy' ? 'is-block' : 'is-warn'}">
        <span aria-hidden="true">${item.passed ? '✓' : item.severity === 'privacy' ? '!' : '○'}</span>
        <div><strong>${esc(item.title)}</strong><p class="small">${esc(item.copy)}</p></div>
      </div>`).join('')}</div>
    <p class="small workspace-value-foot">${passed}/${review.checks.length} checks pass. This is a product-quality guardrail, not a psychological diagnosis or conversion promise.</p>
  </section>`;
}

function capabilityMarkup(role) {
  const caps = workspaceCapabilities(role);
  const items = [
    ['Edit campaigns', caps.canEdit],
    ['Publish campaigns', caps.canPublish],
    ['See aggregate metrics', caps.canSeeMetrics],
    ['Create invite links', caps.canInvite],
    ['Manage member roles', caps.canManageMembers]
  ];
  return `<div class="workspace-capabilities">${items.map(([label, allowed]) => `
    <span class="workspace-capability ${allowed ? 'allowed' : 'denied'}">${allowed ? '✓' : '–'} ${esc(label)}</span>`).join('')}</div>`;
}

function demoCampaign() {
  return getCampaign('aster') || {
    id: 'aster',
    name: 'Aster & Tide',
    copy: { title: 'Find the escape you would actually book.', lede: 'Make a few instinctive tradeoffs and get a useful direction before you browse everything.' },
    leadCapture: { enabled: true, demoOnly: true, title: 'Want the itinerary?', body: 'Keep the useful next step.', consentText: 'Demo only.' },
    catalog: []
  };
}

function renderDemo() {
  if (!WORKSPACE_MODE) return;
  const app = document.querySelector('#app');
  const caps = workspaceCapabilities(demoRole);
  const manifest = demoCampaign();
  document.title = 'Tasteprint Campaign Workspace · Demo';
  app.innerHTML = `<section class="panel pad workspace-shell">
    <div class="workspace-hero">
      <div>
        <div class="eyebrow">Tasteprint · Campaign Workspace</div>
        <h1>Team workflows without needing a backend for the demo.</h1>
        <p class="lede">This local demo lets you show roles, privacy boundaries, campaign quality checks and the handoff into Campaign Studio. No account, email, invitee identity or client data leaves this browser.</p>
      </div>
      <div class="workspace-hero-actions"><span class="workspace-mode-pill">Local demo · $0 backend required</span><a class="secondary" href="?">Exit workspace</a></div>
    </div>

    <div class="callout workspace-problem">
      <div class="eyebrow">The user problem we are solving</div>
      <h2>Too many options, too little confidence about what actually fits.</h2>
      <p class="small">Tasteprint should reduce decision overload. The fun identity layer earns attention, but the product has to finish by giving a small set of explainable choices and a next action the user can actually take.</p>
    </div>

    <div class="workspace-grid">
      <section class="card">
        <div class="row spread"><div><div class="eyebrow">Demo team</div><h2>${esc(DEMO_WORKSPACE.name)}</h2></div><span class="workspace-role-pill">${esc(workspaceRoleLabel(demoRole))}</span></div>
        <p class="small">Switch roles to demonstrate exactly what each collaborator can do. This changes only temporary demo state.</p>
        <div class="workspace-role-switch" aria-label="Demo role">${WORKSPACE_ROLES.map((role) => `<button type="button" data-demo-role="${role}" class="${role === demoRole ? 'is-active' : ''}" aria-pressed="${role === demoRole}">${esc(workspaceRoleLabel(role))}</button>`).join('')}</div>
        ${capabilityMarkup(demoRole)}
      </section>

      <section class="card">
        <div class="eyebrow">Privacy by architecture</div>
        <h2>Collaboration does not need a customer-data firehose.</h2>
        <div class="workspace-privacy-list">
          <span>✓ Workspace tables do not store member emails</span>
          <span>✓ Invite links are one-time random tokens</span>
          <span>✓ Only token hashes belong in the database</span>
          <span>✓ Campaign drafts are tenant-scoped</span>
          <span>✓ Raw leads are not exposed in Workspace</span>
          <span>✓ Anonymous Tasteprint analytics stay separate from accounts</span>
        </div>
      </section>
    </div>

    <section class="card workspace-campaign-card">
      <div class="row spread">
        <div><div class="eyebrow">Campaign</div><h2>${esc(manifest.name || 'Aster & Tide')}</h2><p class="small">Fictional portfolio campaign · safe to demonstrate.</p></div>
        <div class="row">
          <a class="secondary" href="?campaign=aster">Open consumer demo</a>
          <a class="primary ${caps.canEdit ? '' : 'workspace-disabled-link'}" href="${caps.canEdit ? studioURL('demo-workspace', 'aster') : '#'}" ${caps.canEdit ? '' : 'aria-disabled="true"'}>Open Studio</a>
        </div>
      </div>
      <div class="workspace-campaign-meta"><span>Status · demo</span><span>Customer PII · none</span><span>Publishing · simulated</span></div>
    </section>

    ${reviewMarkup(manifest)}

    <div class="callout workspace-demo-note"><strong>When Supabase is connected</strong><p class="small">The same route switches from fictional demo state to authenticated workspaces, RLS-scoped hosted drafts, one-time invite links and role-gated publishing. The public demo remains available even if the backend is offline.</p></div>
    <p class="small" data-workspace-status role="status" aria-live="polite">${esc(status)}</p>
  </section>`;

  app.querySelectorAll('[data-demo-role]').forEach((button) => {
    button.addEventListener('click', () => setDemoRole(button.dataset.demoRole));
  });
}

function signedOutMarkup() {
  return `<section class="panel pad workspace-shell">
    <div class="workspace-hero"><div><div class="eyebrow">Tasteprint · Campaign Workspace</div><h1>Sign in to your team workspace.</h1><p class="lede">The consumer product still works without an account. Workspace login exists only for people collaborating on campaigns.</p></div><a class="secondary" href="?workspace=1&demo=1">View local demo instead</a></div>
    <section class="card workspace-auth-card">
      <h2>Email me a secure sign-in link</h2>
      <form data-workspace-auth class="workspace-auth-form"><input type="email" name="email" maxlength="254" autocomplete="email" placeholder="you@example.com" required /><button class="primary" type="submit">Send sign-in link</button></form>
      <p class="small">Your Auth email is used for login only. Workspace membership tables do not duplicate it, and Workspace actions are not attached to anonymous Tasteprint analytics.</p>
      <p class="small" data-workspace-status role="status" aria-live="polite">${esc(status)}</p>
    </section>
  </section>`;
}

function emptyWorkspaceMarkup() {
  return `<section class="panel pad workspace-shell">
    <div class="workspace-hero"><div><div class="eyebrow">Tasteprint · Campaign Workspace</div><h1>Create your first workspace.</h1><p class="lede">A workspace is the private container for team roles and hosted campaign drafts. Consumer Tasteprints and anonymous analytics stay separate.</p></div><button class="secondary" type="button" data-workspace-signout>Sign out</button></div>
    <section class="card workspace-auth-card">
      <form data-create-workspace class="workspace-create-form">
        <label>Workspace name<input name="name" maxlength="120" placeholder="My studio" required /></label>
        <label>Workspace URL slug<input name="slug" maxlength="48" placeholder="my-studio" required /></label>
        <button class="primary" type="submit">Create private workspace</button>
      </form>
      <p class="small">You become the owner. New collaborators join through one-time invite links, so Tasteprint does not need an invitee email database.</p>
      <p class="small" data-workspace-status role="status" aria-live="polite">${esc(status)}</p>
    </section>
  </section>`;
}

function campaignRowsMarkup(role) {
  const canEdit = canWorkspace(role, 'campaign.edit');
  const canMetrics = canWorkspace(role, 'campaign.metrics.view');
  if (!campaigns.length) return `<div class="workspace-empty"><h3>No hosted drafts yet.</h3><p class="small">${canEdit ? 'Open Studio to create one, then save it into this workspace.' : 'An editor or admin can create the first hosted draft.'}</p></div>`;
  return campaigns.map((campaign) => {
    const manifest = campaign.manifest || {};
    const id = safeCampaignId(campaign.campaign_id);
    return `<div class="workspace-campaign-row">
      <div><strong>${esc(manifest.name || id)}</strong><div class="small">${esc(id)} · ${esc(campaign.status || 'draft')} · v${Number(campaign.version || 1)}</div></div>
      <div class="row">
        ${canMetrics ? `<a class="secondary" href="?campaignReport=${encodeURIComponent(id)}">Metrics</a>` : ''}
        ${canEdit ? `<a class="secondary" href="${studioURL(selectedWorkspace.id, id)}">Edit</a>` : ''}
        ${campaign.status === 'published' ? `<a class="secondary" href="?campaign=${encodeURIComponent(id)}&published=1">Public</a>` : ''}
      </div>
    </div>`;
  }).join('');
}

function memberRowsMarkup(role) {
  const owner = role === 'owner';
  if (!members.length) return '<p class="small">No member list returned yet.</p>';
  return members.map((member) => {
    const memberRole = normalizeWorkspaceRole(member.role);
    return `<div class="workspace-member-row">
      <div><strong>${member.is_me ? 'You' : `Member · ${esc(member.member_ref || 'private')}`}</strong><div class="small">Joined ${member.joined_at ? new Date(member.joined_at).toLocaleDateString() : 'recently'}</div></div>
      <div class="row">
        ${owner && memberRole !== 'owner' ? `<select data-member-role="${esc(member.member_ref)}" aria-label="Role for member ${esc(member.member_ref)}">${['admin','editor','analyst','viewer'].map((option) => `<option value="${option}" ${option === memberRole ? 'selected' : ''}>${workspaceRoleLabel(option)}</option>`).join('')}</select><button class="secondary" data-member-remove="${esc(member.member_ref)}">Remove</button>` : `<span class="workspace-role-pill">${esc(workspaceRoleLabel(memberRole))}</span>`}
      </div>
    </div>`;
  }).join('');
}

function renderWorkspace() {
  if (!selectedWorkspace) return emptyWorkspaceMarkupAndBind();
  const app = document.querySelector('#app');
  const role = normalizeWorkspaceRole(selectedWorkspace.role);
  const caps = workspaceCapabilities(role);
  const sampleManifest = campaigns[0]?.manifest || demoCampaign();
  document.title = `${selectedWorkspace.name} · Tasteprint Workspace`;
  app.innerHTML = `<section class="panel pad workspace-shell">
    <div class="workspace-hero">
      <div><div class="eyebrow">Tasteprint · Campaign Workspace</div><h1>${esc(selectedWorkspace.name)}</h1><p class="lede">Hosted drafts, role-based collaboration and aggregate campaign decisions without mixing team identity into anonymous consumer analytics.</p></div>
      <div class="workspace-hero-actions"><span class="workspace-role-pill">${esc(workspaceRoleLabel(role))}</span><button class="secondary" type="button" data-workspace-signout>Sign out</button></div>
    </div>

    ${workspaces.length > 1 ? `<label class="workspace-switcher">Workspace<select data-workspace-switch>${workspaces.map((workspace) => `<option value="${esc(workspace.id)}" ${workspace.id === selectedWorkspace.id ? 'selected' : ''}>${esc(workspace.name)} · ${esc(workspaceRoleLabel(workspace.role))}</option>`).join('')}</select></label>` : ''}

    <div class="workspace-grid">
      <section class="card">
        <div class="eyebrow">Your access</div><h2>${esc(workspaceRoleLabel(role))}</h2>${capabilityMarkup(role)}
      </section>
      <section class="card">
        <div class="eyebrow">Data boundary</div><h2>Team identity stays on the admin side.</h2>
        <p class="small">This workspace can see campaign drafts and aggregate metrics. It has no API for browsing anonymous consumer rows or raw campaign lead contacts.</p>
      </section>
    </div>

    <section class="card workspace-section">
      <div class="row spread"><div><div class="eyebrow">Hosted campaigns</div><h2>Shared drafts</h2></div>${caps.canEdit ? `<a class="primary" href="${studioURL(selectedWorkspace.id)}">Create in Studio</a>` : ''}</div>
      <div class="workspace-list">${campaignRowsMarkup(role)}</div>
    </section>

    <section class="card workspace-section">
      <div class="row spread"><div><div class="eyebrow">Team</div><h2>Members</h2></div><span class="small">No member email addresses stored here.</span></div>
      <div class="workspace-list">${memberRowsMarkup(role)}</div>
      ${caps.canInvite ? `<div class="workspace-invite-box"><h3>Create a one-time invite link</h3><div class="row"><select data-invite-role>${(role === 'owner' ? ['admin','editor','analyst','viewer'] : ['editor','analyst','viewer']).map((option) => `<option value="${option}">${workspaceRoleLabel(option)}</option>`).join('')}</select><button class="secondary" data-create-invite>Create invite link</button></div>${inviteURL ? `<div class="workspace-invite-output"><input readonly value="${esc(inviteURL)}" /><button class="secondary" data-copy-invite>Copy</button></div>` : ''}<p class="small">The link expires after seven days. The database stores only a SHA-256 hash of its random token, not an invitee email.</p></div>` : ''}
    </section>

    ${reviewMarkup(sampleManifest)}

    <p class="small" data-workspace-status role="status" aria-live="polite">${esc(status)}</p>
  </section>`;
  bindWorkspace();
}

function emptyWorkspaceMarkupAndBind() {
  const app = document.querySelector('#app');
  app.innerHTML = emptyWorkspaceMarkup();
  bindCommon();
  app.querySelector('[data-create-workspace]')?.addEventListener('submit', createWorkspace);
}

function bindCommon() {
  document.querySelector('[data-workspace-signout]')?.addEventListener('click', async () => {
    if (!client) return;
    await client.auth.signOut({ scope: 'local' });
    session = null;
    workspaces = [];
    selectedWorkspace = null;
    renderAuthState();
  });
}

function bindWorkspace() {
  bindCommon();
  document.querySelector('[data-workspace-switch]')?.addEventListener('change', async (event) => {
    selectedWorkspace = workspaces.find((workspace) => workspace.id === event.target.value) || selectedWorkspace;
    await loadWorkspaceData();
    renderWorkspace();
  });

  document.querySelector('[data-create-invite]')?.addEventListener('click', createInvite);
  document.querySelector('[data-copy-invite]')?.addEventListener('click', async () => {
    const copied = await copyText(inviteURL);
    setStatus(copied ? 'Invite link copied.' : 'Select and copy the invite link manually.');
  });

  document.querySelectorAll('[data-member-role]').forEach((select) => {
    select.addEventListener('change', async () => {
      if (!client || !selectedWorkspace) return;
      const { error } = await client.rpc('tasteprint_set_workspace_member_role', {
        p_workspace_id: selectedWorkspace.id,
        p_member_ref: select.dataset.memberRole,
        p_role: select.value
      });
      if (error) return setStatus(error.message || 'Could not update that role.');
      setStatus('Member role updated.');
      await loadWorkspaceData();
      renderWorkspace();
    });
  });

  document.querySelectorAll('[data-member-remove]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!client || !selectedWorkspace) return;
      if (button.dataset.confirm !== '1') {
        button.dataset.confirm = '1';
        button.textContent = 'Click again to remove';
        setTimeout(() => {
          if (button.isConnected) {
            button.dataset.confirm = '0';
            button.textContent = 'Remove';
          }
        }, 4500);
        return;
      }
      const { error } = await client.rpc('tasteprint_remove_workspace_member', {
        p_workspace_id: selectedWorkspace.id,
        p_member_ref: button.dataset.memberRemove
      });
      if (error) return setStatus(error.message || 'Could not remove that member.');
      setStatus('Member removed.');
      await loadWorkspaceData();
      renderWorkspace();
    });
  });
}

async function createWorkspace(event) {
  event.preventDefault();
  if (!client) return;
  const form = new FormData(event.currentTarget);
  const name = String(form.get('name') || '').trim();
  const slug = safeWorkspaceSlug(form.get('slug'));
  if (!name || slug.length < 2) return setStatus('Enter a workspace name and a simple URL slug.');
  setStatus('Creating private workspace…');
  const { data, error } = await client.rpc('tasteprint_create_workspace', { p_name: name, p_slug: slug });
  if (error) return setStatus(error.message || 'Could not create workspace.');
  await loadContext(data?.id || null);
  setStatus('Workspace created.');
  renderWorkspace();
}

async function createInvite() {
  if (!client || !selectedWorkspace) return;
  const role = document.querySelector('[data-invite-role]')?.value || 'viewer';
  setStatus('Creating one-time invite…');
  const { data, error } = await client.rpc('tasteprint_create_workspace_invite', {
    p_workspace_id: selectedWorkspace.id,
    p_role: role
  });
  if (error || !data?.token) return setStatus(error?.message || 'Could not create invite.');
  inviteURL = currentURL({ workspaceInvite: data.token });
  setStatus(`Invite ready for a ${workspaceRoleLabel(role).toLowerCase()}.`);
  renderWorkspace();
}

async function acceptInviteIfPresent() {
  const token = params.get('workspaceInvite');
  if (!token || !session?.user || !client) return false;
  setStatus('Accepting workspace invite…');
  const { data, error } = await client.rpc('tasteprint_accept_workspace_invite', { p_token: token });
  if (error) {
    setStatus(error.message || 'This invite is invalid or expired.');
    return false;
  }
  const next = new URL(location.href);
  next.search = '';
  next.searchParams.set('workspace', '1');
  if (data?.workspace_id) next.searchParams.set('team', data.workspace_id);
  history.replaceState({}, '', next.toString());
  setStatus(`Joined ${data?.workspace_name || 'workspace'} as ${workspaceRoleLabel(data?.role)}.`);
  return true;
}

async function loadContext(preferredId = null) {
  if (!client || !session?.user) return;
  const { data, error } = await client.rpc('tasteprint_workspace_context');
  if (error) throw error;
  workspaces = (Array.isArray(data) ? data : []).map(sanitizeWorkspaceRecord).filter((item) => item.id);
  const requested = preferredId || new URL(location.href).searchParams.get('team');
  selectedWorkspace = workspaces.find((workspace) => workspace.id === requested) || workspaces[0] || null;
  await loadWorkspaceData();
}

async function loadWorkspaceData() {
  campaigns = [];
  members = [];
  inviteURL = '';
  if (!client || !selectedWorkspace) return;
  const [campaignResult, memberResult] = await Promise.all([
    client.from('tasteprint_workspace_campaigns')
      .select('workspace_id,campaign_id,manifest,status,version,updated_at')
      .eq('workspace_id', selectedWorkspace.id)
      .order('updated_at', { ascending: false })
      .limit(80),
    client.rpc('tasteprint_workspace_members_public', { p_workspace_id: selectedWorkspace.id })
  ]);
  if (campaignResult.error) throw campaignResult.error;
  if (memberResult.error) throw memberResult.error;
  campaigns = Array.isArray(campaignResult.data) ? campaignResult.data : [];
  members = Array.isArray(memberResult.data) ? memberResult.data : [];
}

function renderAuthState() {
  if (!WORKSPACE_MODE) return;
  if (!REMOTE_ENABLED || params.get('demo') === '1') return renderDemo();
  const app = document.querySelector('#app');
  if (!session?.user) {
    app.innerHTML = signedOutMarkup();
    app.querySelector('[data-workspace-auth]')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = String(new FormData(event.currentTarget).get('email') || '').trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) return setStatus('Enter a valid email address.');
      setStatus('Sending a one-time sign-in link…');
      const { error } = await client.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true, emailRedirectTo: authRedirectURL() }
      });
      setStatus(error ? (error.message || 'Could not send sign-in link.') : 'Check your email. The link will return you to this workspace.');
    });
    return;
  }
  if (!workspaces.length) return emptyWorkspaceMarkupAndBind();
  renderWorkspace();
}

async function initialize() {
  if (!WORKSPACE_MODE) return;
  if (!REMOTE_ENABLED || params.get('demo') === '1') return renderDemo();
  try {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    session = data.session || null;
    if (session?.user) {
      await acceptInviteIfPresent();
      await loadContext();
    }
    renderAuthState();
    client.auth.onAuthStateChange(async (_event, nextSession) => {
      session = nextSession || null;
      if (session?.user) await loadContext().catch(() => {});
      renderAuthState();
    });
  } catch (error) {
    console.warn('Tasteprint workspace initialization failed', error);
    status = 'Workspace backend could not initialize. The local demo is still available.';
    renderDemo();
  }
}

window.TasteprintWorkspace = Object.freeze({
  remoteEnabled: () => REMOTE_ENABLED,
  demo: () => !REMOTE_ENABLED || params.get('demo') === '1',
  session: () => session,
  workspaces: () => structuredClone(workspaces),
  selected: () => selectedWorkspace ? structuredClone(selectedWorkspace) : null,
  can: (permission) => canWorkspace(selectedWorkspace?.role || demoRole, permission),
  reviewCampaignExperience
});

initialize();
