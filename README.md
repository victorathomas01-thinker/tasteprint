# Tasteprint

Tasteprint is an interactive preference-and-recommendation prototype that turns a user's choices into a reusable profile of what they are likely to enjoy, value, choose, or avoid.

The first live module, **Tasteprint Escape**, focuses on travel. Instead of asking users to describe themselves directly, it uses lightweight decisions and tradeoffs to infer a multidimensional preference profile, then turns that profile into archetypes, badges, visual continuums, destination recommendations, friend comparisons, and shareable Story cards.

## Live demo

**GitHub Pages:** https://victorathomas01-thinker.github.io/tasteprint/

Append `?stats=1` to open the aggregate data dashboard. Until a Supabase project is connected, the dashboard explains that remote analytics is inactive and shows the local event-buffer state instead.

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
- cross-device stateless friend challenge links
- stateless shared result links
- referral tokens on outbound challenge links
- compatibility, shared trait, biggest friction, pair archetypes, compromise advice, and shared destination
- Instagram Story-style result preview
- generated 1080×1920 PNG result cards
- native Web Share API support with PNG fallback
- custom Tasteprint mark + favicon
- staged reveal motion with reduced-motion support
- skip navigation, visible keyboard focus, screen-reader live announcements, and multi-select ARIA state
- automated accessibility, data-contract, and score-distribution regression checks in CI
- optional anonymous Supabase analytics/profile storage
- aggregate result/funnel dashboard without raw-row access
- percentile database function with a 50-profile minimum sample threshold

## Remote challenge MVP

Tasteprint can compare two people on different devices without requiring accounts or a backend.

After finishing a result, the app can generate a result link that recreates the shared Tasteprint and a friend challenge link that carries the sender's profile to another device. The recipient completes the same flow and unlocks compatibility, strongest agreement, biggest friction, shared travel mode, compromise advice, and a destination recommendation.

The current stateless payload is a compact versioned 10-dimension score vector with a checksum. No name, email, account identifier, raw answer text, or answer history is placed in the link. Challenge links also carry a short random `ref` token so challenge creation and completion can be attributed once the optional event backend is active.

## Data MVP

The repository now includes a backend-ready data layer while keeping the public app fully functional without one.

`analytics.js` instruments the product funnel and stores a rolling local buffer of the most recent 200 anonymous events. When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured, the same module also sends anonymous rows to Supabase.

Completed profiles store only the 10-dimensional score vector, result labels, anonymous UUIDs, timestamp, source, and optional referral token. Raw answer selections are intentionally not stored by this layer.

`supabase/schema.sql` creates:

- `tasteprint_profiles`
- `tasteprint_events`
- row-level security policies that permit anonymous inserts but not raw public reads
- `tasteprint_public_stats()` for aggregate dashboard data
- `tasteprint_percentiles(scores)` for real population percentiles once at least 50 completed profiles exist

See [DATA_MVP.md](./DATA_MVP.md) for activation instructions and privacy details.

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
npm run test:distribution
```

The automated checks are regression guards, not substitutes for manual iPhone, Android, VoiceOver, and TalkBack testing.

## Optional Supabase activation

Copy `.env.example` to `.env` for local development, or configure the equivalent GitHub Actions values for the deployed Pages build.

The Pages workflow expects:

- repository variable `VITE_SUPABASE_URL`
- repository secret `VITE_SUPABASE_ANON_KEY`

Run `supabase/schema.sql` in the Supabase SQL editor before enabling the frontend transport.

## How it works

Each answer adjusts a hidden preference vector across:

- romance
- novelty
- comfort
- structure
- social energy
- activity
- culture
- serenity
- aesthetic sensitivity
- spontaneity

The resulting vector is compared against structured archetype and travel-mode vectors. The closest matches drive the headline result, while badges, continuums, contradictions, and recommendations preserve more nuance.

Friend comparison compares two vectors to identify overlap, friction, a shared travel mode, a compromise, and a destination that accommodates both people.

## Main modules

- `data.js` — questions, archetypes, travel modes, badges, continuums
- `app.js` — primary scoring, result generation, UI state, same-device comparison
- `challenge.js` — stateless result links and remote friend challenges
- `referral.js` — non-identifying referral-token propagation
- `share.js` — Story-image generation, native sharing, PNG downloads
- `analytics.js` — local analytics buffer, optional Supabase transport, anonymous profile persistence
- `analytics-contract.js` — event names and percentile minimum shared by code/tests
- `stats.js` — privacy-safe aggregate dashboard
- `polish.js` — visual-brand and accessibility enhancements
- `supabase/schema.sql` — database/RLS/aggregate functions

## Project structure

```text
.
├── index.html
├── app.js
├── data.js
├── challenge.js
├── referral.js
├── share.js
├── analytics.js
├── analytics-contract.js
├── stats.js
├── polish.js
├── styles.css
├── challenge.css
├── favicon.svg
├── vite.config.js
├── package.json
├── README.md
├── ROADMAP.md
├── DATA_MVP.md
├── supabase/
│   └── schema.sql
└── scripts/
    ├── check-accessibility.js
    ├── check-data-contract.js
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
- add short database-backed result IDs
- add in-product privacy/deletion controls
- perform manual iPhone/Android and VoiceOver/TalkBack QA
- begin measuring real completion, sharing, referral, and result-distribution behavior

See [ROADMAP.md](./ROADMAP.md) for the full development plan.
