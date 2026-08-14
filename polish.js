const app = document.querySelector('#app');
const live = document.querySelector('#a11y-status');
let lastViewKey = '';

const BRAND_MARK = `
<svg class="brand-mark" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
  <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" stroke-width="2.4" opacity=".22"/>
  <path d="M14 27c1.2-8.2 5-12.3 10-12.3S32.8 18.8 34 27" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
  <path d="M18 31.5c.8-5.5 2.8-8.3 6-8.3s5.2 2.8 6 8.3" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".74"/>
  <circle cx="24" cy="33.5" r="2.7" fill="currentColor"/>
</svg>`;

function baseHref() {
  const url = new URL(location.href);
  url.search = '';
  url.hash = '';
  return url.pathname.endsWith('/') ? url.pathname : url.pathname.replace(/[^/]*$/, '');
}

function addBrand() {
  document.querySelectorAll('.hero').forEach((hero) => {
    if (hero.querySelector('.brand-lockup')) return;
    const brand = document.createElement('a');
    brand.className = 'brand-lockup';
    brand.href = baseHref();
    brand.setAttribute('aria-label', 'Tasteprint home');
    brand.innerHTML = `${BRAND_MARK}<span>Tasteprint</span>`;
    hero.prepend(brand);
  });

  document.querySelectorAll('.story').forEach((story) => {
    if (story.querySelector('.story-brand-mark')) return;
    const mark = document.createElement('span');
    mark.className = 'story-brand-mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.innerHTML = BRAND_MARK;
    story.prepend(mark);
  });
}

function improveControls() {
  document.querySelectorAll('button').forEach((button) => {
    if (!button.hasAttribute('type')) button.type = 'button';
  });

  document.querySelectorAll('.choice').forEach((choice) => {
    if (choice.closest('.choice-grid')?.querySelector('.choice.selected')) {
      choice.setAttribute('aria-pressed', choice.classList.contains('selected') ? 'true' : 'false');
    } else {
      choice.removeAttribute('aria-pressed');
    }
  });

  document.querySelectorAll('input').forEach((input) => {
    if (!input.autocomplete) input.autocomplete = 'off';
  });
}

function currentViewKey() {
  const panel = app?.querySelector(':scope > .panel');
  if (!panel) return '';
  const eyebrow = panel.querySelector('.eyebrow')?.textContent?.trim() || '';
  const heading = panel.querySelector('h1,h2')?.textContent?.trim() || '';
  const step = [...panel.querySelectorAll('.small')]
    .map((node) => node.textContent.trim())
    .find((text) => /^Choice \d+ of \d+/.test(text)) || '';
  return `${eyebrow}|${heading}|${step}`;
}

function announceAndFocus() {
  const key = currentViewKey();
  if (!key || key === lastViewKey) return;
  lastViewKey = key;

  const panel = app.querySelector(':scope > .panel');
  panel?.classList.add('view-enter');

  const heading = panel?.querySelector('h1,h2');
  if (heading) {
    heading.tabIndex = -1;
    requestAnimationFrame(() => heading.focus({ preventScroll: false }));
  }

  if (live) {
    const step = [...(panel?.querySelectorAll('.small') || [])]
      .map((node) => node.textContent.trim())
      .find((text) => /^Choice \d+ of \d+/.test(text));
    live.textContent = step ? `${step}. ${heading?.textContent || ''}` : (heading?.textContent || 'Tasteprint updated');
  }
}

function enhance() {
  addBrand();
  improveControls();
  announceAndFocus();
}

const observer = new MutationObserver(() => queueMicrotask(enhance));
if (app) observer.observe(app, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
enhance();
