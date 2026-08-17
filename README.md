# Tasteprint

Tasteprint is an interactive preference-and-recommendation prototype that turns a user's choices into a reusable profile of what they are likely to enjoy, value, choose, or avoid.

Two consumer modules are now live:

- **Tasteprint Escape** — travel, pace, atmosphere, comfort and destination fit
- **Tasteprint Wear** — personal style, silhouettes, polish, experimentation and what you actually reach for

A local-first **Tasteprint Passport** sits above both modules. It saves completed module results, maps them into a shared preference vocabulary, tracks changes over time, and can identify patterns that repeat across different domains without requiring an account first.

## Live demo

**GitHub Pages:** https://victorathomas01-thinker.github.io/tasteprint/

Useful views:

- `?` — Tasteprint Escape
- `?module=wear` — Tasteprint Wear
- `?profile=1` — local Tasteprint Passport
- `?modules=1` — module hub
- `?campaign=aster` — fictional Aster & Tide branded-client demo
- `?campaignAdmin=1` — Campaign Studio
- `?campaignReport=aster` — campaign performance/reporting surface
- `?stats=1` — privacy-safe aggregate data dashboard
- `?privacy=1` — open the in-product privacy/data-controls panel

Until a Supabase project is connected, remote analytics, database publishing, and real lead storage stay inactive and Tasteprint works as a static site with local fallbacks.

## Current product features

### Tasteprint Escape

- 8-step mobile-first interactive flow
- 10 hidden travel-preference dimensions
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
- generated 1080×1920 Story cards + native Web Share API fallback
- custom Tasteprint mark, staged reveal motion, reduced-motion support, keyboard focus and screen-reader guardrails

### Tasteprint Wear

- 8 forced-choice wardrobe decisions
- 10 hidden style dimensions: experimentation, coordination, visibility, styling, ease, edge, calm, nostalgia, detail and impulse
- 12 style archetypes
- 8 dressing modes
- dynamic style badges and visible continuums
- strongest-pull and contradiction insight
- three wardrobe-anchor ideas rather than a hardcoded shopping list
- decision fingerprint
- curveball and inverse style directions
- generated Story card using the same native share/download system as Escape
- automatic Passport capture through the generic module-completion event
- module-aware analytics events without misclassifying Wear as an Escape result
- synthetic distribution regression test to catch collapsed archetype logic during development

The Wear archetype distribution check is a software/calibration guardrail only. It is not evidence about a real human population and is not used to make percentile claims.

### Tasteprint Passport / platform layer

- local Passport at `?profile=1`
- six-module registry: Escape, Wear, Watch, Move, Eat and Live
- Escape + Wear are live; unfinished modules are clearly marked planned
- shared 10-dimensional master preference vocabulary
- separate translation layers from Escape and Wear domain-specific scores into the master model
- latest-result-per-module aggregation so repeated use of one module cannot dominate the master profile
- recent preference history stored locally
- within-person “What changed?” summaries when a module is retaken
- provisional master-pattern labels and badges
- true cross-module badges that require the same pattern to occur in at least two different completed modules
- JSON Passport export and reset controls
- Passport included in the main Privacy & data export/delete flow
- automated platform regression checks in CI

Current cross-module badges include patterns such as **Aesthetic Throughline**, **Novelty Everywhere**, **Comfort Loyalist**, **Structured Curiosity**, and **Low-Noise Throughline**. They remain locked until at least two real modules support the pattern.

See [PLATFORM.md](./PLATFORM.md) for the platform architecture and module rules.

### Data and privacy layer

- in-product privacy/data controls
- browser-authorized anonymous deletion architecture
- 180-day anonymous raw-data retention target
- optional anonymous Supabase analytics/profile storage
- aggregate result/funnel dashboard without raw-row access
- percentile database function with a 50-profile minimum sample threshold
- short anonymous profile-ID schema and RPCs

### Commercial campaign engine

