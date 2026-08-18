# Tasteprint Roadmap

## P0 — Portfolio-ready demo

- [x] Mobile responsive flow
- [x] 10-dimensional scoring model
- [x] 12 result archetypes
- [x] Travel modes
- [x] Dynamic badges
- [x] Visible continuums
- [x] Decision fingerprint
- [x] Contradiction insight
- [x] Destination recommendations
- [x] Inverse recommendation
- [x] Same-device friend comparison
- [x] Custom Tasteprint mark / wordmark treatment
- [x] Cohesive icon-card visual system
- [x] Polished view/result reveal animation
- [x] Accessibility guardrails: skip link, focus-visible states, reduced motion, live announcements, multi-select ARIA state
- [x] Automated accessibility regression check in CI
- [ ] Manual keyboard + VoiceOver / screen-reader QA
- [x] Automated scoring distribution tests

## P1 — Viral MVP

- [x] Generate 9:16 result images
- [x] Web Share API with download fallback
- [x] Backend short-profile-ID schema + RPC scaffold
- [x] Stateless result URLs
- [x] Stateless friend challenge URLs
- [x] Remote comparison across devices
- [x] Stateless referral-token propagation on challenge links
- [x] Backend-gated short result/challenge URL progressive enhancement
- [x] Backend referral attribution reporting + `?growth=1` dashboard scaffold
- [x] Native-share / clipboard / fallback / cancellation outcome instrumentation
- [x] Privacy-safe creator-token activation, recipient completion, comparison unlock, and same-session reshare metrics
- [x] Independent minimum-sample gates for creator and recipient referral rates
- [ ] Activate referral reporting against the production Supabase project
- [ ] QA challenge/result links on iPhone Safari
- [ ] QA challenge/result links on Android Chrome
- [ ] Mobile share-card QA across iOS / Android / desktop fallbacks

### Current remote-link approach

The first viral MVP intentionally keeps a backend optional. A compact versioned Tasteprint score vector is encoded into the result/challenge URL with a checksum. Challenge links carry a short random creator-session referral token so the optional event backend can connect challenge creation, share outcome, receipt, completion, comparison unlock and same-session downstream resharing without names or accounts.

`referral.js` now records whether the native share flow completed, copied successfully, fell back to showing the URL, or was cancelled. `supabase/referrals.sql` provides only aggregate cross-device attribution; raw referral tokens, session IDs, install IDs and sender/recipient pair records are never exposed by the public RPC. `?growth=1` uses that RPC when Supabase is active and clearly falls back to current-browser share telemetry when it is not.

Creator-token rates remain hidden until at least 20 distinct creator-session tokens exist. Recipient completion and same-session resharing have their own attributed-recipient sample gates, so a mature creator sample cannot accidentally make a tiny recipient sample look authoritative.

The backend scaffold also generates unguessable 10-character short result codes. When Supabase is active, `short-links.js` automatically prefers `?p=` result links and `?c=` challenge links, then resolves those codes through a privacy-limited RPC. Old stateless links remain fully compatible.

See `REFERRALS.md` for the attribution model and limitations.

## P2 — Data MVP

- [x] Supabase schema with row-level security
- [x] Anonymous profile-storage client + local fallback
- [x] Event analytics instrumentation + rolling local event buffer
- [x] Privacy-safe aggregate result/funnel dashboard (`?stats=1`)
- [x] Real percentile RPC implementation
- [x] Minimum sample threshold for percentiles (50 completed profiles)
- [x] Data-contract regression test in CI
- [x] In-product privacy/data-controls screen (`?privacy=1` or persistent button)
- [x] Browser-authorized server-side deletion RPC using private deletion tokens
- [x] 180-day raw-data retention policy + trusted pruning function
- [x] Short anonymous database ID creation/resolution + sharing UI scaffold
- [x] Optional Supabase Auth + RLS Passport-sync schema/client + account deletion scaffold
- [ ] Create/connect the production Supabase project
- [ ] Add production GitHub Actions Supabase URL/anon-key values
- [ ] Run/QA `passport-sync.sql`, Auth redirect URLs, and `delete-account` Edge Function in production
- [ ] Schedule trusted retention pruning in production
- [ ] QA anonymous deletion, short-link resolution, aggregate RPCs, referral reporting, account sync, and recommendation-intelligence aggregates against real Supabase

### Data-layer behavior

Tasteprint remains fully functional with no backend configured. When Supabase environment values are present, the same frontend begins sending anonymous event rows and completed Escape score vectors. Raw answer choices, names, emails, and account IDs are intentionally excluded from that anonymous analytics path.

Each browser keeps a private deletion token. Only its SHA-256 hash is attached to remote anonymous rows. The public deletion RPC requires both the browser install UUID and the matching raw token, which makes deletion possible without accounts while preventing deletion by install-ID knowledge alone.

Optional Passport sync is a separate authenticated path. Supabase Auth holds the account email; `tasteprint_passport_snapshots` stores only the Auth user ID plus sanitized Passport snapshots. RLS limits rows to `auth.uid()`. Anonymous browser deletion and optional account deletion remain separate by design.

