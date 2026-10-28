import {savedRoute} from './navigation-core.js';
import {loadConsumerCatalog,catalogUnavailable} from './consumer-catalog.js';
import {savedInterests,savedCatalog} from './saved-core.js';
import {INTERESTS_KEY,writeInterests} from './interests.js';
import {setItemDecision} from './interests-core.js';
import {itemCard,escapeHTML as esc} from './item-view.js';
if(savedRoute(new URL(location.href).searchParams)){
 const app=document.querySelector('#app');document.body.classList.add('is-item-discovery');document.title='Saved · Tasteprint';let message='',changing=false;
 app.textContent='Checking the current catalog…';
 let catalog;try{catalog=await loadConsumerCatalog();}catch{catalogUnavailable(app);}
 if(catalog){
 function read(){return savedInterests(localStorage.getItem(INTERESTS_KEY));}
 function render(){
  let tastes=null,error='';try{tastes=read();}catch{error='Your saved list could not be read. Nothing was changed. Try again or review Privacy & data controls.';}
  const list=tastes?savedCatalog(catalog.items,tastes.saved):{available:[],unavailable:[]};
  const moves=window.TasteprintNextMoves?.list?.()||[],active=moves.filter(move=>['saved','trying'].includes(move.status));
  app.innerHTML=`<section class="panel pad discovery-view"><div class="eyebrow">Tasteprint · Saved</div><h1>Saved for later.</h1><p class="lede">Keep specific ideas within reach.</p><p>These saves stay on this browser. They are not shared with friends or synced between devices.</p><p role="status" tabindex="-1">${esc(message)}</p><div class="row"><a class="primary" href="?discover=1">Find another idea</a><a class="secondary" href="?friends=1">Choose with a friend</a></div>
  ${error?`<p class="callout" role="alert">${esc(error)} <a href="?privacy=1">Open privacy controls</a></p>`:`<h2>Saved ideas (${list.available.length})</h2><p class="small">Saved choices are kept even when your tastes change. Check current details and suitability before choosing.</p>${list.available.length?`<div class="discovery-grid">${list.available.map(item=>itemCard({item,fits:[]},{saved:tastes.saved,detailHref:'?discover=1&item='+encodeURIComponent(item.id)})).join('')}</div>`:'<div class="callout"><h3>No specific items saved yet.</h3><p>Browse Discover and choose Save on something you want to return to.</p><a class="secondary" href="?discover=1">Explore Discover</a></div>'}${list.unavailable.length?`<section class="card"><h2>Unavailable saved items</h2><p>These IDs are no longer in the current catalog. Your saves were kept; availability and old details cannot be confirmed.</p>${list.unavailable.map(id=>`<p><code>${esc(id)}</code> <button class="secondary" data-item-action="unsave" data-item-id="${esc(id)}">Remove unavailable save</button></p>`).join('')}</section>`:''}`}
  <section class="card"><h2>From your assessments</h2><p>Next Moves keeps recommendations you marked Saved or Trying after an assessment. These are separate from the catalog saves above.</p>${active.length?`<p>${active.length} active assessment idea${active.length===1?'':'s'}.</p><ul>${active.slice(-3).reverse().map(move=>`<li>${esc(move.name||'Saved assessment idea')} · ${move.status==='trying'?'Trying':'Saved'}</li>`).join('')}</ul>`:'<p>No active assessment ideas on this browser yet.</p>'}<a class="secondary" href="?next=1">Open Next Moves</a></section></section>`;
  app.querySelectorAll('[data-item-action]').forEach(button=>button.onclick=()=>{
   try{const current=read();changing=true;const success=writeInterests(setItemDecision(current,button.dataset.itemId,button.dataset.itemAction));message=success?'Updated your saved list on this browser. Nothing was shared.':'Could not update your saved list. Your stored data was kept.';}catch{message='Could not read your saved data. Nothing was changed.';}finally{changing=false;render();app.querySelector('[role=status]').focus();}
  });
 }
 addEventListener('tasteprint:interests-updated',()=>{if(!changing)render();});addEventListener('tasteprint:next-moves',render);
 addEventListener('storage',event=>{if(event.key===INTERESTS_KEY||event.key===window.TasteprintNextMoves?.storageKey||event.key===null)render();});
 render();
}
}
