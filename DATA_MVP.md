# Tasteprint Data MVP

The repository contains a production-oriented data-layer scaffold. Tasteprint still works as a static GitHub Pages app when no backend is configured.

The architecture now has three deliberately separated paths:

1. **Anonymous product data** — analytics, Escape share profiles, referral events and structured recommendation feedback.
2. **Optional account-backed Passport sync** — Supabase Auth plus per-user Passport snapshots.
3. **Explicit-consent campaign contacts** — restricted lead storage used only by branded campaigns that enable it.

Keeping these paths separate prevents an optional email login or campaign lead from silently becoming the identity key for anonymous product analytics.

## Anonymous product data

The browser instrumentation intentionally avoids names, emails, account IDs, precise location history, contacts, raw answer choices and free-text learning feedback.

A completed Escape share profile may store:

- anonymous profile UUID
- anonymous browser install UUID
- anonymous session UUID
- SHA-256 owner hash used only for browser-authorized deletion
- optional 10-character share code
- 10-dimensional Tasteprint score vector
- resulting archetype
- travel mode
- optional referral token
- completion timestamp

The event stream stores product/funnel events such as quiz starts, completions, result views, Story sharing, challenge creation/share outcomes/receipt/completion, remote match unlocks, campaign events and structured recommendation-intelligence events.

Recommendation feedback is constrained to fixed fields such as a 1–4 result rating, an existing module dimension plus higher/lower direction, qualitative model-fit confidence, cold-start/returning state and a selected recommendation ID. It does not accept arbitrary free text or demographic/protected-attribute recommendation features. See `INTELLIGENCE.md`.

Referral events use a short creator-session token rather than a person identifier. Aggregate reporting can connect challenge creation to downstream opens/completions without exposing the token itself. See `REFERRALS.md`.

## In-product privacy controls

The persistent **Privacy & data** control explains whether the current build is local-only or connected to remote analytics, shows the anonymous raw-data retention target and exposes the distinction between anonymous product data, optional account sync and campaign contact data.

It can:

- export the local analytics fallback, structured recommendation feedback and current browser Passport copy as JSON
- clear local analytics event history without destroying the browser deletion credential
- delete/reset anonymous data tied to the current browser identity
- link to optional Passport account management
- delete an optional account + synced Passport separately when account sync is active

The panel can be opened directly with:

```text
?privacy=1
```

## Browser-authorized anonymous deletion

Each browser receives two unrelated random values:

1. an anonymous install UUID
2. a private deletion token

Only the SHA-256 hash of the deletion token is attached to anonymous database rows. The raw token stays in local storage until the user explicitly requests anonymous browser-data deletion.

The deletion RPC requires both the install UUID and raw deletion token. The server hashes the submitted token and only deletes rows where both values match.

The anonymous reset also clears local structured recommendation feedback. If the user is signed into optional Passport sync, that account-backed Passport is intentionally kept; account deletion is a separate action.

Deletion is browser-specific. Another device/browser has its own independent anonymous identity and credential.

## Anonymous raw-data retention

The current production target is **180 days maximum** for raw anonymous profile and event rows.

`supabase/schema.sql` includes:

```sql
tasteprint_prune_old_data()
```

It deletes raw rows older than 180 days and is deliberately unavailable to public browser roles. Once Supabase is connected, schedule it from a trusted Supabase cron/operator context.

Aggregate counts may outlive individual rows because the aggregate outputs do not expose browser/session identifiers.

## Short Escape result IDs

`tasteprint_create_profile(...)` creates a completed Escape profile and assigns an unguessable 10-character hexadecimal `short_code`.

`tasteprint_shared_profile(short_code)` exposes only the fields needed to render a deliberately shared result:

- short code
- creation timestamp
- archetype
- travel mode
- score vector

It does **not** expose install IDs, session IDs, owner hashes, referral tokens or analytics events.

`short-links.js` already progressively prefers `?p=` result and `?c=` challenge links when Supabase is configured. The stateless encoded-vector link format remains as a backward-compatible/backend-free fallback.

## Optional account-backed Passport

`supabase/passport-sync.sql` creates `tasteprint_passport_snapshots` with authenticated RLS. Rows are scoped to `auth.uid()` and contain sanitized Passport snapshots, not raw answers or the user's Auth email.

`account-sync.js` uses passwordless Supabase Auth magic links and performs bidirectional local/cloud union. Signing out keeps the browser-local copy.

`supabase/functions/delete-account/index.ts` performs authenticated account deletion server-side using the service role. The Passport table cascades from `auth.users`.

See `ACCOUNT_SYNC.md` for merge and deletion rules.

## Structured recommendation intelligence

`intelligence.js` stores up to 100 local structured result-feedback records under:

```text
tasteprint.intelligence-feedback.v1
```

