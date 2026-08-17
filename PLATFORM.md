# Tasteprint Platform Layer

Tasteprint is now a multi-module preference platform rather than a single Escape experience. The local **Tasteprint Passport** sits above individual modules without requiring an account and can now combine five genuinely different domains: travel, personal style, entertainment taste, training preferences and dining taste.

## Routes

- `?profile=1` — open the local Tasteprint Passport
- `?modules=1` — open the module hub
- `?` — Tasteprint Escape
- `?module=wear` — Tasteprint Wear
- `?module=watch` — Tasteprint Watch
- `?module=move` — Tasteprint Move
- `?module=eat` — Tasteprint Eat

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

Escape maps travel-specific romance, activity, culture and related scores into this vocabulary. Wear keeps a fashion vocabulary — experimentation, coordination, visibility, styling, ease, edge, calm, nostalgia, detail and impulse. Watch uses surprise, coherence, ensemble, visuality, accessibility, momentum, gentleness, emotion, complexity and discovery. Move uses variety, structure, social energy, movement craft, recovery, intensity, calm, training identity, learning and flexibility. Eat uses adventure, ritual, sharing, presentation, comfort, flavor intensity, ease, nostalgia, curiosity and spontaneity.

Each module therefore asks questions in the language of its own domain, then translates only the finished score vector into the shared Passport vocabulary.

The master profile uses only the **latest saved result from each completed module**. Each module gets one equal vote. Retaking one module repeatedly cannot overpower the rest of the profile.

## Tasteprint Wear

Wear is built around wardrobe decisions rather than generic style labels. It includes 8 forced-choice decisions, 10 hidden style dimensions, 12 archetypes, 8 dressing modes, badges, continuums, contradiction insight, wardrobe-direction anchors, decision fingerprints, curveball/inverse directions, Story sharing, analytics and Passport capture.

Its distribution test is a software calibration guardrail only, not evidence about real population frequencies.

## Tasteprint Watch

Watch is built around **story mechanics rather than genre labels**. It includes 8 forced-choice viewing decisions, 10 hidden story-preference dimensions, 12 archetypes, 8 viewing modes, badges, continuums, contradiction insight, recommendation signals, decision fingerprints, curveball/inverse lanes, Story sharing, analytics and Passport capture.

The Watch regression test exhaustively evaluates all **65,536 possible response paths**. Every archetype must remain reachable and inside broad synthetic coverage bounds. Those thresholds are development calibration only, not evidence about real human frequencies.

## Tasteprint Move

Move is built around **what makes training feel repeatable and rewarding**, not around telling users which workout is medically or physiologically best for them.

It includes 8 forced-choice training decisions, 10 hidden training-preference dimensions, 12 archetypes, 8 session modes, badges, continuums, contradiction insight, session-fit signals, decision fingerprints, curveball/inverse modes, Story sharing, analytics and Passport capture. It explicitly frames the result as preference rather than exercise or medical prescription.

The Move regression test exhaustively evaluates all **65,536 possible response paths**. All archetypes and session modes must remain reachable and inside broad synthetic coverage bounds.

## Tasteprint Eat

Eat is built around **what makes a meal feel worth it**, rather than reducing taste to favorite cuisines. It distinguishes discovery, ritual, social energy, presentation, comfort, flavor intensity, ease, nostalgia, curiosity and spontaneity.

It includes:

- 8 forced-choice dining decisions
- 10 hidden food-preference dimensions
- 12 Eat archetypes
- 8 dining modes
- dynamic Eat badges
- visible dining continuums
- contradiction/nuance insight
- strongest-pull explanation
- three dining-fit signals rather than a static restaurant list
- decision fingerprint
- curveball and inverse dining modes
- Story-card generation through the existing share engine
- automatic Passport capture
- module-aware analytics events
- an explicit boundary that preferences do not account for allergies, dietary restrictions, nutrition needs or medical considerations

The Eat regression test exhaustively evaluates all **65,536 possible response paths**. Its archetype and mode centroids were calibrated against the valid response space so every result remains reachable and no single outcome dominates. That is an engineering guardrail, not a real-user population claim.

## Local Passport storage

`platform.js` stores recent module snapshots under:

```text
tasteprint.platform-history.v1
```

A snapshot contains the module ID, timestamp, module score vector, mapped master score vector, result labels, a non-identifying source label and a duplicate-suppression signature. It does **not** store raw quiz answer selections, name, email or an account identity.

The current history cap is 60 snapshots. Passport can be exported as JSON or cleared independently. The main Privacy & data control also includes Passport history in local export and clears it after a successful browser-data deletion/reset.

## Preference history

When a user completes a module more than once, Passport compares the newest result with the previous result from that same module and surfaces the largest movement. Small changes are described as stable rather than turned into fake precision.

The Passport's “What changed?” card follows the most recently completed module, so module retakes are compared within their own domain.

This comparison is explicitly **within-person history**, not a population percentile or psychological diagnosis.

## Master labels and cross-module badges

Passport creates a lightweight master-pattern title from the strongest departures from the midpoint and can show provisional aggregate badges such as Novelty Magnet, Aesthetic First, Soft-Life Bias, Curious by Default, Freeform Instinct and Structured Explorer.

With multiple real modules, Passport can also unlock a separate class of **cross-module badges** only when the same preference is present in at least two different domains. Current examples include Aesthetic Throughline, Novelty Everywhere, Comfort Loyalist, Freeform Across Contexts, Sentimental Thread, Low-Noise Throughline, Structured Curiosity and High-Energy Throughline.

This is deliberately stricter than simply reading the master average. With Escape, Wear, Watch, Move and Eat live, those throughlines now have five different domains in which to hold up or disappear.

## Module registry

The platform registry currently defines:

1. Escape — live
2. Wear — live
3. Watch — live
4. Move — live
5. Eat — live
6. Live — planned

The module hub keeps the unfinished Live module clearly marked as planned rather than presenting a placeholder as a working feature.

## Files

- `platform-core.js` — shared dimensions, module registry, five live module mappings, snapshot normalization, master aggregation, aggregate badges, cross-module badges and change summaries
- `platform.js` — local storage, generic module-result capture, Passport UI, module hub, export/reset controls
- `platform.css` — Passport and module-hub presentation
- `wear-data.js` / `wear.js` / `wear.css` — Wear model, runtime and presentation
- `watch-data.js` / `watch.js` / `watch.css` — Watch model, runtime and presentation
- `move-data.js` / `move.js` / `move.css` — Move model, runtime and presentation
- `eat-data.js` / `eat.js` / `eat.css` — Eat model, runtime and presentation
- `scripts/check-platform.js` — regression tests for five-module mapping/aggregation/history/cross-module badges
- `scripts/check-wear.js` — Wear schema/runtime/distribution regression test
- `scripts/check-watch.js` — Watch schema/runtime and exhaustive response-path regression test
- `scripts/check-move.js` — Move schema/runtime and exhaustive response-path regression test
- `scripts/check-eat.js` — Eat schema/runtime and exhaustive response-path regression test

## Next platform work

The next major platform milestones are:

1. ship Live, completing the six-domain consumer module set
2. add optional accounts/sync without making signup mandatory
3. decide how account-backed history and deletion interact with the anonymous/local model
4. eventually add module-specific persistent/share links where they create real value
5. validate master and cross-module patterns against real user feedback rather than only hand-designed logic

The Passport remains intentionally local-first so the platform concept can be tested before account complexity becomes a prerequisite.
