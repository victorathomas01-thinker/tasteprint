import { MIN_REFERRAL_SAMPLE, referralAggregate, referralHealth } from './referral-core.js';
import { SUPABASE_PUBLIC_ENABLED, supabasePublicHeaders, supabasePublicURL } from './supabase-public.js';

const params = new URLSearchParams(location.search);
if (params.get('growth') === '1') renderGrowth();

function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function count(value) {
  return Number(value || 0).toLocaleString();
}

function rate(value) {
  return value === null || value === undefined ? 'Collecting…' : `${Number(value).toFixed(Number(value) % 1 ? 1 : 0)}%`;
}

async function fetchReferralStats() {
  if (!SUPABASE_PUBLIC_ENABLED) return null;

  const response = await fetch(supabasePublicURL('rest/v1/rpc/tasteprint_referral_stats'), {
    method: 'POST',
    headers: supabasePublicHeaders(),
    body: '{}'
  });
  if (!response.ok) throw new Error(`Referral stats request failed: ${response.status}`);
  return response.json();
}

function outcomeRows(outcomes = {}) {
  const labels = { shared: 'Native share completed', copied: 'Copied', show: 'Fallback link shown', cancelled: 'Share cancelled' };
  return Object.entries(labels).map(([key, label]) => `
    <div class="row spread growth-row"><span>${escapeHTML(label)}</span><strong>${count(outcomes[key])}</strong></div>
  `).join('');
}

function metric(label, value, copy) {
  return `<div class="card growth-kpi"><div class="eyebrow">${escapeHTML(label)}</div><h2>${escapeHTML(value)}</h2><p class="small">${escapeHTML(copy)}</p></div>`;
}

function renderReport(app, stats, source) {
  const health = source === 'remote'
    ? referralHealth(stats)
    : {
        state: 'Cross-device attribution needs the backend',
        copy: 'This browser can measure challenge creation and share-sheet outcomes here, but it cannot see whether a friend on another device opened or completed the challenge.'
      };
  const sourceCopy = source === 'remote'
    ? 'Cross-device aggregate from the configured Supabase referral RPC.'
    : 'Current-browser fallback only. Downstream recipient rates remain intentionally non-actionable until remote aggregation is connected.';

  app.innerHTML = `<section class="panel pad growth-view">
    <div class="growth-hero">
      <div>
        <div class="eyebrow">Tasteprint · Referral loop</div>
        <h1>Can one result create the next user?</h1>
        <p class="lede">This report follows the Escape friend-challenge loop without exposing who sent what to whom. It measures anonymous creator tokens, recipient opens, completions and same-session resharing.</p>
      </div>
      <a class="secondary" href="${location.pathname}">Back to Tasteprint</a>
    </div>

    <div class="callout growth-health"><div class="eyebrow">Loop health</div><h2>${escapeHTML(health.state)}</h2><p class="small">${escapeHTML(health.copy)}</p><p class="small">${escapeHTML(sourceCopy)}</p></div>

    <div class="grid-3 growth-kpis">
      ${metric('Challenge actions', count(stats.challenge_actions), 'Times someone asked Tasteprint to prepare a challenge.')}
      ${metric('Creator tokens', count(stats.creator_tokens), 'Anonymous creator-session tokens. Rate claims unlock at the minimum sample.')}
      ${metric('Successful share actions', count(stats.successful_share_actions), 'Native share completions + clipboard copies.')}
      ${metric('Recipient opens', count(stats.recipient_opens), 'Challenge-receive events across devices when remote reporting is active.')}
      ${metric('Recipient completions', count(stats.recipient_completions), 'Attributed recipients who completed the challenge flow.')}
      ${metric('Match unlocks', count(stats.match_unlocks), 'Attributed flows that reached the comparison result.')}
    </div>

    <div class="result-grid">
      <section class="card">
        <div class="eyebrow">Creator-token effectiveness</div>
        <h2>${rate(source === 'remote' ? stats.token_activation_pct : null)}</h2>
        <p class="small">Creator tokens that produced at least one recipient open. Hidden until ${stats.minimum || MIN_REFERRAL_SAMPLE} creator tokens and unavailable in local-only mode.</p>
        <div class="growth-mini"><span>Tokens opened</span><strong>${source === 'remote' ? `${count(stats.tokens_opened)} / ${count(stats.creator_tokens)}` : 'Backend needed'}</strong></div>
        <div class="growth-mini"><span>Tokens producing a completion</span><strong>${source === 'remote' ? `${count(stats.tokens_completed)} / ${count(stats.creator_tokens)}` : 'Backend needed'}</strong></div>
        <div class="growth-mini"><span>Completion-producing token rate</span><strong>${source === 'remote' ? rate(stats.completion_producing_token_pct) : 'Backend needed'}</strong></div>
      </section>
      <section class="card">
        <div class="eyebrow">Recipient funnel</div>
        <h2>${rate(source === 'remote' ? stats.recipient_completion_pct : null)}</h2>
        <p class="small">Attributed recipient completions ÷ attributed recipient opens. The rate stays hidden until enough attributed opens exist.</p>
        <div class="growth-mini"><span>Attributed opens</span><strong>${source === 'remote' ? count(stats.attributed_opens) : 'Backend needed'}</strong></div>
        <div class="growth-mini"><span>Attribution coverage</span><strong>${source === 'remote' ? rate(stats.attribution_coverage_pct) : 'Backend needed'}</strong></div>
        <div class="growth-mini"><span>Same-session reshare rate</span><strong>${source === 'remote' ? rate(stats.same_session_reshare_pct) : 'Backend needed'}</strong></div>
      </section>
    </div>

    <section class="card growth-outcomes"><div class="eyebrow">Share-sheet outcomes</div><div>${outcomeRows(stats.share_outcomes)}</div></section>

    <div class="callout growth-note"><div class="eyebrow">What this does not claim</div><p class="small">A creator token is not a person and a share callback is not proof that a message was delivered. Same-session resharing undercounts people who return later. These are product-loop diagnostics, not user identity or social-graph analytics.</p></div>
  </section>`;
}

async function renderGrowth() {
  const app = document.querySelector('#app');
  document.title = 'Tasteprint Referral Loop';
  app.innerHTML = `<section class="panel pad"><div class="eyebrow">Tasteprint · Referral loop</div><h1>Measuring the invite loop…</h1><div class="card"><p class="small">Loading privacy-safe referral aggregates.</p></div></section>`;

  try {
    const remote = await fetchReferralStats();
    if (remote) {
      renderReport(app, remote, 'remote');
      return;
    }
    const local = referralAggregate(window.TasteprintAnalytics?.localEvents?.() || []);
    renderReport(app, local, 'local');
  } catch (error) {
    console.error(error);
    const local = referralAggregate(window.TasteprintAnalytics?.localEvents?.() || []);
    renderReport(app, local, 'local');
    const health = app.querySelector('.growth-health');
    if (health) health.insertAdjacentHTML('beforeend', '<p class="small">The production referral RPC could not be loaded, so this view fell back to current-browser data.</p>');
  }
}
