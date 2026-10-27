import {authenticatedSocialRequest} from './social-request.js';
import {recoverAuthSession} from './auth-session-core.js';
import {
  getCampaign,
  saveCampaignDraft,
  validateCampaignManifest
} from './campaign-config.js';
import { parseCatalogText, validateCatalog } from './campaign-import.js';
import { publishCampaign, unpublishCampaign } from './campaign-remote.js';
import { supabaseAuthClient as client } from './supabase-auth.js';
import { SUPABASE_PUBLIC_ENABLED as REMOTE_ENABLED, SUPABASE_URL, SUPABASE_PUBLIC_KEY } from './supabase-public.js';
import {
  canWorkspace,
  WORKSPACE_ROLES,
  normalizeWorkspaceRole,
  reviewCampaignExperience,
  safeCampaignId,
  workspaceRoleLabel
} from './workspace-core.js';

const params = new URL(location.href).searchParams;
const ADMIN_MODE = params.get('campaignAdmin') === '1';
const WORKSPACE_ID = params.get('workspace') || '';
const HOSTED_CAMPAIGN = safeCampaignId(params.get('hosted') || '');
const DEMO_WORKSPACE = WORKSPACE_ID === 'demo-workspace';
const VALID_WORKSPACE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(WORKSPACE_ID);

let session = null;
let role = DEMO_WORKSPACE ? normalizeWorkspaceRole(readDemoRole()) : null;
let injected = false;
let loadedHosted = false;
let initialEditorFingerprint=null;
const hostedVersions=new Map();
let generation=0,studioRevision=0,studioBusy=null,bridgeMessage='',bridgeKind='';
const send=authenticatedSocialRequest({url:SUPABASE_URL,publicKey:SUPABASE_PUBLIC_KEY,getSession:()=>recoverAuthSession(client.auth),label:'Studio requests'});
function studioOperation(){const actor=session?.user?.id,epoch=generation;return {actor,current:()=>generation===epoch&&(DEMO_WORKSPACE||Boolean(actor)&&session?.user?.id===actor)};}
function formFingerprint(){return JSON.stringify([...document.querySelectorAll('.campaign-admin input,.campaign-admin textarea,.campaign-admin select')].filter(node=>!node.matches('[data-confirm-team-load]')).map(node=>[node.name||node.id||node.dataset.offerField||node.type,node.type==='checkbox'?node.checked:node.value]));}
async function runStudio(task){
 if(studioBusy?.current())return;const op=studioOperation();if(!op.current())return setBridgeStatus('Sign in through Workspace to confirm team access.','bad');studioBusy=op;refreshTeamControls();
 try{return await task(op);}catch{if(op.current())setBridgeStatus('Could not confirm the team request. Your local editor was kept; review the team state before retrying.','bad');return false;}
 finally{if(studioBusy===op){studioBusy=null;refreshTeamControls();}}
}


function readDemoRole() {
  try { return sessionStorage.getItem('tasteprint.workspace-demo-role.v1') || 'owner'; } catch { return 'owner'; }
}

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formValue(name) {
  return document.querySelector(`#app [name="${name}"]`)?.value?.trim() || '';
}

function checked(name) {
  return Boolean(document.querySelector(`#app [name="${name}"]`)?.checked);
}

function safeAccent(value) {
  return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value) : '#5b8cff';
}

