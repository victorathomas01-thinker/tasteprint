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
- [ ] Custom logo / wordmark
- [ ] Stronger icon / illustration system
- [ ] Polished result reveal animation
- [ ] Keyboard + screen-reader QA
- [x] Automated scoring distribution tests

## P1 — Viral MVP

- [x] Generate 9:16 result images
- [x] Web Share API with download fallback
- [ ] Anonymous database-backed profile IDs
- [x] Stateless result URLs
- [x] Stateless friend challenge URLs
- [x] Remote comparison across devices
- [ ] Referral attribution
- [ ] QA challenge/result links on iPhone Safari
- [ ] QA challenge/result links on Android Chrome
- [ ] Mobile share-card QA across iOS / Android / desktop fallbacks

### Current remote-link approach

The first viral MVP intentionally avoids a backend. A compact versioned Tasteprint score vector is encoded into the result/challenge URL with a checksum. That makes result viewing and cross-device friend comparison work immediately on GitHub Pages without accounts, cookies, or a database.

A later data MVP can replace or supplement these links with short anonymous IDs backed by Supabase while preserving old versioned links.

## P2 — Data MVP

- [ ] Supabase schema
- [ ] Response storage
- [ ] Event analytics
- [ ] Result distribution dashboard
- [ ] Real percentile service
- [ ] Minimum sample thresholds
- [ ] Deletion/privacy controls
- [ ] Short anonymous IDs for share URLs

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
