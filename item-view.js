import { freshness, safeCatalogURL } from './catalog-core.js';
import { interestLabel } from './interests-core.js';
export const escapeHTML = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
export function itemCard(entry, {saved = [], together = false} = {}) {
  const {item, fits} = entry;
  const esc = escapeHTML;
  return `<article class="card discovery-item" data-catalog-item="${esc(item.id)}">
    <div class="eyebrow">${esc(item.category)} · ${esc(freshness(item))}</div><h3>${esc(item.title)}</h3>
    <p>${esc(item.description)}</p><div class="badges">${item.tags.map(tag=>`<span class="badge">${esc(interestLabel(tag))}</span>`).join('')}</div>
    <p class="small">${esc(item.content_note || 'Review suitability with your friend.')}</p>
    <div class="item-reasons">${fits.map((fit,index)=>`<p class="small"><strong>${together ? index === 0 ? 'For you' : `For friend ${index}` : 'Why this appears'}:</strong> ${fit.matches.length ? `Your explicit interests include ${fit.matches.map(interestLabel).map(esc).join(', ')}.` : 'No explicit interest overlap; an option to explore.'} ${esc(fit.evidence)}</p>`).join('')}</div>
    <p class="small">Editorial recommendation, not validated compatibility. Availability, cost and suitability must be checked. ${esc(item.source.note)}</p>
    <div class="row"><a class="secondary" href="${esc(safeCatalogURL(item.action_url)||item.source.url)}" target="_blank" rel="noopener noreferrer">Open official reference ↗</a><button type="button" class="secondary" data-item-action="${saved.includes(item.id)?'unsave':'save'}" data-item-id="${esc(item.id)}">${saved.includes(item.id)?'Unsave':'Save'}</button><button type="button" class="secondary" data-item-action="dismiss" data-item-id="${esc(item.id)}">Not for me</button>${together?`<button type="button" class="primary" data-suggest-item="${esc(item.id)}">Suggest this film</button>`:`<a class="primary" href="?together=1#item=${encodeURIComponent(item.id)}">Consider together</a>`}</div>
  </article>`;
}
