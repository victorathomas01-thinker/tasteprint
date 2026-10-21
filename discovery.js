import { socialRoute } from './navigation-core.js';
import { catalogItems } from './catalog.js';
import { CATEGORIES, rankCatalog, freshness, safeCatalogURL } from './catalog-core.js';
import { readInterests, writeInterests } from './interests.js';
import { setItemDecision, interestLabel } from './interests-core.js';
import { itemCard, escapeHTML as esc } from './item-view.js';
import { browseCatalog, discoveryConstraints, discoveryFilters, discoveryURL } from './discovery-core.js';
const params = new URL(location.href).searchParams;
if (socialRoute(params) === 'discover') {
  const app = document.querySelector('#app');
  document.body.classList.add('is-item-discovery');
  let filters = discoveryFilters(params), message = '';
  function navigate(next) {
    filters = next; message = ''; history.pushState(null, '', discoveryURL(filters)); render(true);
  }
  addEventListener('popstate', () => { filters = discoveryFilters(new URL(location.href).searchParams); message = ''; render(true); });
  function render(focus = false) {
    const tastes = readInterests(), master = window.TasteprintPassport?.master();
    const items = catalogItems();
    const selected = items.find(item => item.id === filters.item && item.status === 'active');
    const result = rankCatalog(browseCatalog(items, filters, tastes), [{interests:tastes,scores:master?.modules ? master.scores : {}}], discoveryConstraints(filters));
    const back = discoveryURL({...filters,item:''});
    const detail = selected ? `<div class="row"><a class="secondary" data-discovery-back href="${esc(back)}">Back to results</a><a class="secondary" href="?discover=1&item=${encodeURIComponent(selected.id)}">Direct item link</a></div>
      <div class="eyebrow">${esc(selected.category)} · ${esc(freshness(selected))}</div><h1 tabindex="-1">${esc(selected.title)}</h1><p class="lede">${esc(selected.description)}</p>
      <div class="badges">${selected.tags.map(tag=>`<span class="badge">${esc(interestLabel(tag))}</span>`).join('')}</div>
      <h2>Before you choose</h2><p>${esc(selected.content_note || 'Review suitability before making plans.')}</p>
      <dl class="item-facts"><dt>Location</dt><dd>${esc(selected.location || 'Not supplied')}</dd><dt>Cost</dt><dd>${selected.constraints?.cost == null?'Not confirmed':esc(`${selected.constraints.cost} ${selected.constraints.currency}`)}</dd><dt>Duration</dt><dd>${selected.constraints?.duration_minutes == null?'Not confirmed':esc(`${selected.constraints.duration_minutes} minutes`)}</dd><dt>Availability</dt><dd>${esc(selected.availability.status)} — confirm with the source</dd><dt>Step-free access</dt><dd>${selected.constraints?.step_free == null?'Not confirmed':selected.constraints.step_free?'Reported step-free; confirm with the source':'Not step-free'}</dd></dl>
      <p class="callout">${esc(freshness(selected))}. Listed information is not a booking or a guarantee. Hard requirements must be checked before agreeing on a plan.</p>
      <h2>Source and provenance</h2><p>${esc(selected.source.publisher)}. ${esc(selected.source.note)}</p><p>Last checked: ${esc(selected.source.verified_at || 'Not independently checked')}. Revision ${selected.revision}. Tags are editorial guidance.</p>
      <div class="row"><a class="secondary" href="${esc(safeCatalogURL(selected.action_url)||safeCatalogURL(selected.source.url))}" target="_blank" rel="noopener noreferrer">Open official reference ↗</a><button class="secondary" data-item-action="${tastes.saved.includes(selected.id)?'unsave':'save'}" data-item-id="${esc(selected.id)}">${tastes.saved.includes(selected.id)?'Unsave':'Save'}</button><a class="primary" href="?together=1#item=${encodeURIComponent(selected.id)}">Consider together</a><a class="secondary" href="?plans=1&item=${encodeURIComponent(selected.id)}">Propose a private plan</a></div>` : `<h1 tabindex="-1">This item is unavailable.</h1><p>It may have been removed or the link may be incorrect. No replacement has been selected.</p><a class="secondary" data-discovery-back href="${esc(back)}">Back to results</a>`;
    document.title = `${filters.item ? selected?.title || 'Unavailable item' : 'Discover specific things'} · Tasteprint`;
    app.innerHTML = `<section class="panel pad discovery-view"><div class="eyebrow">Tasteprint · Discover · Development review</div>${filters.item ? detail : `<h1 tabindex="-1">Find something worth sharing.</h1><p class="lede">Start with a specific film, then choose who you would enjoy it with.</p>
    <p class="callout">Six specific films to explore. Check the official source for current playback and suitability; links are not verified here. Your interests and saves stay on this browser.</p>
    <div class="row"><a class="secondary" href="?profile=1">Edit Passport interests</a><a class="secondary" href="?modules=1">Explore all six modules</a><a class="secondary" href="?together=1">Find something together</a></div>
    <form id="discovery-filters" class="card"><div class="interest-grid"><label>Search films<input type="search" name="query" maxlength="120" value="${esc(filters.query)}" placeholder="Title or interest"></label><div><label for="discovery-category">Category</label><select id="discovery-category" name="category"><option value="">All categories</option>${CATEGORIES.map(category=>`<option value="${category}" ${filters.category===category?'selected':''}>${category[0].toUpperCase()+category.slice(1)}</option>`).join('')}</select></div>
    ${[['maxCost','Maximum cost in USD (unknown excluded)','0.01'],['maxMinutes','Maximum duration in minutes (unknown excluded)','1'],['maxDistance','Maximum distance in km (unknown excluded)','0.1']].map(([name,label,step])=>`<label>${label}<input name="${name}" type="number" min="0" step="${step}" value="${esc(filters[name])}"></label>`).join('')}
    ${[['stepFree','Require confirmed step-free access'],['available','Require confirmed availability'],['savedOnly','Saved items only']].map(([name,label])=>`<label class="interest-share"><input type="checkbox" name="${name}" ${filters[name]?'checked':''}> ${label}</label>`).join('')}</div><div class="row"><button type="submit" class="secondary">Apply filters</button><a class="secondary" data-reset-filters href="?discover=1">Clear filters</a></div></form>
    ${!result.ranked.length?'<div class="callout"><h2>No confirmed options with these filters.</h2><p>Unknown cost, access or availability never satisfies a hard requirement. Try clearing optional filters; do not relax requirements you need.</p></div>':''}
    <div class="discovery-grid">${result.ranked.map(entry=>itemCard(entry,{saved:tastes.saved,detailHref:discoveryURL({...filters,item:entry.item.id})})).join('')}</div>
    <p class="small">${tastes.dismissed.length} hidden on this browser.</p><button type="button" class="secondary" id="restore-items">Restore hidden items</button>`}
    <p role="status" tabindex="-1" class="small">${esc(message || (filters.item ? 'Your tastes are private. An item link shares only its public catalog ID.' : `${result.ranked.length} items. ${result.excluded.length} excluded by constraints.`))}</p></section>`;
    app.querySelector('#discovery-filters')?.addEventListener('submit', event => {
      event.preventDefault(); const data = new FormData(event.target);
      navigate({...filters,query:String(data.get('query')).trim(),category:String(data.get('category')),maxCost:String(data.get('maxCost')).trim(),maxMinutes:String(data.get('maxMinutes')).trim(),maxDistance:String(data.get('maxDistance')).trim(),stepFree:data.has('stepFree'),available:data.has('available'),savedOnly:data.has('savedOnly'),item:''});
    });
    app.querySelectorAll('[data-item-detail], [data-discovery-back], [data-reset-filters]').forEach(link => link.addEventListener('click', event => {
      if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); navigate(discoveryFilters(new URL(link.href).searchParams));
    }));
    app.querySelectorAll('[data-item-action]').forEach(button => button.onclick = () => {
      const next = setItemDecision(readInterests(), button.dataset.itemId, button.dataset.itemAction);
      message = writeInterests(next) ? 'Updated on this browser. Nothing was shared.' : 'Could not save: browser storage is unavailable.'; render(); app.querySelector('[role=status]').focus();
    });
    app.querySelector('#restore-items')?.addEventListener('click', () => { message = writeInterests({...readInterests(),dismissed:[]})?'Hidden items restored.':'Could not update browser storage.'; render(); app.querySelector('[role=status]').focus(); });
    if (focus) app.querySelector('h1').focus();
  }
  render();
}