When remote anonymous analytics are enabled, the same allowlisted signals can be emitted as anonymous events.

`supabase/intelligence.sql` adds the trusted service-role-only aggregate:

```sql
tasteprint_intelligence_summary(module)
```

It summarizes ratings, mismatch directions, confidence labels, cold-start/returning states and per-result-type satisfaction without exposing raw events. It reports a 50-feedback minimum review gate and explicitly disables automatic weight updates.

The 50-record gate means “enough to start reviewing,” not “statistically sufficient for every model change.” Real scoring changes still require versioned analysis and calibration.

## Referral attribution

Every outbound Escape friend challenge receives a short random creator-session `ref` token. A recipient carries it through the challenge flow, allowing the event stream to connect:

```text
challenge creation
→ native share / copy / fallback / cancellation outcome
→ recipient open
→ recipient completion
→ remote comparison unlock
→ optional same-session downstream reshare
```

`supabase/referrals.sql` adds:

```sql
tasteprint_referral_stats()
```

The function returns only aggregate loop metrics. It never returns referral tokens, install IDs, session IDs, owner hashes, raw event rows or sender/recipient pair records.

The public dashboard lives at:

```text
?growth=1
```

Without Supabase, that page can report current-browser challenge/share telemetry but intentionally marks cross-device downstream metrics as backend-required.

Referral rates are sample-gated. Creator-token rates require at least 20 distinct creator-session tokens. Recipient completion requires at least 20 attributed recipient opens. Same-session resharing requires at least 20 attributed recipient sessions.

These thresholds are minimum product-review gates, not universal statistical-significance claims.

## Activate Supabase

For the complete current backend:

1. Create a Supabase project.
2. Run `supabase/schema.sql`.
3. Run `supabase/referrals.sql` for cross-device referral attribution.
4. Run `supabase/campaigns.sql` if campaign reporting is needed.
5. Run `supabase/campaign-registry.sql` if database-published campaigns are needed.
6. Run `supabase/leads.sql` if real consent lead capture is needed.
7. Run `supabase/passport-sync.sql` for optional account sync.
8. Run `supabase/intelligence.sql` for trusted feedback aggregation.
9. Deploy the needed Edge Functions: `publish-campaign`, `capture-lead`, and `delete-account`.
10. Add the GitHub Pages callback URL to the Supabase Auth redirect allowlist.
11. Set repository variable `VITE_SUPABASE_URL` to the project URL.
12. Set repository secret `VITE_SUPABASE_ANON_KEY` to the public anon/publishable key.
13. Set a high-entropy server-only `TASTEPRINT_PUBLISH_TOKEN` if campaign publishing is used.
14. Re-run the GitHub Pages workflow or push another commit.
15. Schedule `tasteprint_prune_old_data()` from a trusted cron/operator context.

The public browser key is expected to be public. Security comes from RLS, narrow RPCs and server-side service-role boundaries. The service-role key and publish token must never be exposed as Vite variables.

## Verify it

After production environment values are present:

```js
TasteprintAnalytics.remoteEnabled()
```

should return `true`.

Useful local/privacy helpers include:

```js
TasteprintAnalytics.localEvents()
TasteprintAnalytics.clearLocalEvents()
TasteprintAnalytics.deleteMyData()
TasteprintAnalytics.resolveSharedProfile('0123abcdef')
TasteprintAnalytics.sessionId()
TasteprintAnalytics.installId()
TasteprintIntelligence.localFeedback()
TasteprintIntelligence.summary()
TasteprintIntelligence.learningReview()
```

For optional account sync, use the controls in:

```text
?profile=1
```

For public aggregate anonymous analytics:

```text
?stats=1
```

For referral-loop attribution:

```text
?growth=1
```

The dashboards call aggregate RPCs only and never read raw profile/event rows.

## Percentiles

`tasteprint_percentiles(scores)` returns unavailable until at least 50 completed Escape profiles exist. That prevents Tasteprint from presenting fake population precision during early testing.

This is distinct from the 50-feedback intelligence review gate and the 20-sample referral-rate gates. Each threshold protects a different type of claim.

## Local fallback

Without Supabase, analytics writes a rolling buffer of at most 200 events to local storage, Passport remains local-first, recommendation feedback remains local-first, and the referral dashboard limits itself to current-browser share telemetry. Backend failures do not block the consumer experience.

## Remaining production work

- create/connect the actual Supabase project
- configure the GitHub Actions project URL/public key
- run all migrations and deploy the Edge Functions against that project
- configure Auth redirect URLs and test passwordless callbacks
- schedule the trusted 180-day pruning job
- QA anonymous deletion, short IDs, aggregate RPCs, referral attribution, campaign paths, account sync and trusted intelligence aggregates against the real backend
- add production abuse/rate-limit controls if traffic becomes meaningful
- review the production schema and privacy terms before collecting data at scale
