# Tasteprint Platform Layer

Tasteprint is moving from a single Escape experience into a multi-module preference platform. The first platform batch adds a local **Tasteprint Passport** that sits above individual modules without requiring an account.

## Routes

- `?profile=1` — open the local Tasteprint Passport
- `?modules=1` — open the module hub
- `?` — Tasteprint Escape, currently the only live consumer module

The normal Escape experience also gets a small **My Tasteprint** shortcut.

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

Escape currently maps its existing travel dimensions into this shared vocabulary. Future Wear, Watch, Move, Eat and Live modules should define their own mapping instead of pretending every domain asks identical questions.

The master profile uses only the **latest saved result from each completed module**. Each module gets one equal vote. Retaking Escape five times therefore does not give travel five times more influence than another module.

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

When a user completes Escape more than once, Passport compares the newest result with the previous Escape result and surfaces the largest movement. Small changes are described as stable rather than turned into fake precision.

This comparison is explicitly **within-person history**, not a population percentile or psychological diagnosis.

## Master labels and badges

Passport creates a lightweight master-pattern title from the strongest departures from the midpoint and can show provisional master badges such as:

- Novelty Magnet
- Aesthetic First
- Soft-Life Bias
- Curious by Default
- Freeform Instinct
- Structured Explorer

These are product-language summaries of the score vector, not scientific personality labels.

True **cross-module badges** stay gated conceptually until at least two real modules can contribute data. `platform-core.js` already supports a `crossModuleOnly` badge gate so later modules can use the same engine.

## Module registry

The platform registry currently defines:

1. Escape — live
2. Wear — planned
3. Watch — planned
4. Move — planned
5. Eat — planned
6. Live — planned

The module hub deliberately shows the future categories now so the product reads as a platform, while keeping unfinished modules clearly marked as planned rather than presenting placeholders as working features.

## Files

- `platform-core.js` — shared dimensions, module registry, mappings, snapshot normalization, master aggregation, badges and change summaries
- `platform.js` — local storage, Escape-result capture, Passport UI, module hub, export/reset controls
- `platform.css` — Passport and module-hub presentation
- `scripts/check-platform.js` — regression tests for module registry, mapping, deduplication, aggregation, history/change summaries and runtime asset wiring

## Next platform work

The next major platform milestones are:

1. ship a second real module so aggregation becomes genuinely cross-domain
2. enable cross-module badges after two or more real modules exist
3. add optional accounts/sync without making signup mandatory
4. decide how account-backed history and deletion interact with the anonymous/local model
5. continue with Wear, Watch, Move, Eat and Live

The current Passport is intentionally local-first so the platform idea can be tested before adding account complexity.
