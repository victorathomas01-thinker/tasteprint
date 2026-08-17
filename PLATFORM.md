# Tasteprint Platform Layer

Tasteprint is now a six-domain preference platform rather than a single Escape experience. The local **Tasteprint Passport** sits above individual modules without requiring an account and can combine travel, personal style, entertainment taste, training preferences, dining taste and everyday-environment preferences.

## Routes

- `?profile=1` — open the local Tasteprint Passport
- `?modules=1` — open the module hub
- `?` — Tasteprint Escape
- `?module=wear` — Tasteprint Wear
- `?module=watch` — Tasteprint Watch
- `?module=move` — Tasteprint Move
- `?module=eat` — Tasteprint Eat
- `?module=live` — Tasteprint Live

All six consumer modules expose the same **My Tasteprint** Passport shortcut.

## Shared master model

Individual modules use domain-specific score names. Before a module contributes to the master Tasteprint, its completed score vector is mapped into ten shared dimensions:

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

Escape maps travel-specific romance, activity, culture and related scores into this vocabulary. Wear uses experimentation, coordination, visibility, styling, ease, edge, calm, nostalgia, detail and impulse. Watch uses surprise, coherence, ensemble, visuality, accessibility, momentum, gentleness, emotion, complexity and discovery. Move uses variety, structure, social energy, movement craft, recovery, intensity, calm, training identity, learning and flexibility. Eat uses adventure, ritual, sharing, presentation, comfort, flavor intensity, ease, nostalgia, curiosity and spontaneity. Live uses discovery, routine, community, space aesthetics, comfort, everyday pace, quiet, rootedness, access and flexibility.

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

It includes 8 forced-choice dining decisions, 10 hidden food-preference dimensions, 12 archetypes, 8 dining modes, badges, continuums, contradiction insight, dining-fit signals, decision fingerprints, curveball/inverse modes, Story sharing, analytics and Passport capture. It explicitly notes that preference output does not account for allergies, dietary restrictions, nutrition needs or medical considerations.

The Eat regression test exhaustively evaluates all **65,536 possible response paths**. Its archetype and mode centroids are calibrated against the valid response space so every result remains reachable and no single outcome dominates. That is an engineering guardrail, not a real-user population claim.

## Tasteprint Live

Live is built around **the jobs an everyday environment needs to do**, rather than reducing housing preference to city versus suburbs.

It includes:

- 8 forced-choice home-and-neighborhood decisions
- 10 hidden environment dimensions: discovery, routine, community, space aesthetics, comfort, pace, quiet, rootedness, access and flexibility
- 12 Live archetypes
- 8 living modes
- dynamic Live badges
- visible environment continuums
- contradiction/nuance insight
- strongest-pull explanation
- three environment-fit signals rather than a relocation recommendation
- decision fingerprint
- curveball and inverse living modes
- Story-card generation through the existing share engine
- automatic Passport capture
- module-aware analytics events
- an explicit boundary that Live does not evaluate housing cost, safety, accessibility needs, legal constraints, commute feasibility or whether a specific move is right for someone

The Live regression test exhaustively evaluates all **65,536 possible response paths**. Archetype and mode centroids are calibrated against the valid response space to keep all results reachable and avoid a single dominant outcome. As with the other module tests, these are engineering checks rather than population claims.

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

Passport can also unlock a separate class of **cross-module badges** only when the same preference is present in at least two different domains. Current examples include Aesthetic Throughline, Novelty Everywhere, Comfort Loyalist, Freeform Across Contexts, Sentimental Thread, Low-Noise Throughline, Structured Curiosity and High-Energy Throughline.

This is deliberately stricter than simply reading the master average. With all six domains live, those throughlines now have the complete original product set in which to hold up or disappear.

## Module registry

The platform registry now defines six live modules:

1. Escape — live
2. Wear — live
3. Watch — live
4. Move — live
5. Eat — live
6. Live — live

The six-domain consumer lineup originally planned for P4 is therefore complete. The remaining P4 platform work is optional account-backed cross-device Passport sync.

## Files

- `platform-core.js` — shared dimensions, six-module registry/mappings, snapshot normalization, master aggregation, aggregate badges, cross-module badges and change summaries
- `platform.js` — local storage, generic module-result capture, Passport UI, module hub, export/reset controls
- `platform.css` — Passport and module-hub presentation
- `wear-data.js` / `wear.js` / `wear.css` — Wear model, runtime and presentation
- `watch-data.js` / `watch.js` / `watch.css` — Watch model, runtime and presentation
- `move-data.js` / `move.js` / `move.css` — Move model, runtime and presentation
- `eat-data.js` / `eat.js` / `eat.css` — Eat model, runtime and presentation
- `live-data.js` / `live.js` / `live.css` — Live model, runtime and presentation
- `scripts/check-platform.js` — regression tests for six-module mapping/aggregation/history/cross-module badges
- `scripts/check-wear.js` — Wear schema/runtime/distribution regression test
- `scripts/check-watch.js` — Watch schema/runtime and exhaustive response-path regression test
- `scripts/check-move.js` — Move schema/runtime and exhaustive response-path regression test
- `scripts/check-eat.js` — Eat schema/runtime and exhaustive response-path regression test
- `scripts/check-live.js` — Live schema/runtime and exhaustive response-path regression test

## Next platform work

The next major platform milestones are:

1. add optional accounts/sync without making signup mandatory
2. decide how account-backed history and deletion interact with the anonymous/local model
3. eventually add module-specific persistent/share links where they create real value
4. validate master and cross-module patterns against real user feedback rather than only hand-designed logic
5. begin recommendation-intelligence work only where real usage data can support it

The Passport remains intentionally local-first so the platform can be tested before account complexity becomes a prerequisite.
