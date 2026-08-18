import { getCampaign } from './campaign-config.js';
import { EVENTS } from './analytics-contract.js';
import { trackCampaignConversion } from './campaign-conversion.js';

const env = import.meta.env || {};
const SUPABASE_URL = String(env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_PUBLIC_KEY = String(env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || '');
const REMOTE_ENABLED = Boolean(SUPABASE_URL && SUPABASE_PUBLIC_KEY);
const campaign = getCampaign();
const tracked = new Set();

function publicHeaders() {
  const headers = {
    apikey: SUPABASE_PUBLIC_KEY,
    'Content-Type': 'application/json'
  };
  if (SUPABASE_PUBLIC_KEY && !SUPABASE_PUBLIC_KEY.startsWith('sb_publishable_')) {
    headers.Authorization = `Bearer ${SUPABASE_PUBLIC_KEY}`;
  }
  return headers;
}

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function text(node) {
  return node?.textContent?.trim() || '';
}

function resultPanel() {
  return [...document.querySelectorAll('#app .panel')].find((panel) => {
    const hasResultEyebrow = [...panel.querySelectorAll('.eyebrow')]
      .some((node) => /escape archetype|matched tasteprint|your .* match/i.test(text(node)));
    const hasResultStructure = Boolean(panel.querySelector('.story')) &&
      [...panel.querySelectorAll('.eyebrow')].some((node) => /your trip mode|most defining pull/i.test(text(node)));
    return hasResultEyebrow || hasResultStructure;
  }) || null;
}

function trackOnce(key, eventName, properties = {}) {
  if (tracked.has(key)) return;
  tracked.add(key);
  window.TasteprintAnalytics?.track?.(eventName, properties);
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

async function submitRemote(payload) {
  if (!REMOTE_ENABLED) return { ok: false, localOnly: true };
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/capture-lead`, {
      method: 'POST',
      headers: publicHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: data.error || `Lead capture failed (${response.status}).` };
    return { ok: true, ...data };
  } catch (error) {
    return { ok: false, error: error?.message || 'Could not submit your request.' };
  }
}

function injectLeadCapture() {
  const config = campaign?.leadCapture;
  if (!campaign || !config?.enabled) return;
  const panel = resultPanel();
  if (!panel || panel.querySelector('.campaign-lead')) return;

  const section = document.createElement('section');
  section.className = 'campaign-lead';
  section.setAttribute('aria-label', config.title || `${campaign.name} follow-up`);
  const demoOnly = Boolean(config.demoOnly || campaign.demo);
  const collectName = Boolean(config.collectName);
  const privacyLink = config.privacyUrl
    ? `<a href="${esc(config.privacyUrl)}" target="_blank" rel="noopener noreferrer">Privacy details</a>`
    : '';

  section.innerHTML = `
    <div class="eyebrow">Optional follow-up</div>
    <h3>${esc(config.title || 'Want the matched details sent to you?')}</h3>
    <p class="small">${esc(config.body || 'Share your email only if you want this campaign partner to follow up about your result.')}</p>
    ${demoOnly ? '<div class="campaign-demo-note">Demo only · contact details entered here are not stored or sent anywhere.</div>' : ''}
    <form class="campaign-lead-form" novalidate>
      ${collectName ? '<label>Name <span class="small">(optional)</span><input name="name" autocomplete="name" maxlength="100" /></label>' : ''}
      <label>Email<input name="email" type="email" autocomplete="email" inputmode="email" maxlength="254" required /></label>
      <label class="campaign-consent">
        <input name="consent" type="checkbox" required />
        <span>${esc(config.consentText || `I agree that ${campaign.name} may contact me about this result.`)} ${privacyLink}</span>
      </label>
      <div class="row">
        <button class="primary" type="submit">${esc(config.submitLabel || 'Send me the details')}</button>
        <span class="small campaign-lead-status" role="status" aria-live="polite"></span>
      </div>
    </form>`;

  const catalog = panel.querySelector('.campaign-catalog');
  const storyRegion = [...panel.querySelectorAll('.result-grid')].at(-1);
  if (catalog?.nextSibling) catalog.parentNode.insertBefore(section, catalog.nextSibling);
  else if (storyRegion) panel.insertBefore(section, storyRegion);
  else panel.appendChild(section);

  trackOnce(`lead-view:${campaign.id}`, EVENTS.CAMPAIGN_LEAD_VIEW, {
    campaign_id: campaign.id,
    demo_only: demoOnly
  });

  const form = section.querySelector('form');
  const status = section.querySelector('.campaign-lead-status');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = form.elements.email?.value?.trim() || '';
    const name = collectName ? (form.elements.name?.value?.trim() || '') : '';
    const consent = Boolean(form.elements.consent?.checked);

    if (!validEmail(email)) {
      status.textContent = 'Enter a valid email address.';
      return;
    }
    if (!consent) {
      status.textContent = 'Please confirm the consent checkbox first.';
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    status.textContent = demoOnly ? 'Running demo submission…' : 'Submitting…';

    let result = { ok: true, demoOnly: true };
    if (!demoOnly) {
      // Only the fields required for the explicit follow-up use case leave the browser.
      result = await submitRemote({
        campaign_id: campaign.id,
        email,
        name: name || null,
        consent: true,
        consent_version: String(config.consentVersion || 'v1').slice(0, 40),
        source: 'post_result'
      });
    }

    if (!result.ok && !result.localOnly) {
      button.disabled = false;
      status.textContent = result.error || 'Could not submit right now.';
      return;
    }

    if (result.localOnly && !demoOnly) {
      button.disabled = false;
      status.textContent = 'Lead capture is not connected in this build yet.';
      return;
    }

    // PII is deliberately excluded from analytics events.
    window.TasteprintAnalytics?.track?.(EVENTS.CAMPAIGN_LEAD_SUBMIT, {
      campaign_id: campaign.id,
      source: 'post_result',
      demo_only: demoOnly
    });
    trackCampaignConversion('lead_submit', { source: 'post_result', demoOnly });

    form.reset();
    form.querySelectorAll('input,button').forEach((node) => { node.disabled = true; });
    status.textContent = demoOnly
      ? 'Demo conversion recorded locally. No contact details were stored.'
      : (config.successText || 'Got it. Your request was submitted.');
  });
}

if (campaign?.leadCapture?.enabled) {
  const observer = new MutationObserver(injectLeadCapture);
  observer.observe(document.querySelector('#app'), { childList: true, subtree: true });
  injectLeadCapture();
}
