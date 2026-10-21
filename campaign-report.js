import { getCampaign } from './campaign-config.js';
import { SUPABASE_PUBLIC_ENABLED, supabasePublicHeaders, supabasePublicURL } from './supabase-public.js';
import { currentSupabaseSession } from './supabase-auth.js';

const params = new URL(location.href).searchParams;
const campaignId = params.get('campaignReport')?.trim().toLowerCase();
const REMOTE_ENABLED = SUPABASE_PUBLIC_ENABLED;
const workspaceId = params.get('workspace') || '';
const LOCAL_REPORT = params.get('demo') === '1' || workspaceId === 'demo-workspace'
  || (!REMOTE_ENABLED && !workspaceId);
const esc = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

function localStats(id) {
  const events = window.TasteprintAnalytics?.localEvents?.() || [];
  const scoped = events.filter((event) => event.properties?.campaign_id === id);
  const count = (name) => scoped.filter((event) => event.event_name === name).length;
  const itemClicks = {};
  const conversionTypes = {};

  scoped
    .filter((event) => event.event_name === 'campaign_cta' && event.properties?.item_id)
    .forEach((event) => {
      const item = event.properties.item_id;
      itemClicks[item] = (itemClicks[item] || 0) + 1;
    });

  scoped
    .filter((event) => event.event_name === 'campaign_conversion' && event.properties?.conversion_type)
    .forEach((event) => {
      const type = event.properties.conversion_type;
      conversionTypes[type] = (conversionTypes[type] || 0) + 1;
    });

  const views = count('campaign_view');
  const clicks = count('campaign_cta');
  const leadViews = count('campaign_lead_view');
  const leadSubmits = count('campaign_lead_submit');
  const conversions = count('campaign_conversion');

  return {
    campaign_id: id,
    views,
    result_matches: count('campaign_result_match'),
    cta_clicks: clicks,
    lead_views: leadViews,
    lead_submits: leadSubmits,
    conversions,
    cta_rate: views ? Math.round(clicks / views * 1000) / 10 : 0,
    lead_rate: leadViews ? Math.round(leadSubmits / leadViews * 1000) / 10 : 0,
    conversion_rate: views ? Math.round(conversions / views * 1000) / 10 : 0,
    item_clicks: itemClicks,
    conversion_types: conversionTypes,
    local_only: true
  };
}

async function remoteStats(id) {
  if (!REMOTE_ENABLED) throw new Error('Production reporting is unavailable until Supabase is configured.');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workspaceId)) {
    throw new Error('Open this report from the campaign’s team Workspace.');
  }
  const session = await currentSupabaseSession();
  if (!session?.access_token) throw new Error('Sign in to the campaign’s team Workspace to view production reporting.');
  let response;
  try {
    response = await fetch(supabasePublicURL('rest/v1/rpc/tasteprint_workspace_campaign_stats'), {
      method: 'POST',
      headers: supabasePublicHeaders({ Authorization: `Bearer ${session.access_token}` }),
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({ p_workspace_id: workspaceId, p_campaign_id: id })
    });
  } catch {
    throw new Error('Could not reach production reporting. Check your connection and retry.');
  }
  if (!response.ok) throw new Error(`Production reporting failed (HTTP ${response.status}). Check your session and workspace access, then retry.`);
  const stats = await response.json().catch(() => null);
  const counts = ['views', 'result_matches', 'cta_clicks', 'lead_views', 'lead_submits', 'conversions'];
  const rates = ['cta_rate', 'lead_rate', 'conversion_rate'];
  const validCount = (value) => Number.isSafeInteger(value) && value >= 0;
  const validMap = (value) => value && typeof value === 'object' && !Array.isArray(value)
    && Object.values(value).every(validCount);
  if (!stats || typeof stats !== 'object' || Array.isArray(stats) || stats.campaign_id !== id
    || !counts.every((key) => validCount(stats[key]))
    || !rates.every((key) => typeof stats[key] === 'number' && Number.isFinite(stats[key]) && stats[key] >= 0)
    || !validMap(stats.item_clicks) || !validMap(stats.conversion_types)) {
    throw new Error('Production reporting returned an invalid response. Please retry.');
  }
  return stats;
}

function metric(label, value, suffix = '') {
  return `<div class="card"><div class="eyebrow">${esc(label)}</div><h2 style="margin-top:8px">${esc(value)}${esc(suffix)}</h2></div>`;
}

function itemRows(stats, campaign) {
  const catalog = new Map((campaign?.catalog || []).map((item) => [item.id, item.name]));
  const entries = Object.entries(stats.item_clicks || {}).sort((a,b) => b[1] - a[1]);
  if (!entries.length) return '<p class="small">No campaign CTA activity has been recorded yet.</p>';
  return entries.map(([id, clicks]) => `<div class="campaign-report-row"><span>${esc(catalog.get(id) || id)}</span><strong>${esc(clicks)}</strong></div>`).join('');
}

