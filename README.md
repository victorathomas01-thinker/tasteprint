# Tasteprint

Tasteprint is an interactive preference-and-recommendation prototype that turns a user's choices into a reusable profile of what they are likely to enjoy, value, choose, or avoid.

The first live module, **Tasteprint Escape**, focuses on travel. Instead of asking users to describe themselves directly, it uses lightweight decisions and tradeoffs to infer a multidimensional preference profile, then turns that profile into archetypes, badges, visual continuums, destination recommendations, friend comparisons, and shareable Story cards.

## Live demo

**GitHub Pages:** https://victorathomas01-thinker.github.io/tasteprint/

Useful views:

- `?campaign=aster` — fictional Aster & Tide branded-client demo
- `?campaignReport=aster` — campaign performance/reporting surface
- `?stats=1` — privacy-safe aggregate data dashboard
- `?privacy=1` — open the in-product privacy/data-controls panel

Until a Supabase project is connected, remote analytics stays inactive and Tasteprint works entirely as a static site with a local analytics fallback.

## Current demo features

- 8-step mobile-first interactive flow
- 10 hidden preference dimensions
- 12 named travel archetypes
- 8 travel modes
- weighted scoring from user choices
- dynamic badges and visible preference continuums
- decision fingerprint and contradiction insight
- best-fit, same-energy, curveball, and inverse recommendations
- same-device friend comparison
- cross-device friend challenge links
- stateless result links with backend short-link progressive enhancement
- referral tokens on outbound challenge links
- compatibility, shared trait, biggest friction, pair archetypes, compromise advice, and shared destination
- Instagram Story-style result preview
- generated 1080×1920 PNG result cards
- native Web Share API support with PNG fallback
- custom Tasteprint mark + favicon
- staged reveal motion with reduced-motion support
- skip navigation, visible keyboard focus, screen-reader live announcements, and multi-select ARIA state
- in-product privacy/data controls
- local analytics export + clear controls
- browser-authorized anonymous deletion architecture
- 180-day raw-data retention target
- optional anonymous Supabase analytics/profile storage
- aggregate result/funnel dashboard without raw-row access
- percentile database function with a 50-profile minimum sample threshold
- data-driven branded campaign manifests
- configurable campaign question copy and scoring multipliers
- client catalog matching against Tasteprint archetypes/travel modes
- campaign CTA instrumentation and aggregate reporting scaffold
- fictional Aster & Tide portfolio campaign
- automated accessibility, data-contract, campaign-engine, and score-distribution regression checks in CI

## Remote challenge MVP

Tasteprint can compare two people on different devices without requiring accounts.

After finishing a result, the app can generate a result link and a friend challenge link. The recipient completes the same flow and unlocks compatibility, strongest agreement, biggest friction, shared travel mode, compromise advice, and a destination recommendation.

The permanent fallback link format is a compact versioned 10-dimension score vector with a checksum. No name, email, account identifier, raw answer text, or answer history is placed in the link. Challenge links also carry a short random `ref` token so challenge creation and completion can be attributed once the optional event backend is active.

When Supabase is connected, completed profiles also receive an unguessable 10-character database short code. `short-links.js` progressively upgrades outbound sharing to shorter `?p=` result links and `?c=` challenge links. Opening one resolves only the deliberately shared result fields and then hands the existing stateless renderer the reconstructed vector. Old stateless links continue to work.

## Data MVP

The repository includes a backend-ready data layer while keeping the public app fully functional without one.

`analytics.js` instruments the product funnel and stores a rolling local buffer of the most recent 200 anonymous events. When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured, the same module can also send anonymous rows to Supabase.

Completed profiles store the 10-dimensional score vector, result labels, anonymous UUIDs, timestamp, source, optional referral token, deletion-owner hash, and optional short share code. Raw answer selections are intentionally not stored by this layer.

`supabase/schema.sql` creates the anonymous profile/event tables, RLS policies, short-profile RPCs, deletion flow, retention function, public aggregate dashboard, and real percentile calculations.

See [DATA_MVP.md](./DATA_MVP.md) for activation instructions and privacy details.

## Privacy model

Tasteprint currently avoids collecting names, emails, account identities, contacts, precise location history, and raw answer choices.

Each browser has a random install UUID and a separate private deletion token. Only the SHA-256 hash of that token is attached to remote rows. When a user presses **Delete my Tasteprint data**, the server requires both the install UUID and the raw token before deleting rows. This provides deletion without requiring an account.

Raw anonymous profile/event rows have a **180-day maximum retention target** in the production schema. The pruning function must be scheduled from a trusted Supabase context once the backend is activated.

## Commercial campaign engine

Tasteprint can now run as the default Escape experience or as a branded client campaign without forking the main scoring app.

The fictional **Aster & Tide** campaign demonstrates the commercial architecture. Open:

```text
?campaign=aster
```

Its source-controlled campaign manifest changes the brand treatment, landing/result copy, selected question copy, scoring emphasis, and partner catalog. After a user gets a Tasteprint result, the campaign layer matches the user's archetype and travel mode against the partner catalog and renders the strongest partner offers.

The campaign analytics contract adds:

- `campaign_view`
- `campaign_result_match`
- `campaign_cta`

The fictional offers intentionally have no real outbound booking destinations. Their CTA demonstrates tracking without pretending the demo brand exists.

A campaign report is available at:

```text
?campaignReport=aster
```

