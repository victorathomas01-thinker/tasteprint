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

const csv = 'id,name,description,tag,modes,archetypes,ctaLabel,href\n"city-weekend","City, Weekend","Food, streets, and design",City,Culture City|Structured Megacity,Culture Collector,Explore,https://example.com/city';
const csvCatalog = catalogFromCSV(csv);
if (csvCatalog.length !== 1 || csvCatalog[0].name !== 'City, Weekend') throw new Error('CSV importer did not preserve quoted commas.');
if (csvCatalog[0].modes.length !== 2) throw new Error('CSV campaign catalog import failed.');
if (validateCatalog(csvCatalog).length) throw new Error('Imported CSV catalog failed validation.');
const roundTrip = catalogFromCSV(catalogToCSV(csvCatalog));
if (JSON.stringify(roundTrip) !== JSON.stringify(csvCatalog)) throw new Error('Catalog CSV round-trip changed data.');

const jsonCatalog = catalogFromJSON(JSON.stringify({ catalog: campaign.catalog.slice(0, 2) }));
if (jsonCatalog.length !== 2 || validateCatalog(jsonCatalog).length) throw new Error('JSON campaign catalog import failed.');

const badCatalog = [{ id: 'bad', name: 'Bad', description: 'Bad link', modes: ['Culture City'], archetypes: [], ctaLabel: 'Open', href: 'http://unsafe.test' }];
if (!validateCatalog(badCatalog).some((error) => /HTTPS/.test(error))) throw new Error('Catalog validator must reject non-HTTPS outbound links.');

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
for (const requirement of ['campaignAdmin', 'saveCampaignDraft', 'parseCatalogText', 'Download manifest JSON', 'publishCampaign', 'unpublishCampaign', 'publish-token', 'published-campaigns']) {
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

const registryClient = fs.readFileSync(new URL('../campaign-remote.js', import.meta.url), 'utf8');
for (const marker of ['tasteprint_public_campaign', 'tasteprint_public_campaign_index', '/functions/v1/publish-campaign', 'x-publish-token']) {
  if (!registryClient.includes(marker)) throw new Error(`Remote campaign client is missing ${marker}.`);
}
if (registryClient.includes('VITE_TASTEPRINT_PUBLISH_TOKEN')) throw new Error('Publish authorization must never be compiled into the public Vite bundle.');

const config = fs.readFileSync(new URL('../campaign-config.js', import.meta.url), 'utf8');
for (const marker of ['prefetchRequestedCampaign', 'REMOTE_REGISTRY', 'publishedRoute', 'listPublishedCampaigns']) {
  if (!config.includes(marker)) throw new Error(`Campaign config is missing published-registry behavior: ${marker}.`);
}

const registrySql = fs.readFileSync(new URL('../supabase/campaign-registry.sql', import.meta.url), 'utf8');
for (const marker of ['tasteprint_campaigns', 'tasteprint_public_campaign', 'tasteprint_public_campaign_index', "status = 'published'"]) {
  if (!registrySql.includes(marker)) throw new Error(`Campaign registry SQL is missing ${marker}.`);
}

const publisher = fs.readFileSync(new URL('../supabase/functions/publish-campaign/index.ts', import.meta.url), 'utf8');
for (const marker of ['TASTEPRINT_PUBLISH_TOKEN', 'SUPABASE_SERVICE_ROLE_KEY', 'safeEqual', "action === 'unpublish'", "status: 'published'"]) {
  if (!publisher.includes(marker)) throw new Error(`Secure publish function is missing ${marker}.`);
}

console.log(`Campaign engine OK — ${campaign.name}, CSV/JSON Studio, secure publish registry, ${campaign.catalog.length} demo items, CTA analytics and reporting wired.`);
