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

- [ ] Client theming
- [ ] Configurable questions and scoring
- [ ] Client catalog import
- [ ] Product/destination matching
- [ ] CTA tracking
- [ ] Optional post-result lead capture
- [ ] Campaign reporting

## P4 — Tasteprint platform

- [ ] Optional accounts
- [ ] Persistent master Tasteprint
- [ ] Escape / Wear / Watch / Move / Eat / Live
- [ ] Cross-module badges
- [ ] Preference history
- [ ] “What changed about me?” summaries

## P5 — Recommendation intelligence

- [ ] Tune weights from real behavior
- [ ] Recommendation satisfaction feedback
- [ ] Uncertainty/confidence modeling
- [ ] Recommendation diversity
- [ ] Cold-start vs returning-user behavior
- [ ] Avoid sensitive-attribute inference
