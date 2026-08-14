import fs from 'node:fs';
import { EVENTS } from '../analytics-contract.js';
import {
  getCampaign,
  applyCampaignQuestions,
  matchCatalog,
  validateCampaignManifest
} from '../campaign-config.js';
import {
  catalogFromCSV,
  catalogFromJSON,
  catalogToCSV,
  validateCatalog
} from '../campaign-import.js';

const campaign = getCampaign('aster');
if (!campaign) throw new Error('Aster demo campaign is missing from the registry.');
if (campaign.id !== 'aster' || !campaign.name) throw new Error('Campaign identity contract is invalid.');
if (!campaign.demo) throw new Error('Aster must be explicitly marked as a fictional demo.');
if (!campaign.theme?.accent || !campaign.copy?.title) throw new Error('Campaign theme/copy configuration is incomplete.');
if (!Array.isArray(campaign.catalog) || campaign.catalog.length < 3) throw new Error('Campaign catalog needs at least three demo offers.');
if (validateCampaignManifest(campaign).length) throw new Error('Aster manifest does not pass campaign validation.');

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

const csv = 'id,name,description,tag,modes,archetypes,ctaLabel,href\ncoast-test,Coast Test,Four nights by the water,Coast,Coastal Romantic|City + Coast,Golden Hour Romantic,Explore,https://example.com/coast';
const csvCatalog = catalogFromCSV(csv);
if (csvCatalog.length !== 1 || csvCatalog[0].modes.length !== 2) throw new Error('CSV campaign catalog import failed.');
if (validateCatalog(csvCatalog).length) throw new Error('Imported CSV catalog failed validation.');
const roundTrip = catalogFromCSV(catalogToCSV(csvCatalog));
if (roundTrip[0]?.id !== 'coast-test' || roundTrip[0]?.href !== 'https://example.com/coast') throw new Error('Catalog CSV round-trip failed.');

const jsonCatalog = catalogFromJSON(JSON.stringify({ catalog: csvCatalog }));
if (jsonCatalog[0]?.name !== 'Coast Test') throw new Error('JSON campaign catalog import failed.');

for (const event of ['CAMPAIGN_VIEW', 'CAMPAIGN_RESULT_MATCH', 'CAMPAIGN_CTA']) {
  if (!EVENTS[event]) throw new Error(`Analytics contract is missing ${event}.`);
}

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
for (const asset of ['campaign.css', 'campaign-runtime.js', 'campaign-report.js', 'campaign-admin.js', 'campaign-admin.css']) {
  if (!html.includes(asset)) throw new Error(`index.html is not loading ${asset}.`);
}

const data = fs.readFileSync(new URL('../data.js', import.meta.url), 'utf8');
if (!data.includes('applyCampaignQuestions(BASE_QUESTIONS)')) {
  throw new Error('Core question data is not wired through the campaign configuration layer.');
}

const admin = fs.readFileSync(new URL('../campaign-admin.js', import.meta.url), 'utf8');
for (const requirement of ['campaignAdmin', 'saveCampaignDraft', 'parseCatalogText', 'Download manifest JSON']) {
  if (!admin.includes(requirement)) throw new Error(`Campaign Studio is missing: ${requirement}.`);
}

const report = fs.readFileSync(new URL('../campaign-report.js', import.meta.url), 'utf8');
if (!report.includes('tasteprint_campaign_stats') || !report.includes('campaignReport')) {
  throw new Error('Campaign reporting UI is not wired to the aggregate reporting contract.');
}

const sql = fs.readFileSync(new URL('../supabase/campaigns.sql', import.meta.url), 'utf8');
if (!sql.includes('tasteprint_campaign_stats') || !sql.includes("event_name = 'campaign_cta'")) {
  throw new Error('Campaign aggregate reporting RPC is missing.');
}

console.log(`Campaign engine OK — ${campaign.name}, CSV/JSON ingestion, local admin drafts, ${campaign.catalog.length} demo items, CTA analytics and reporting wired.`);