- data-driven branded campaign manifests
- configurable campaign question copy and scoring multipliers
- CSV/JSON client catalog ingestion and validation
- Campaign Studio for source-free local campaign authoring
- client catalog matching against Tasteprint archetypes/travel modes
- CTA, lead-funnel and conversion analytics
- optional post-result lead capture with explicit consent
- restricted service-role lead storage scaffold
- Supabase published-campaign registry scaffold
- secure Edge Function publish/unpublish flow using a server-side operator token
- fictional Aster & Tide portfolio campaign

## Remote challenge MVP

Tasteprint Escape can compare two people on different devices without requiring accounts.

After finishing an Escape result, the app can generate a result link and a friend challenge link. The recipient completes the same flow and unlocks compatibility, strongest agreement, biggest friction, shared travel mode, compromise advice, and a destination recommendation.

The permanent fallback link format is a compact versioned 10-dimension score vector with a checksum. No name, email, account identifier, raw answer text, or answer history is placed in the link. Challenge links also carry a short random `ref` token so the optional event backend can connect challenge creation, receipt, completion, and match unlocks without names or accounts.

When Supabase is connected, completed Escape profiles can also receive an unguessable 10-character database short code. `short-links.js` progressively upgrades outbound sharing to shorter `?p=` result links and `?c=` challenge links. Old stateless links remain compatible.

Wear currently shares its Story image but does not pretend to have persistent result/challenge URLs yet.

## Passport model

`platform-core.js` defines ten shared master dimensions:

- novelty
- structure
- social energy
- aesthetic sensitivity
- comfort
- energy
- serenity
- sentiment
- curiosity
- spontaneity

Individual modules keep domain-specific scores and map them into this shared vocabulary only after the module has scored its own domain.

Escape maps activity → energy, romance → sentiment, culture → curiosity, and keeps its other compatible dimensions directly.

Wear maps experimentation → novelty, coordination → structure, visibility → social, styling → aesthetic, ease → comfort, edge → energy, calm → serenity, nostalgia → sentiment, detail → curiosity and impulse → spontaneity.

The master profile uses only the latest saved result from each completed module. That gives every domain one equal vote instead of letting frequent retakes of one category overwhelm the rest.

Passport currently stores recent snapshots under `tasteprint.platform-history.v1` in local storage. It does not store raw answer selections, names, emails or account identities.

## Data MVP

`analytics.js` instruments the product funnel and stores a rolling local buffer of the most recent 200 anonymous events. Events are module-aware. When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured, the same module can also send anonymous event rows to Supabase.

The existing anonymous profile/short-link database path is still Escape-specific because it powers Escape result/challenge URLs. Wear contributes to the local Passport and generic event stream without being forced into the travel-profile schema. A future account/sync layer can persist Passport module snapshots in a module-native structure.

`supabase/schema.sql` creates the anonymous Escape profile/event tables, RLS policies, short-profile RPCs, deletion flow, retention function, public aggregate dashboard, and real percentile calculations.

See [DATA_MVP.md](./DATA_MVP.md) for activation instructions and privacy details.

## Privacy model

The default Tasteprint experience avoids collecting names, emails, account identities, contacts, precise location history, and raw answer choices.

Passport history is local in the current version. The Privacy & data panel can export it alongside local anonymous analytics or clear it when the browser's Tasteprint data is reset.

A branded campaign may optionally enable **post-result lead capture**. That is a separate, explicit-consent flow after the user already sees their result. Real lead capture requires custom consent copy and an HTTPS privacy URL. Email/name are sent only to the restricted `capture-lead` Edge Function and never placed into Tasteprint analytics events, conversion properties, result links, or aggregate reports.

The Aster & Tide portfolio demo uses `demoOnly` lead capture. Contact details typed into that demo are discarded and are not sent or stored.

Each browser also has a random install UUID and a separate private deletion token for anonymous Tasteprint profile/event data. Only the SHA-256 hash of that token is attached to remote anonymous rows.

## Commercial campaign engine

Tasteprint can run as the default Escape experience or as a branded client campaign without forking the main scoring app.

