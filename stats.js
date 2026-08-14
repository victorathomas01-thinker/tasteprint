const params = new URLSearchParams(location.search);
if (params.get('stats') === '1') renderStats();

async function fetchStats() {
  const base = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  const key = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '');
  if (!base || !key) return null;

  const response = await fetch(`${base}/rest/v1/rpc/tasteprint_public_stats`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: '{}'
  });
  if (!response.ok) throw new Error(`Stats request failed: ${response.status}`);
  return response.json();
}

function count(value) {
  return Number(value || 0).toLocaleString();
}

function rows(object = {}) {
  const entries = Object.entries(object).sort((a, b) => Number(b[1]) - Number(a[1]));
  if (!entries.length) return '<p class="small">No population data yet.</p>';
  return entries.map(([name, value]) => `
    <div class="row spread stats-row">
      <span>${escapeHTML(name)}</span>
      <strong>${count(value)}</strong>
    </div>
  `).join('');
}

function escapeHTML(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function renderStats() {
  const app = document.querySelector('#app');
  app.innerHTML = `
    <section class="panel pad">
      <div class="eyebrow">Tasteprint · Data MVP</div>
      <h1 style="margin-top:10px">Population pulse</h1>
      <p class="lede">Aggregate product and result statistics only. Raw Tasteprint profiles are not exposed by this dashboard.</p>
      <div class="card"><p class="small">Loading aggregate statistics…</p></div>
    </section>
  `;

  try {
    const stats = await fetchStats();
    if (!stats) {
      const local = window.TasteprintAnalytics?.localEvents?.().length || 0;
      app.innerHTML = `
        <section class="panel pad">
          <div class="eyebrow">Tasteprint · Data MVP</div>
          <h1 style="margin-top:10px">Population pulse</h1>
          <div class="callout">
            <h3>Remote analytics is not connected yet.</h3>
            <p class="small">The app is already instrumented and has ${count(local)} locally buffered event${local === 1 ? '' : 's'} on this browser. Configure the Supabase environment variables to activate population reporting.</p>
          </div>
          <div class="row" style="margin-top:18px"><a class="secondary button-link" href="${location.pathname}">Back to Tasteprint</a></div>
        </section>
      `;
      return;
    }

    const funnel = stats.funnel || {};
    const starts = Number(funnel.quiz_start || 0);
    const completes = Number(funnel.quiz_complete || 0);
    const challengeReceives = Number(funnel.challenge_receive || 0);
    const challengeCompletes = Number(funnel.challenge_complete || 0);
    const completionRate = starts ? Math.round((completes / starts) * 100) : 0;
    const referralRate = challengeReceives ? Math.round((challengeCompletes / challengeReceives) * 100) : 0;

    app.innerHTML = `
      <section class="panel pad">
        <div class="eyebrow">Tasteprint · Data MVP</div>
        <h1 style="margin-top:10px">Population pulse</h1>
        <p class="lede">A privacy-safe aggregate view of how Tasteprint is being used and which results are appearing.</p>

        <div class="grid-3 stats-kpis">
          <div class="card"><div class="eyebrow">Profiles</div><h2>${count(stats.total_profiles)}</h2><p class="small">Anonymous completed score vectors.</p></div>
          <div class="card"><div class="eyebrow">Quiz completion</div><h2>${completionRate}%</h2><p class="small">Completions ÷ starts.</p></div>
          <div class="card"><div class="eyebrow">Challenge completion</div><h2>${referralRate}%</h2><p class="small">Recipients who finish.</p></div>
        </div>

        <div class="result-grid">
          <div class="card"><div class="eyebrow">Archetype distribution</div><div style="margin-top:12px">${rows(stats.archetypes)}</div></div>
          <div class="card"><div class="eyebrow">Travel-mode distribution</div><div style="margin-top:12px">${rows(stats.travel_modes)}</div></div>
        </div>

        <div class="card" style="margin-top:22px">
          <div class="eyebrow">Funnel events</div>
          <div style="margin-top:12px">${rows(funnel)}</div>
        </div>

        <div class="callout" style="margin-top:22px">
          <div class="eyebrow">Percentiles</div>
          <h3>${stats.percentiles_enabled ? 'Population percentiles are eligible.' : 'Still collecting the comparison population.'}</h3>
          <p class="small">Tasteprint keeps percentile output disabled until at least 50 completed profiles exist.</p>
        </div>

        <div class="row" style="margin-top:18px"><a class="secondary button-link" href="${location.pathname}">Back to Tasteprint</a></div>
      </section>
    `;
  } catch (error) {
    console.error(error);
    app.innerHTML = `
      <section class="panel pad">
        <div class="eyebrow">Tasteprint · Data MVP</div>
        <h1 style="margin-top:10px">Population pulse</h1>
        <div class="callout"><h3>Could not load aggregate statistics.</h3><p class="small">The public experience still works. Check the Supabase schema and GitHub Actions environment values.</p></div>
        <div class="row" style="margin-top:18px"><a class="secondary button-link" href="${location.pathname}">Back to Tasteprint</a></div>
      </section>
    `;
  }
}
