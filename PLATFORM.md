# Tasteprint Platform Layer

Tasteprint is now a multi-module preference platform rather than a single Escape experience. The local **Tasteprint Passport** sits above individual modules without requiring an account and can now combine three genuinely different domains: travel, personal style and entertainment taste.

## Routes

- `?profile=1` — open the local Tasteprint Passport
- `?modules=1` — open the module hub
- `?` — Tasteprint Escape
- `?module=wear` — Tasteprint Wear
- `?module=watch` — Tasteprint Watch

All live consumer modules expose the same **My Tasteprint** Passport shortcut.

## Shared master model

Individual modules are allowed to use domain-specific score names. Before a module contributes to the master Tasteprint, its scores are mapped into ten shared dimensions:

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

Escape maps travel-specific romance, activity, culture and related scores into this vocabulary. Wear keeps a fashion vocabulary — experimentation, coordination, visibility, styling, ease, edge, calm, nostalgia, detail and impulse. Watch uses surprise, coherence, ensemble, visuality, accessibility, momentum, gentleness, emotion, complexity and discovery.

Each module therefore asks questions in the language of its own domain, then translates only the finished score vector into the shared Passport vocabulary.

The master profile uses only the **latest saved result from each completed module**. Each module gets one equal vote. Retaking Escape five times therefore does not give travel five times more influence than Wear or Watch.

## Tasteprint Wear

Wear is the first cross-domain expansion and is intentionally designed as a complete consumer module rather than a placeholder.

It includes:

- 8 forced-choice wardrobe decisions
- 10 hidden style dimensions
- 12 style archetypes
- 8 dressing modes
- dynamic style badges
- visible style continuums
- contradiction/nuance insight
- strongest-pull explanation
- three wardrobe anchor ideas rather than a product shopping list
- decision fingerprint
- curveball and inverse style directions
- Story-card generation through the existing share engine
- automatic Passport capture
- module-aware analytics events

Its archetype distribution is checked with synthetic valid response combinations for development coverage only. That is a product-engineering guardrail, not a claim about real population frequencies.

## Tasteprint Watch

Watch is the third live domain and is built around **story mechanics rather than genre labels**. Someone can like science fiction, romance or comedy for completely different underlying reasons, so the module scores what the story is doing for them instead of simply asking what genres they select.

It includes:

- 8 forced-choice viewing decisions
- 10 hidden story-preference dimensions
- 12 Watch archetypes
- 8 viewing modes
- dynamic Watch badges
- visible story continuums
- contradiction/nuance insight
- strongest-pull explanation
- three “what to look for next” signals rather than a static title list
- decision fingerprint
- curveball and inverse viewing lanes
- Story-card generation through the existing share engine
- automatic Passport capture
- module-aware analytics events

The Watch regression test exhaustively evaluates all **65,536 possible response paths**. Every archetype must remain reachable, no archetype may fall below 1% of valid response paths, and no single archetype may exceed 25%. Those thresholds are development calibration only, not evidence about real human frequencies.

## Local Passport storage

`platform.js` stores recent module snapshots under:

```text
tasteprint.platform-history.v1
```

A snapshot contains:

- module ID
- timestamp
- module score vector
- mapped master score vector
- result archetype / mode labels
- non-identifying source label
- a result signature used for duplicate suppression

It does **not** store raw quiz answer selections, name, email, or an account identity.

The current history cap is 60 snapshots. Passport can be exported as JSON or cleared independently. The main Privacy & data control also includes Passport history in local export and clears it after a successful browser-data deletion/reset.

## Preference history

When a user completes a module more than once, Passport compares the newest result with the previous result from that same module and surfaces the largest movement. Small changes are described as stable rather than turned into fake precision.

The Passport's “What changed?” card follows the most recently completed module, so a new Watch retake is compared to the previous Watch result rather than to Escape or Wear.

This comparison is explicitly **within-person history**, not a population percentile or psychological diagnosis.

## Master labels and cross-module badges

Passport creates a lightweight master-pattern title from the strongest departures from the midpoint and can show provisional aggregate badges such as:

- Novelty Magnet
- Aesthetic First
- Soft-Life Bias
- Curious by Default
- Freeform Instinct
- Structured Explorer

With multiple real modules, Passport can also unlock a separate class of **cross-module badges** only when the same preference is present in at least two different domains. Current examples include:

- Aesthetic Throughline
- Novelty Everywhere
- Comfort Loyalist
- Freeform Across Contexts
- Sentimental Thread
- Low-Noise Throughline
- Structured Curiosity
- High-Energy Throughline

This is deliberately stricter than simply reading the master average. A cross-module badge requires the underlying pattern to appear independently in multiple completed modules. With Escape, Wear and Watch live, a badge can now survive a third-domain check rather than relying on only one pair.

## Module registry

The platform registry currently defines:

1. Escape — live
2. Wear — live
3. Watch — live
4. Move — planned
5. Eat — planned
6. Live — planned

The module hub shows the future categories while keeping unfinished modules clearly marked as planned rather than presenting placeholders as working features.

## Files

- `platform-core.js` — shared dimensions, module registry, Escape/Wear/Watch mappings, snapshot normalization, master aggregation, aggregate badges, cross-module badges and change summaries
- `platform.js` — local storage, generic module-result capture, Passport UI, module hub, export/reset controls
- `platform.css` — Passport and module-hub presentation
- `wear-data.js` / `wear.js` / `wear.css` — Wear model, runtime and presentation
- `watch-data.js` / `watch.js` / `watch.css` — Watch model, runtime and presentation
- `scripts/check-platform.js` — regression tests for three-module mapping/aggregation/history/cross-module badges
- `scripts/check-wear.js` — Wear schema/runtime/distribution regression test
- `scripts/check-watch.js` — Watch schema/runtime and exhaustive 65,536-path distribution regression test

## Next platform work

The next major platform milestones are:

1. add optional accounts/sync without making signup mandatory
2. decide how account-backed history and deletion interact with the anonymous/local model
3. ship Move, Eat and Live
4. eventually add module-specific persistent/share links where they create real value
5. validate master and cross-module patterns against real user feedback rather than only hand-designed logic

The Passport remains intentionally local-first so the platform concept can be tested before account complexity becomes a prerequisite.
