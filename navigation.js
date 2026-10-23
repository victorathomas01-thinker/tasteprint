import { activeNavigation, entryPage } from './navigation-core.js';

const params = new URL(location.href).searchParams;
const active = activeNavigation(params);
const items = [
  ['discover','?discover=1','Discover'], ['together','?together=1','Together'],
  ['friends','?friends=1','Friends'], ['plans','?plans=1','Plans'],
  ['saved','?saved=1','Saved'], ['profile','?profile=1','My Passport']
];
const secondary=[['campaigns','?campaigns=1','Campaigns'],['next','?next=1','Next Moves'],['business','?business=1','For businesses']];
const links=list=>list.map(([id,href,name])=>`<a href="${href}"${active===id?' aria-current="page"':''}>${name}</a>`).join('');
const header = document.createElement('header');
header.className = 'site-header';
header.innerHTML = `<div class="site-header-inner"><a class="site-wordmark" href="?" aria-label="Tasteprint home"${active==='home'?' aria-current="page"':''}><span aria-hidden="true">◎</span> tasteprint<span class="site-wordmark-dot" aria-hidden="true">.</span></a><nav class="site-main-nav" aria-label="Main navigation">${links(items)}</nav><nav class="site-more-nav" aria-label="More destinations"><details class="site-more"><summary${secondary.some(([id])=>id===active)?' class="has-current"':''}>More</summary><div class="site-more-links">${links(secondary)}</div></details></nav></div>`;
const more=header.querySelector('.site-more');
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&more.open){more.open=false;more.querySelector('summary').focus();}});
document.addEventListener('pointerdown',event=>{if(!more.contains(event.target))more.open=false;});
document.body.insertBefore(header, document.querySelector('#app'));
const footer = document.createElement('footer');
footer.className = 'site-footer';
footer.innerHTML = '<span>Tasteprint · Find what fits.</span><nav aria-label="Resources"><a href="?privacy=1">Privacy &amp; data controls</a><a href="?tour=1">Product tour</a><a href="?business=1">Business tools</a></nav>';
document.querySelector('#app').insertAdjacentElement('afterend', footer);
document.body.classList.add('has-site-navigation');
if (entryPage(params)) document.body.classList.add('is-entry-page');
