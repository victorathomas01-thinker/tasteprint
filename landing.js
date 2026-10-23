import { BUSINESS_TOOLS, discoveryModules, entryPage, moduleHref } from './navigation-core.js';
import { listBundledCampaigns } from './campaign-config.js';

const esc = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
const link = (href, text, primary = false) => `<a class="${primary ? 'primary' : 'secondary'}" href="${esc(href)}">${esc(text)}</a>`;

function moduleCards() {
  return discoveryModules().map((module) => `<a class="entry-module" href="${moduleHref(module.id)}"><span class="entry-module-icon" aria-hidden="true">${module.icon}</span><div><h3>${esc(module.name)}</h3><p>${esc(module.copy)}</p></div><span class="entry-arrow" aria-hidden="true">→</span></a>`).join('');
}

function home() {
  return `<section class="entry-hero"><div class="eyebrow">Less searching. More choosing.</div><h1>A little more you.<br><span>A lot less guesswork.</span></h1><p class="lede">Explore specific ideas, save what catches your eye, and understand what you enjoy. No assessment required to start.</p><div class="row">${link('?discover=1', 'Explore ideas', true)}${link('?modules=1', 'Explore your tastes')}${link('?business=1', 'For my business →')}</div><p class="small">Six discovery experiences · No signup needed</p><div class="entry-orbit" aria-hidden="true"><span>Travel</span><span>Style</span><span>Stories</span><span>Movement</span><span>Food</span><span>Living</span><b>your<br>tasteprint</b></div></section>
  <section class="entry-section" aria-labelledby="discover-heading"><div class="entry-section-head"><div><div class="eyebrow">Tasteprint Discover</div><h2 id="discover-heading">What are you in the mood to discover?</h2><p class="small">Eight choices. A clearer sense of your taste. Recommendations with a reason.</p></div>${link('?module=escape', 'Start with travel →')}</div><div class="entry-module-grid">${moduleCards()}</div></section>
  <section class="entry-section entry-journey" aria-labelledby="journey-heading"><div><div class="eyebrow">Keep the useful part</div><h2 id="journey-heading">Your taste has a home.</h2><p class="small">Each completed experience adds to your Passport. Save a recommendation in Next Moves, try it, and record how it went. Share or compare with a friend from your result.</p></div><div class="entry-feature-links">${link('?profile=1', 'Open my Passport →')}${link('?next=1', 'See my Next Moves →')}</div></section>
  <section class="entry-section entry-business-callout"><div><div class="eyebrow">Tasteprint Experiences · For businesses</div><h2>Help your customers find their fit.</h2><p class="lede">Turn a curated catalog into a branded discovery experience. Explore the guest journey, then shape your own campaign in Studio.</p><div class="row">${link('?business=1', 'Explore business tools', true)}${link('?campaigns=1', 'Browse campaigns')}</div></div><div class="entry-ticket"><span class="eyebrow">Featured fictional campaign</span><h3>Demo Hotel CLT</h3><p class="small">A fictional Charlotte hotel.<br>A more personal kind of stay.</p>${link('?campaignGuide=charlotte-boutique-demo', 'See the hotel walkthrough →')}</div></section>`;
}

