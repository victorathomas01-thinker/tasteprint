# Tasteprint Data MVP

The repository now contains the complete first data-layer scaffold. Tasteprint still works as a static GitHub Pages app when no backend is configured.

## What the data layer collects

The browser instrumentation intentionally avoids names, emails, account IDs, and raw answer choices.

A completed profile may store:

- anonymous profile UUID
- anonymous browser install UUID
- anonymous session UUID
- 10-dimensional Tasteprint score vector
- resulting archetype
- travel mode
- optional referral token
- completion timestamp

The event stream stores product/funnel events such as quiz starts, completions, result views, Story sharing, challenge creation, challenge receipt, challenge completion, and remote match unlocks.

## Activate Supabase

1. Create a Supabase project.
2. Open the SQL editor and run `supabase/schema.sql`.
3. In Supabase project settings, copy the Project URL and public anon key.
4. In the GitHub repository, open **Settings → Secrets and variables → Actions**.
5. Add repository variable `VITE_SUPABASE_URL` with the Supabase Project URL.
6. Add repository secret `VITE_SUPABASE_ANON_KEY` with the public anon key.
7. Re-run the GitHub Pages workflow, or push another commit to `main`.

The anon key is designed to be used by public browser applications. Security comes from row-level security policies, not from pretending the public key is private. The workflow stores it as a GitHub secret simply to keep configuration tidy.

## Verify it

Open the deployed app and run this in the browser console:

```js
TasteprintAnalytics.remoteEnabled()
```

It should return `true` after the environment values are included in the production build.

To inspect the aggregate dashboard, open the deployed site with:

```text
?stats=1
```

The dashboard calls only the aggregate `tasteprint_public_stats()` RPC. It never reads raw profile rows.

## Percentiles

`tasteprint_percentiles(scores)` exists in the SQL schema, but returns unavailable until at least 50 completed profiles exist. That prevents Tasteprint from presenting fake population precision during the earliest testing phase.

The minimum sample constant is also checked by the repository test suite so the frontend contract and SQL threshold cannot silently drift apart.

## Referral attribution

Every outbound friend challenge receives a short random `ref` token. A recipient carries that token through the challenge flow, allowing the event stream to connect:

- challenge created
- challenge opened
- challenge completed
- remote comparison unlocked

The token is not a name or account identifier.

## Local fallback

Without Supabase, event instrumentation writes a rolling buffer of the most recent 200 events to local storage. This is useful for development and keeps analytics failures from breaking the product.

Useful console helpers:

```js
TasteprintAnalytics.localEvents()
TasteprintAnalytics.clearLocalData()
TasteprintAnalytics.sessionId()
TasteprintAnalytics.installId()
```

## Remaining privacy work before a larger public launch

- add an in-product privacy/data-controls screen
- implement server-side deletion for database-backed anonymous profiles
- decide and document data-retention periods
- add rate limiting / abuse protection if traffic becomes meaningful
- review the production schema before collecting data at scale
