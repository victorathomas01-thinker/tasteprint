import { getCampaign } from './campaign-config.js';
import { escapeHTML } from './hospitality.js';

const params = new URL(location.href).searchParams;
const id = params.get('campaignGuide');
if (id) {
  const campaign = getCampaign(id);
  const app = document.querySelector('#app');
  if (app && campaign?.demo && campaign.presentation?.kind === 'hospitality') {
    document.documentElement.dataset.campaignKind = 'hospitality';
    document.title = 'Demo Hotel CLT · Hotel team walkthrough';
    app.innerHTML = `<section class="panel pad hotel-guide">
      <div class="hotel-result-top"><a class="hotel-wordmark" href="?">Tasteprint for Business</a><span class="hotel-demo-badge">Fictional hotel · Local demonstration</span></div>
      <div class="hotel-guide-hero"><div class="eyebrow">The hotel team’s view</div><h1>A guest experience.<br>A simpler next choice.</h1><p class="lede">See how ${escapeHTML(campaign.name)} could help a guest discover a fitting experience, then change an offering and review honest activity from this browser.</p><p class="small">This is a demonstration of the workflow. No real hotel, guests, partnerships, bookings or revenue results are represented.</p><a class="primary" href="?campaign=${encodeURIComponent(id)}">Try the guest experience →</a></div>
      <div class="hotel-walkthrough-grid">
        <article class="hotel-walkthrough-step"><span>01 / Discover</span><h2>Be the guest.</h2><p>Answer eight questions about the stay you’d enjoy. Get three illustrative ideas with fit reasons and tradeoffs, before any signup or contact request.</p><a href="?campaign=${encodeURIComponent(id)}">Open the guest demo →</a></article>
        <article class="hotel-walkthrough-step"><span>02 / Make it yours</span><h2>Edit an offering.</h2><p>Open the existing Campaign Studio with this demo loaded. Change the introduction, brand color and two offer descriptions using the editable fields. Save and preview. Hotel questions, scoring and demo safeguards stay intact.</p><a href="?campaignAdmin=1&edit=${encodeURIComponent(id)}">Edit the demo in Studio →</a></article>
        <article class="hotel-walkthrough-step"><span>03 / Understand</span><h2>See what happened.</h2><p>Open the local report after the guest flow. Views, completions and clicks come from this browser’s recent activity. A new browser starts at zero; there are no invented customers or sample revenue numbers.</p><a href="?campaignReport=${encodeURIComponent(id)}&demo=1">View browser-local activity →</a></article>
        <article class="hotel-walkthrough-step"><span>04 / Prepare a pilot</span><h2>Bring real offerings.</h2><p>A real pilot needs approved branding, accurate descriptions, safe destination links, an agreed distribution point and a useful measurement question. Concierge onboarding is enough to begin.</p><a href="#hotel-pilot-checklist">See the setup checklist ↓</a></article>
      </div>
      <section id="hotel-pilot-checklist" class="hotel-honesty"><h2>What a hotel would provide</h2><ul><li>Approved name, brand colors, logo/asset rights and a point of contact.</li><li>A small catalog of real offerings: title, description, fit tags, tradeoffs and a current HTTPS details/booking link.</li><li>Someone responsible for checking availability, restrictions, accessibility and keeping the catalog current.</li><li>A distribution choice: website, pre-arrival message or a QR placed with permission.</li><li>One outcome to evaluate: guest usefulness, discovery engagement or concierge workload. CTA clicks are not confirmed bookings.</li></ul><p>Lead capture is off. Authenticated team publishing, reporting across devices and real data collection need separately approved staging and production validation. Nothing here activates them.</p></section>
      <div class="hotel-result-footer"><a class="secondary" href="?campaign=${encodeURIComponent(id)}">Back to the guest demo</a><a class="secondary" href="?">Back to Tasteprint</a></div>
    </section>`;
  } else if (app) {
    app.innerHTML = '<section class="panel pad"><h1>This demonstration is unavailable.</h1><p class="small">The requested walkthrough could not be found.</p><a class="secondary" href="?">Back to Tasteprint</a></section>';
  }
}