Structured recommendation feedback uses the anonymous event path and fixed allowlisted fields only. It is not attached to the optional Auth identity. Referral reporting also stays inside the anonymous product-data path and exposes only aggregate loop metrics.

See `DATA_MVP.md`, `ACCOUNT_SYNC.md`, `INTELLIGENCE.md`, `REFERRALS.md`, `supabase/schema.sql`, and `supabase/passport-sync.sql` for activation and privacy details.

## P3 — Commercial campaign engine

- [x] Client theming through campaign manifests
- [x] Configurable landing/result copy
- [x] Configurable question copy or complete question sets
- [x] Configurable per-dimension scoring multipliers
- [x] Source-controlled client catalog manifests
- [x] Tasteprint-to-product/destination catalog matching
- [x] Campaign view, result-match, and CTA tracking events
- [x] Privacy-safe campaign reporting RPC scaffold
- [x] Local/production-aware campaign report UI (`?campaignReport=<id>`)
- [x] Fictional branded portfolio campaign (`?campaign=aster`)
- [x] Campaign-engine regression test in CI
- [x] Source-free CSV/JSON catalog import + validation + CSV export
- [x] Browser Campaign Studio for creating, saving, editing and previewing local campaigns (`?campaignAdmin=1`)
- [x] Downloadable campaign-manifest export for source control or future database publishing
- [x] Supabase published-campaign registry schema + privacy-limited public resolver
- [x] Secure Edge Function publish/unpublish scaffold using a server-side operator token
- [x] Campaign Studio production-publish controls + published-campaign library
- [x] Runtime loading of published campaign manifests with `?campaign=<id>&published=1`
- [x] Optional post-result lead capture with explicit consent
- [x] Restricted lead-contact table + service-role capture Edge Function
- [x] Campaign Studio lead-form configuration + privacy URL validation
- [x] Conversion events beyond outbound CTA activity
- [x] Lead/conversion funnel metrics in campaign reports
- [ ] Activate campaign registry, lead table and Edge Functions in the production Supabase project
- [ ] Hosted multi-user campaign administration + permissions
- [ ] First real client campaign + case-study metrics

### Current campaign approach

Campaign manifests can live in source control under `campaigns/`, as browser-local drafts created in Campaign Studio, or in the Supabase published-campaign registry once that backend is activated. `campaign-config.js` applies theme/copy/question/scoring configuration before the quiz engine runs. `campaign-runtime.js` progressively brands the UI, matches the user's archetype/travel mode to the client catalog, and instruments partner CTAs.

Open `?campaignAdmin=1` to launch Campaign Studio. It accepts CSV or JSON catalogs, validates required fields and HTTPS links, configures optional post-result lead capture, previews imported offers, saves drafts to browser storage, exports catalogs back to CSV, exports full campaign manifests to JSON, and launches the actual campaign runtime using the saved draft.

Lead capture remains optional and comes only after the user has received a result. Non-demo campaigns must provide explicit consent copy and an HTTPS privacy URL. Contact details are sent only to the `capture-lead` Edge Function and stored in the restricted `tasteprint_campaign_leads` table; email/name are deliberately excluded from Tasteprint analytics events and aggregate reports. The Aster portfolio campaign demonstrates the form in discard-only mode, so demo contact details are never stored.

The publish layer is deliberately separated from the public browser bundle. `supabase/campaign-registry.sql` creates the registry and read-only public RPCs. `supabase/functions/publish-campaign/index.ts` performs publish/unpublish writes with the Supabase service role only after validating a server-side `TASTEPRINT_PUBLISH_TOKEN`. Campaign Studio asks the operator for that token only when publishing and does not persist it. This provides a secure single-operator publish path without pretending a multi-user CMS already exists.

Campaign conversion analytics now include lead submissions plus a small privacy-safe conversion API for booking intent, checkout start, purchase confirmation, or custom conversion events. Conversion event properties intentionally exclude names, emails and free-form PII. `?campaignReport=<id>` reports aggregate lead-form completion, total conversions, conversion rate and conversion types without exposing contact rows.

The fictional **Aster & Tide** campaign exists strictly as a portfolio demonstration. Open `?campaign=aster` to use it. Open `?campaignReport=aster` to view the campaign reporting surface. When Supabase is not configured the report uses only the current browser's local analytics buffer; once Supabase is active and the campaign SQL extensions are installed, it can use aggregate production reporting without exposing raw event rows.

See `CAMPAIGNS.md` for the manifest format and commercial architecture.

## P4 — Tasteprint platform

