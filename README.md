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

Accounts are optional. The codebase includes passwordless Supabase Auth and bidirectional cross-device Passport sync, but the public deployment remains local-first until the production Supabase project is connected.

Tasteprint also has a recommendation-intelligence layer: qualitative fit confidence, intentionally diverse recommendation lanes, cold-start versus returning-user behavior, structured satisfaction feedback and strict sensitive-feature guardrails. It does **not** claim learned weights before real-user evidence exists.

A local-first **Next Moves** layer turns the lane a user deliberately marks as worth trying into a small decision memory. It keeps at most one active move per domain so Tasteprint is useful after the reveal instead of becoming another recommendation backlog.

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
?next=1                   local-first Next Moves decision memory
?campaign=aster           fictional Aster & Tide campaign
?campaignAdmin=1          local Campaign Studio
?workspace=1              Campaign Workspace (automatic local demo without Supabase)
?workspace=1&demo=1       force fictional Workspace demo
?campaignReport=aster     campaign report
?stats=1                  privacy-safe aggregate dashboard
?growth=1                 privacy-safe referral-loop dashboard
?privacy=1                Privacy & data controls
```

Without Supabase environment values, Tasteprint remains a functional static/local product. All six modules, Passport, recommendation intelligence, Next Moves, Campaign Studio, the fictional Aster campaign and the Campaign Workspace role/Experience-QA demo remain demonstrable. Remote analytics, database short links, cross-device referral attribution, hosted team drafts, authenticated publishing, real lead storage and account sync stay inactive.

## The product problem

Tasteprint is not meant to stop at “here is your archetype.” The user problem is decision overload in taste-heavy categories: people can browse hundreds of destinations, clothes, shows, training styles, meals or living environments without becoming more confident about what fits them.

The product uses a deliberate two-part structure:

1. **Make discovery enjoyable enough to finish.** Fast tradeoffs, identity language, visual reveal, badges and shareability create curiosity and emotional salience.
2. **Turn insight into a decision.** Explainable recommendation lanes, confidence limits and Next Moves reduce the output to something the user can actually try.

The experience avoids fake urgency, hidden commitment and fake scientific certainty. Curiosity earns attention; user agency decides what happens next.

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

Passport supports 6/6 module coverage, one equal vote per completed domain, preference history, within-person “What changed?” summaries, provisional master labels/badges, cross-module badges, JSON export, local reset and optional cross-device account sync.

See `PLATFORM.md`.

## Next Moves

`?next=1` is the lightweight action layer.

When a user presses **I'd try this** on one of the recommendation-intelligence lanes, the existing structured feedback stores the selected recommendation ID. `next-moves.js` turns that deliberate selection into a local card with Saved, Trying, Done or Dismissed status.

Only one move per domain can remain active. Replacing a Watch idea, for example, moves the previous Watch idea into history rather than building an endless queue.

Next Moves is local-first and capped at 30 records. It stores no free-text diary, account email, contacts, location history, raw answers or demographic profile. The Privacy & data dialog exposes independent export and clear controls.

See `NEXT_MOVES.md`.

## Optional account + cross-device Passport sync

Account sync is deliberately **optional and post-value**. Tasteprint does not require signup before a result.

`account-sync.js` uses Supabase Auth passwordless magic links. Once a user signs in, local and remote Passport histories merge in both directions. Local-only entries upload, remote-only entries download, duplicate snapshots collapse by stable identity, and future module results sync automatically.

Signing out leaves the local Passport intact.

`supabase/passport-sync.sql` creates the authenticated `tasteprint_passport_snapshots` table. It uses RLS so authenticated users can access only rows matching `auth.uid()`. The table stores the Auth user ID and sanitized Passport snapshot data, not email, anonymous install/deletion identifiers, campaign leads, or raw quiz answers.

Supabase Auth itself stores the email used for passwordless authentication. That account identity is not copied into anonymous Tasteprint analytics.

Anonymous browser deletion and optional account deletion remain separate on purpose.

See `ACCOUNT_SYNC.md`.

## Recommendation intelligence

`intelligence-core.js` and `intelligence-registry.js` add a reusable intelligence layer across all six modules without replacing their domain-native scoring models.

After a first-party quiz result, `intelligence.js` can add:

- fit confidence based on model separation, signal strength and same-module stability when available;
- three deliberately different recommendation lanes instead of three near-duplicates;
- cold-start behavior that stays closer to immediate fit;
- returning behavior that can lightly use the immediately previous same-module result for recommendation ranking;
- structured satisfaction feedback: Nailed it / Mostly me / Mixed / Missed me;
- optional higher/lower feedback on existing preference dimensions;
- recommendation-lane interest.

The confidence label describes Tasteprint's own model fit. It is not a diagnosis, population percentile or claim that the system “knows” a person.

Structured feedback is local-first and capped at 100 records under:

```text
tasteprint.intelligence-feedback.v1
```

When anonymous remote analytics are active, fixed learning records can also be sent as anonymous events. The allowlist excludes raw answers, free text, account email, campaign lead data and demographic/protected-attribute features.

`supabase/intelligence.sql` provides a trusted aggregate review function with a 50-feedback minimum review gate. Automatic weight updates remain disabled. Real scoring changes require real-user evidence, human review, versioning and response-space simulation.

See `INTELLIGENCE.md`.

## Remote friend challenge + referral loop

Escape can compare two people on different devices without requiring accounts.

The permanent fallback link encodes a compact versioned 10-dimensional score vector with a checksum. No name, email, account ID, raw answer text or answer history is placed in the link.

Challenge links carry a short random creator-session referral token so the optional event backend can connect challenge creation, share outcome, receipt, completion, comparison unlock and same-session downstream resharing without identity data.

`referral.js` records whether the native share flow completed, copied successfully, fell back to showing the URL, or was cancelled. `supabase/referrals.sql` adds a privacy-safe cross-device aggregate RPC. `?growth=1` displays creator-token activation, attributed recipient completion, comparison unlocks and same-session resharing without exposing referral tokens, session IDs, install IDs or sender/recipient pair records.

Rate claims are sample-gated. Without Supabase, the growth dashboard reports only current-browser telemetry and explicitly marks cross-device downstream metrics as backend-required.

See `REFERRALS.md`.

## Commercial campaign engine

Tasteprint can run branded **Tasteprint Drops** without forking the core Escape experience.

Campaign features include manifest-driven theming/copy, configurable question sets/scoring, CSV/JSON catalog ingestion, source-free Campaign Studio, catalog matching, CTA/conversion analytics, optional explicit-consent post-result lead capture, restricted lead storage, published campaign registry, privacy-safe reports and Campaign Workspace.

The fictional **Aster & Tide** campaign is a portfolio demo. Its lead form operates in discard-only demo mode.

### Campaign Workspace

`?workspace=1` is the multi-user administration surface. Without Supabase it becomes a fictional local demo automatically, including role switching and Experience QA.

The production scaffold adds five roles: Owner, Admin, Editor, Analyst and Viewer. Hosted draft rows are tenant-scoped through RLS. Editors can edit but cannot publish. Publish/unpublish requires a signed-in user and is re-authorized server-side for Owner/Admin membership.

Workspace membership tables do not store member email/name columns. One-time invite links store only SHA-256 token hashes. Browser-visible member lists use short hashed references instead of Auth user UUIDs. Workspace has no raw lead-contact or anonymous-consumer-data browser.

The old browser-entered shared operator publish secret has been retired from the active client publishing path. `campaign-remote.js` now sends the signed-in user's Auth JWT; the Edge Function verifies the user, workspace, role and campaign ownership before using any elevated backend credential.

`studio-workspace-bridge.js` keeps ordinary local Campaign Studio behavior intact, hides the legacy publish-secret UI, adds live Experience QA, can load/save hosted drafts, and exposes authenticated publish actions when a real workspace is connected.

See `WORKSPACES.md` and `PRIVACY_MODEL.md`.

### Experience QA

The campaign quality review treats privacy failures as blocking and scores whether the campaign has a clear user value promise, concrete output, enough recommendation breadth, value before lead capture, explicit consent, HTTPS links, autonomy-preserving copy and no sensitive-attribute targeting keys.

The score is a deterministic product heuristic, not a psychological diagnosis or conversion guarantee.

## Data and privacy layer

Tasteprint separates four data zones instead of silently connecting everything under one identity:

1. anonymous consumer product data;
2. optional account-backed Passport sync;
3. authenticated Campaign Workspace administration;
4. explicit-consent campaign lead contacts.

The anonymous path includes local/optional remote analytics, structured recommendation feedback, referral telemetry, aggregate dashboards, sample-gated percentiles, browser-authorized deletion and short Escape result IDs.

The optional account path holds Passport snapshots. The Workspace path holds tenant/admin data and campaign manifests. Lead contact values stay in the restricted lead path.

The persistent Privacy & data dialog exposes the distinction and adds local Next Moves export/clear controls.

`scripts/check-privacy-boundaries.js` also fails CI if browser clients contain backend secret-key markers or if key Workspace authorization/privacy invariants disappear.

See `DATA_MVP.md`, `ACCOUNT_SYNC.md`, `INTELLIGENCE.md`, `REFERRALS.md`, `WORKSPACES.md`, `NEXT_MOVES.md`, `PRIVACY_MODEL.md`, and the SQL files under `supabase/`.

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
npm run test:privacy
npm run test:campaign
npm run test:workspace
npm run test:platform
npm run test:account
npm run test:intelligence
npm run test:next
npm run test:referrals
npm run test:wear
npm run test:watch
npm run test:move
npm run test:eat
npm run test:live
npm run test:distribution
```

