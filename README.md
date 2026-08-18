# Tasteprint

Tasteprint is an interactive preference-and-recommendation platform that turns fast forced-choice decisions into a reusable map of what a person is likely to enjoy, value, choose, or avoid.

The original six consumer domains are live:

- **Escape** — travel, pace, atmosphere, comfort and destination fit
- **Wear** — personal style, silhouettes, polish, experimentation and ease
- **Watch** — story mechanics, pacing, tone, worlds and emotional investment
- **Move** — training structure, intensity, recovery, craft and repeatability
- **Eat** — flavor, discovery, ritual, comfort, sharing and dining spontaneity
- **Live** — home/neighborhood rhythm, community, quiet, access, rootedness and discovery

A local-first **Tasteprint Passport** sits above every module. It saves completed results, maps domain-specific scores into one shared 10-dimensional vocabulary, tracks changes over time, and surfaces patterns that repeat across very different kinds of decisions.

Accounts are optional. The codebase includes passwordless Supabase Auth and bidirectional cross-device Passport sync, but the public deployment remains local-only until the production Supabase project is connected.

Tasteprint also now has a recommendation-intelligence layer: qualitative fit confidence, intentionally diverse recommendation lanes, cold-start versus returning-user behavior, structured satisfaction feedback and strict sensitive-feature guardrails. It does **not** claim learned weights before real-user evidence exists.

## Live demo

GitHub Pages:

```text
https://victorathomas01-thinker.github.io/tasteprint/
```

Useful routes:

```text
?                         Tasteprint Escape
?module=wear              Tasteprint Wear
?module=watch             Tasteprint Watch
?module=move              Tasteprint Move
?module=eat               Tasteprint Eat
?module=live              Tasteprint Live
?profile=1                Tasteprint Passport + optional sync controls
?modules=1                module hub
?campaign=aster           fictional Aster & Tide campaign
?campaignAdmin=1          Campaign Studio
?campaignReport=aster     campaign report
?stats=1                  privacy-safe aggregate dashboard
?privacy=1                Privacy & data controls
```

Without Supabase environment values, Tasteprint remains a fully functional static/local product. Remote analytics, database short links, published campaigns, real lead storage and account sync stay inactive.

## Consumer product

Each module uses its own domain-native questions, score dimensions, archetypes, modes, badges and recommendations. Shared identity modeling happens only after a module has finished scoring its own domain.

Escape includes the original travel flow, destination modes, same-device friend comparison, cross-device challenge links, compatibility results and shareable Story cards.

Wear, Watch, Move, Eat and Live each include 8 forced-choice decisions, 10 hidden domain dimensions, 12 named archetypes, 8 modes, dynamic badges, visible continuums, strongest-pull/contradiction insights, decision fingerprints, curveball/inverse results, Story sharing, analytics and automatic Passport capture.

Move explicitly stays in the lane of training preference rather than exercise/medical prescription. Eat does not treat its output as nutrition/allergy guidance. Live does not pretend to determine housing affordability, neighborhood safety, commute feasibility, legal/accessibility constraints, or whether somebody should move.

The exhaustive module regression tests for Watch, Move, Eat and Live evaluate all 65,536 possible response paths as engineering calibration checks. They are not population evidence and are never presented as user percentiles.

## Tasteprint Passport

`platform-core.js` defines the shared master dimensions:

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

Every domain translates its completed score vector into these dimensions. The master profile then uses only the latest result from each completed module, giving every domain one equal vote. Repeating Escape five times cannot make travel count five times more than Wear.

Passport stores recent local snapshots under:

```text
tasteprint.platform-history.v1
```

The local history cap is 60 snapshots. Raw answer selections are not stored in Passport.

Passport supports:

- 6/6 module coverage
- one equal vote per completed domain
- preference history
- within-person “What changed?” summaries
- provisional master labels/badges
- cross-module badges that require a pattern in 2+ domains
- JSON export
- local reset
- optional cross-device account sync

See `PLATFORM.md` for the platform model.

## Optional account + cross-device Passport sync

Account sync is deliberately **optional and post-value**. Tasteprint does not require signup before a result.

`account-sync.js` uses Supabase Auth passwordless magic links. Once a user signs in, local and remote Passport histories merge in both directions. Local-only entries upload, remote-only entries download, duplicate snapshots collapse by stable identity, and future module results sync automatically.

Signing out leaves the local Passport intact.

`supabase/passport-sync.sql` creates the authenticated `tasteprint_passport_snapshots` table. It uses RLS so authenticated users can access only rows matching `auth.uid()`. The table stores the Auth user ID and sanitized Passport snapshot data, not email, anonymous install/deletion identifiers, campaign leads, or raw quiz answers.

