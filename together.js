import {dimensions,projection,encodeShare,decodeShare,rankTogether,transition} from './together-core.js';
const params=new URL(location.href).searchParams;
if(params.get('together')==='1'){
 const app=document.querySelector('#app');
 const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
 const master=window.TasteprintPassport?.master();
 let own=projection(master?.modules?master.scores:{curiosity:70,serenity:70,energy:40});
 const fragment=new URLSearchParams(location.hash.slice(1));
 let friend=fragment.has('taste')?decodeShare(fragment.get('taste')):null;
 let message=fragment.has('taste')&&!friend?'This preference link is invalid or expired. Ask your friend for a new one.':'';
 let shortlist=false,excludeActive=false,plan=null,saved=new Set();
 const button=(action,label)=>`<button class="secondary" data-social="${action}">${label}</button>`;
 function render(){
 app.innerHTML=`<section class="panel pad together"><div class="eyebrow">Tasteprint · Together · Review prototype</div><h1>Find your common ground.</h1><p class="lede">Choose something worth doing with someone you know.</p><p class="callout">Local prototype. Preference links work across browsers. Plans and simulated friend responses stay on this page; nothing is sent or synchronized. Reload clears plans.</p><p role="status">${esc(message)}</p>
 <h2>Your shared preferences</h2><p class="small">${master?.modules?'Starting from your Passport.':'No Passport needed: adjust these starting preferences.'} These are preference patterns, not shared saved items or a people-compatibility score.</p>
 <div class="grid-3">${dimensions.map(k=>`<div class="card"><label>${k}<input type="range" min="0" max="100" value="${own[k]??50}" data-preference="${k}" aria-label="Your ${k}"></label><label><input type="checkbox" data-share="${k}" checked> Include ${k} in link</label></div>`).join('')}</div>
 <p class="small">Link preview: only checked preference values. No name, answers, account ID, history or plan details. Anyone holding the link can read or alter it; it expires in 7 days but cannot be revoked. Share only non-sensitive preferences with a trusted friend.</p>
 ${button('share','Create preference link')}<label id="social-link-wrap" hidden>Copy this link<input id="social-link" readonly></label>
 <h2 style="margin-top:28px">${friend?'A friend shared their preferences':'Try it before inviting a friend'}</h2>
 <p class="small">${friend?'This is a self-declared link, not verified identity.':'Sample friend uses invented preferences. No real social data.'}</p>${button('sample','Use sample friend')}
 ${friend?`<p>Shared fields: ${esc(Object.keys(friend).join(', '))}. Differences are tradeoffs, not incompatibility.</p><label><input type="checkbox" id="exclude-active" ${excludeActive?'checked':''}> Exclude physically active ideas (hard constraint)</label>${button('compare','Find joint ideas')}`:''}
 ${shortlist?`<h2 style="margin-top:28px">Ideas for both of you</h2><p class="small">Editorial activity formats, not venue listings. You supply the actual film, recipe or route. No prices or availability are claimed. Ranking favors the least-satisfied participant (60% minimum fit, 40% mean fit); it is an unvalidated engineering heuristic.</p><div class="social-ideas">${rankTogether(own,friend,{excludeActive}).map((item,i)=>`<article class="card"><div class="eyebrow">${['Strongest joint fit','Alternative','Wildcard'][i]}</div><h3>${item.title}</h3><p>${item.copy}</p><p class="small">Why for both: ${esc(item.reason)}.</p><p class="small">Discuss your ${item.tradeoff} difference and any access, budget or dietary needs before choosing.</p>${button('save:'+item.id,saved.has(item.id)?'Saved on this page':'Save for yourself')} ${button('suggest:'+item.id,'Suggest this idea')}</article>`).join('')}</div>`:''}
 <form id="custom-idea"><h3 style="margin-top:24px">Have a concrete idea?</h3><label>Title<input name="title" required maxlength="100" placeholder="The film or activity you actually want to try"></label><label>Optional HTTPS source link<input name="url" type="url" placeholder="https://…"></label><button type="submit" class="primary">Suggest your idea</button></form>
 ${plan?`<section class="card" id="shared-plan" style="margin-top:24px"><div class="eyebrow">Local plan simulation · never a booking</div><h2>${esc(plan.title)}</h2>${plan.url?`<a href="${esc(plan.url)}" target="_blank" rel="noopener noreferrer">Your supplied source (unverified)</a>`:''}<p role="status">State: ${esc(plan.state)}</p><p>Interest — You: ${plan.interest?.you?'yes':'not yet'}; sample friend: ${plan.interest?.friend?'yes':'not yet'}.</p><p>${esc(plan.details||'No date or place agreed.')}</p>${button('you:interest','I am interested')} ${button('friend:interest','Simulate friend interest')} ${button('friend:decline','Simulate friend declining')}
 <form id="plan-details"><label>Proposed date, time and place (local only)<input name="details" required maxlength="300" value="${esc(plan.details||'')}"></label><button type="submit" class="secondary">Propose details / request reapproval</button></form>
 ${button('you:agree','I agree to these details')} ${button('friend:agree','Simulate friend agreeing')} ${button('you:cancel','Withdraw / cancel')} ${button('you:complete','I tried it (self-report)')}<p class="small">Changes reset both approvals. Completion is your self-report, never verified attendance. Sample friend controls demonstrate states; they cannot establish another person’s consent.</p></section>`:''}</section>`;
 app.querySelectorAll('[data-preference]').forEach(el=>el.oninput=()=>{own[el.dataset.preference]=Number(el.value);shortlist=false;});
 app.querySelector('#exclude-active')?.addEventListener('change',e=>{excludeActive=e.target.checked;if(shortlist)render();});
 app.querySelectorAll('[data-social]').forEach(el=>el.onclick=()=>act(el.dataset.social));
 app.querySelector('#custom-idea').onsubmit=e=>{e.preventDefault();const data=new FormData(e.target);let url=data.get('url').trim();if(url){try{const u=new URL(url);if(u.protocol!=='https:'||u.username||u.password)throw Error();url=u.href;}catch{message='Use a valid HTTPS link without embedded credentials.';render();return;}}if(!data.get('title').trim()){message='Add an idea title.';render();return;}plan={title:data.get('title').trim(),url,state:'proposed',interest:{}};message='Local proposal created. No invitation has been sent.';render();};
 app.querySelector('#plan-details')?.addEventListener('submit',e=>{e.preventDefault();try{plan=transition(plan,'you','details',new FormData(e.target).get('details'));message='Both participants must agree to this version.';}catch(err){message=err.message;}render();});
 }
 function act(action){try{
 if(action==='share'){
  const keys=[...app.querySelectorAll('[data-share]:checked')].map(el=>el.dataset.share);
  const u=new URL(location.href);u.search='?together=1';u.hash=new URLSearchParams({taste:encodeShare(projection(own,keys))}).toString();
  app.querySelector('#social-link-wrap').hidden=false;app.querySelector('#social-link').value=u.href;app.querySelector('#social-link').select();return;
 }
 if(action==='sample'){friend={curiosity:85,serenity:55,energy:65};message='Using an invented sample friend.';shortlist=false;}
 else if(action==='compare'){shortlist=true;message='Only the shared fields affect these suggestions.';}
 else if(action.startsWith('save:')){saved.add(action.split(':')[1]);message='Saved locally on this page. This is not a shared invitation.';}
 else if(action.startsWith('suggest:')){const item=rankTogether(own,friend,{excludeActive}).find(x=>x.id===action.split(':')[1]);plan={title:item.title,state:'proposed',interest:{}};message='Local proposal created. No invitation has been sent.';}
 else {const [actor,event]=action.split(':');plan=transition(plan,actor,event);message='Local simulation updated.';}
 }catch(err){message=err.message;}render();}
 window.addEventListener('hashchange',()=>{const incoming=new URLSearchParams(location.hash.slice(1));friend=incoming.has('taste')?decodeShare(incoming.get('taste')):null;shortlist=false;plan=null;message=incoming.has('taste')&&!friend?'This preference link is invalid or expired. Ask your friend for a new one.':'';render();});
 render();
}