The fictional **Aster & Tide** campaign demonstrates the commercial architecture:

```text
?campaign=aster
```

Campaign Studio is available at:

```text
?campaignAdmin=1
```

Studio can create the campaign shell, import CSV/JSON catalogs, validate offers and HTTPS destinations, configure optional consent-based post-result follow-up, save/edit local drafts, preview the consumer flow, export CSV, export a full JSON manifest, and expose production publish controls when the backend is connected.

The campaign analytics contract includes:

- `campaign_view`
- `campaign_result_match`
- `campaign_cta`
- `campaign_lead_view`
- `campaign_lead_submit`
- `campaign_conversion`

Lead submission automatically records a `lead_submit` conversion after a successful endpoint response. `campaign-conversion.js` also supports privacy-safe booking-intent, checkout-start, purchase-confirmation, and custom conversion events without accepting email/name/free-form PII.

A campaign report is available at:

```text
?campaignReport=aster
```

The report can show campaign views, result matches, CTA activity, lead-form views/submits, lead completion rate, total conversions, conversion rate, conversion types, and per-item CTA activity. It does not expose raw contact rows.

### Published campaign registry

`supabase/campaign-registry.sql` creates a registry for published campaign manifests plus narrow public read RPCs. A published database version can be explicitly opened with:

```text
?campaign=<id>&published=1
```

Publishing stays outside the public browser trust boundary. `supabase/functions/publish-campaign/index.ts` uses the Supabase service-role key only server-side and requires a separate `TASTEPRINT_PUBLISH_TOKEN` Edge Function secret. Campaign Studio asks the operator for that token only when publishing and does not persist it.

### Lead capture backend

`supabase/leads.sql` creates `tasteprint_campaign_leads`, an RLS-enabled contact table with no public read/write policy. `supabase/functions/capture-lead/index.ts` checks that the campaign is published, lead capture is enabled, and the request asserts explicit consent before writing through the service role. The table stores an email hash for per-campaign upsert/deduplication.

See [CAMPAIGNS.md](./CAMPAIGNS.md) for the manifest format, Studio workflow, registry architecture, lead-capture model, and production activation steps.

## Run locally

You need Node.js installed.

