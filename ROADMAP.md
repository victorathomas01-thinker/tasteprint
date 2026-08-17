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
- [ ] Backend referral attribution reporting (activates with data backend)
- [ ] QA challenge/result links on iPhone Safari
- [ ] QA challenge/result links on Android Chrome
- [ ] Mobile share-card QA across iOS / Android / desktop fallbacks

### Current remote-link approach

The first viral MVP intentionally keeps a backend optional. A compact versioned Tasteprint score vector is encoded into the result/challenge URL with a checksum. Challenge links also carry a short random referral token so the future/optional event backend can connect challenge creation, receipt, completion, and match unlocks without names or accounts.

The backend scaffold generates unguessable 10-character short codes. When Supabase is active, `short-links.js` automatically prefers `?p=` result links and `?c=` challenge links, then resolves those codes through a privacy-limited RPC. Old stateless links remain fully compatible.

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
- [ ] Create/connect the production Supabase project
- [ ] Add production GitHub Actions Supabase URL/anon-key values
- [ ] Schedule trusted retention pruning in production
- [ ] QA deletion, short-link resolution, and aggregate RPCs against real Supabase

### Data-layer behavior

Tasteprint remains fully functional with no backend configured. When Supabase environment values are present, the same frontend begins sending anonymous event rows and completed 10-dimensional score vectors. Raw answer choices, names, emails, and account IDs are intentionally excluded.

Each browser keeps a private deletion token. Only its SHA-256 hash is attached to remote rows. The public deletion RPC requires both the browser install UUID and the matching raw token, which makes deletion possible without accounts while preventing deletion by install-ID knowledge alone.

See `DATA_MVP.md` and `supabase/schema.sql` for activation and privacy details.

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
- [ ] Optional accounts + cross-device Passport sync

### Current platform approach

`platform-core.js` defines six modules and a shared master vocabulary. Every module keeps domain-specific scoring internally, then maps the finished score vector into the same ten shared Passport dimensions. Travel, personal style, entertainment, training, dining and everyday environment therefore get domain-native questions without losing the ability to surface cross-domain patterns.

`platform.js` creates a local-first Tasteprint Passport. It captures completed module results, stores recent snapshots without raw answer selections, gives each completed module one equal vote in the master profile, and compares repeated module results to show preference movement over time. Retaking one module therefore does not let that category overpower the rest of the master Tasteprint.

Wear uses experimentation, coordination, visibility, styling, ease, edge, calm, nostalgia, detail and impulse internally. Watch uses surprise, coherence, ensemble, visuality, accessibility, momentum, gentleness, emotion, complexity and discovery. Move uses variety, structure, social energy, movement craft, recovery, intensity, calm, training identity, learning and flexibility. Eat uses food adventure, ritual, sharing, presentation, comfort, flavor intensity, ease, nostalgia, curiosity and dining spontaneity. Live uses discovery, routine, community, space aesthetics, comfort, everyday pace, quiet, rootedness, access and flexibility.

Once at least two domains are completed, Passport can unlock badges only when a preference repeats across modules, such as Aesthetic Throughline, Comfort Loyalist or Structured Curiosity. With all six original modules live, those patterns can now be tested against the complete planned consumer-domain set.

See `PLATFORM.md` for the master model, storage behavior and module architecture.

## P5 — Recommendation intelligence

- [ ] Tune weights from real behavior
- [ ] Recommendation satisfaction feedback
- [ ] Uncertainty/confidence modeling
- [ ] Recommendation diversity
- [ ] Cold-start vs returning-user behavior
- [ ] Avoid sensitive-attribute inference