Supabase Auth itself stores the email used for passwordless authentication. That account identity is not copied into anonymous Tasteprint analytics.

`supabase/functions/delete-account/index.ts` verifies a user's bearer session and deletes the Auth user using the service role server-side. The synced Passport table references `auth.users` with `ON DELETE CASCADE`.

Anonymous browser deletion and optional account deletion are separate on purpose. Resetting anonymous analytics does not silently destroy a synced Passport, and deleting an account does not claim to identify anonymous rows that were deliberately stored without account identity.

See `ACCOUNT_SYNC.md` for merge rules, privacy boundaries and production activation.

## Recommendation intelligence

`intelligence-core.js` and `intelligence-registry.js` add a reusable intelligence layer across all six modules without replacing their domain-native scoring models.

After a first-party quiz result, `intelligence.js` can add:

- **Fit confidence** based on separation between the closest archetypes, strength of the current preference signal, and the user's own same-module stability when available
- **Three deliberately different recommendation lanes** selected with a relevance/diversity tradeoff rather than simply returning the three nearest clones
- **Cold-start behavior** that stays close to the current result when there is little personal history
- **Returning behavior** that can lightly blend the immediately previous same-module result into recommendation ranking while leaving the actual archetype/result untouched
- **Structured satisfaction feedback**: Nailed it / Mostly me / Mixed / Missed me
- **Optional fixed-direction feedback** on existing module dimensions, such as asking for more Familiar versus more Surprising
- **Recommendation-lane interest** so the system can learn which direction a user would actually try

The confidence label is explicitly confidence in Tasteprint's own model fit. It is not a diagnosis, population percentile, or claim about how well the system “knows” a person.

Structured feedback is local-first and capped at 100 records under:

```text
tasteprint.intelligence-feedback.v1
```

When anonymous remote analytics are active, fixed learning records can also be sent as anonymous events. The learning record is built from an allowlist and excludes raw answers, free text, account email, campaign lead data and demographic/protected-attribute features.

`supabase/intelligence.sql` provides a service-role-only aggregate review function with a 50-feedback minimum gate. It reports rating/mismatch/result-segment summaries but never exposes raw feedback publicly and explicitly disables automatic weight updates.

The roadmap still leaves **Tune weights from real behavior** open. That step requires real users, enough coverage across results, versioned calibration, distribution simulation and manual approval. The product will not pretend that hand-designed or synthetic calibration is learned population behavior.

See `INTELLIGENCE.md` for the full model and safety boundary.

## Remote friend challenge MVP

Escape can compare two people on different devices without requiring accounts.

The permanent fallback link encodes a compact versioned 10-dimensional score vector with a checksum. No name, email, account ID, raw answer text or answer history is placed in the link.

Challenge links also carry a short random referral token so the optional event backend can connect challenge creation, receipt, completion and match unlocks without identity data.

When Supabase is connected, Escape profiles can receive an unguessable 10-character short code. `short-links.js` progressively upgrades outbound sharing to shorter `?p=` result and `?c=` challenge links while preserving stateless compatibility.

## Data and privacy layer

The anonymous data path includes:

- local rolling analytics buffer
- optional Supabase event/profile storage
- structured recommendation feedback
- privacy-safe aggregate dashboard
- real percentile RPC gated until 50 completed profiles
- browser-authorized deletion token architecture
- 180-day anonymous raw-data retention target
- short anonymous profile IDs for shared Escape results

Anonymous analytics deliberately exclude account identity, names, emails and raw answer choices.

The optional account-backed Passport path and optional campaign-lead path are separate data models with separate controls.

The Privacy & data dialog exposes the distinction between:

1. anonymous browser data + structured recommendation feedback
2. optional account + synced Passport data
3. explicit-consent campaign contact data

See `DATA_MVP.md`, `ACCOUNT_SYNC.md`, `INTELLIGENCE.md`, and `supabase/schema.sql`.

## Commercial campaign engine

Tasteprint can run branded **Tasteprint Drops** without forking the core Escape experience.

Campaign features include:

- manifest-driven theming/copy
- configurable question copy or complete question sets
- per-dimension scoring multipliers
- CSV/JSON client catalog ingestion
- source-free Campaign Studio
- catalog matching against Tasteprint results
- CTA/conversion analytics
- optional explicit-consent post-result lead capture
- restricted campaign lead storage
- published campaign registry scaffold
- secure publish/unpublish Edge Function using a server-side operator token
- privacy-safe campaign reports

The fictional **Aster & Tide** campaign is a portfolio demo. Its lead form operates in discard-only demo mode.

See `CAMPAIGNS.md`.

## Run locally

Requires Node.js.

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

All automated checks:

```bash
npm test
```

Individual suites include:

