import { getCampaign, matchCatalog } from './campaign-config.js';
import { EVENTS } from './analytics-contract.js';

const campaign = getCampaign();
const tracked = new Set();

function trackOnce(key, eventName, properties = {}) {
  if (tracked.has(key)) return;
  tracked.add(key);
  window.TasteprintAnalytics?.track?.(eventName, properties);
}

function applyTheme() {
  if (!campaign) return;
  const theme = campaign.theme || {};
  const root = document.documentElement;
  if (theme.accent) root.style.setProperty('--accent', theme.accent);
  if (theme.accentSoft) root.style.setProperty('--accent-soft', theme.accentSoft);
  if (theme.accentMid) root.style.setProperty('--accent-mid', theme.accentMid);
  if (theme.heroGlow) root.style.setProperty('--campaign-hero-glow', theme.heroGlow);
  root.dataset.campaign = campaign.id;
  document.title = `${campaign.name} × Tasteprint`;
  document.querySelector('meta[name="description"]')?.setAttribute(
    'content',
    `${campaign.name} powered by Tasteprint — a branded interactive recommendation experience.`
  );
}

function text(node) {
  return node?.textContent?.trim() || '';
}

function resultPanel() {
  return [...document.querySelectorAll('#app .panel')].find((panel) =>
    [...panel.querySelectorAll('.eyebrow')].some((node) => /escape archetype/i.test(text(node)))
  ) || null;
}

function findTravelMode(panel) {
  const callout = [...panel.querySelectorAll('.callout')].find((card) =>
    /your trip mode/i.test(text(card.querySelector('.eyebrow')))
  );
  const raw = text(callout?.querySelector('h3'));
  const knownModes = [...new Set(campaign.catalog?.flatMap((item) => item.modes || []) || [])];
  return knownModes.find((mode) => raw.includes(mode)) || raw.replace(/^\S+\s+/, '');
}

function campaignNote() {
  if (campaign.demo) return 'Fictional client demo · campaign configuration, scoring and catalog are data-driven.';
  if (campaign.localDraft) return 'Local campaign draft · created in Tasteprint Campaign Studio and stored only in this browser.';
  return '';
}

function campaignPill() {
  if (campaign.demo) return 'Demo catalog';
  if (campaign.localDraft) return 'Local draft catalog';
  return 'Partner catalog';
}

function personalizeHome() {
  const hero = document.querySelector('#app .hero');
  if (!hero) return;
  const copy = campaign.copy || {};
  const eyebrow = hero.querySelector('.eyebrow');
  const title = hero.querySelector('h1');
  const lede = hero.querySelector('.lede');
  const start = hero.querySelector('[data-action="start"]');

  if (eyebrow) eyebrow.textContent = campaign.label || `${campaign.name} × Tasteprint`;
  if (title && copy.title) title.textContent = copy.title;
  if (lede && copy.lede) lede.textContent = copy.lede;
  if (start && copy.start) start.textContent = copy.start;

  const noteText = campaignNote();
  if (noteText && !hero.querySelector('.campaign-demo-note')) {
    const note = document.createElement('div');
    note.className = 'campaign-demo-note';
    note.textContent = noteText;
    hero.appendChild(note);
  }

  trackOnce(`landing:${campaign.id}`, EVENTS.CAMPAIGN_VIEW, {
    campaign_id: campaign.id,
    placement: 'landing',
    local_draft: Boolean(campaign.localDraft)
  });
}

function personalizeQuiz() {
  const panel = document.querySelector('#app .panel.pad');
  if (!panel || resultPanel()) return;
  const eyebrow = panel.querySelector('.eyebrow');
  if (!eyebrow) return;
  if (/tasteprint forming/i.test(text(eyebrow))) return;
  if (/friend/i.test(text(eyebrow))) return;
  eyebrow.textContent = campaign.label || `${campaign.name} × Tasteprint`;
}

function catalogCard(item, rank) {
  const card = document.createElement('article');
  card.className = 'card campaign-catalog-card';
  card.dataset.catalogItem = item.id;

  const label = document.createElement('div');
  label.className = 'eyebrow';
  label.textContent = rank === 0 ? 'Top partner match' : rank === 1 ? 'Also fits' : 'Another angle';

  const heading = document.createElement('h3');
  heading.textContent = item.name;
  heading.style.marginTop = '9px';

  const tag = document.createElement('div');
  tag.className = 'campaign-tag';
  tag.textContent = item.tag || '';

  const description = document.createElement('p');
  description.className = 'small';
  description.textContent = item.description || '';

  const button = document.createElement(item.href ? 'a' : 'button');
  button.className = 'secondary campaign-cta';
  button.textContent = item.ctaLabel || 'Explore';
  button.dataset.campaignCta = item.id;
  button.dataset.rank = String(rank + 1);
  if (item.href) {
    button.href = item.href;
    button.target = '_blank';
    button.rel = 'noopener noreferrer';
  } else {
    button.type = 'button';
    button.dataset.demoOnly = 'true';
  }

  card.append(label, heading, tag, description, button);
  return card;
}

