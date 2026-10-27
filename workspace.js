import {authReturnNotice} from './auth-return-core.js';
import {authenticatedSocialRequest} from './social-request.js';
import {recoverAuthSession} from './auth-session-core.js';
import './workspace-report-links.js';
import { getCampaign } from './campaign-config.js';
import { supabaseAuthClient as client, AUTH_RETURN_FAILED } from './supabase-auth.js';
import { SUPABASE_PUBLIC_ENABLED as REMOTE_ENABLED, SUPABASE_URL, SUPABASE_PUBLIC_KEY } from './supabase-public.js';
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
const DEMO_ROLE_KEY = 'tasteprint.workspace-demo-role.v1';

let session = null;
let workspaces = [];
let selectedWorkspace = null;
let campaigns = [];
let members = [];
let status = '';
let inviteURL = '';
let demoRole = readDemoRole();
let generation=0,authRevision=0,sessionInitialized=false,subscribed=false,busyOperation=null;
const send=authenticatedSocialRequest({url:SUPABASE_URL,publicKey:SUPABASE_PUBLIC_KEY,getSession:()=>recoverAuthSession(client.auth),label:'Workspace requests'});
function operation(){const actor=session?.user?.id,epoch=generation;return {actor,current:()=>Boolean(actor)&&session?.user?.id===actor&&generation===epoch};}
function clearTeamData(){if(WORKSPACE_MODE)document.title='Campaign Workspace · Tasteprint';workspaces=[];selectedWorkspace=null;campaigns=[];members=[];inviteURL='';status='';}
function acceptSession(next){const changed=session?.user?.id!==next?.user?.id;if(changed){generation++;busyOperation=null;clearTeamData();}session=next||null;return changed;}
const rpc=(name,body,op)=>send(`rpc/${name}`,{body:body||{},expectedActor:op.actor,guard:op.current});
function unavailable(op=null){
 if(op&&!op.current())return;
 clearTeamData();const app=document.querySelector('#app');
 app.innerHTML='<section class="panel pad workspace-view"><h1>Workspace is unavailable.</h1><p>We could not confirm account access or load this team. No local workspace or reporting data was substituted.</p><button class="primary" id="retry-workspace">Try again</button><p><a href="?workspace=1&amp;demo=1">Open the separate fictional Workspace demo</a></p></section>';
 app.querySelector('#retry-workspace').addEventListener('click',()=>location.reload());
}
function pending(){document.querySelector('#app').innerHTML='<section class="panel pad workspace-view"><h1>Opening your Workspace.</h1><p role="status">Checking account and team access…</p></section>';}
async function run(task,op=operation()){
 if(!op.current()||busyOperation?.current())return;
 busyOperation=op;
 const controls=[...document.querySelectorAll('#app button:not([data-workspace-signout]),#app input,#app select')].map(node=>({node,disabled:node.disabled}));controls.forEach(({node})=>node.disabled=true);
 try{await task(op);}catch{unavailable(op);}finally{if(busyOperation===op){busyOperation=null;controls.forEach(({node,disabled})=>{if(node.isConnected)node.disabled=disabled;});}}
}


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
  const inviteToken = params.get('workspaceInvite');
  return currentURL({
    auth: 'return',
    ...(inviteToken ? { workspaceInvite: inviteToken } : {})
  });
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
  app.innerHTML = `<section class="panel pad workspace-shell">${authReturnNotice(REMOTE_ENABLED&&AUTH_RETURN_FAILED,true)}
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
  const inviteNote = params.get('workspaceInvite')
    ? '<p class="small"><strong>You were invited to a Workspace.</strong> Sign in with this browser and Tasteprint will accept the one-time invite after the magic-link return.</p>'
    : '';
  return `<section class="panel pad workspace-shell">${authReturnNotice(REMOTE_ENABLED&&AUTH_RETURN_FAILED,true)}
    <div class="workspace-hero"><div><div class="eyebrow">Tasteprint · Campaign Workspace</div><h1>Sign in to your team workspace.</h1><p class="lede">The consumer product still works without an account. Workspace login exists only for people collaborating on campaigns.</p></div><a class="secondary" href="?workspace=1&demo=1">View local demo instead</a></div>
    <section class="card workspace-auth-card">
      <h2>Email me a secure sign-in link</h2>
      ${inviteNote}
      <form data-workspace-auth class="workspace-auth-form"><label>Email address<input type="email" name="email" maxlength="254" autocomplete="email" placeholder="you@example.com" required /></label><button class="primary" type="submit">Send sign-in link</button></form>
      <p class="small">Your Auth email is used for login only. Workspace membership tables do not duplicate it, and Workspace actions are not attached to anonymous Tasteprint analytics.</p>
      <p class="small" data-workspace-status role="status" aria-live="polite">${esc(status)}</p>
    </section>
  </section>`;
}

function emptyWorkspaceMarkup() {
  return `<section class="panel pad workspace-shell">${authReturnNotice(REMOTE_ENABLED&&AUTH_RETURN_FAILED,true)}
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
  app.innerHTML = `<section class="panel pad workspace-shell">${authReturnNotice(REMOTE_ENABLED&&AUTH_RETURN_FAILED,true)}
    <div class="workspace-hero">
      <div><div class="eyebrow">Tasteprint · Campaign Workspace</div><h1>${esc(selectedWorkspace.name)}</h1><p class="lede">Hosted drafts, role-based collaboration and aggregate campaign decisions without mixing team identity into anonymous consumer analytics.</p></div>
      <div class="workspace-hero-actions"><span class="workspace-role-pill">${esc(workspaceRoleLabel(role))}</span><button class="secondary" type="button" data-workspace-signout>Sign out</button></div>
    </div>

    ${workspaces.length > 1 ? `<label class="workspace-switcher">Workspace<select data-workspace-switch aria-label="Workspace">${workspaces.map((workspace) => `<option value="${esc(workspace.id)}" ${workspace.id === selectedWorkspace.id ? 'selected' : ''}>${esc(workspace.name)} · ${esc(workspaceRoleLabel(workspace.role))}</option>`).join('')}</select></label>` : ''}

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
      ${caps.canInvite ? `<div class="workspace-invite-box"><h3>Create a one-time invite link</h3><div class="row"><select data-invite-role aria-label="Invitation role">${(role === 'owner' ? ['admin','editor','analyst','viewer'] : ['editor','analyst','viewer']).map((option) => `<option value="${option}">${workspaceRoleLabel(option)}</option>`).join('')}</select><button class="secondary" data-create-invite>Create invite link</button></div>${inviteURL ? `<div class="workspace-invite-output"><input readonly value="${esc(inviteURL)}" /><button class="secondary" data-copy-invite>Copy</button></div>` : ''}<p class="small">The link expires after seven days. The database stores only a SHA-256 hash of its random token, not an invitee email.</p></div>` : ''}
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
    const op=operation();await client.auth.signOut({ scope: 'local' });
    if(session?.user&&session.user.id!==op.actor)return;
    generation++;busyOperation=null;acceptSession(null);clearTeamData();renderAuthState();
  });
}

function bindWorkspace() {
  bindCommon();
  document.querySelector('[data-workspace-switch]')?.addEventListener('change', async (event) => {
    const next=workspaces.find(workspace=>workspace.id===event.target.value);if(!next)return;
    generation++;busyOperation=null;selectedWorkspace=next;
    await run(async op=>{await loadWorkspaceData(op);if(op.current())renderWorkspace();});
  });

  document.querySelector('[data-create-invite]')?.addEventListener('click', createInvite);
  document.querySelector('[data-copy-invite]')?.addEventListener('click', async () => {
    const copied = await copyText(inviteURL);
    setStatus(copied ? 'Invite link copied.' : 'Select and copy the invite link manually.');
  });

  document.querySelectorAll('[data-member-role]').forEach((select) => {
    select.addEventListener('change', async () => {
      if (!client || !selectedWorkspace) return;
      const id=selectedWorkspace.id,ref=select.dataset.memberRole,role=select.value;
      await run(async op=>{await rpc('tasteprint_set_workspace_member_role',{p_workspace_id:id,p_member_ref:ref,p_role:role},op);await loadWorkspaceData(op);if(op.current()){setStatus('Member role updated.');renderWorkspace();}});
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
      const id=selectedWorkspace.id,ref=button.dataset.memberRemove;
      await run(async op=>{await rpc('tasteprint_remove_workspace_member',{p_workspace_id:id,p_member_ref:ref},op);await loadWorkspaceData(op);if(op.current()){setStatus('Member removed.');renderWorkspace();}});
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
  await run(async op=>{
    setStatus('Creating private workspace…');
    const data=await rpc('tasteprint_create_workspace',{p_name:name,p_slug:slug},op);
    await loadContext(data?.id||null,op);if(op.current()){setStatus('Workspace created.');renderAuthState();}
  });
}

async function createInvite(){
 if(!client||!selectedWorkspace)return;const id=selectedWorkspace.id,role=document.querySelector('[data-invite-role]')?.value||'viewer';
 await run(async op=>{setStatus('Creating one-time invite…');const data=await rpc('tasteprint_create_workspace_invite',{p_workspace_id:id,p_role:role},op);if(!op.current())return;if(typeof data?.token!=='string'||!/^[a-f0-9]{48}$/.test(data.token))throw Error('Invitation unavailable');inviteURL=currentURL({workspaceInvite:data.token});setStatus(`Invite ready for a ${workspaceRoleLabel(role).toLowerCase()}.`);renderWorkspace();});
}

async function acceptInviteIfPresent(op){
 const token=new URL(location.href).searchParams.get('workspaceInvite');if(!token||!op.current())return false;
 setStatus('Accepting workspace invite…');const data=await rpc('tasteprint_accept_workspace_invite',{p_token:token},op);if(!op.current())return false;
 const next=new URL(location.href);next.search='';next.searchParams.set('workspace','1');if(data?.workspace_id)next.searchParams.set('team',data.workspace_id);history.replaceState({},'',next.toString());setStatus(`Joined ${data?.workspace_name||'workspace'} as ${workspaceRoleLabel(data?.role)}.`);return true;
}

async function loadContext(preferredId=null,op=operation()){
 if(!client||!op.current())return;
 const data=await rpc('tasteprint_workspace_context',{},op);if(!op.current())return;
 if(!Array.isArray(data))throw Error('Invalid workspace context');
 const next=data.map(sanitizeWorkspaceRecord).filter(item=>item.id),requested=preferredId||new URL(location.href).searchParams.get('team');
 const selected=next.find(workspace=>workspace.id===requested)||(requested?null:next[0])||null;
 if(requested&&!selected)throw Error('Requested workspace unavailable');
 workspaces=next;selectedWorkspace=selected;await loadWorkspaceData(op);
}

async function loadWorkspaceData(op=operation()){
 if(!op.current())return;campaigns=[];members=[];inviteURL='';const id=selectedWorkspace?.id;if(!client||!id)return;
 const [nextCampaigns,nextMembers]=await Promise.all([
  send(`tasteprint_workspace_campaigns?select=workspace_id,campaign_id,manifest,status,version,updated_at&workspace_id=eq.${encodeURIComponent(id)}&order=updated_at.desc&limit=80`,{method:'GET',expectedActor:op.actor,guard:op.current}),
  rpc('tasteprint_workspace_members_public',{p_workspace_id:id},op)
 ]);
 if(!op.current()||selectedWorkspace?.id!==id)return;
 if(!Array.isArray(nextCampaigns)||!Array.isArray(nextMembers))throw Error('Invalid workspace data');campaigns=nextCampaigns;members=nextMembers;
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
      setStatus(error ? (error.message || 'Could not send sign-in link.') : 'Check your email. The link will return you to this workspace and preserve the one-time invite if one was supplied.');
    });
    return;
  }
  if (!workspaces.length) return emptyWorkspaceMarkupAndBind();
  renderWorkspace();
}

async function refreshContext(op=operation()){
 return run(async()=>{await acceptInviteIfPresent(op);await loadContext(null,op);if(op.current())renderAuthState();},op);
}
function authChanged(event,nextSession){
 authRevision++;const first=!sessionInitialized,changed=acceptSession(event==='SIGNED_OUT'?null:nextSession);sessionInitialized=true;
 if(event==='SIGNED_OUT'){generation++;busyOperation=null;clearTeamData();}
 if(!session?.user){renderAuthState();return;}
 if(!first&&!changed)return;
 pending();const op=operation();setTimeout(()=>{if(op.current())void refreshContext(op);},0);
}
async function initialize(){
 if(!WORKSPACE_MODE)return;
 if(!REMOTE_ENABLED||params.get('demo')==='1')return renderDemo();
 pending();
 if(!subscribed){client.auth.onAuthStateChange(authChanged);subscribed=true;}
 const revision=authRevision;
 try{const next=await recoverAuthSession(client.auth);if(revision!==authRevision)return;acceptSession(next);sessionInitialized=true;if(session?.user)await refreshContext();else renderAuthState();}
 catch{if(revision===authRevision){acceptSession(null);unavailable();}}
}

window.TasteprintWorkspace = Object.freeze({
  remoteEnabled: () => REMOTE_ENABLED,
  demo: () => !REMOTE_ENABLED || params.get('demo') === '1',
  session: () => session,
  workspaces: () => structuredClone(workspaces),
  selected: () => selectedWorkspace ? structuredClone(selectedWorkspace) : null,
  can: (permission) => canWorkspace((!REMOTE_ENABLED||params.get('demo')==='1')?demoRole:selectedWorkspace?.role,permission),
  reviewCampaignExperience
});

initialize();
