const params = new URL(location.href).searchParams;
const BARE_HOME = [...params.keys()].length === 0 && !location.hash;

function addRecruiterEntry() {
  if (!BARE_HOME) return;
  const hero = document.querySelector('#app .hero');
  const panel = hero?.closest('.panel');
  if (!hero || !panel || document.querySelector('[data-resume-entry]')) return;
  const heading = hero.querySelector('h1')?.textContent || '';
  if (!heading.includes('trip') || !heading.includes('fits')) return;

  const entry = document.createElement('section');
  entry.className = 'resume-entry';
  entry.dataset.resumeEntry = '1';
  entry.setAttribute('aria-label', 'Tasteprint project overview');
  entry.innerHTML = `
    <div class="resume-entry-head">
      <div>
        <div class="eyebrow">Explore Tasteprint</div>
        <h2>A six-domain preference and recommendation platform.</h2>
        <p class="small">Escape is the quickest way to experience the product. The full project connects travel, style, entertainment, training, food and living preferences into one local-first Passport, then turns recommendations into small decisions a user can actually try.</p>
      </div>
      <div class="resume-entry-actions">
        <a class="primary" href="?tour=1">View 5-minute product demo</a>
        <a class="secondary" href="?modules=1">Explore all six modules</a>
      </div>
    </div>
    <div class="resume-proof-grid">
      <article class="card resume-proof-card"><span class="resume-proof-icon" aria-hidden="true">✦</span><div><strong>Enjoyable discovery</strong><p class="small">Fast forced tradeoffs, memorable archetypes and visual reveals keep the interaction lightweight enough to finish.</p></div></article>
      <article class="card resume-proof-card"><span class="resume-proof-icon" aria-hidden="true">→</span><div><strong>Useful after the reveal</strong><p class="small">Explainable recommendation lanes and Next Moves help reduce decision overload instead of ending at a personality label.</p></div></article>
      <article class="card resume-proof-card"><span class="resume-proof-icon" aria-hidden="true">◌</span><div><strong>Privacy-first architecture</strong><p class="small">Core experiences work without signup or a backend. Optional sync, analytics and commercial tooling are separated by purpose.</p></div></article>
    </div>
    <div class="resume-stack" aria-label="Project technologies and engineering highlights">
      <span>Vanilla JavaScript</span><span>Vite</span><span>GitHub Pages</span><span>Automated regression suites</span><span>Supabase-ready</span><span>Local-first UX</span>
    </div>`;
  panel.insertAdjacentElement('afterend', entry);
}

if (BARE_HOME) {
  const observer = new MutationObserver(() => requestAnimationFrame(addRecruiterEntry));
  observer.observe(document.querySelector('#app'), { childList: true, subtree: true });
  addRecruiterEntry();
}