function conversionRows(stats) {
  const entries = Object.entries(stats.conversion_types || {}).sort((a,b) => b[1] - a[1]);
  if (!entries.length) return '<p class="small">No conversion events have been recorded yet.</p>';
  return entries.map(([type, count]) => `<div class="campaign-report-row"><span>${esc(type.replaceAll('_', ' '))}</span><strong>${esc(count)}</strong></div>`).join('');
}

async function renderReport() {
  if (!params.has('campaignReport')) return;
  const campaign = getCampaign(campaignId);
  const app = document.querySelector('#app');
  if (!app) return;
  app.innerHTML = '<section class="panel pad campaign-report"><h1>Loading campaign report…</h1><p class="small" role="status">Checking reporting access and data source.</p></section>';
  let remote;
  try {
    if (!campaignId) throw new Error('A campaign identifier is required. Open a report from Workspace.');
    remote = LOCAL_REPORT ? null : await remoteStats(campaignId);
  } catch (error) {
    document.title = 'Campaign report unavailable · Tasteprint';
    app.innerHTML = `<section class="panel pad campaign-report"><div class="eyebrow">Tasteprint campaign report</div>
      <h1>Production report unavailable</h1><p class="lede" role="alert">${esc(error.message)}</p>
      <p class="small">No local statistics are shown in place of production data.</p>
      <div class="row"><button class="primary" type="button" id="retry-report">Retry report</button>
      <a class="secondary" href="?workspace=1${workspaceId ? `&amp;team=${encodeURIComponent(workspaceId)}` : ''}">Open Workspace</a></div></section>`;
    app.querySelector('#retry-report')?.addEventListener('click', renderReport);
    return;
  }
  const stats = LOCAL_REPORT ? localStats(campaignId) : remote;

  document.title = `${campaign?.name || campaignId} campaign report · Tasteprint`;
  app.innerHTML = `
    <section class="panel pad campaign-report">
      <div class="eyebrow">Tasteprint campaign report</div>
      <h1 style="font-size:clamp(2rem,7vw,3.8rem);margin-top:10px">${esc(campaign?.name || campaignId)}</h1>
      <p class="lede">${remote ? 'Aggregate production campaign activity from the authenticated team reporting service.' : 'Local demo activity from this browser only. Production reporting requires a configured Supabase backend and a signed-in team Workspace.'}</p>

      <div class="grid-3" style="margin-top:24px">
        ${metric('Campaign views', stats.views || 0)}
        ${metric('Result matches', stats.result_matches || 0)}
        ${metric('CTA clicks', stats.cta_clicks || 0)}
      </div>

      <div class="grid-3" style="margin-top:18px">
        ${metric('Lead submits', stats.lead_submits || 0)}
        ${metric('Conversions', stats.conversions || 0)}
        ${metric('Conversion rate', stats.conversion_rate || 0, '%')}
      </div>

      <div class="result-grid">
        <div class="callout">
          <div class="eyebrow">CTA rate</div>
          <h2 style="margin-top:8px">${esc(stats.cta_rate || 0)}%</h2>
          <p class="small">CTA clicks divided by campaign-view events. This is an engagement signal, not a purchase-conversion claim.</p>
        </div>
        <div class="callout">
          <div class="eyebrow">Lead form completion</div>
          <h2 style="margin-top:8px">${esc(stats.lead_rate || 0)}%</h2>
          <p class="small">Submitted lead forms divided by lead-form views. Contact details themselves are never exposed in this report.</p>
        </div>
        <div class="card">
          <div class="eyebrow">Data mode</div>
          <h3 style="margin-top:8px">${remote ? 'Aggregate backend report' : 'Local browser demo'}</h3>
          <p class="small">Raw event rows and lead contact details are not exposed through this report.</p>
        </div>
      </div>

      <div class="result-grid">
        <div class="card">
          <div class="eyebrow">Catalog CTA activity</div>
          <div style="margin-top:10px">${itemRows(stats, campaign)}</div>
        </div>
        <div class="card">
          <div class="eyebrow">Conversion types</div>
          <div style="margin-top:10px">${conversionRows(stats)}</div>
        </div>
      </div>

      <div class="row" style="margin-top:22px">
        <a class="primary" href="?campaign=${encodeURIComponent(campaignId)}${remote ? '&amp;published=1' : ''}">Open campaign</a>
        <a class="secondary" href="?">Back to Tasteprint</a>
      </div>
    </section>
  `;
}

renderReport();
