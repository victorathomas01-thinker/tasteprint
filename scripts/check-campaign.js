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
if (!campaign.leadCapture?.enabled || !campaign.leadCapture?.demoOnly) throw new Error('Aster should demonstrate discard-only lead capture.');
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

const invalidLeadCampaign = structuredClone(campaign);
invalidLeadCampaign.id = 'invalid-lead';
invalidLeadCampaign.demo = false;
invalidLeadCampaign.leadCapture.demoOnly = false;
invalidLeadCampaign.leadCapture.privacyUrl = '';
if (!validateCampaignManifest(invalidLeadCampaign).some((error) => /privacy URL/i.test(error))) {
  throw new Error('Real lead capture must require an HTTPS privacy URL.');
}

for (const event of [
  'CAMPAIGN_VIEW',
  'CAMPAIGN_RESULT_MATCH',
  'CAMPAIGN_CTA',
  'CAMPAIGN_LEAD_VIEW',
  'CAMPAIGN_LEAD_SUBMIT',
  'CAMPAIGN_CONVERSION'
]) {
  if (!EVENTS[event]) throw new Error(`Analytics contract is missing ${event}.`);
}

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
for (const asset of [
  'campaign.css',
  'campaign-runtime.js',
  'campaign-report.js',
  'campaign-admin.js',
  'campaign-admin.css',
  'campaign-conversion.js',
  'lead-capture.js',
  'workspace.js',
  'workspace.css',
  'studio-workspace-bridge.js'
]) {
  if (!html.includes(asset)) throw new Error(`index.html is not loading ${asset}.`);
}

const data = fs.readFileSync(new URL('../data.js', import.meta.url), 'utf8');
if (!data.includes('applyCampaignQuestions(BASE_QUESTIONS)')) {
  throw new Error('Core question data is not wired through the campaign configuration layer.');
}

const admin = fs.readFileSync(new URL('../campaign-admin.js', import.meta.url), 'utf8');
for (const requirement of [
  'campaignAdmin', 'saveCampaignDraft', 'parseCatalogText', 'Download manifest JSON',
  'publishCampaign', 'unpublishCampaign', 'published-campaigns',
  'leadEnabled', 'leadConsentText', 'leadPrivacyUrl'
]) {
  if (!admin.includes(requirement)) throw new Error(`Campaign Studio is missing: ${requirement}.`);
}

const bridge = fs.readFileSync(new URL('../studio-workspace-bridge.js', import.meta.url), 'utf8');
for (const marker of ['hideLegacyPublishToken', 'Save to team workspace', 'Publish with team permission', 'reviewCampaignExperience']) {
  if (!bridge.includes(marker)) throw new Error(`Studio Workspace bridge is missing ${marker}.`);
}

const report = fs.readFileSync(new URL('../campaign-report.js', import.meta.url), 'utf8');
for (const marker of ['tasteprint_campaign_stats', 'campaignReport', 'lead_submits', 'conversion_rate', 'conversion_types']) {
  if (!report.includes(marker)) throw new Error(`Campaign reporting UI is missing ${marker}.`);
}

const sql = fs.readFileSync(new URL('../supabase/campaigns.sql', import.meta.url), 'utf8');
for (const marker of ["event_name = 'campaign_cta'", "event_name = 'campaign_lead_submit'", "event_name = 'campaign_conversion'", 'conversion_types']) {
  if (!sql.includes(marker)) throw new Error(`Campaign aggregate reporting RPC is missing ${marker}.`);
}

const registryClient = fs.readFileSync(new URL('../campaign-remote.js', import.meta.url), 'utf8');
for (const marker of ['tasteprint_public_campaign', 'tasteprint_public_campaign_index', '/functions/v1/publish-campaign', 'session.access_token', 'workspace_id: team']) {
  if (!registryClient.includes(marker)) throw new Error(`Remote campaign client is missing ${marker}.`);
}
for (const forbidden of ['x-publish-token', 'VITE_TASTEPRINT_PUBLISH_TOKEN']) {
  if (registryClient.includes(forbidden)) throw new Error(`Browser campaign client still contains legacy publish-secret marker ${forbidden}.`);
}

