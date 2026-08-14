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
- compatibility percentage
- shared trait + biggest friction
- pair archetypes and compromise advice
- Instagram Story-style result preview
- generated 1080×1920 PNG result cards
- native Web Share API support when the browser can share files
- automatic PNG download fallback when native file sharing is unavailable
- percentile system intentionally withheld until real comparison data exists

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

To run the scoring-distribution simulation:

```bash
npm run test:distribution
```

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

Friend comparison builds a second profile and compares both vectors to identify overlap, friction, a shared travel mode, and a destination that better accommodates both people.

`share.js` observes result cards and turns them into a branded 1080×1920 canvas image. On supported mobile browsers the image can be handed directly to the native share sheet; otherwise the user can download the PNG.

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
├── styles.css
├── package.json
├── README.md
├── ROADMAP.md
└── scripts/
    └── simulate.js
```

`data.js` contains the questions, archetypes, travel modes, badges, and continuum definitions. `app.js` contains scoring, result generation, UI state, and friend-comparison logic. `share.js` handles Story-image generation, native sharing, and PNG fallback downloads.

## Next steps

The biggest remaining step is turning the public portfolio prototype into a real viral MVP:

- persistent anonymous result IDs
- unique result URLs
- unique friend challenge links
- remote comparison across devices
- referral attribution
- Supabase-backed response storage
- analytics and funnel tracking
- real percentile calculations after minimum sample thresholds
- mobile QA for image sharing across iOS and Android

See [ROADMAP.md](./ROADMAP.md) for the full development plan.

## Privacy note

Tasteprint is intended to infer entertainment and lifestyle preferences from user-provided responses. Any future persistent profile or analytics system should make collection, retention, and deletion transparent, and should avoid presenting the results as psychological diagnosis.
