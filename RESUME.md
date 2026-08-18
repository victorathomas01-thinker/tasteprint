# Tasteprint — Resume Reference

## Live links

Main product:

```text
https://victorathomas01-thinker.github.io/tasteprint/
```

Recruiter / portfolio walkthrough:

```text
https://victorathomas01-thinker.github.io/tasteprint/?tour=1
```

GitHub repository:

```text
https://github.com/victorathomas01-thinker/tasteprint
```

## Short resume title

**Tasteprint — Preference & Recommendation Platform**

## One-line description

Designed and developed a six-domain interactive preference and recommendation platform that turns rapid forced-choice tradeoffs into explainable recommendations, a reusable cross-domain Passport, and small next-step decisions.

## Resume bullets

- Built six domain-specific recommendation experiences in vanilla JavaScript and Vite, using 10-dimensional scoring models, named archetypes, explainable recommendation lanes, local-first persistence, and a shared cross-domain Passport.
- Developed privacy-first product architecture with optional Supabase Auth/database integration, Row Level Security scaffolding, passwordless Passport sync, anonymous analytics boundaries, hashed deletion/invite tokens, and role-based commercial campaign tooling.
- Created automated regression coverage for scoring, accessibility guardrails, privacy boundaries, campaign permissions, recommendation intelligence, and exhaustive 65,536-response-path checks for multiple modules; deployed the static product through GitHub Pages and GitHub Actions.

## Interview framing

The problem Tasteprint tries to solve is decision overload in taste-heavy categories. Users can browse hundreds of destinations, clothes, shows, training styles, meals, or living environments without becoming more confident about what actually fits them.

The product uses identity and visual discovery as the enjoyable hook, then turns the result into a small set of explainable recommendation lanes and an optional Next Moves action layer. It intentionally avoids requiring signup before value, avoids fake population percentiles, and keeps the core demo functional without a backend.

## Technical highlights worth discussing

- Vanilla JavaScript + Vite
- GitHub Pages deployment
- Six independent domain-native scoring models
- Shared 10-dimensional Passport mapping
- Explainable recommendation diversity + confidence model
- Local-first persistence
- Optional Supabase Auth/Postgres/RLS architecture
- Privacy-separated consumer, account, workspace, and lead data zones
- Multi-role Campaign Workspace architecture
- Stateless cross-device challenge/result links
- Automated regression and exhaustive response-space tests

## Important accuracy note

Until the production Supabase project is connected, describe the public deployment as a **local-first web application with production backend architecture/scaffolding**, not as a fully activated cloud backend. Cross-device Passport sync, hosted workspaces, backend analytics, real lead storage, and authenticated publishing are implemented in code but remain inactive on the public deployment until Supabase is configured.