```bash
npm run test:accessibility
npm run test:data
npm run test:campaign
npm run test:platform
npm run test:account
npm run test:intelligence
npm run test:wear
npm run test:watch
npm run test:move
npm run test:eat
npm run test:live
npm run test:distribution
```

Automated checks are regression guards, not substitutes for physical iPhone/Android or VoiceOver/TalkBack testing.

## Optional Supabase activation

Copy `.env.example` to `.env` locally or configure equivalent GitHub Actions values.

The Pages workflow expects:

- repository variable `VITE_SUPABASE_URL`
- repository secret `VITE_SUPABASE_ANON_KEY`

The same public project URL/key power anonymous database calls and Supabase Auth. Never expose the service-role key as a Vite variable.

For the complete backend, run/deploy in roughly this order:

1. `supabase/schema.sql` — anonymous data/RPC layer
2. `supabase/campaigns.sql` — aggregate campaign reporting
3. `supabase/campaign-registry.sql` — published campaigns
4. `supabase/leads.sql` — restricted consent leads
5. `supabase/passport-sync.sql` — authenticated Passport snapshots + RLS
6. `supabase/intelligence.sql` — trusted structured-feedback aggregates
7. deploy `supabase/functions/publish-campaign`
8. deploy `supabase/functions/capture-lead`
9. deploy `supabase/functions/delete-account`
10. configure a strong server-side `TASTEPRINT_PUBLISH_TOKEN`
11. add the GitHub Pages callback to Supabase Auth allowed redirect URLs
12. configure the public Vite URL/key in GitHub Actions
13. schedule `tasteprint_prune_old_data()` from a trusted Supabase cron/operator context
14. QA anonymous deletion, short links, aggregate RPCs, campaigns, leads, magic-link sign-in, second-device Passport merging, account deletion and the trusted intelligence summary

The service-role key and publish token stay server-side only.

## Main modules

- `data.js` / `app.js` — Escape model and runtime
- `wear-data.js` / `wear.js` / `wear.css` — Wear
- `watch-data.js` / `watch.js` / `watch.css` — Watch
- `move-data.js` / `move.js` / `move.css` — Move
- `eat-data.js` / `eat.js` / `eat.css` — Eat
- `live-data.js` / `live.js` / `live.css` — Live
- `platform-core.js` — six-domain master model, mappings, aggregation, badges and history logic
- `platform.js` / `platform.css` — local-first Passport and module hub
- `account-core.js` — pure account merge/row transform logic
- `account-sync.js` / `account.css` — passwordless Auth and cross-device Passport sync UI/runtime
- `intelligence-core.js` — confidence, returning behavior, diversity, feedback normalization and learning gate
- `intelligence-registry.js` — all six domain-native intelligence model adapters
- `intelligence.js` / `intelligence.css` — post-result intelligence/feedback UI
- `analytics.js` / `analytics-contract.js` — anonymous analytics/profile layer
- `challenge.js`, `short-links.js`, `referral.js`, `share.js` — viral/share systems
- `campaign-*` modules — campaign configuration, Studio, runtime, conversions and reports
- `privacy.js` / `privacy.css` — anonymous/account/campaign/intelligence data controls
- `supabase/schema.sql` — anonymous data schema/RPCs
- `supabase/passport-sync.sql` — account Passport RLS schema
- `supabase/intelligence.sql` — trusted recommendation-feedback aggregate
- `supabase/functions/delete-account/index.ts` — authenticated account deletion

## Product principles

1. **Fun before formality** — it should feel like an experience, not a survey.
2. **Choices over self-description** — tradeoffs are more useful than yes-to-everything trait questions.
3. **Useful output** — results should lead somewhere, not stop at a label.
4. **Shareability** — archetypes, badges, comparisons and Story cards should create conversation naturally.
5. **No fake precision** — real percentiles stay gated until a real comparison population exists.
6. **Low friction** — no account/email wall before the user gets value.
7. **Privacy by default** — anonymous analytics, optional account data and campaign leads stay separate.
8. **Domain-native modules** — shared aggregation happens after each module scores its own domain.
9. **Local-first accounts** — sync should add portability, not make the product dependent on login.
10. **No fake learning** — feedback infrastructure can exist before data, but learned-weight claims wait for real behavior.
11. **No sensitive-feature optimization** — recommendation ranking is built from Tasteprint preferences and the user's own history, not inferred protected attributes.

## What remains

The codeable core of P4 is complete and most of P5 is now implemented. The biggest remaining work is:

- connect and QA the real production Supabase project
- physical mobile + assistive-technology QA
- activate backend referral reporting
- hosted multi-user Campaign Studio permissions
- first real client/case-study metrics
- collect enough real structured recommendation feedback to justify a calibration pass
- tune recommendation weights only after that real behavioral evidence exists

See `ROADMAP.md` for detailed status.
