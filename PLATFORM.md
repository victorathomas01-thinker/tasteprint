# Tasteprint Platform Layer

Tasteprint is now a six-domain preference platform rather than a single Escape experience. The **Tasteprint Passport** sits above individual modules, works locally without an account, and can combine travel, personal style, entertainment taste, training preferences, dining taste and everyday-environment preferences.

## Routes

- `?profile=1` — open the Tasteprint Passport and optional account-sync controls
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

It includes 8 forced-choice home-and-neighborhood decisions, 10 hidden environment dimensions, 12 archetypes, 8 living modes, badges, continuums, contradiction insight, environment-fit signals, decision fingerprints, curveball/inverse modes, Story sharing, analytics and Passport capture. It explicitly does not evaluate housing cost, safety, accessibility needs, legal constraints, commute feasibility or whether a specific move is right for someone.

The Live regression test exhaustively evaluates all **65,536 possible response paths**. Archetype and mode centroids are calibrated against the valid response space to keep all results reachable and avoid a single dominant outcome. As with the other module tests, these are engineering checks rather than population claims.

## Local Passport storage

`platform.js` stores recent module snapshots under:

```text
tasteprint.platform-history.v1
```

A snapshot contains the module ID, timestamp, module score vector, mapped master score vector, result labels, a non-identifying source label and a duplicate-suppression signature. It does **not** store raw quiz answer selections.

The current history cap is 60 snapshots. Passport can be exported as JSON or cleared independently when it is unsynced.

## Optional account + cross-device sync

The local Passport remains the default. `account-sync.js` adds an optional Supabase Auth layer only when the production backend is configured.

The account flow is passwordless:

1. the user enters an email from `?profile=1`
2. Supabase sends a one-time magic link
3. the link returns to the Passport
4. local and remote histories merge in both directions
5. new module results sync automatically while signed in

Signing out does not erase the local Passport.

`account-core.js` owns deterministic merge logic. A snapshot with a signature uses module ID + signature as its stable sync key; legacy/fallback entries use module ID + timestamp + result labels. The merge is a union rather than “cloud wins” or “device wins,” then the same 60-entry history bound is applied.

`supabase/passport-sync.sql` creates `tasteprint_passport_snapshots`. It stores the Auth user ID plus sanitized Passport snapshot fields, but it does not duplicate the user's email, anonymous install ID/deletion hash, campaign lead data, or raw answer selections. RLS allows authenticated users to read/write only rows where `auth.uid() = user_id`.

The optional account path has a separate deletion model. `supabase/functions/delete-account/index.ts` validates the signed-in bearer session and uses the Supabase service role only server-side to delete that Auth user. The Passport table references `auth.users` with `ON DELETE CASCADE`, so synced snapshots are removed with the account.

Anonymous browser deletion remains separate. Resetting anonymous analytics identifiers does not silently delete a Passport the user explicitly chose to sync, and deleting the optional account does not claim to delete anonymous rows that deliberately contain no account identity.

See `ACCOUNT_SYNC.md` for the full sync, merge, privacy and activation model.

## Preference history

When a user completes a module more than once, Passport compares the newest result with the previous result from that same module and surfaces the largest movement. Small changes are described as stable rather than turned into fake precision.

The Passport's “What changed?” card follows the most recently completed module, so module retakes are compared within their own domain.

This comparison is explicitly **within-person history**, not a population percentile or psychological diagnosis.

## Master labels and cross-module badges

Passport creates a lightweight master-pattern title from the strongest departures from the midpoint and can show provisional aggregate badges such as Novelty Magnet, Aesthetic First, Soft-Life Bias, Curious by Default, Freeform Instinct and Structured Explorer.

Passport can also unlock a separate class of **cross-module badges** only when the same preference is present in at least two different domains. Current examples include Aesthetic Throughline, Novelty Everywhere, Comfort Loyalist, Freeform Across Contexts, Sentimental Thread, Low-Noise Throughline, Structured Curiosity and High-Energy Throughline.

This is deliberately stricter than simply reading the master average. With all six domains live, those throughlines now have the complete original product set in which to hold up or disappear.

## Module registry

The platform registry defines six live modules:

1. Escape — live
2. Wear — live
3. Watch — live
4. Move — live
5. Eat — live
6. Live — live

The original P4 consumer platform and optional account-sync implementation are code-complete. Production account activation still requires the real Supabase project, Auth redirect configuration, SQL migration and account-deletion Edge Function deployment.

## Files

- `platform-core.js` — shared dimensions, six-module registry/mappings, snapshot normalization, master aggregation, aggregate badges, cross-module badges and change summaries
- `platform.js` — local storage, generic module-result capture, Passport UI, module hub, export/reset controls and merge-safe replace hook
- `platform.css` — Passport and module-hub presentation
- `account-core.js` — pure local/remote history merge and remote-row transforms
- `account-sync.js` / `account.css` — passwordless account UI, Supabase session handling, cross-device sync and account controls
- `supabase/passport-sync.sql` — account-backed Passport table, RLS policies and per-user history pruning
- `supabase/functions/delete-account/index.ts` — authenticated account deletion boundary
- `wear-data.js` / `wear.js` / `wear.css` — Wear model, runtime and presentation
- `watch-data.js` / `watch.js` / `watch.css` — Watch model, runtime and presentation
- `move-data.js` / `move.js` / `move.css` — Move model, runtime and presentation
- `eat-data.js` / `eat.js` / `eat.css` — Eat model, runtime and presentation
- `live-data.js` / `live.js` / `live.css` — Live model, runtime and presentation
- `scripts/check-platform.js` — regression tests for six-module mapping/aggregation/history/cross-module badges
- `scripts/check-account.js` — merge/RLS/Auth/privacy-boundary regression checks
- module-specific regression scripts — distribution and runtime checks for Wear, Watch, Move, Eat and Live

## Next platform work

The main platform implementation is now complete enough that the next work shifts away from adding core domains. Remaining work is to:

1. activate and QA account sync against the real Supabase project
2. validate magic-link callbacks on physical mobile browsers/email clients
3. eventually add module-specific persistent/share links where they create real value
4. validate master and cross-module patterns against real user feedback rather than only hand-designed logic
5. build recommendation-intelligence systems that can learn safely once real usage data exists

The local Passport remains intentionally first-class even after account sync, so the product never needs an account wall to function.
