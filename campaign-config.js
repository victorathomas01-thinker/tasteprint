import aster from './campaigns/aster.json' with { type: 'json' };
import {
  REMOTE_CAMPAIGNS_ENABLED,
  fetchPublishedCampaign,
  fetchPublishedCampaignIndex
} from './campaign-remote.js';

const STATIC_REGISTRY = Object.freeze({ aster });
const REMOTE_REGISTRY = new Map();
const DRAFTS_KEY = 'tasteprint.campaign-drafts.v1';

function clone(value) {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function normalizeId(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
}

function readDrafts() {
  if (typeof localStorage === 'undefined') return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(DRAFTS_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeDrafts(drafts) {
  if (typeof localStorage === 'undefined') return false;
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  return true;
}

function activeId() {
  try {
    return new URL(location.href).searchParams.get('campaign')?.trim().toLowerCase() || null;
  } catch {
    return null;
  }
}

function publishedRoute() {
  try {
    return new URL(location.href).searchParams.get('published') === '1';
  } catch {
    return false;
  }
}

async function prefetchRequestedCampaign() {
  if (typeof window === 'undefined' || !REMOTE_CAMPAIGNS_ENABLED) return;
  const id = normalizeId(activeId());
  if (!id) return;
  const hasLocal = Boolean(STATIC_REGISTRY[id] || readDrafts()[id]);
  if (hasLocal && !publishedRoute()) return;
  const remote = await fetchPublishedCampaign(id);
  if (remote) REMOTE_REGISTRY.set(id, remote);
}

await prefetchRequestedCampaign();

export function validateCampaignManifest(campaign) {
  const errors = [];
  if (!campaign || typeof campaign !== 'object') return ['Campaign must be an object.'];
  if (!normalizeId(campaign.id)) errors.push('Campaign id is required.');
  if (!campaign.name?.trim?.()) errors.push('Campaign name is required.');
  if (!campaign.copy?.title?.trim?.()) errors.push('Landing title is required.');
  if (!campaign.copy?.lede?.trim?.()) errors.push('Landing description is required.');
  if (!Array.isArray(campaign.catalog) || !campaign.catalog.length) errors.push('Catalog must contain at least one item.');

  const seen = new Set();
  for (const item of campaign.catalog || []) {
    if (!item.id) errors.push('Every catalog item needs an id.');
    if (item.id && seen.has(item.id)) errors.push(`Duplicate catalog id: ${item.id}.`);
    if (item.id) seen.add(item.id);
    if (!item.name) errors.push(`Catalog item ${item.id || '(unnamed)'} needs a name.`);
    if (!item.description) errors.push(`Catalog item ${item.id || '(unnamed)'} needs a description.`);
    if (!item.modes?.length) errors.push(`Catalog item ${item.id || '(unnamed)'} needs at least one travel mode.`);
    if (item.href && !/^https:\/\//i.test(item.href)) errors.push(`Catalog item ${item.id || '(unnamed)'} must use an HTTPS link.`);
  }
  return errors;
}

export function saveCampaignDraft(campaign) {
  const next = clone(campaign);
  next.id = normalizeId(next.id);
  next.localDraft = true;
  delete next.published;
  delete next.publishedAt;
  delete next.publishedVersion;
  const errors = validateCampaignManifest(next);
  if (errors.length) return { ok: false, errors };
  const drafts = readDrafts();
  drafts[next.id] = next;
  writeDrafts(drafts);
  return { ok: true, campaign: clone(next) };
}

export function deleteCampaignDraft(id) {
  const key = normalizeId(id);
  if (!key) return false;
  const drafts = readDrafts();
  if (!drafts[key]) return false;
  delete drafts[key];
  writeDrafts(drafts);
  return true;
}

export function getCampaign(id = activeId()) {
  const key = normalizeId(id);
  if (!key) return null;
  const preferRemote = key === normalizeId(activeId()) && publishedRoute();
  if (preferRemote && REMOTE_REGISTRY.has(key)) return clone(REMOTE_REGISTRY.get(key));
  if (STATIC_REGISTRY[key]) return clone(STATIC_REGISTRY[key]);
  const draft = readDrafts()[key];
  if (draft) return clone(draft);
  if (REMOTE_REGISTRY.has(key)) return clone(REMOTE_REGISTRY.get(key));
  return null;
}

export function listCampaigns() {
  const drafts = readDrafts();
  const all = [...Object.values(STATIC_REGISTRY), ...Object.values(drafts), ...REMOTE_REGISTRY.values()];
  const seen = new Set();
  return all.filter((campaign) => {
    if (!campaign?.id || seen.has(campaign.id)) return false;
    seen.add(campaign.id);
    return true;
  }).map(({ id, name, description, localDraft = false, published = false, publishedVersion = null }) => ({
    id, name, description, localDraft, published, publishedVersion
  }));
}

export async function listPublishedCampaigns() {
  if (!REMOTE_CAMPAIGNS_ENABLED) return [];
  return await fetchPublishedCampaignIndex();
}

export async function refreshPublishedCampaign(id) {
  const key = normalizeId(id);
  if (!key || !REMOTE_CAMPAIGNS_ENABLED) return null;
  const campaign = await fetchPublishedCampaign(key);
  if (campaign) REMOTE_REGISTRY.set(key, campaign);
  else REMOTE_REGISTRY.delete(key);
  return campaign ? clone(campaign) : null;
}

export function applyCampaignQuestions(baseQuestions, campaign = getCampaign()) {
  const base = clone(baseQuestions);
  if (!campaign) return base;

  if (Array.isArray(campaign.questions) && campaign.questions.length) {
    return applyScoringMultipliers(clone(campaign.questions), campaign.scoring?.dimensionMultipliers);
  }

  const overrides = campaign.questionOverrides || {};
  const questions = base.map((question, index) => {
    const override = overrides[String(index)] || {};
    return {
      ...question,
      ...override,
      options: override.options ? clone(override.options) : question.options
    };
  });

  return applyScoringMultipliers(questions, campaign.scoring?.dimensionMultipliers);
}

function applyScoringMultipliers(questions, multipliers = {}) {
  if (!multipliers || typeof multipliers !== 'object') return questions;

  return questions.map((question) => ({
    ...question,
    options: question.options.map((option) => {
      const next = clone(option);
      const delta = { ...(next[3] || {}) };
      for (const [dimension, multiplier] of Object.entries(multipliers)) {
        if (!(dimension in delta)) continue;
        const safeMultiplier = Number(multiplier);
        if (!Number.isFinite(safeMultiplier) || safeMultiplier <= 0 || safeMultiplier > 3) continue;
        delta[dimension] = Math.round(delta[dimension] * safeMultiplier);
      }
      next[3] = delta;
      return next;
    })
  }));
}

export function matchCatalog(campaign, { archetype = '', travelMode = '' } = {}) {
  if (!campaign?.catalog?.length) return [];

  return campaign.catalog
    .map((item, index) => {
      const modeMatch = item.modes?.includes(travelMode) ? 6 : 0;
      const archetypeMatch = item.archetypes?.includes(archetype) ? 4 : 0;
      const breadth = (item.modes?.length || 0) + (item.archetypes?.length || 0);
      return { item, score: modeMatch + archetypeMatch - breadth * 0.01 - index * 0.001 };
    })
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
}

export function campaignContext() {
  const campaign = getCampaign();
  return campaign ? {
    id: campaign.id,
    name: campaign.name,
    localDraft: Boolean(campaign.localDraft),
    published: Boolean(campaign.published),
    publishedVersion: campaign.publishedVersion || null
  } : null;
}

if (typeof window !== 'undefined') {
  window.TasteprintCampaignConfig = Object.freeze({
    getCampaign,
    listCampaigns,
    listPublishedCampaigns,
    refreshPublishedCampaign,
    campaignContext,
    saveCampaignDraft,
    deleteCampaignDraft,
    validateCampaignManifest
  });
}
