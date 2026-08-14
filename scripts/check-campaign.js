import fs from 'node:fs';
import { EVENTS } from '../analytics-contract.js';
import { getCampaign, applyCampaignQuestions, matchCatalog } from '../campaign-config.js';

const campaign = getCampaign('aster');
if (!campaign) throw new Error('Aster demo campaign is missing from the registry.');
if (campaign.id !== 'aster' || !campaign.name) throw new Error('Campaign identity contract is invalid.');
if (!campaign.theme?.accent || !campaign.copy?.title) throw new Error('Campaign theme/copy configuration is incomplete.');
if (!Array.isArray(campaign.catalog) || campaign.catalog.length < 3) throw new Error('Campaign catalog needs at least three demo offers.');

const ids = campaign.catalog.map((item) => item.id);
if (new Set(ids).size !== ids.length) throw new Error('Campaign catalog item IDs must be unique.');
for (const item of campaign.catalog) {
  if (!item.name || !item.description) throw new Error(`Campaign item ${item.id} is missing copy.`);
  if (!Array.isArray(item.modes) || !item.modes.length) throw new Error(`Campaign item ${item.id} needs at least one travel mode.`);
  if (item.href && !/^https:\/\//.test(item.href)) throw new Error(`Campaign item ${item.id} must use an HTTPS CTA URL.`);
}

const sample = [{
  title: 'Base question',
  subtitle: 'Base subtitle',
  options: [['x', 'Base option', 'Base note', { comfort: 10, novelty: 5 }]]
}];
const configured = applyCampaignQuestions(sample, {
  questionOverrides: { '0': { title: 'Branded question' } },
  scoring: { dimensionMultipliers: { comfort: 1.2 } }
});
if (configured[0].title !== 'Branded question') throw new Error('Question overrides are not applied.');
if (configured[0].options[0][3].comfort !== 12) throw new Error('Campaign scoring multipliers are not applied.');
if (configured[0].options[0][3].novelty !== 5) throw new Error('Unconfigured score dimensions should remain unchanged.');

const ranked = matchCatalog(campaign, {
  archetype: 'Golden Hour Romantic',
  travelMode: 'Coastal Romantic'
});
if (ranked[0]?.id !== 'amalfi-afterglow') throw new Error('Catalog matcher did not prioritize the strongest mode/archetype match.');

for (const event of ['CAMPAIGN_VIEW', 'CAMPAIGN_RESULT_MATCH', 'CAMPAIGN_CTA']) {
  if (!EVENTS[event]) throw new Error(`Analytics contract is missing ${event}.`);
}

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
for (const asset of ['campaign.css', 'campaign-runtime.js']) {
  if (!html.includes(asset)) throw new Error(`index.html is not loading ${asset}.`);
}

const data = fs.readFileSync(new URL('../data.js', import.meta.url), 'utf8');
if (!data.includes('applyCampaignQuestions(BASE_QUESTIONS)')) {
  throw new Error('Core question data is not wired through the campaign configuration layer.');
}

console.log(`Campaign engine OK — ${campaign.name}, ${campaign.catalog.length} catalog items, configurable questions/scoring, CTA analytics wired.`);
