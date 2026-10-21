import { socialRoute } from './navigation-core.js';
import { dimensions, projection, encodeTasteShare, decodeTasteShare, commonGround, transition } from './together-core.js';
import { catalogItems } from './catalog.js';
import { rankCatalog, safeCatalogURL } from './catalog-core.js';
import { readInterests, writeInterests } from './interests.js';
import { interestLabel, setItemDecision } from './interests-core.js';
import { itemCard, escapeHTML as esc } from './item-view.js';
const params = new URL(location.href).searchParams;
if (socialRoute(params) === 'together') {
  const app = document.querySelector('#app');
  document.body.classList.add('is-together');
  const master = window.TasteprintPassport?.master();
  let own = projection(master?.modules ? master.scores : {});
  const scoreFields = new Set(master?.modules ? dimensions : []);
  const interestFields = new Set(readInterests().shared);
  const itemFields = new Set();
  let friend = null, sampleFriend = false, showIdeas = false, plan = null, message = '', activeItem = '', excludeDrama = false;
  const items = catalogItems();
  function loadFragment() {
    const fragment = new URLSearchParams(location.hash.slice(1));
    friend = fragment.has('taste') ? decodeTasteShare(fragment.get('taste')) : null;
    sampleFriend = false; showIdeas = Boolean(friend); plan = null;
    activeItem = fragment.get('item') || '';
    message = fragment.has('taste') && !friend ? 'This preference link is invalid or expired. Ask your friend for a new one.' : '';
    if (activeItem && !items.some(item=>item.id===activeItem)) message = 'This film could not be found. Browse the current catalog instead.';
  }
  const button = (action,label) => `<button type="button" class="secondary" data-social="${action}">${label}</button>`;
  function proposal(item) {
    plan = {title:item.title,url:safeCatalogURL(item.action_url)||'',state:'proposed',interest:{},itemId:item.id};
    message = 'A local proposal draft. No invitation has been sent.';
  }
  function render() {
    const tastes = readInterests();
    const ground = friend ? commonGround(tastes,friend) : {interests:[],items:[]};
    const participants = [{scores:own,interests:tastes}];
    if(friend) participants.push({scores:friend.scores,interests:{liked:friend.interests,saved:friend.saved}});
    const result = rankCatalog(items.filter(item=>!tastes.dismissed.includes(item.id)),participants,{excludedTags:excludeDrama?['drama']:[]});
    const selected = items.find(item=>item.id===activeItem);
    document.title = 'Together · Tasteprint';
    app.innerHTML = `<section class="panel pad together">
      <div class="eyebrow">Tasteprint · Together · Development review</div><h1>Find your common ground.</h1>
      <p class="lede">A specific film. Both of your tastes. One easier decision.</p>
      <p class="callout">Preference links share a snapshot across browsers. Saves stay on this browser. Plans are local drafts; no remote invitation, agreement or synchronization is active.</p>
      <p role="status" class="social-status">${esc(message)}</p>
      <div class="row"><a class="secondary" href="?profile=1">Edit Passport interests</a><a class="secondary" href="?discover=1">Browse specific films</a></div>
      ${selected?`<section class="card" style="margin-top:22px"><div class="eyebrow">A film to consider · not an invitation</div><h2>${esc(selected.title)}</h2><p>${esc(selected.description)}</p>${button('selected','Make a proposal draft')}</section>`:''}
      <section class="social-section"><h2>${sampleFriend?'Invented sample friend':friend?'A friend shared their preferences':'Start with someone you know'}</h2>
        <p class="small">${sampleFriend?'Sample preferences only, not a real person.':friend?'This link is self-declared and can be forwarded or altered. Identity is not verified.':'Choose which interests or films to share below, then send the link yourself. You do not need to finish any quiz.'}</p>
        ${button('sample','Use sample friend')}
        ${friend?`<div class="common-ground"><h3>What you actually share</h3><p>${ground.interests.length?ground.interests.map(id=>`<span class="badge">${esc(interestLabel(id))}</span>`).join(' '):'No explicit shared interest yet. The link may contain only broad preferences.'}</p>${ground.items.length?`<p>You both saved: ${ground.items.map(id=>esc(items.find(item=>item.id===id)?.title||id)).join(', ')}.</p>`:''}<p class="small">Your interests: ${tastes.liked.map(interestLabel).map(esc).join(', ')||'none selected'}. Friend shared: ${friend.interests.map(interestLabel).map(esc).join(', ')||'no explicit interests'}. Differences are options to discuss, not incompatibility.</p>${friend.saved.length?`<h3>Their shortlist snapshot</h3><ul>${friend.saved.map(id=>`<li>${esc(items.find(item=>item.id===id)?.title||id)}</li>`).join('')}</ul><p class="small">This is a shared snapshot, not a synchronized list or commitment.</p>`:''}</div><label class="interest-share"><input type="checkbox" id="exclude-drama" ${excludeDrama?'checked':''}> Exclude drama for this decision</label>${button('compare','Find joint ideas')}`:''}
      </section>
      <details class="social-section share-settings"><summary>Choose what to share</summary>
        <p class="small">Only checked fields go into the link. No name, account ID, raw answers, dislikes or plan details. Anyone with the link can read/alter it; seven-day expiry is client-side and links cannot be revoked. Use non-sensitive interests and a trusted recipient.</p>
        <h3>Approved Passport interests</h3>${tastes.shared.length?tastes.shared.map(id=>`<label class="interest-share"><input type="checkbox" data-share-interest="${id}" ${interestFields.has(id)?'checked':''}> Include ${esc(interestLabel(id))}</label>`).join(''):'<p class="small">Sharing is off by default. Approve individual liked interests in Passport, or share a selected film below.</p>'}
        <h3>Films to include in this shortlist link</h3>${tastes.saved.length?items.filter(item=>tastes.saved.includes(item.id)).map(item=>`<label class="interest-share"><input type="checkbox" data-share-item="${item.id}" ${itemFields.has(item.id)?'checked':''}> Include ${esc(item.title)}</label>`).join(''):'<p class="small">Save a film first. Saves are private until individually checked here.</p>'}
        <details><summary>Optional broad preference patterns</summary><p class="small">${master?.modules?'Starting from your Passport.':'No quiz-derived pattern: optionally adjust these starting values.'} These are preference sliders, not people-match percentages.</p><div class="grid-3">${dimensions.map(key=>`<div class="card"><label>${key}<input type="range" min="0" max="100" value="${own[key]??50}" data-preference="${key}" aria-label="Your ${key}"></label><label class="interest-share"><input type="checkbox" data-share="${key}" ${scoreFields.has(key)?'checked':''}> Include ${key} in link</label></div>`).join('')}</div></details>
      </details>
      ${button('share','Create preference link')}<label id="social-link-wrap" hidden>Copy this link<input id="social-link" readonly></label>
      <section class="social-section"><h2>${friend?'Specific ideas for both of you':'Start your film shortlist'}</h2>
        <p class="small">${friend?'Both people’s tastes count. An option that fits one person poorly moves down the list.':'Start from your expressed interests, or explore without a profile.'} Personal avoids and decision exclusions are hard filters. Only disclosed friend preferences can be considered; discuss unshared needs and constraints.</p>
        <p class="small">Check content notes and the official reference before choosing. Playback and availability have not been verified.</p>
        ${(!friend||showIdeas)?`<div class="social-ideas">${result.ranked.slice(0,3).map(entry=>itemCard(entry,{saved:tastes.saved,together:true})).join('')}</div>${!result.ranked.length?'<div class="callout">No films meet the current exclusions. Browse other ideas or add your own; required exclusions are never relaxed automatically.</div>':''}`:''}
      </section>
      <form id="custom-idea" class="card"><h3>Have a concrete idea?</h3><label>Title<input name="title" required maxlength="100" placeholder="A film or activity you actually want to try"></label><label>Optional HTTPS source link<input name="url" type="url" placeholder="https://…"></label><button type="submit" class="primary">Suggest your idea</button><p class="small">Your own idea is unverified and is not assigned invented matching metadata. It stays in this page’s draft.</p></form>
      ${plan?planView():''}
    </section>`;
    bind();
  }
  function planView() {
    const link = new URL(location.href); link.search='?together=1';link.hash=plan.itemId?new URLSearchParams({item:plan.itemId}).toString():'';
    return `<section class="card social-section" id="shared-plan"><div class="eyebrow">Local proposal draft · never a booking</div><h2>${esc(plan.title)}</h2>${plan.url?`<a href="${esc(plan.url)}" target="_blank" rel="noopener noreferrer">Open supplied source (unverified)</a>`:''}<p role="status">State: ${esc(plan.state)}</p><p>Use your usual chat to discuss this idea. No recipient has been contacted or agreed through Tasteprint.</p>${plan.itemId?`<label>Idea link (no preferences or plan details)<input readonly value="${esc(link.href)}"></label>`:''}
      <details class="plan-simulation"><summary>Explore demo decision steps (no remote responses)</summary><p class="callout">All controls below are a local simulation. Use invented date/place details for review. Reload clears the plan. Simulated friend responses do not establish another person’s consent.</p><p>Interest — You: ${plan.interest?.you?'yes':'not yet'}; sample friend: ${plan.interest?.friend?'yes':'not yet'}.</p><p>${esc(plan.details||'No date or place agreed.')}</p>
      ${button('you:interest','I am interested')} ${button('friend:interest','Simulate friend interest')} ${button('friend:decline','Simulate friend declining')}
      <form id="plan-details"><label>Proposed date, time and place (local only)<input name="details" required maxlength="300" value="${esc(plan.details||'')}"></label><button type="submit" class="secondary">Propose details / request reapproval</button></form>
      ${button('you:agree','I agree to these details')} ${button('friend:agree','Simulate friend agreeing')} ${button('you:cancel','Withdraw / cancel')} ${button('you:complete','I tried it (self-report)')}<p class="small">Changes invalidate both approvals. Completion is self-reported, never verified attendance.</p></details></section>`;
  }
  // Keep focus and open disclosures stable across stateful rerenders.
  function update() {
    const disclosureKey = el => `${el.closest('[data-catalog-item]')?.dataset.catalogItem||''}:${el.querySelector('summary')?.textContent}`;
    const open = new Set([...app.querySelectorAll('details[open]')].map(disclosureKey));
    const focused = document.activeElement;
    const attribute = ['data-social','data-preference','data-share','data-share-interest','data-share-item','id'].find(key=>focused?.hasAttribute(key));
    const value = attribute ? focused.getAttribute(attribute) : null;
    render();
    app.querySelectorAll('details').forEach(el=>{if(open.has(disclosureKey(el)))el.open=true;});
    if(attribute) [...app.querySelectorAll(`[${attribute}]`)].find(el=>el.getAttribute(attribute)===value)?.focus({preventScroll:true});
  }
  function bind() {
    app.querySelectorAll('[data-preference]').forEach(input=>{input.oninput=()=>{own[input.dataset.preference]=Number(input.value);};input.onchange=update;});
    for (const [selector,set,key] of [['[data-share]',scoreFields,'share'],['[data-share-interest]',interestFields,'shareInterest'],['[data-share-item]',itemFields,'shareItem']]) app.querySelectorAll(selector).forEach(input=>input.onchange=()=>{input.checked?set.add(input.dataset[key]):set.delete(input.dataset[key]);});
    app.querySelector('#exclude-drama')?.addEventListener('change',event=>{excludeDrama=event.target.checked;showIdeas=true;update();});
    app.querySelectorAll('[data-social]').forEach(input=>input.onclick=()=>act(input.dataset.social));
    app.querySelectorAll('[data-item-action]').forEach(input=>input.onclick=()=>{
      message=writeInterests(setItemDecision(readInterests(),input.dataset.itemId,input.dataset.itemAction))?'Updated on this browser. No invitation sent.':'Could not update: browser storage is unavailable.';
      if(input.dataset.itemAction==='dismiss'||input.dataset.itemAction==='unsave')itemFields.delete(input.dataset.itemId);
      update();
    });
    app.querySelectorAll('[data-suggest-item]').forEach(input=>input.onclick=()=>{proposal(items.find(item=>item.id===input.dataset.suggestItem));update();app.querySelector('#shared-plan')?.scrollIntoView({block:'start'});});
    app.querySelector('#custom-idea').onsubmit=event=>{
      event.preventDefault();const data=new FormData(event.target),title=String(data.get('title')).trim(),raw=String(data.get('url')).trim();
      if(!title||raw&&!safeCatalogURL(raw)){message='Add a title and a valid HTTPS link without embedded credentials.';update();return;}
      plan={title,url:raw?safeCatalogURL(raw):'',state:'proposed',interest:{}};message='Unverified idea saved in this page’s proposal draft.';update();
    };
    app.querySelector('#plan-details')?.addEventListener('submit',event=>{event.preventDefault();try{plan=transition(plan,'you','details',new FormData(event.target).get('details'));message='Both simulated participants must approve this version.';}catch(error){message=error.message;}update();});
  }
  function act(action) {
    try {
      if(action==='share'){
        const tastes=readInterests();
        const payload={scores:projection(own,[...scoreFields]),interests:[...interestFields].filter(id=>tastes.shared.includes(id)),saved:[...itemFields].filter(id=>tastes.saved.includes(id))};
        const url=new URL(location.href);url.search='?together=1';url.hash=new URLSearchParams({taste:encodeTasteShare(payload)}).toString();
        app.querySelector('#social-link-wrap').hidden=false;app.querySelector('#social-link').value=url.href;app.querySelector('#social-link').select();return;
      }
      if(action==='sample'){sampleFriend=true;friend={scores:{curiosity:85,serenity:55,energy:65},interests:['animation','fantasy'],saved:['spring']};showIdeas=true;message='Using invented sample preferences; no real person joined.';}
      else if(action==='compare'){showIdeas=true;message='Ranked using each participant’s disclosed preferences.';}
      else if(action==='selected'){const item=items.find(item=>item.id===activeItem);if(item)proposal(item);}
      else {const [actor,event]=action.split(':');plan=transition(plan,actor,event);message='Local simulation updated. No remote consent recorded.';}
    } catch(error){message=error.message;}
    update();
  }
  loadFragment();render();window.addEventListener('hashchange',()=>{loadFragment();render();});
}