function business() {
  return `<section class="entry-intro"><div class="eyebrow">Tasteprint Experiences</div><h1>Your offerings.<br><span>Their kind of experience.</span></h1><p class="lede">Help customers choose from your catalog through a branded travel-preference experience. Start with the guest demo, then use the tools below to build and review a campaign.</p><div class="row">${link('?campaign=charlotte-boutique-demo', 'Try the hotel guest demo', true)}${link('?campaignGuide=charlotte-boutique-demo', 'Hotel team walkthrough')}${link('?campaignAdmin=1', 'Open Campaign Studio')}</div></section>
  <section class="entry-section"><div class="eyebrow">Company profiles · Local preview</div><h2>A home for your offerings.</h2><p class="small">Explore how company profiles, website links and interest-tagged activities, products and events could join discovery without another quiz. Ownership verification and hosted posting are not active.</p><div class="row">${link('?company=demo-hotel-clt', 'See the company profile demo')}${link('?companyAdmin=1', 'Open local Company Studio')}${link('?catalogAdmin=1', 'Open catalog workbench')}</div></section><section class="entry-section" aria-labelledby="business-heading"><div class="entry-section-head"><div><div class="eyebrow">From first idea to customer experience</div><h2 id="business-heading">One workflow. Four clear steps.</h2></div></div><div class="entry-tool-grid">${BUSINESS_TOOLS.map((tool) => `<article class="entry-tool"><div class="row spread"><span class="entry-step">${tool.step} / ${tool.label}</span><span class="entry-status">${tool.status}</span></div><h3>${tool.name}</h3><details class="tool-help"><summary aria-label="About ${tool.name}">ⓘ What does this mean?</summary><p class="small">${tool.name==='Campaign reporting'?'Counts are events recorded in this browser, not unique people, bookings or revenue. Production reports need authenticated team access and never substitute local activity after a failure.':tool.copy}</p></details><p class="small">${tool.copy}</p>${link(tool.href, `Open ${tool.name} →`)}</article>`).join('')}</div></section>
  <section class="entry-section entry-journey"><div><div class="eyebrow">Before you launch</div><h2>Explore locally. Connect when you’re ready.</h2><p class="small">Studio drafts stay in this browser and can be exported. The current campaign engine uses travel preferences. Hosted publishing, real lead storage, shared reporting and account sync require Supabase setup and validation. Demo links do not complete bookings.</p></div><div class="entry-feature-links">${link('?campaigns=1', 'Browse campaign experiences →')}${link('?stats=1', 'View aggregate activity →')}${link('?growth=1', 'View referral activity →')}</div></section>`;
}

export function campaignCards(campaigns) {
  if (!campaigns.length) return '<p class="small entry-empty">No campaigns match your search. Try another name or clear the search.</p>';
  return campaigns.map((campaign) => `<article class="entry-tool"><div class="row spread"><span class="eyebrow">${campaign.presentation?.kind === 'hospitality' ? 'Hotel guest experience' : 'Travel experience'}</span><span class="entry-status">${campaign.demo ? 'Fictional demo' : 'Featured campaign'}</span></div><h2>${esc(campaign.name)}</h2><p class="small">${esc(campaign.description)}</p>${link(`?campaign=${encodeURIComponent(campaign.id)}`, campaign.demo ? 'Try this demo →' : 'Explore campaign →', true)}</article>`).join('');
}

export function featuredCampaigns() {
  // Only bundled, reviewed campaigns belong in this public showcase. Browser-local
  // drafts and hosted team data stay in Studio/Workspace, never in this directory.
  return listBundledCampaigns();
}

function directory() {
  return `<section class="entry-intro"><div class="eyebrow">Campaign directory</div><h1>A new way<br><span>to find your fit.</span></h1><p class="lede">Explore featured branded experiences powered by Tasteprint. Try the fictional Charlotte hotel or Aster travel campaign to see how a few choices become curated recommendations.</p><p class="small">Fictional demos are labeled. Private drafts stay in your business tools.</p></section><section class="entry-section" aria-labelledby="campaign-heading"><div class="entry-section-head"><h2 id="campaign-heading">Featured experiences</h2><label class="entry-search">Search campaigns<input type="search" id="campaign-search" placeholder="Search by name or topic" autocomplete="off"></label></div><p class="small" id="campaign-count" role="status" aria-live="polite"></p><div class="entry-tool-grid" id="campaign-list">${campaignCards(featuredCampaigns())}</div></section><section class="entry-section entry-journey"><div><h2>Have a catalog of your own?</h2><p class="small">Explore the tools for creating a branded experience for your customers.</p></div>${link('?business=1', 'Explore business tools →')}</section>`;
}

export function landingView(params) {
  const page = entryPage(params);
  if (!page) return null;
  const titles = { home: 'Tasteprint — Find What Fits', business: 'Tasteprint — For Businesses', campaigns: 'Tasteprint — Campaign Directory' };
  document.title = titles[page];
  return `<div class="entry-page" data-entry-page="${page}">${({ home, business, campaigns: directory })[page]()}</div>`;
}

export function bindLanding(app) {
  const input = app.querySelector('#campaign-search');
  if (!input) return;
  const campaigns = featuredCampaigns();
  const update = () => {
    const query = input.value.trim().toLowerCase();
    const matches = campaigns.filter((campaign) => `${campaign.name} ${campaign.description}`.toLowerCase().includes(query));
    app.querySelector('#campaign-list').innerHTML = campaignCards(matches);
    app.querySelector('#campaign-count').textContent = `${matches.length} ${matches.length === 1 ? 'experience' : 'experiences'}`;
  };
  input.addEventListener('input', update);
  update();
}
