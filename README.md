# Tasteprint

Tasteprint is an interactive preference-and-recommendation prototype that turns a user's choices into a reusable profile of what they are likely to enjoy, value, choose, or avoid.

The first live module, **Tasteprint Escape**, focuses on travel. Instead of asking users to describe themselves directly, it uses lightweight decisions and tradeoffs to infer a multidimensional preference profile, then turns that profile into archetypes, badges, visual continuums, destination recommendations, friend comparisons, and shareable Story cards.

## Live demo

**GitHub Pages:** https://victorathomas01-thinker.github.io/tasteprint/

## Current demo features

- 8-step mobile-first interactive flow
- 10 hidden preference dimensions
- 12 named travel archetypes
- 8 travel modes
- weighted scoring from user choices
- dynamic badges
- visible preference continuums
- decision fingerprint showing influential choices
- psychological tension / contradiction insight
- best-fit, same-energy, and curveball recommendations
- inverse “probably not your trip” recommendation
- same-device friend comparison
- cross-device friend challenge links
- stateless shared result links
- compatibility percentage
- shared trait + biggest friction
- pair archetypes and compromise advice
- Instagram Story-style result preview
- generated 1080×1920 PNG result cards
- native Web Share API support when the browser can share files
- automatic PNG download fallback when native file sharing is unavailable
- custom Tasteprint mark + favicon
- cohesive icon-card styling
- staged view/result reveal motion with reduced-motion support
- skip navigation, visible keyboard focus, live screen-reader announcements, and multi-select ARIA state
- automated accessibility regression checks in the GitHub Pages deployment pipeline
- percentile system intentionally withheld until real comparison data exists

## Remote challenge MVP

Tasteprint can compare two people on different devices without requiring accounts or a backend.

After finishing a result, the app can generate:

- a **result link** that recreates the shared Tasteprint
- a **friend challenge link** that carries the sender's profile to another device

The recipient completes the same Tasteprint flow and unlocks a remote comparison with compatibility, strongest agreement, biggest friction, shared travel mode, compromise advice, and a destination recommendation.

The current implementation encodes a compact, versioned 10-dimension score vector directly into the URL and includes a checksum. No name, email, account identifier, raw answer text, or answer history is placed in the link. Anyone who receives the link can reconstruct the encoded preference vector, so users should treat the URL itself as the shared result. This is intentionally a stateless MVP. A later Supabase layer can add short anonymous IDs, analytics, and real population statistics without blocking the viral loop now.

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

Run all current automated checks:

```bash
npm test
```

Or run them separately:

```bash
npm run test:accessibility
npm run test:distribution
```

The accessibility guard checks the static shell and progressive-enhancement layer for important regressions such as missing skip navigation, focus states, reduced-motion handling, the live status region, semantic choice buttons, and multi-select ARIA state. It is a regression guard, not a replacement for manual VoiceOver/TalkBack testing.

## How it works

Each answer adjusts a set of hidden preference dimensions:

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

The resulting vector is compared against structured archetype and travel-mode vectors. The closest matches drive the headline result, while badges, continuums, contradictions, and recommendations preserve more of the nuance in the user's profile.

Friend comparison compares two vectors to identify overlap, friction, a shared travel mode, a compromise, and a destination that better accommodates both people.

`share.js` observes result cards and turns them into a branded 1080×1920 canvas image. On supported mobile browsers the image can be handed directly to the native share sheet; otherwise the user can download the PNG.

`challenge.js` tracks the same scoring decisions in parallel with the main experience, creates versioned result/challenge URLs, reconstructs shared profiles, and unlocks remote comparison without server storage.

`polish.js` adds the Tasteprint visual mark, focus management, screen-reader announcements, selected-state semantics, and staged view-entry motion without coupling those concerns to the core scoring engine.

## Why Tasteprint exists

The broader product idea is to help people figure out what fits them next while making the discovery process entertaining enough to share.

Potential future modules include:

- **Escape** — travel and vacations
- **Wear** — fashion and aesthetic preferences
- **Watch** — movies and TV
- **Move** — fitness and training preferences
- **Eat** — food and restaurants
- **Live** — lifestyle, interiors, and cities

The long-term idea is a persistent Tasteprint that becomes more useful as a person completes different modules.

## Product principles

1. **Fun before formality** — it should feel like an experience, not a survey.
2. **Choices over self-description** — tradeoffs often reveal more than asking people to label themselves.
3. **Useful output** — results should lead to recommendations, not just personality labels.
4. **Shareability** — archetypes, badges, comparisons, result cards, and future percentiles should naturally create conversation.
5. **No fake precision** — percentiles will only appear once there is a real comparison population.
6. **Low friction** — no account or email wall before the user sees value.

## Project structure

```text
.
├── index.html
├── app.js
├── data.js
├── share.js
├── challenge.js
├── polish.js
├── styles.css
├── challenge.css
├── favicon.svg
├── vite.config.js
├── package.json
├── README.md
├── ROADMAP.md
└── scripts/
    ├── check-accessibility.js
    └── simulate.js
```

`data.js` contains the questions, archetypes, travel modes, badges, and continuum definitions. `app.js` contains the primary scoring, result generation, UI state, and same-device friend comparison logic. `share.js` handles Story-image generation, native sharing, and PNG fallback downloads. `challenge.js` handles stateless result links and remote friend challenges. `polish.js` contains the current visual-brand and accessibility enhancements.

## Next steps

The next layer moves Tasteprint from a viral prototype toward a measurable product:

- manual keyboard + VoiceOver/TalkBack QA
- mobile QA for challenge links and image sharing across iOS and Android
- referral attribution
- Supabase-backed anonymous response storage
- short anonymous result IDs
- analytics and funnel tracking
- real percentile calculations after minimum sample thresholds

See [ROADMAP.md](./ROADMAP.md) for the full development plan.

## Privacy note

Tasteprint is intended to infer entertainment and lifestyle preferences from user-provided responses. The current stateless challenge/result links contain the Tasteprint score vector needed to recreate a result, but no account, email, name, or raw answer history. Anyone with the URL can reconstruct that shared vector. Any future persistent profile or analytics system should make collection, retention, and deletion transparent, and should avoid presenting the results as psychological diagnosis.
