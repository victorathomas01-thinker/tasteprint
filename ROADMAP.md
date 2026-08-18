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

The viral MVP keeps a backend optional. A compact versioned Tasteprint score vector is encoded into result/challenge URLs with a checksum. Challenge links carry a short random creator-session referral token so the optional event backend can connect challenge creation, share outcome, receipt, completion, comparison unlock and same-session downstream resharing without names or accounts.

`referral.js` records whether the native share flow completed, copied successfully, fell back to showing the URL, or was cancelled. `supabase/referrals.sql` provides only aggregate cross-device attribution; raw referral tokens, session IDs, install IDs and sender/recipient pair records are never exposed by the public RPC. `?growth=1` uses that RPC when Supabase is active and clearly falls back to current-browser share telemetry when it is not.

Creator-token rates remain hidden until at least 20 distinct creator-session tokens exist. Recipient completion and same-session resharing have independent attributed-recipient sample gates.

The backend scaffold also generates unguessable 10-character short result codes. When Supabase is active, `short-links.js` automatically prefers `?p=` result links and `?c=` challenge links, while old stateless links remain compatible.

See `REFERRALS.md`.

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
- [x] Automated client-secret / tenant-boundary privacy regression guard
- [ ] Create/connect the production Supabase project
- [ ] Add production GitHub Actions Supabase URL/public-key values
- [ ] Run/QA `passport-sync.sql`, `workspaces.sql`, Auth redirect URLs, and authenticated Edge Functions in production
- [ ] Schedule trusted retention pruning in production
- [ ] QA anonymous deletion, short-link resolution, aggregate RPCs, referral reporting, Workspace isolation, account sync, and recommendation-intelligence aggregates against real Supabase

### Data-layer behavior

Tasteprint remains functional with no backend configured. Anonymous consumer analytics, optional account-backed Passport sync, authenticated Campaign Workspace data and explicit-consent campaign leads are separate data zones rather than one master identity table.

Each anonymous browser keeps a private deletion token. Only its SHA-256 hash is attached to remote anonymous rows. Optional Passport sync uses Auth user IDs and RLS. Workspace administration uses a separate tenant/membership model. Structured recommendation feedback stays in the anonymous allowlisted event path. Campaign lead contacts stay in the restricted lead path.

Workspace invitation links do not require an invitee email database. `supabase/workspaces.sql` stores only SHA-256 hashes of one-time random invitation tokens, and browser member listings use short hashed member references rather than Auth user UUIDs.

See `DATA_MVP.md`, `ACCOUNT_SYNC.md`, `INTELLIGENCE.md`, `REFERRALS.md`, `WORKSPACES.md`, `PRIVACY_MODEL.md`, and the SQL files under `supabase/`.

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
- [x] Downloadable campaign-manifest export for source control/database publishing
- [x] Supabase published-campaign registry schema + privacy-limited public resolver
- [x] Optional post-result lead capture with explicit consent
- [x] Restricted lead-contact table + service-role capture Edge Function
- [x] Campaign Studio lead-form configuration + privacy URL validation
- [x] Conversion events beyond outbound CTA activity
- [x] Lead/conversion funnel metrics in campaign reports
- [x] Hosted multi-user Campaign Workspace architecture + permissions
- [x] Five-role model: Owner / Admin / Editor / Analyst / Viewer
- [x] RLS tenant isolation + hosted campaign drafts
- [x] One-time hashed invite-link flow with no workspace email table
- [x] Authenticated role-gated publish/unpublish replacing browser-entered shared publish secrets
- [x] Local fictional Workspace demo that does not require Supabase
- [x] Campaign Experience QA: value, usefulness, autonomy, consent, safe links and sensitive-targeting guardrails
- [ ] Activate campaign registry, workspace tables, lead table and Edge Functions in the production Supabase project
- [ ] First real client campaign + case-study metrics

### Current campaign approach

Campaign manifests can live in source control, browser-local drafts, private Workspace hosted drafts, or the deliberately public published registry.

`?campaignAdmin=1` remains a source-free local editor. `studio-workspace-bridge.js` adds live Experience QA and, when opened from a real Workspace, can load/save a hosted draft. The legacy browser-entered operator-token section is hidden and no longer used by the active client publishing path.

`?workspace=1` is the multi-user admin surface. Without Supabase it automatically renders a fictional local demo with role switching, privacy explanations and the Aster experience review. With Supabase, workspace membership and hosted draft rows are authenticated and tenant-scoped by RLS.

Publishing requires a valid Auth JWT plus Owner/Admin membership. The `publish-campaign` Edge Function verifies user, workspace role and campaign ownership before using any elevated backend credential. It also rejects sensitive targeting keys, unsafe script/javascript content and invalid outbound URLs. Authenticated publishing uses an explicit origin allowlist rather than wildcard CORS.

Lead capture remains optional and comes only after the user has received a result. Contact details remain outside anonymous analytics and Workspace membership.

See `CAMPAIGNS.md`, `WORKSPACES.md`, and `PRIVACY_MODEL.md`.

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
- [x] Wear module + distribution/regression test
- [x] Watch module + exhaustive response-path test
- [x] Move module + exhaustive response-path test
- [x] Eat module + exhaustive response-path test
- [x] Live module + exhaustive response-path test
- [x] Escape / Wear / Watch / Move / Eat / Live all live
- [x] Optional passwordless account + bidirectional cross-device Passport sync implementation
- [x] Account/local merge rules, RLS storage, account-aware privacy controls and deletion scaffold
- [x] Next Moves: local-first recommendation-to-action memory (`?next=1`)
- [x] One active next move per domain + Saved/Trying/Done/Dismissed states
- [x] Next Moves independent export/reset privacy controls

### Current platform approach

Every module keeps domain-specific scoring internally, then maps the completed vector into the shared ten-dimensional Passport vocabulary. Only the latest snapshot from each domain gets one equal vote.

Recommendation intelligence provides an intentionally small set of different next lanes. Next Moves then gives the user a place to keep the one lane they deliberately marked as worth trying. It is capped, local-first and contains no free-text diary/account identity/raw answers.

See `PLATFORM.md`, `ACCOUNT_SYNC.md`, and `NEXT_MOVES.md`.

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

`intelligence-core.js` provides model-fit confidence, cold-start/returning classification, recommendation-profile blending, diversity selection, structured feedback allowlisting and the learning-review gate. `intelligence-registry.js` connects all six domain-native models.

The post-result UI lets users see qualitative model-fit confidence, receive three deliberately non-duplicate recommendation lanes, rate the read, optionally point an existing preference dimension higher/lower, and mark a lane they would try.

Learning records contain no free text, account email, campaign lead data, raw answer selections or demographic/protected-attribute features. The aggregate SQL is review-only; automatic weight updates remain disabled.

The remaining weight-tuning item cannot be truthfully completed until real people generate enough feedback across relevant modules/results. Any change should be manually reviewed, versioned, simulated against valid response space and measured after release.

See `INTELLIGENCE.md`.
