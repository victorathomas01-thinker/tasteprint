import { getCampaign } from './campaign-config.js';

const params = new URL(location.href).searchParams;
const campaignId = params.get('campaignReport')?.trim().toLowerCase();
const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '');
const REMOTE_ENABLED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

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
  if (!REMOTE_ENABLED) return null;
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/tasteprint_campaign_stats`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_campaign_id: id })
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function metric(label, value, suffix = '') {
  return `<div class="card"><div class="eyebrow">${label}</div><h2 style="margin-top:8px">${value}${suffix}</h2></div>`;
}

function itemRows(stats, campaign) {
  const catalog = new Map((campaign?.catalog || []).map((item) => [item.id, item.name]));
  const entries = Object.entries(stats.item_clicks || {}).sort((a,b) => b[1] - a[1]);
  if (!entries.length) return '<p class="small">No campaign CTA activity has been recorded yet.</p>';
  return entries.map(([id, clicks]) => `<div class="campaign-report-row"><span>${catalog.get(id) || id}</span><strong>${clicks}</strong></div>`).join('');
}

function conversionRows(stats) {
  const entries = Object.entries(stats.conversion_types || {}).sort((a,b) => b[1] - a[1]);
  if (!entries.length) return '<p class="small">No conversion events have been recorded yet.</p>';
  return entries.map(([type, count]) => `<div class="campaign-report-row"><span>${type.replaceAll('_', ' ')}</span><strong>${count}</strong></div>`).join('');
}

async function renderReport() {
  if (!campaignId) return;
  const campaign = getCampaign(campaignId);
  const app = document.querySelector('#app');
  const remote = await remoteStats(campaignId);
  const stats = remote || localStats(campaignId);

  document.title = `${campaign?.name || campaignId} campaign report · Tasteprint`;
  app.innerHTML = `
    <section class="panel pad campaign-report">
      <div class="eyebrow">Tasteprint campaign report</div>
      <h1 style="font-size:clamp(2rem,7vw,3.8rem);margin-top:10px">${campaign?.name || campaignId}</h1>
      <p class="lede">${remote ? 'Aggregate production campaign activity from the privacy-safe reporting RPC.' : 'Local demo activity from this browser. Connect Supabase and run supabase/campaigns.sql to unlock aggregate production reporting.'}</p>

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
          <h2 style="margin-top:8px">${stats.cta_rate || 0}%</h2>
          <p class="small">CTA clicks divided by campaign-view events. This is an engagement signal, not a purchase-conversion claim.</p>
        </div>
        <div class="callout">
          <div class="eyebrow">Lead form completion</div>
          <h2 style="margin-top:8px">${stats.lead_rate || 0}%</h2>
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
        <a class="primary" href="?campaign=${encodeURIComponent(campaignId)}">Open campaign</a>
        <a class="secondary" href="?">Back to Tasteprint</a>
      </div>
    </section>
  `;
}

renderReport();