Automated checks are regression guards, not substitutes for physical iPhone/Android, VoiceOver/TalkBack, production RLS review or a security assessment.

## Optional Supabase activation

Tasteprint still accepts the existing frontend environment variable name:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

`VITE_SUPABASE_ANON_KEY` is a historical variable name; it can hold the current public/publishable client key. New Workspace/campaign code also recognizes `VITE_SUPABASE_PUBLISHABLE_KEY` when present. Never put a secret/service-role key in any `VITE_*` value.

For the complete backend, run/deploy in roughly this order:

1. `supabase/schema.sql` — anonymous data/RPC layer
2. `supabase/referrals.sql` — privacy-safe cross-device referral aggregates
3. `supabase/campaigns.sql` — aggregate campaign reporting
4. `supabase/campaign-registry.sql` — deliberately public published campaigns
5. `supabase/workspaces.sql` — authenticated tenant workspaces, hosted drafts and hashed invite links
6. `supabase/leads.sql` — restricted consent leads
7. `supabase/passport-sync.sql` — authenticated Passport snapshots + RLS
8. `supabase/intelligence.sql` — trusted structured-feedback aggregates
9. deploy the updated `supabase/functions/publish-campaign`
10. deploy `supabase/functions/capture-lead`
11. deploy `supabase/functions/delete-account`
12. add the GitHub Pages callbacks to Supabase Auth allowed redirect URLs
13. configure the public project URL/key in GitHub Actions
14. set `TASTEPRINT_ALLOWED_ORIGINS` if additional production origins need authenticated campaign publishing
15. schedule `tasteprint_prune_old_data()` from a trusted cron/operator context
16. QA anonymous deletion, short links, aggregate RPCs, referral attribution, campaigns, leads, Workspace role isolation, invite acceptance, hosted drafts, Auth publishing, magic-link Passport sync and account deletion.

