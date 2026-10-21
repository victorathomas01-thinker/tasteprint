import { catalogItems } from './catalog.js';
import { rankCatalog } from './catalog-core.js';
import { readInterests, writeInterests } from './interests.js';
import { setItemDecision } from './interests-core.js';
import { itemCard, escapeHTML as esc } from './item-view.js';
const params = new URL(location.href).searchParams;
if (params.get('discover') === '1') {
  const app = document.querySelector('#app');
  document.body.classList.add('is-item-discovery');
  let query = '', savedOnly = false, maxCost = '', stepFree = false, message = '';
  function render() {
    const tastes = readInterests(), master = window.TasteprintPassport?.master();
    const constraints = { ...(maxCost !== '' ? {maxCost:Number(maxCost),currency:'USD'} : {}), stepFree };
    const candidates = catalogItems().filter(item => !tastes.dismissed.includes(item.id) && (!savedOnly || tastes.saved.includes(item.id)) && `${item.title} ${item.description} ${item.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()));
    const result = rankCatalog(candidates, [{interests:tastes,scores:master?.modules ? master.scores : {}}], constraints);
    document.title = 'Discover specific things · Tasteprint';
    app.innerHTML = `<section class="panel pad discovery-view"><div class="eyebrow">Tasteprint · Discover · Development review</div><h1>Find something worth sharing.</h1><p class="lede">Start with a specific film, then choose who you would enjoy it with.</p>
    <p class="callout">Six specific films to explore. Check the official source for current playback and suitability; links are not verified here. Your interests and saves stay on this browser.</p>
    <div class="row"><a class="secondary" href="?profile=1">Edit Passport interests</a><a class="secondary" href="?modules=1">Explore all six modules</a><a class="secondary" href="?together=1">Find something together</a></div>
    <form id="discovery-filters" class="card"><div class="interest-grid"><label>Search films<input type="search" name="query" value="${esc(query)}" placeholder="Title or interest"></label><label>Maximum cost in USD (unknown excluded)<input name="maxCost" type="number" min="0" step="0.01" value="${esc(maxCost)}"></label><label class="interest-share"><input type="checkbox" name="stepFree" ${stepFree?'checked':''}> Require confirmed step-free access</label><label class="interest-share"><input type="checkbox" name="savedOnly" ${savedOnly?'checked':''}> Saved items only</label></div><button type="submit" class="secondary">Apply filters</button></form>
    <p role="status" class="small">${esc(message || `${result.ranked.length} items. ${result.excluded.length} excluded by constraints.`)}</p>
    ${!result.ranked.length?'<div class="callout"><h2>No confirmed options with these filters.</h2><p>Unknown cost, access or availability never satisfies a hard requirement. Try clearing optional filters; do not relax requirements you need.</p></div>':''}
    <div class="discovery-grid">${result.ranked.map(entry=>itemCard(entry,{saved:tastes.saved})).join('')}</div>
    <p class="small">${tastes.dismissed.length} hidden on this browser.</p><button type="button" class="secondary" id="restore-items">Restore hidden items</button></section>`;
    app.querySelector('#discovery-filters').onsubmit = event => {
      event.preventDefault(); const data = new FormData(event.target);
      query = String(data.get('query')).trim(); maxCost = String(data.get('maxCost')).trim();
      stepFree = data.has('stepFree'); savedOnly = data.has('savedOnly'); message = ''; render();
    };
    app.querySelectorAll('[data-item-action]').forEach(button => button.onclick = () => {
      const next = setItemDecision(readInterests(), button.dataset.itemId, button.dataset.itemAction);
      message = writeInterests(next) ? 'Updated on this browser. Nothing was shared.' : 'Could not save: browser storage is unavailable.'; render();
    });
    app.querySelector('#restore-items').onclick = () => { message = writeInterests({...readInterests(),dismissed:[]})?'Hidden items restored.':'Could not update browser storage.'; render(); };
  }
  render();
}
