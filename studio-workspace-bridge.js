import {
  getCampaign,
  saveCampaignDraft,
  validateCampaignManifest
} from './campaign-config.js';
import { parseCatalogText, validateCatalog } from './campaign-import.js';
import { publishCampaign, unpublishCampaign } from './campaign-remote.js';
import { supabaseAuthClient as client } from './supabase-auth.js';
import { SUPABASE_PUBLIC_ENABLED as REMOTE_ENABLED } from './supabase-public.js';
import {
  canWorkspace,
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
let role = DEMO_WORKSPACE ? normalizeWorkspaceRole(readDemoRole()) : 'viewer';
let injected = false;
let loadedHosted = false;

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
      ? `Authenticated team workspace · ${workspaceRoleLabel(role)}.`
      : VALID_WORKSPACE
        ? 'This team workspace cannot connect until Supabase is configured. The Studio itself still works locally.'
        : 'This Studio is local-only. Open Campaign Workspace when you want hosted team drafts and authenticated publishing.';

  return `<section class="card admin-section studio-workspace-card" data-studio-workspace>
    <div class="row spread"><div><div class="eyebrow">Team + publishing</div><h2>${isTeam ? 'Campaign Workspace' : 'Local Studio mode'}</h2></div><a class="secondary" href="${isTeam ? backToWorkspaceURL() : '?workspace=1&demo=1'}">${isTeam ? 'Back to workspace' : 'See workspace demo'}</a></div>
    <p class="small">${esc(modeCopy)}</p>
    ${isTeam ? `<div class="studio-workspace-actions">
      <button class="secondary" type="button" data-team-save ${canEdit ? '' : 'disabled'}>${DEMO_WORKSPACE ? 'Simulate team save' : 'Save to team workspace'}</button>
      <button class="primary" type="button" data-team-publish ${canPublish && VALID_WORKSPACE && REMOTE_ENABLED ? '' : 'disabled'}>Publish with team permission</button>
      <button class="danger" type="button" data-team-unpublish ${canPublish && VALID_WORKSPACE && REMOTE_ENABLED ? '' : 'disabled'}>Unpublish</button>
    </div>` : ''}
    <p class="small" data-studio-workspace-status role="status" aria-live="polite"></p>
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

async function loadHostedCampaign() {
  if (loadedHosted || !HOSTED_CAMPAIGN || !VALID_WORKSPACE || !client || !session?.user) return;
  loadedHosted = true;
  const { data, error } = await client
    .from('tasteprint_workspace_campaigns')
    .select('manifest')
    .eq('workspace_id', WORKSPACE_ID)
    .eq('campaign_id', HOSTED_CAMPAIGN)
    .maybeSingle();
  if (error || !data?.manifest) {
    setBridgeStatus(error?.message || 'Hosted draft could not be loaded.', 'bad');
    return;
  }

  const saved = saveCampaignDraft({ ...data.manifest, localDraft: true });
  if (!saved?.ok) {
    setBridgeStatus(saved?.errors?.[0] || 'Hosted draft could not be copied into the local editor.', 'bad');
    return;
  }

  const clickEdit = () => {
    const button = document.querySelector(`[data-load-draft="${CSS.escape(HOSTED_CAMPAIGN)}"]`);
    if (!button) return false;
    button.click();
    setBridgeStatus('Hosted draft loaded. Edits stay local until you press “Save to team workspace.”', 'good');
    refreshExperience();
    return true;
  };
  if (!clickEdit()) setTimeout(clickEdit, 150);
}

async function saveToWorkspace() {
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
  const now = new Date().toISOString();
  const { error } = await client.from('tasteprint_workspace_campaigns').upsert({
    workspace_id: WORKSPACE_ID,
    campaign_id: cleanManifest.id,
    manifest: cleanManifest,
    status: 'draft',
    created_by: session.user.id,
    updated_by: session.user.id,
    updated_at: now
  }, { onConflict: 'workspace_id,campaign_id' });
  if (error) {
    setBridgeStatus(error.message || 'Hosted save failed.', 'bad');
    return false;
  }
  saveCampaignDraft({ ...cleanManifest, localDraft: true });
  setBridgeStatus('Hosted draft saved for your workspace. No consumer or lead data was copied into it.', 'good');
  return true;
}

async function publishFromWorkspace() {
  const manifest = currentManifest();
  const errors = validateManifest(manifest);
  const review = reviewCampaignExperience(manifest);
  if (errors.length) return setBridgeStatus(errors[0], 'bad');
  if (review.blocking.length) return setBridgeStatus('Publishing is blocked until the privacy/security Experience QA checks pass.', 'bad');
  if (!canWorkspace(role, 'campaign.publish')) return setBridgeStatus('Owner or admin permission is required to publish.', 'bad');

  const saved = await saveToWorkspace();
  if (!saved) return;
  setBridgeStatus('Publishing through your authenticated workspace…');
  const result = await publishCampaign(manifest);
  setBridgeStatus(result.ok ? `Published ${manifest.id} as version ${result.version}.` : (result.error || 'Publish failed.'), result.ok ? 'good' : 'bad');
}

async function unpublishFromWorkspace() {
  const id = safeCampaignId(formValue('id'));
  if (!id) return setBridgeStatus('Campaign id is required.', 'bad');
  if (!canWorkspace(role, 'campaign.publish')) return setBridgeStatus('Owner or admin permission is required to unpublish.', 'bad');
  setBridgeStatus(`Unpublishing ${id}…`);
  const result = await unpublishCampaign(id);
  setBridgeStatus(result.ok ? `${id} is no longer public.` : (result.error || 'Unpublish failed.'), result.ok ? 'good' : 'bad');
}

function inject() {
  if (!ADMIN_MODE || injected) return;
  const admin = document.querySelector('.campaign-admin');
  const saveSection = document.querySelector('#save-preview')?.closest('.admin-section');
  if (!admin || !saveSection) return;
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

  document.querySelector('[data-team-save]')?.addEventListener('click', saveToWorkspace);
  document.querySelector('[data-team-publish]')?.addEventListener('click', publishFromWorkspace);
  document.querySelector('[data-team-unpublish]')?.addEventListener('click', unpublishFromWorkspace);

  admin.addEventListener('input', () => requestAnimationFrame(refreshExperience));
  admin.addEventListener('change', () => requestAnimationFrame(refreshExperience));
  document.querySelector('#parse-catalog')?.addEventListener('click', () => setTimeout(refreshExperience, 0));
  document.querySelector('#load-aster')?.addEventListener('click', () => setTimeout(refreshExperience, 0));
  loadHostedCampaign();
}

async function initializeSession() {
  if (!ADMIN_MODE) return;
  if (DEMO_WORKSPACE) {
    role = normalizeWorkspaceRole(readDemoRole());
    return;
  }
  if (!VALID_WORKSPACE || !client) return;
  try {
    const { data } = await client.auth.getSession();
    session = data.session || null;
    if (!session?.user) return;
    const { data: roleData } = await client.rpc('tasteprint_workspace_role', { p_workspace_id: WORKSPACE_ID });
    role = normalizeWorkspaceRole(roleData || 'viewer');
  } catch {
    role = 'viewer';
  }
}

if (ADMIN_MODE) {
  await initializeSession();
  const observer = new MutationObserver(() => inject());
  observer.observe(document.querySelector('#app'), { childList: true, subtree: true });
  inject();
}