function injectCatalog() {
  const panel = resultPanel();
  if (!panel || panel.querySelector('.campaign-catalog')) return;

  const archetype = text(panel.querySelector('.row h2'));
  const travelMode = findTravelMode(panel);
  const matches = matchCatalog(campaign, { archetype, travelMode }).slice(0, 3);
  if (!matches.length) return;

  const section = document.createElement('section');
  section.className = 'campaign-catalog';
  section.setAttribute('aria-label', `${campaign.name} recommendations`);

  const header = document.createElement('div');
  header.className = 'campaign-catalog-head';
  const headerCopy = document.createElement('div');
  const eyebrow = document.createElement('div');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = campaign.label || `${campaign.name} × Tasteprint`;
  const heading = document.createElement('h3');
  heading.textContent = campaign.copy?.catalogTitle || `${campaign.name} recommendations`;
  const subtitle = document.createElement('p');
  subtitle.className = 'small';
  subtitle.textContent = campaign.copy?.catalogSubtitle || 'Partner recommendations matched to this Tasteprint result.';
  headerCopy.append(eyebrow, heading, subtitle);
  const pill = document.createElement('span');
  pill.className = 'campaign-demo-pill';
  pill.textContent = campaignPill();
  header.append(headerCopy, pill);

  const grid = document.createElement('div');
  grid.className = 'grid-3 campaign-catalog-grid';
  matches.forEach((item, index) => grid.appendChild(catalogCard(item, index)));

  const status = document.createElement('p');
  status.className = 'small campaign-catalog-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  section.append(header, grid, status);

  const storyRegion = [...panel.querySelectorAll('.result-grid')].at(-1);
  if (storyRegion) panel.insertBefore(section, storyRegion);
  else panel.appendChild(section);

  const resultEyebrow = [...panel.querySelectorAll('.eyebrow')].find((node) => /your escape archetype/i.test(text(node)));
  if (resultEyebrow && campaign.copy?.resultEyebrow) resultEyebrow.textContent = campaign.copy.resultEyebrow;

  panel.querySelectorAll('.story .eyebrow').forEach((node) => {
    if (/tasteprint · escape/i.test(text(node))) node.textContent = campaign.label || `${campaign.name} × Tasteprint`;
  });

  trackOnce(`result:${campaign.id}:${archetype}:${travelMode}`, EVENTS.CAMPAIGN_RESULT_MATCH, {
    campaign_id: campaign.id,
    archetype,
    travel_mode: travelMode,
    matched_items: matches.map((item) => item.id),
    local_draft: Boolean(campaign.localDraft)
  });
}

function inspect() {
  if (!campaign) return;
  personalizeHome();
  personalizeQuiz();
  injectCatalog();
}

if (campaign) {
  applyTheme();

  document.addEventListener('click', (event) => {
    const cta = event.target.closest('[data-campaign-cta]');
    if (!cta) return;

    const itemId = cta.dataset.campaignCta;
    const rank = Number(cta.dataset.rank || 0);
    window.TasteprintAnalytics?.track?.(EVENTS.CAMPAIGN_CTA, {
      campaign_id: campaign.id,
      item_id: itemId,
      rank,
      destination: cta.href || null,
      demo_only: cta.dataset.demoOnly === 'true',
      local_draft: Boolean(campaign.localDraft)
    });

    if (cta.dataset.demoOnly === 'true') {
      const status = cta.closest('.campaign-catalog')?.querySelector('.campaign-catalog-status');
      if (status) status.textContent = campaign.demo
        ? 'Demo CTA recorded. A real client campaign would open its booking or product page here.'
        : 'This catalog item has no destination URL yet.';
    }
  }, true);

  const observer = new MutationObserver(inspect);
  observer.observe(document.querySelector('#app'), { childList: true, subtree: true });
  inspect();
}

window.TasteprintCampaign = Object.freeze({
  active: () => campaign,
  inspect
});