const config = fs.readFileSync(new URL('../campaign-config.js', import.meta.url), 'utf8');
for (const marker of ['prefetchRequestedCampaign', 'REMOTE_REGISTRY', 'publishedRoute', 'listPublishedCampaigns', 'leadCapture']) {
  if (!config.includes(marker)) throw new Error(`Campaign config is missing behavior: ${marker}.`);
}

const registrySql = fs.readFileSync(new URL('../supabase/campaign-registry.sql', import.meta.url), 'utf8');
for (const marker of ['tasteprint_campaigns', 'tasteprint_public_campaign', 'tasteprint_public_campaign_index', "status = 'published'"]) {
  if (!registrySql.includes(marker)) throw new Error(`Campaign registry SQL is missing ${marker}.`);
}

const workspaceSql = fs.readFileSync(new URL('../supabase/workspaces.sql', import.meta.url), 'utf8');
for (const marker of ['tasteprint_workspace_campaigns', 'tasteprint_workspace_members', 'enable row level security', 'tasteprint_workspace_role']) {
  if (!workspaceSql.includes(marker)) throw new Error(`Workspace campaign schema is missing ${marker}.`);
}

const publisher = fs.readFileSync(new URL('../supabase/functions/publish-campaign/index.ts', import.meta.url), 'utf8');
for (const marker of ['auth.getUser(token)', 'tasteprint_workspace_members', "['owner', 'admin']", 'SUPABASE_SECRET_KEYS', "action === 'unpublish'", "status: 'published'", 'privacyUrl', 'hasSensitiveKey(manifest)']) {
  if (!publisher.includes(marker)) throw new Error(`Authenticated publish function is missing ${marker}.`);
}
for (const forbidden of ['TASTEPRINT_PUBLISH_TOKEN', 'x-publish-token', "'Access-Control-Allow-Origin': '*'"]) {
  if (publisher.includes(forbidden)) throw new Error(`Publish function still contains legacy/high-risk marker ${forbidden}.`);
}

const leadClient = fs.readFileSync(new URL('../lead-capture.js', import.meta.url), 'utf8');
for (const marker of ['/functions/v1/capture-lead', 'consent', 'CAMPAIGN_LEAD_SUBMIT', "trackCampaignConversion('lead_submit'"]) {
  if (!leadClient.includes(marker)) throw new Error(`Lead capture client is missing ${marker}.`);
}

const conversionClient = fs.readFileSync(new URL('../campaign-conversion.js', import.meta.url), 'utf8');
if (!conversionClient.includes('CAMPAIGN_CONVERSION') || !conversionClient.includes('Intentionally do not accept email')) {
  throw new Error('Privacy-safe conversion API contract is missing.');
}

const leadSql = fs.readFileSync(new URL('../supabase/leads.sql', import.meta.url), 'utf8');
for (const marker of ['tasteprint_campaign_leads', 'enable row level security', 'revoke all', 'email_hash']) {
  if (!leadSql.includes(marker)) throw new Error(`Restricted lead table is missing ${marker}.`);
}

const leadFunction = fs.readFileSync(new URL('../supabase/functions/capture-lead/index.ts', import.meta.url), 'utf8');
for (const marker of ['SUPABASE_SERVICE_ROLE_KEY', 'tasteprint_campaign_leads', "status', 'published'", 'email_hash']) {
  if (!leadFunction.includes(marker)) throw new Error(`Lead Edge Function is missing ${marker}.`);
}

console.log(`Campaign engine OK — ${campaign.name}, local Studio, authenticated Workspace publishing, consent lead capture, conversion analytics, ${campaign.catalog.length} demo items.`);