```bash
npm install
npm run dev
```

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
npm run test:platform
npm run test:wear
npm run test:distribution
```

The automated checks are regression guards, not substitutes for manual iPhone, Android, VoiceOver, and TalkBack testing.

## Optional Supabase activation

Copy `.env.example` to `.env` for local development, or configure equivalent GitHub Actions values for the deployed Pages build.

The Pages workflow expects:

- repository variable `VITE_SUPABASE_URL`
- repository secret `VITE_SUPABASE_ANON_KEY`

For the complete backend:

1. Run `supabase/schema.sql`.
2. Run `supabase/campaigns.sql` for aggregate campaign reporting.
3. Run `supabase/campaign-registry.sql` for database-published campaigns.
4. Run `supabase/leads.sql` for restricted consent-lead storage.
5. Deploy `supabase/functions/publish-campaign` if Studio publishing is needed.
6. Deploy `supabase/functions/capture-lead` if real campaign lead capture is needed.
7. Set a strong server-side `TASTEPRINT_PUBLISH_TOKEN` for the publish function.
8. Schedule `tasteprint_prune_old_data()` from a trusted Supabase cron/operator context.

The publish token and Supabase service-role key must never be exposed as Vite variables or committed to the repository.

## How it works

Escape and Wear each score their own domain independently against their own archetype and mode vectors. The Passport then translates the finished module vector into the shared master vocabulary.

This keeps the module experience native to the decision being made while still allowing cross-domain aggregation. The same master dimension can therefore be supported by different behaviors: travel aesthetics in Escape and styling intent in Wear both contribute to aesthetic sensitivity, but the questions are not artificially identical.

When a campaign is active, `data.js` runs its base questions through `campaign-config.js` before the Escape app imports them. Published campaigns are prefetched through the privacy-limited registry RPC before scoring initializes, so source-controlled, browser-local, and database-backed campaigns reuse the same runtime.

## Main modules

- `data.js` — Escape questions, archetypes, travel modes, badges, continuums
- `app.js` — Escape scoring, result generation, UI state, same-device comparison
- `wear-data.js` — Wear questions, hidden style dimensions, archetype vectors, dressing modes and badges
- `wear.js` / `wear.css` — Wear scoring, results, Story card and Passport completion event
- `platform-core.js` — module registry, Escape/Wear mappings, shared master model, aggregation, badges and change summaries
- `platform.js` / `platform.css` — local Passport, module hub, history/export/reset UI and generic module completion capture
- `campaign-config.js` — source/local/remote campaign registry, manifest validation, question/scoring transform, catalog matcher
- `campaign-import.js` — CSV/JSON catalog parsing, validation and CSV export
- `campaign-admin.js` / `campaign-admin.css` — Campaign Studio
- `campaign-remote.js` — public registry reads + publish-function client
- `campaign-runtime.js` / `campaign.css` — client theming, result catalog and CTA experience
- `lead-capture.js` — explicit-consent post-result lead UI + capture endpoint client
- `campaign-conversion.js` — privacy-safe conversion event API
- `campaign-report.js` — local or Supabase-backed campaign reporting surface
- `campaigns/aster.json` — fictional campaign manifest
- `challenge.js` — Escape stateless result links and remote friend challenges
- `short-links.js` — Escape backend short-ID progressive enhancement
- `referral.js` — non-identifying referral-token propagation
- `share.js` — generic Story-image generation, native sharing, PNG downloads
- `analytics.js` — module-aware local analytics buffer, optional Supabase event transport, Escape anonymous profile persistence, deletion API
- `analytics-contract.js` — event names, percentile minimum, and retention contract shared by code/tests
- `stats.js` — privacy-safe aggregate dashboard
- `privacy.js` / `privacy.css` — user-facing data controls
- `polish.js` — visual-brand and accessibility enhancements
- `supabase/schema.sql` — database/RLS/core RPC layer
- `supabase/campaigns.sql` — aggregate commercial campaign reporting RPC
- `supabase/campaign-registry.sql` — published campaign registry + public read RPCs
- `supabase/leads.sql` — restricted lead-contact table
- `supabase/functions/publish-campaign/index.ts` — privileged publish/unpublish Edge Function
- `supabase/functions/capture-lead/index.ts` — explicit-consent lead capture Edge Function

## Product principles

1. **Fun before formality** — it should feel like an experience, not a survey.
2. **Choices over self-description** — tradeoffs often reveal more than asking people to label themselves.
3. **Useful output** — results should lead to recommendations, not just personality labels.
4. **Shareability** — archetypes, badges, comparisons, result cards, and real percentiles should naturally create conversation.
5. **No fake precision** — percentile output stays gated until a real comparison population exists.
6. **Low friction** — no account or email wall before the user sees value.
7. **Privacy by default** — avoid identity data unless the user explicitly opts into a concrete follow-up use case.
8. **Modules should stay domain-native** — Wear should not pretend fashion decisions are travel questions with different nouns. Shared aggregation happens after each module scores its own domain.

## Next steps

The most important remaining near-term work is:

- create/connect the production Supabase project and GitHub Actions environment values
- activate and QA the data, short-link, campaign-reporting, published-campaign registry and lead-capture paths against the real backend
- deploy the campaign Edge Functions and configure the server-side publish secret
- schedule and QA the 180-day anonymous production pruning job
- perform manual iPhone/Android and VoiceOver/TalkBack QA
- add optional Passport accounts/sync without making signup mandatory
- build Watch, Move, Eat and Live as real modules
- begin measuring real completion, sharing, referral, result-distribution, cross-module patterns, CTA, lead and conversion behavior
- move toward the first real branded campaign and case study

See [ROADMAP.md](./ROADMAP.md) for the full development plan.
