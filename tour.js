const params = new URL(location.href).searchParams;
const TOUR_MODE = params.get('tour') === '1';

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const stops = [
  {
    step: '01',
    eyebrow: 'Consumer hook',
    title: 'Take Escape',
    copy: 'Show the fast forced-choice flow, archetype reveal, visual continuums, recommendations and Story card. This is the “fun enough to finish” layer.',
    href: '?',
    action: 'Open Escape',
    mode: 'Local-first'
  },
  {
    step: '02',
    eyebrow: 'Cross-domain platform',
    title: 'Open the six-module hub',
    copy: 'Show that travel is not the whole product. Wear, Watch, Move, Eat and Live use different domain models but feed one Passport.',
    href: '?modules=1',
    action: 'View modules',
    mode: 'Local-first'
  },
  {
    step: '03',
    eyebrow: 'Reusable identity',
    title: 'Show Passport',
    copy: 'Completed modules become a reusable preference map with equal domain votes and within-person change history. No signup is required for the local version.',
    href: '?profile=1',
    action: 'Open Passport',
    mode: 'Local-first'
  },
  {
    step: '04',
    eyebrow: 'Actual utility',
    title: 'Show Next Moves',
    copy: 'The user can turn one recommendation lane into a Saved → Trying → Done experiment. This is where Tasteprint stops being just an identity quiz and starts helping with decisions.',
    href: '?next=1',
    action: 'Open Next Moves',
    mode: 'Local-only by design'
  },
  {
    step: '05',
    eyebrow: 'Commercial proof',
    title: 'Run Aster & Tide',
    copy: 'Use the fictional branded campaign to show how a partner can turn product discovery into an interactive result rather than a generic landing page. Demo lead details are discarded.',
    href: '?campaign=aster',
    action: 'Open Aster demo',
    mode: 'Local demo'
  },
  {
    step: '06',
    eyebrow: 'Client builder',
    title: 'Open Campaign Studio',
    copy: 'Load Aster, edit copy/catalog data, watch Experience QA update, and preview the real campaign. The local editor does not need Supabase.',
    href: '?campaignAdmin=1&workspace=demo-workspace&hosted=aster',
    action: 'Open Studio demo',
    mode: 'Local demo'
  },
  {
    step: '07',
    eyebrow: 'Team product',
    title: 'Switch Workspace roles',
    copy: 'Demonstrate Owner, Admin, Editor, Analyst and Viewer permissions plus the privacy architecture. The fictional team exists only in the browser.',
    href: '?workspace=1&demo=1',
    action: 'Open Workspace demo',
    mode: 'Local demo'
  },
  {
    step: '08',
    eyebrow: 'Data without pretending',
    title: 'Show analytics fallbacks',
    copy: 'Population and referral dashboards explicitly say when cross-device data is unavailable. They do not fabricate production metrics just to make the demo look busy.',
    href: '?stats=1',
    secondHref: '?growth=1',
    action: 'Population dashboard',
    secondAction: 'Referral dashboard',
    mode: 'Local fallback'
  },
  {
    step: '09',
    eyebrow: 'Trust',
    title: 'Open Privacy & data',
    copy: 'Show the separation between anonymous analytics, optional Passport account data, Campaign Workspace administration, campaign contacts and local Next Moves.',
    href: '?privacy=1',
    action: 'Open privacy controls',
    mode: 'Local-first'
  }
];

function render() {
  if (!TOUR_MODE) return;
  const app = document.querySelector('#app');
  document.title = 'Tasteprint · Demo Tour';
  app.innerHTML = `<section class="panel pad tour-shell">
    <div class="tour-hero">
      <div>
        <div class="eyebrow">Tasteprint · 5-minute demo</div>
        <h1>Show the whole product without a database.</h1>
        <p class="lede">Every stop below is deliberately useful in a static GitHub Pages build. Supabase adds persistence, collaboration and cross-device data later; it is not required to prove the consumer idea, the commercial workflow or the privacy model.</p>
      </div>
      <a class="secondary" href="?">Exit tour</a>
    </div>

    <div class="callout tour-thesis">
      <div class="eyebrow">One sentence to lead with</div>
      <h2>“Tasteprint makes choosing easier by turning a few instinctive tradeoffs into a small, explainable set of things that actually fit you.”</h2>
      <p class="small">The archetype is the memorable hook. The decision support is the product.</p>
    </div>

    <div class="tour-grid">${stops.map((stop) => `<article class="card tour-stop">
      <div class="row spread"><span class="tour-step">${esc(stop.step)}</span><span class="tour-mode">${esc(stop.mode)}</span></div>
      <div><div class="eyebrow">${esc(stop.eyebrow)}</div><h2>${esc(stop.title)}</h2><p class="small">${esc(stop.copy)}</p></div>
      <div class="row tour-actions"><a class="primary" href="${esc(stop.href)}">${esc(stop.action)}</a>${stop.secondHref ? `<a class="secondary" href="${esc(stop.secondHref)}">${esc(stop.secondAction)}</a>` : ''}</div>
    </article>`).join('')}</div>

    <div class="tour-footer card">
      <div><div class="eyebrow">What Supabase adds later</div><h2>Persistence, not the magic trick.</h2><p class="small">Production Supabase turns on cross-device Passport sync, real aggregate analytics/referrals, hosted team drafts, authenticated publishing and real consent lead storage. The recommendation experience itself stays usable without it.</p></div>
      <a class="secondary" href="?workspace=1&demo=1">Finish on the Workspace demo</a>
    </div>
  </section>`;
}

render();
