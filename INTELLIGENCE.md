# Tasteprint Recommendation Intelligence

Tasteprint's P5 intelligence layer improves how results turn into recommendations **without pretending the system has already learned from a population it does not have yet**.

The current implementation adds five things that can be built safely before large-scale usage data exists:

1. structured recommendation satisfaction feedback
2. model-fit confidence / uncertainty
3. recommendation diversity
4. cold-start versus returning-user behavior
5. sensitive-attribute inference safeguards

Actual weight tuning from real behavior remains gated until there is a sufficiently large real feedback sample and a manual review step.

## Result-time intelligence

`intelligence.js` progressively adds an intelligence panel after a first-party quiz result in Escape, Wear, Watch, Move, Eat or Live.

The panel does not appear on:

- shared result links
- friend-challenge routes
- branded client campaigns
- Passport/module/admin/reporting pages

That keeps feedback attached to a result the current user actually generated and avoids unexpectedly changing commercial campaign surfaces.

## Fit confidence

`confidenceModel()` in `intelligence-core.js` is intentionally scoped to **confidence in Tasteprint's own fit model**.

It combines:

- separation between the closest and second-closest archetype vectors
- how directional the current score vector is versus sitting near the midpoint
- when available, consistency with that user's own previous result in the same module

The UI reports qualitative labels:

- Blended read
- Moderate read
- Clear read
- Very clear read

The internal numeric score is not shown as a population percentile and is not presented as confidence about the person. A visible note explicitly says this is model-fit confidence only, not diagnosis, personality certainty, or population evidence.

## Cold start versus returning behavior

The recommendation layer distinguishes three states:

### Cold start

No prior Passport history exists. Recommendations stay closest to the current module result and use the least diversity pressure.

### Cross-domain returning

The user has other Tasteprint modules in Passport, but no previous result in this module. The current domain still determines fit; the mode set is allowed to spread a little more so returning users do not see three nearly identical lanes.

### Module returning

The user has a previous result in the same module. The recommendation profile is approximately:

```text
82% current module result
18% immediately previous result in the same module
```

This blend affects recommendation ranking only. It does **not** rewrite the archetype, stored result, Passport score, or master Tasteprint.

Returning module users also get a slightly stronger diversity term when selecting adjacent recommendation lanes.

## Recommendation diversity

`diverseModeSet()` starts from nearest mode fit and then uses a lightweight maximal-marginal-relevance-style selection for the remaining lanes.

Each later recommendation balances:

- relevance to the user's effective module score vector
- distance from modes already selected for the recommendation set
- a penalty for drifting too far down the raw fit ranking

This creates three different jobs:

1. Best fit
2. Same energy
3. Curveball / Fresh lane

The goal is not randomness. It is to avoid three recommendations that are technically different but functionally the same.

## Structured satisfaction feedback

After a result, the user can rate the read with four fixed choices:

- Nailed it
- Mostly me
- Mixed
- Missed me

If the result was not a perfect fit, the user can optionally indicate a direction that should move, using only dimensions already present in that module. For example, a Watch user may ask for more Familiar or more Surprising; a Live user may ask for more Quiet or more Stimulating.

There is deliberately **no free-text feedback box** in the learning surface.

The user can also mark which of the three recommendation lanes they would actually be most interested in trying.

Local structured feedback is stored under:

```text
tasteprint.intelligence-feedback.v1
```

The local store is capped at 100 result records.

When anonymous remote analytics are active, the same structured record can be sent as anonymous product events. Raw quiz answers, account email, campaign lead data and free-form text are not part of this record.

## Learning record allowlist

`buildLearningRecord()` constructs learning records from a fixed allowlist:

- intelligence version
- result key
- module
- event stage
- 1–4 rating
- fixed archetype label
- fixed mode label
- qualitative confidence label
- cold-start/returning state
- optional module dimension + higher/lower adjustment
- selected recommendation ID
- recommendation IDs shown
- completed module score vector restricted to that module's ten known dimensions

Arbitrary input keys are ignored.

## Sensitive-attribute safeguards

Recommendation intelligence does not ask for or use demographic/protected/sensitive attributes as recommendation features.

The policy explicitly rejects the idea that ranking should depend on fields such as:

- age
- race or ethnicity
- religion
- sex, gender, sexuality or orientation
- disability or medical/health state
- pregnancy
- income
- politics
- precise location / postal identifiers
- biometrics
- contacts

The current six modules are preference systems. Their intelligence layer consumes only the module's already-defined preference scores plus the user's own prior Tasteprint history and structured satisfaction feedback.

There is no demographic enrichment, contact-list enrichment, precise geolocation, or inferred protected-class feature pipeline.

## Feedback aggregation and weight-review gate

`supabase/intelligence.sql` adds a trusted service-role aggregate function:

```text
tasteprint_intelligence_summary(module)
```

It summarizes only structured feedback metrics such as:

- sample size
- average rating
- rating distribution
- mismatch directions
- confidence-label distribution
- cold-start/returning distribution
- per-archetype average rating
- per-mode average rating

It does not expose raw event rows to public/anonymous/authenticated clients.

The summary reports `learning_ready: true` only after at least **50 distinct result feedback records** in the requested scope. This threshold is a minimum review gate, not proof that 50 responses are statistically sufficient for every model change.

`learningReview()` in the client-side pure core follows the same principle for local/test data.

## No automatic self-modifying weights

Tasteprint does not automatically rewrite quiz weights because a few users click “Missed me.”

Even after the feedback minimum is reached, aggregated pressure is treated as a **review signal**. A real weight change should be:

1. based on real-user evidence
2. inspected for selection bias and broken segments
3. versioned explicitly
4. simulated against the full valid response space
5. checked for collapsed archetypes/modes
6. manually approved
7. measured after release

This is why the roadmap item **Tune weights from real behavior** remains open even though the feedback and learning infrastructure now exists.

## Privacy controls

The local intelligence-feedback store is included in Tasteprint's local data export and cleared by the anonymous browser reset. Account-backed Passport deletion remains separate because recommendation feedback belongs to the anonymous product-data path, not the optional Auth identity path.

## Regression coverage

`scripts/check-intelligence.js` verifies:

- all six modules expose a compatible 10D intelligence model
- confidence output reacts to fit separation and retake stability
- cold-start / cross-domain / same-module returning behavior
- diverse recommendation sets contain unique lanes
- learning records drop arbitrary sensitive fields
- the feedback minimum gate
- no automatic weight application
- intelligence events are present in the analytics contract
- the public runtime loads the intelligence assets
- the trusted Supabase aggregate stays service-role-only

## Still requires reality

The code can collect and summarize learning signals now, but Tasteprint should not claim learned weights until real people use it. The remaining P5 weight-tuning work requires actual behavioral feedback, enough sample coverage across modules/results, and a measured versioned calibration pass.