Without a backend it summarizes only campaign activity stored in the current browser. With Supabase connected and `supabase/campaigns.sql` installed, the same surface can call `tasteprint_campaign_stats()` for aggregate views, result matches, CTA activity, CTA rate, and catalog-item clicks without exposing raw event rows.

See [CAMPAIGNS.md](./CAMPAIGNS.md) for the manifest format and extension workflow.

## Run locally

You need Node.js installed.

```bash
npm install
npm run dev
```

Vite will print a local development URL, usually `http://localhost:5173`.

To create a production build:

```bash
npm run build
```

Run all automated checks:

```bash
npm test
```

Or run them separately:

```bash
npm run test:accessibility
npm run test:data
npm run test:campaign
npm run test:distribution
```

The automated checks are regression guards, not substitutes for manual iPhone, Android, VoiceOver, and TalkBack testing.

## Optional Supabase activation

Copy `.env.example` to `.env` for local development, or configure the equivalent GitHub Actions values for the deployed Pages build.

The Pages workflow expects:

- repository variable `VITE_SUPABASE_URL`
- repository secret `VITE_SUPABASE_ANON_KEY`

Run `supabase/schema.sql` in the Supabase SQL editor before enabling the frontend transport. Run `supabase/campaigns.sql` as well if campaign aggregate reporting is needed. Then schedule `tasteprint_prune_old_data()` from a trusted Supabase cron/operator context.

## How it works

Each answer adjusts a hidden preference vector across romance, novelty, comfort, structure, social energy, activity, culture, serenity, aesthetic sensitivity, and spontaneity.

The resulting vector is compared against structured archetype and travel-mode vectors. The closest matches drive the headline result, while badges, continuums, contradictions, and recommendations preserve more nuance.

Friend comparison compares two vectors to identify overlap, friction, a shared travel mode, a compromise, and a destination that accommodates both people.

When a campaign is active, `data.js` runs its base questions through `campaign-config.js` before the main app imports them. This lets a client override question copy, supply a complete question set, or change scoring multipliers without rewriting `app.js`.

## Main modules

- `data.js` — base questions, archetypes, travel modes, badges, continuums
- `app.js` — primary scoring, result generation, UI state, same-device comparison
- `campaign-config.js` — campaign registry, question/scoring transform, catalog matcher
- `campaign-runtime.js` / `campaign.css` — client theming, result catalog, CTA experience
- `campaign-report.js` — local or Supabase-backed campaign reporting surface
- `campaigns/aster.json` — fictional campaign manifest
- `challenge.js` — stateless result links and remote friend challenges
- `short-links.js` — backend short-ID progressive enhancement
- `referral.js` — non-identifying referral-token propagation
- `share.js` — Story-image generation, native sharing, PNG downloads
- `analytics.js` — local analytics buffer, optional Supabase transport, anonymous profile persistence, deletion API
- `analytics-contract.js` — event names, percentile minimum, and retention contract shared by code/tests
- `stats.js` — privacy-safe aggregate dashboard
- `privacy.js` / `privacy.css` — user-facing data controls
- `polish.js` — visual-brand and accessibility enhancements
- `supabase/schema.sql` — database/RLS/core RPC layer
- `supabase/campaigns.sql` — aggregate commercial campaign reporting RPC

## Project structure

```text
.
├── index.html
├── app.js
├── data.js
├── campaign-config.js
├── campaign-runtime.js
├── campaign-report.js
├── campaign.css
├── campaigns/
│   └── aster.json
├── challenge.js
├── short-links.js
├── referral.js
├── share.js
├── analytics.js
├── analytics-contract.js
├── stats.js
├── privacy.js
├── privacy.css
├── polish.js
├── styles.css
├── challenge.css
├── favicon.svg
├── vite.config.js
├── package.json
├── README.md
├── ROADMAP.md
├── DATA_MVP.md
├── CAMPAIGNS.md
├── supabase/
│   ├── schema.sql
│   └── campaigns.sql
└── scripts/
    ├── check-accessibility.js
    ├── check-data-contract.js
    ├── check-campaign.js
    └── simulate.js
```

## Why Tasteprint exists

The broader product idea is to help people figure out what fits them next while making discovery entertaining enough to share.

Potential future modules include Escape, Wear, Watch, Move, Eat, and Live. The longer-term idea is a persistent Tasteprint that becomes more useful as a person completes different modules.

## Product principles

1. **Fun before formality** — it should feel like an experience, not a survey.
2. **Choices over self-description** — tradeoffs often reveal more than asking people to label themselves.
3. **Useful output** — results should lead to recommendations, not just personality labels.
4. **Shareability** — archetypes, badges, comparisons, result cards, and real percentiles should naturally create conversation.
5. **No fake precision** — percentile output stays gated until a real comparison population exists.
6. **Low friction** — no account or email wall before the user sees value.
7. **Privacy by default** — avoid collecting raw answers or identity data when aggregate preference vectors are enough.

## Next steps

The most important remaining near-term work is:

- connect the production Supabase project and GitHub Actions environment values
- schedule and QA the 180-day production pruning job
- QA short-link resolution and deletion against the real backend
- add production-grade client catalog ingestion and campaign administration
- add optional post-result lead capture with explicit consent
- perform manual iPhone/Android and VoiceOver/TalkBack QA
- begin measuring real completion, sharing, referral, result-distribution, and campaign CTA behavior

See [ROADMAP.md](./ROADMAP.md) for the full development plan.
