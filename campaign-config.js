import aster from './campaigns/aster.json';

const REGISTRY = Object.freeze({
  aster
});

function clone(value) {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function activeId() {
  try {
    return new URL(location.href).searchParams.get('campaign')?.trim().toLowerCase() || null;
  } catch {
    return null;
  }
}

export function getCampaign(id = activeId()) {
  if (!id) return null;
  return REGISTRY[id] ? clone(REGISTRY[id]) : null;
}

export function listCampaigns() {
  return Object.values(REGISTRY).map(({ id, name, description }) => ({ id, name, description }));
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
  return campaign ? { id: campaign.id, name: campaign.name } : null;
}

window.TasteprintCampaignConfig = Object.freeze({
  getCampaign,
  listCampaigns,
  campaignContext
});
