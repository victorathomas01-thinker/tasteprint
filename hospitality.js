import { recommendExperiences, safeOfferURL, STAY_PATTERNS } from './hospitality-core.js';

export const escapeHTML = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
const illustration = new URL('./hotel-illustration.svg', import.meta.url).href;

export function hospitalityHomeArt() {
  return `<div class="hotel-visual"><img src="${illustration}" alt="" width="480" height="420"><div class="hotel-visual-caption">A fictional place.<br>A more personal way to choose.</div></div>`;
}

export function hospitalityResultView(campaign, profile) {
  const matches = recommendExperiences(campaign, { archetype: profile.archetype.name, travelMode: profile.mode.name });
  const pattern = STAY_PATTERNS[profile.mode.name];
  return `<section class="panel pad hospitality-result">
    <div class="hotel-result-top"><a class="hotel-wordmark" href="?campaign=${encodeURIComponent(campaign.id)}">${escapeHTML(campaign.name)}</a><span class="hotel-demo-badge">${campaign.demo ? 'Fictional hotel demo' : 'Guest experience'}${campaign.localDraft ? ' · Local draft' : ''}</span></div>
    <div class="hotel-result-intro"><div class="eyebrow">Your kind of stay</div><h1>${escapeHTML(pattern?.title || 'A few ideas to make this stay yours.')}</h1><p class="lede">${escapeHTML(pattern?.reason || 'These choices reflect the preferences you shared.')} Here are a few different ways that could feel.</p><p class="small">A preference match, not a certainty. You know what feels right today.</p></div>
    <div class="hotel-section-heading"><h2>${escapeHTML(campaign.copy?.catalogTitle || 'A few ideas for your stay')}</h2><p class="small">${escapeHTML(campaign.copy?.catalogSubtitle || 'Choose a close match or explore a different direction.')}</p></div>
    ${matches.length ? `<div class="hotel-offer-grid">${matches.map(({ item, matched, reason }, index) => {
      const href = campaign.demo ? null : safeOfferURL(item.href);
      return `<article class="hotel-offer"><div class="hotel-offer-top"><span class="hotel-offer-number" aria-hidden="true">0${index + 1}</span><span class="hotel-offer-category">${escapeHTML(item.tag)}</span></div><p class="hotel-fit-label">${matched ? 'Fits your preference pattern' : 'A different direction'}</p><h3>${escapeHTML(item.name)}</h3><p class="small">${escapeHTML(item.description)}</p><div class="hotel-reason"><strong>Why this is here</strong><p>${escapeHTML(reason)}</p></div>${item.tradeoff ? `<p class="hotel-tradeoff"><strong>Worth considering</strong><br>${escapeHTML(item.tradeoff)}</p>` : ''}${href ? `<a class="primary campaign-cta" data-campaign-cta="${escapeHTML(item.id)}" data-rank="${index + 1}" href="${escapeHTML(href)}" target="_blank" rel="noopener noreferrer">${escapeHTML(item.ctaLabel || 'Explore this option')}</a>` : `<button class="primary campaign-cta" type="button" data-hotel-offer="${index}" data-campaign-cta="${escapeHTML(item.id)}" data-rank="${index + 1}" data-demo-only="true" aria-expanded="false" aria-controls="hotel-next-${index}">${escapeHTML(item.ctaLabel || 'Explore this idea')}</button><div class="hotel-next-step" id="hotel-next-${index}" hidden><strong>${campaign.demo ? 'Illustrative next step' : 'Ask the hotel team'}</strong><p>${campaign.demo ? 'In a real hotel campaign, this could open the hotel’s approved details, booking or concierge page. This demo has no availability or reservation system; nothing has been booked.' : 'There is no destination link configured for this offering. Check details and availability with the hotel team before making plans.'}</p></div>`}</article>`;
    }).join('')}</div>` : '<div class="hotel-empty"><h3>No experiences are available right now.</h3><p>Ask the hotel team about current options, or try again later. We won’t invent an offer to fill the space.</p></div>'}
    ${matches.length && !matches.some((match) => match.matched) ? '<p class="hotel-empty">There isn’t a close catalog match for this result. The ideas above are alternatives to consider, not personalized best-fit claims.</p>' : ''}
    <div class="hotel-result-footer"><div><h2>Keep the part that feels like you.</h2><p class="small">You can start again for a different kind of day. No signup or contact details needed.</p></div><button class="secondary" data-action="retake">Try a different stay</button></div>
    ${campaign.demo ? `<div class="hotel-honesty"><strong>Demonstration, not a real hotel offering.</strong><p>Demo Hotel CLT and its experiences are fictional. No affiliations, menus, prices, availability, reservations or dietary suitability are promised.</p><a href="?campaignGuide=${encodeURIComponent(campaign.id)}">For hotel teams: see the operator walkthrough →</a></div>` : ''}
  </section>`;
}

export function bindHospitalityResult(app) {
  app.querySelectorAll('[data-hotel-offer]').forEach((button) => button.addEventListener('click', () => {
    const details = app.querySelector(`#hotel-next-${Number(button.dataset.hotelOffer)}`);
    if (!details) return;
    const opening = details.hidden;
    details.hidden = !opening;
    button.setAttribute('aria-expanded', String(opening));
  }));
}