Backend secret/service-role keys stay server-side only.

## Main modules

- `data.js` / `app.js` — Escape model and runtime
- `wear-data.js` / `wear.js` / `wear.css` — Wear
- `watch-data.js` / `watch.js` / `watch.css` — Watch
- `move-data.js` / `move.js` / `move.css` — Move
- `eat-data.js` / `eat.js` / `eat.css` — Eat
- `live-data.js` / `live.js` / `live.css` — Live
- `platform-core.js` / `platform.js` — six-domain Passport model/runtime
- `account-core.js` / `account-sync.js` — optional cross-device Passport account sync
- `intelligence-core.js` / `intelligence-registry.js` / `intelligence.js` — fit confidence, diversity, feedback and learning gates
- `next-moves-core.js` / `next-moves.js` — local decision-memory/action layer
- `referral-core.js` / `referral.js` / `growth.js` — referral attribution and growth dashboard
- `workspace-core.js` / `workspace.js` / `studio-workspace-bridge.js` — team roles, demo workspace, hosted drafts and Experience QA
- `campaign-*` modules — campaign configuration, Studio, runtime, conversions and reports
- `analytics.js` / `analytics-contract.js` — anonymous analytics/profile layer
- `privacy.js` / `privacy-extensions.js` — data controls and local Next Moves extensions
- `supabase/workspaces.sql` — tenant/RLS Workspace schema
- `supabase/functions/publish-campaign/index.ts` — authenticated role-gated campaign publishing

## Product principles

1. **Fun before formality** — discovery should feel like an experience, not a survey.
2. **Choices over self-description** — tradeoffs are more useful than yes-to-everything trait questions.
3. **Useful output** — results should reduce a decision, not stop at a label.
4. **Small next steps** — one real experiment is better than an infinite recommendation backlog.
5. **Shareability** — archetypes, badges, comparisons and Story cards should create conversation naturally.
6. **No fake precision** — real percentiles and small-sample rates stay gated.
7. **Low friction** — no account/email wall before the user gets value.
8. **Value before data requests** — lead capture belongs after a useful result and requires consent.
9. **Privacy by architecture** — anonymous analytics, accounts, workspaces and leads stay separated by purpose.
10. **Domain-native modules** — shared aggregation happens after each module scores its own domain.
11. **No fake learning** — learned-weight claims wait for real behavior.
12. **No sensitive-feature optimization** — protected attributes do not belong in recommendation ranking/targeting.
13. **No hidden social graph** — referral attribution measures the product loop without exposing sender/recipient relationships.
14. **Autonomy over pressure** — curiosity is welcome; manufactured urgency and dark patterns are not.

## What remains

The remaining work is now mostly production activation and real-world evidence rather than large standalone product features:

- connect and QA the production Supabase project;
- run the Workspace/campaign/referral/account/intelligence migrations and Edge Functions against it;
- physical iPhone/Android and assistive-technology QA;
- first real client campaign + case-study metrics;
- collect enough real structured recommendation feedback for a calibration review;
- tune recommendation weights only after that real behavioral evidence exists.

See `ROADMAP.md` for detailed status.
