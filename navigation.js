import { activeNavigation, entryPage } from './navigation-core.js';

const params = new URL(location.href).searchParams;
const active = activeNavigation(params);
const items = [
  ['home', '?', 'Home'], ['discover', '?modules=1', 'Discover'],
  ['together', '?together=1', 'Together'], ['campaigns', '?campaigns=1', 'Campaigns'], ['business', '?business=1', 'For businesses'],
  ['profile', '?profile=1', 'My Passport'], ['next', '?next=1', 'Next Moves']
];
const header = document.createElement('header');
header.className = 'site-header';
header.innerHTML = `<div class="site-header-inner"><a class="site-wordmark" href="?" aria-label="Tasteprint home"><span aria-hidden="true">◎</span> tasteprint<span class="site-wordmark-dot" aria-hidden="true">.</span></a><nav aria-label="Main navigation">${items.map(([id, href, name]) => `<a href="${href}"${active === id ? ' aria-current="page"' : ''}>${name}</a>`).join('')}</nav></div>`;
document.body.insertBefore(header, document.querySelector('#app'));
const footer = document.createElement('footer');
footer.className = 'site-footer';
footer.innerHTML = '<span>Tasteprint · Find what fits.</span><nav aria-label="Resources"><a href="?privacy=1">Privacy &amp; data controls</a><a href="?tour=1">Product tour</a><a href="?business=1">Business tools</a></nav>';
document.querySelector('#app').insertAdjacentElement('afterend', footer);
document.body.classList.add('has-site-navigation');
if (entryPage(params)) document.body.classList.add('is-entry-page');