function rgbaFromHex(hex, alpha) {
  const value = safeAccent(hex).slice(1);
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function currentCatalog() {
  const editor = document.querySelector('#catalog-editor');
  const text = editor?.value || '';
  if (!text.trim()) return [];
  try { return parseCatalogText(text, 'catalog.json'); } catch { return []; }
}

function currentManifest() {
  if (window.TasteprintStudio?.manifest) return window.TasteprintStudio.manifest();
  const accent = safeAccent(formValue('accent'));
  const name = formValue('name');
  return {
    id: safeCampaignId(formValue('id')),
    name,
    label: formValue('label') || `${name} × Tasteprint`,
    description: formValue('description'),
    localDraft: true,
    theme: {
      accent,
      accentSoft: rgbaFromHex(accent, .16),
      accentMid: rgbaFromHex(accent, .32),
      heroGlow: rgbaFromHex(accent, .22)
    },
    copy: {
      title: formValue('title'),
      lede: formValue('lede'),
      start: formValue('start') || 'Find my match',
      resultEyebrow: formValue('resultEyebrow') || 'Your matched Tasteprint',
      catalogTitle: formValue('catalogTitle') || `${name} picks for this Tasteprint`,
      catalogSubtitle: formValue('catalogSubtitle') || 'Recommendations matched to how this result actually behaves.'
    },
    scoring: { dimensionMultipliers: {} },
    leadCapture: {
      enabled: checked('leadEnabled'),
      demoOnly: checked('leadDemoOnly'),
      collectName: checked('leadCollectName'),
      title: formValue('leadTitle'),
      body: formValue('leadBody'),
      consentText: formValue('leadConsentText'),
      privacyUrl: formValue('leadPrivacyUrl') || null,
      consentVersion: formValue('leadConsentVersion') || 'v1',
      submitLabel: formValue('leadSubmitLabel') || 'Send me the details',
      successText: formValue('leadSuccessText') || 'Got it. Your request was submitted.'
    },
    catalog: currentCatalog()
  };
}

function validateManifest(manifest) {
  return [...validateCatalog(manifest.catalog || []), ...validateCampaignManifest(manifest)];
}

function setBridgeStatus(message, kind = '') {
  bridgeMessage=String(message||'');bridgeKind=kind;
  const status = document.querySelector('[data-studio-workspace-status]');
  if (!status) return;
  status.textContent = message;
  status.dataset.kind = kind;
}

function experienceMarkup(manifest) {
  const review = reviewCampaignExperience(manifest);
  return `<div class="row spread"><div><div class="eyebrow">Tasteprint · Experience QA</div><h2>${esc(review.grade)}</h2></div><div><span class="studio-experience-score">${review.score}/100</span></div></div>
    <p class="small">Before a campaign is allowed to feel “done,” it should reduce decision friction, preserve agency, give useful options, and avoid collecting data it does not need.</p>
    <div class="studio-experience-grid">${review.checks.map((item) => `<div class="studio-experience-item"><strong>${item.passed ? '✓' : item.severity === 'privacy' ? '!' : '○'} ${esc(item.title)}</strong><span class="small">${esc(item.copy)}</span></div>`).join('')}</div>
    ${review.blocking.length ? '<p class="small" style="margin-top:10px"><strong>Publishing blocked:</strong> fix the privacy/security checks above first.</p>' : ''}`;
}

function refreshExperience() {
  const host = document.querySelector('[data-studio-experience]');
  if (!host) return;
  host.innerHTML = experienceMarkup(currentManifest());
}

function backToWorkspaceURL() {
  if (DEMO_WORKSPACE) return '?workspace=1&demo=1';
  return `?workspace=1&team=${encodeURIComponent(WORKSPACE_ID)}`;
}

function bridgeMarkup() {
  const isTeam = DEMO_WORKSPACE || VALID_WORKSPACE;
  const canEdit = canWorkspace(role, 'campaign.edit');
  const canPublish = canWorkspace(role, 'campaign.publish');
  const modeCopy = DEMO_WORKSPACE
    ? 'Demo workspace. Team saves and publishing are simulated locally.'
    : VALID_WORKSPACE && REMOTE_ENABLED
      ? session?.user&&role?`Authenticated team workspace · ${workspaceRoleLabel(role)}.`:'Team access could not be confirmed. Sign in through Workspace to try again.'
      : VALID_WORKSPACE
        ? 'This team workspace cannot connect until Supabase is configured. The Studio itself still works locally.'
        : 'This Studio is local-only. Open Campaign Workspace when you want hosted team drafts and authenticated publishing.';

  return `<section class="card admin-section studio-workspace-card" data-studio-workspace>
    <div class="row spread"><div><div class="eyebrow">Team + publishing</div><h2>${isTeam ? 'Campaign Workspace' : 'Local Studio mode'}</h2></div><a class="secondary" href="${isTeam ? backToWorkspaceURL() : '?workspace=1&demo=1'}">${isTeam ? 'Back to workspace' : 'See workspace demo'}</a></div>
    <p class="small">${esc(modeCopy)}</p>
    ${isTeam ? `<div class="studio-workspace-actions">
      <button class="secondary" type="button" data-team-save ${canEdit&&!studioBusy ? '' : 'disabled'}>${DEMO_WORKSPACE ? 'Simulate team save' : 'Save to team workspace'}</button>
      <button class="primary" type="button" data-team-publish ${canPublish && VALID_WORKSPACE && REMOTE_ENABLED&&!studioBusy ? '' : 'disabled'}>Publish with team permission</button>
      <button class="danger" type="button" data-team-unpublish ${canPublish && VALID_WORKSPACE && REMOTE_ENABLED&&!studioBusy ? '' : 'disabled'}>Unpublish</button>
    </div>` : ''}
    ${VALID_WORKSPACE?`<label class="small"><span><input type="checkbox" data-confirm-team-load> I saved or exported local changes before loading the team version</span></label><button class="secondary" data-team-load-hosted ${role&&!studioBusy?'':'disabled'}>Load team version</button><p class="small">Loading replaces the visible form after confirmation. Saved local drafts are kept until you explicitly save over or remove them.</p>`:''}
    <p class="small" data-studio-workspace-status data-kind="${esc(bridgeKind)}" role="status" aria-live="polite">${esc(bridgeMessage)}</p>
  </section>`;
}

function hideLegacyPublishToken() {
  const token = document.querySelector('#publish-token');
  const legacySection = token?.closest('.admin-section');
  if (legacySection) {
    legacySection.hidden = true;
    legacySection.setAttribute('aria-hidden', 'true');
  }
}

async function loadHostedCampaign(op=studioOperation(),force=false){
 const target=force?safeCampaignId(formValue('id')):HOSTED_CAMPAIGN;
 if(force&&!target){if(op.current())setBridgeStatus('Enter a campaign ID before loading its team version.','bad');return;}
 if((loadedHosted&&!force)||!target||!VALID_WORKSPACE||!client||!op.current()||!role)return;
 loadedHosted=true;
 if(!force&&initialEditorFingerprint!==null&&initialEditorFingerprint!==formFingerprint()){setBridgeStatus('Your local edits were kept. Confirm Load team version when you are ready to replace the visible form.','bad');return;}
 const local=getCampaign(target);
 if(local?.localDraft&&!force){window.TasteprintStudio?.load?.(local);if(op.current())setBridgeStatus('Your saved local draft was kept. Confirm Load team version if you want to replace the visible form.','good');return;}
 const before=formFingerprint();
 try{
  const rows=await send(`tasteprint_workspace_campaigns?select=manifest,version,workspace_id,campaign_id&workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&campaign_id=eq.${encodeURIComponent(target)}&limit=1`,{method:'GET',expectedActor:op.actor,guard:op.current});
  if(!op.current())return;
  if(!Array.isArray(rows)||rows.length!==1||rows[0]?.workspace_id!==WORKSPACE_ID||rows[0]?.campaign_id!==target||rows[0]?.manifest?.id!==target||!Number.isInteger(rows[0]?.version)||rows[0].version<1||validateManifest(rows[0].manifest).length)throw Error('Hosted draft unavailable');
  if(before!==formFingerprint()){setBridgeStatus('Your local edits were kept. Confirm Load team version when you are ready to replace the visible form.','bad');return;}
  if(!window.TasteprintStudio?.load?.(rows[0].manifest))throw Error('Editor not ready');
  hostedVersions.set(target,rows[0].version);
  setBridgeStatus('Team draft loaded into this editor. Saved local drafts were not overwritten.','good');refreshExperience();
 }catch{if(op.current())setBridgeStatus('Hosted draft could not be confirmed. Your local editor was kept.','bad');}
}

async function saveToWorkspace(op=studioOperation()) {
  const manifest = currentManifest();
  const errors = validateManifest(manifest);
  const review = reviewCampaignExperience(manifest);
  if (errors.length) {
    setBridgeStatus(errors[0], 'bad');
    return false;
  }
  if (review.blocking.length) {
    setBridgeStatus('Fix the privacy/security Experience QA blocks before saving a hosted draft.', 'bad');
    return false;
  }

  if (DEMO_WORKSPACE) {
    const saved = saveCampaignDraft(manifest);
    setBridgeStatus(saved.ok ? 'Demo team save complete. Nothing left this browser.' : (saved.errors?.[0] || 'Could not save demo draft.'), saved.ok ? 'good' : 'bad');
    return Boolean(saved.ok);
  }
  if (!VALID_WORKSPACE || !client || !session?.user) {
    setBridgeStatus('Sign in through Campaign Workspace before saving hosted drafts.', 'bad');
    return false;
  }
  if (!canWorkspace(role, 'campaign.edit')) {
    setBridgeStatus('Your workspace role is read-only for campaign drafts.', 'bad');
    return false;
  }

  const cleanManifest = structuredClone(manifest);
  delete cleanManifest.localDraft;
  const beforeForm=formFingerprint(),beforeLocal=JSON.stringify(getCampaign(cleanManifest.id));
  const resource=`tasteprint_workspace_campaigns?workspace_id=eq.${encodeURIComponent(WORKSPACE_ID)}&campaign_id=eq.${encodeURIComponent(cleanManifest.id)}`;
  let expected=hostedVersions.get(cleanManifest.id),rows;
  if(expected===undefined){
    const existing=await send(resource+'&select=version&limit=1',{method:'GET',expectedActor:op.actor,guard:op.current});
    if(!op.current())return false;
    if(!Array.isArray(existing)||existing.length>1)throw Error('Team draft unavailable');
    if(existing.length){setBridgeStatus('A team draft already exists. Your local work was kept. Save or export it, then confirm Load team version before editing that shared draft.','bad');return false;}
    expected=0;
    // Insert only: if another editor creates this ID first, never upsert over it.
    rows=await send('tasteprint_workspace_campaigns?select=workspace_id,campaign_id,version',{
      body:{workspace_id:WORKSPACE_ID,campaign_id:cleanManifest.id,manifest:cleanManifest,status:'draft',updated_by:op.actor,version:1},
      headers:{Prefer:'return=representation'},expectedActor:op.actor,guard:op.current
    });
  }else{
    rows=await send(resource+`&version=eq.${expected}&select=workspace_id,campaign_id,version`,{
      method:'PATCH',body:{manifest:cleanManifest,status:'draft',updated_by:op.actor,version:expected+1},
      headers:{Prefer:'return=representation'},expectedActor:op.actor,guard:op.current
    });
    if(Array.isArray(rows)&&rows.length===0){setBridgeStatus('The team draft changed or was removed. Your local work was kept. Save or export it, then confirm Load team version to review the latest draft before retrying.','bad');return false;}
  }
  if(!Array.isArray(rows)||rows.length!==1||rows[0]?.workspace_id!==WORKSPACE_ID||rows[0]?.campaign_id!==cleanManifest.id||rows[0]?.version!==expected+1)throw Error('Team save acknowledgement unavailable');
  if(!op.current())return false;
  hostedVersions.set(cleanManifest.id,rows[0].version);
  if(beforeForm!==formFingerprint()||beforeLocal!==JSON.stringify(getCampaign(cleanManifest.id))){setBridgeStatus('Team draft saved. Your newer local edits were kept; save them separately when ready.','good');return true;}
  const localSaved=saveCampaignDraft({ ...cleanManifest, localDraft: true });
  if(!op.current())return false;
  setBridgeStatus(localSaved?.ok?'Hosted draft saved for your workspace. No consumer or lead data was copied into it.':'Team draft saved. A browser backup could not be saved; your visible edits were kept. Download the manifest for a backup.', 'good');
  return true;
}

async function publishFromWorkspace(op=studioOperation()) {
  const manifest = currentManifest();
  const errors = validateManifest(manifest);
  const review = reviewCampaignExperience(manifest);
  if (errors.length) return setBridgeStatus(errors[0], 'bad');
  if (review.blocking.length) return setBridgeStatus('Publishing is blocked until the privacy/security Experience QA checks pass.', 'bad');
  if (!canWorkspace(role, 'campaign.publish')) return setBridgeStatus('Owner or admin permission is required to publish.', 'bad');

  const saved = await saveToWorkspace(op);
  if (!saved||!op.current()) return;
  setBridgeStatus('Publishing through your authenticated workspace…');
  const result = await publishCampaign(manifest,'',op);
  if(!op.current())return;
  setBridgeStatus(result.ok ? `Published ${manifest.id} as version ${result.version}.` : (result.error || 'Publish failed.'), result.ok ? 'good' : 'bad');
}

async function unpublishFromWorkspace(op=studioOperation()) {
  const id = safeCampaignId(formValue('id'));
  if (!id) return setBridgeStatus('Campaign id is required.', 'bad');
  if (!canWorkspace(role, 'campaign.publish')) return setBridgeStatus('Owner or admin permission is required to unpublish.', 'bad');
  setBridgeStatus(`Unpublishing ${id}…`);
  const result = await unpublishCampaign(id,'',op);
  if(!op.current())return;
  setBridgeStatus(result.ok ? `${id} is no longer public.` : (result.error || 'Unpublish failed.'), result.ok ? 'good' : 'bad');
}

function inject() {
  if (!ADMIN_MODE) return;
  const admin = document.querySelector('.campaign-admin');
  const saveSection = document.querySelector('#save-preview')?.closest('.admin-launch,.admin-section');
  if (!admin || !saveSection || admin.querySelector('[data-studio-workspace]')) return;
  injected = true;

  hideLegacyPublishToken();

  const experience = document.createElement('section');
  experience.className = 'card admin-section studio-workspace-card';
  experience.dataset.studioExperience = '1';
  experience.innerHTML = experienceMarkup(currentManifest());
  saveSection.insertAdjacentElement('afterend', experience);

  const bridge = document.createElement('div');
  bridge.innerHTML = bridgeMarkup();
  experience.insertAdjacentElement('afterend', bridge.firstElementChild);

  bindTeamControls();

  admin.addEventListener('input', () => requestAnimationFrame(refreshExperience));
  admin.addEventListener('change', () => requestAnimationFrame(refreshExperience));
  document.querySelector('#parse-catalog')?.addEventListener('click', () => setTimeout(refreshExperience, 0));
  document.querySelector('#load-aster')?.addEventListener('click', () => setTimeout(refreshExperience, 0));
  loadHostedCampaign();
}

function bindTeamControls(){
 document.querySelector('[data-team-save]')?.addEventListener('click',()=>runStudio(saveToWorkspace));
 document.querySelector('[data-team-publish]')?.addEventListener('click',()=>runStudio(publishFromWorkspace));
 document.querySelector('[data-team-unpublish]')?.addEventListener('click',()=>runStudio(unpublishFromWorkspace));
 document.querySelector('[data-team-load-hosted]')?.addEventListener('click',()=>{if(!document.querySelector('[data-confirm-team-load]')?.checked)return setBridgeStatus('Save or export local changes first, then confirm loading the team version.','bad');return runStudio(op=>loadHostedCampaign(op,true));});
}
function refreshTeamControls(){
 if(!injected)return;const current=document.querySelector('[data-studio-workspace]');if(!current)return;
 const wrapper=document.createElement('div');wrapper.innerHTML=bridgeMarkup();current.replaceWith(wrapper.firstElementChild);bindTeamControls();
}
async function loadStudioRole(op=studioOperation()){
 try{const data=await send('rpc/tasteprint_workspace_role',{body:{p_workspace_id:WORKSPACE_ID},expectedActor:op.actor,guard:op.current});if(!op.current())return;role=WORKSPACE_ROLES.includes(data)?data:null;refreshTeamControls();if(injected&&role)await loadHostedCampaign(op);}
 catch{if(op.current()){role=null;refreshTeamControls();}}
}
function studioAuthChanged(event,next){
 studioRevision++;const previous=session?.user?.id;session=event==='SIGNED_OUT'?null:next||null;
 if(previous===session?.user?.id&&event!=='SIGNED_OUT')return;
 generation++;hostedVersions.clear();studioBusy=null;role=null;if(previous)loadedHosted=true;
 bridgeMessage='Account changed. Your local editor was kept; team access must be confirmed.';bridgeKind='';refreshTeamControls();
 if(session?.user){const op=studioOperation();setTimeout(()=>{if(op.current())void loadStudioRole(op);},0);}
}
async function initializeSession(){
 if(!ADMIN_MODE)return;if(DEMO_WORKSPACE){role=normalizeWorkspaceRole(readDemoRole());return;}if(!VALID_WORKSPACE||!client)return;
 const revision=studioRevision;
 try{const next=await recoverAuthSession(client.auth);if(revision!==studioRevision)return;session=next;if(!session?.user)return;await loadStudioRole();}
 catch{role=null;}
}

if (ADMIN_MODE) {
  initialEditorFingerprint=formFingerprint();
  if(VALID_WORKSPACE&&client&&!DEMO_WORKSPACE)client.auth.onAuthStateChange(studioAuthChanged);
  await initializeSession();
  const observer = new MutationObserver(() => inject());
  observer.observe(document.querySelector('#app'), { childList: true, subtree: true });
  inject();
}