- [x] Local-first module registry and Passport shell (`?profile=1`, `?modules=1`)
- [x] Shared 10-dimensional master preference vocabulary + all six module mappings
- [x] Persistent local master Tasteprint
- [x] Preference history
- [x] “What changed about me?” summaries
- [x] Passport export/reset integrated with privacy controls
- [x] Platform regression test in CI
- [x] Ship a second real module so the master profile becomes genuinely cross-domain
- [x] Cross-module badges unlocked from 2+ real modules
- [x] Wear module: 8-choice flow, 10D style model, 12 archetypes, 8 dressing modes, Story sharing and Passport capture
- [x] Wear synthetic distribution/regression test in CI
- [x] Watch module: 8-choice flow, 10D story model, 12 archetypes, 8 viewing modes, Story sharing and Passport capture
- [x] Watch exhaustive response-path distribution/regression test in CI
- [x] Move module: 8-choice flow, 10D training-preference model, 12 archetypes, 8 session modes, Story sharing and Passport capture
- [x] Move exhaustive response-path distribution/regression test in CI
- [x] Eat module: 8-choice flow, 10D dining-preference model, 12 archetypes, 8 dining modes, Story sharing and Passport capture
- [x] Eat exhaustive response-path distribution/regression test in CI
- [x] Live module: 8-choice flow, 10D environment-preference model, 12 archetypes, 8 living modes, Story sharing and Passport capture
- [x] Live exhaustive response-path distribution/regression test in CI
- [x] Escape / Wear / Watch / Move / Eat / Live all live
- [x] Optional passwordless account + bidirectional cross-device Passport sync implementation
- [x] Account/local merge rules, RLS storage, account-aware privacy controls and deletion scaffold

### Current platform approach

`platform-core.js` defines six modules and a shared master vocabulary. Every module keeps domain-specific scoring internally, then maps the finished score vector into the same ten shared Passport dimensions. Travel, personal style, entertainment, training, dining and everyday environment therefore get domain-native questions without losing the ability to surface cross-domain patterns.

`platform.js` creates a local-first Tasteprint Passport. It captures completed module results, stores recent snapshots without raw answer selections, gives each completed module one equal vote in the master profile, and compares repeated module results to show preference movement over time. Retaking one module therefore does not let that category overpower the rest of the master Tasteprint.

`account-sync.js` adds an optional passwordless Supabase Auth layer without changing the default flow. Once signed in, local and remote histories are merged bidirectionally by stable snapshot identity, the combined history stays capped, and future results sync automatically. Signing out leaves the local Passport intact. `supabase/passport-sync.sql` uses authenticated RLS, and account deletion is isolated behind a service-role Edge Function. Production activation still depends on the real Supabase project.

Wear uses experimentation, coordination, visibility, styling, ease, edge, calm, nostalgia, detail and impulse internally. Watch uses surprise, coherence, ensemble, visuality, accessibility, momentum, gentleness, emotion, complexity and discovery. Move uses variety, structure, social energy, movement craft, recovery, intensity, calm, training identity, learning and flexibility. Eat uses food adventure, ritual, sharing, presentation, comfort, flavor intensity, ease, nostalgia, curiosity and dining spontaneity. Live uses discovery, routine, community, space aesthetics, comfort, everyday pace, quiet, rootedness, access and flexibility.

Once at least two domains are completed, Passport can unlock badges only when a preference repeats across modules, such as Aesthetic Throughline, Comfort Loyalist or Structured Curiosity. With all six original modules live, those patterns can now be tested against the complete planned consumer-domain set.

See `PLATFORM.md` and `ACCOUNT_SYNC.md` for the master model, storage behavior, module architecture, and optional sync path.

## P5 — Recommendation intelligence

- [ ] Tune weights from real behavior — infrastructure is ready; requires real-user evidence and a versioned calibration pass
- [x] Recommendation satisfaction feedback
- [x] Uncertainty/confidence modeling
- [x] Recommendation diversity
- [x] Cold-start vs returning-user behavior
- [x] Avoid sensitive-attribute inference
- [x] Structured feedback learning record + local summary pipeline
- [x] Trusted Supabase intelligence aggregate scaffold with 50-feedback review gate
- [x] Explicit no-auto-weight-update policy + regression checks

### Current intelligence approach

`intelligence-core.js` provides the pure model-fit confidence, cold-start/returning classification, recommendation-profile blending, diversity selection, structured feedback allowlist and learning-review gate. `intelligence-registry.js` connects all six domain-native models without flattening their score vocabularies.

`intelligence.js` adds a post-result intelligence panel only to first-party consumer quiz results. It does not alter shared-result, friend-challenge, branded-campaign or admin/report routes. Users can see a qualitative fit-confidence explanation, get three deliberately non-duplicate recommendation lanes, rate whether the read felt right, optionally point one existing preference dimension higher/lower, and mark a lane they would actually try.

Returning behavior is deliberately conservative: a same-module retake uses the current score vector as the dominant recommendation signal and blends only a small amount of the immediately previous module result. The stored archetype/result and Passport scores are never rewritten by this layer.

Learning records are built from a fixed allowlist and contain no free text, account email, campaign lead data, raw answer selections or demographic/protected-attribute features. `supabase/intelligence.sql` exposes only a trusted service-role aggregate review function and explicitly reports that automatic weight updates are disabled.

The remaining `Tune weights from real behavior` item cannot be truthfully completed until real people generate enough feedback across the relevant modules/results. Once that data exists, any weight change should be manually reviewed, versioned, simulated against the valid response space, checked for collapsed outcomes, and measured after release.

See `INTELLIGENCE.md` for the full P5 model, privacy boundary and calibration policy.
