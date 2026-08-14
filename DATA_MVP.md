# Tasteprint Data MVP

The repository contains the first production-oriented data-layer scaffold. Tasteprint still works as a static GitHub Pages app when no backend is configured.

## What the data layer collects

The browser instrumentation intentionally avoids names, emails, account IDs, precise location history, contacts, and raw answer choices.

A completed profile may store:

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

The event stream stores product/funnel events such as quiz starts, completions, result views, Story sharing, challenge creation, challenge receipt, challenge completion, and remote match unlocks.

## In-product privacy controls

The app now includes a persistent **Privacy & data** control. It explains whether the current build is local-only or connected to remote analytics, shows the raw-data retention target, lists what is and is not collected, and allows the user to:

- export the local analytics fallback as JSON
- clear local analytics history without destroying the deletion credential
- delete/reset data tied to the current anonymous browser identity

The same panel can be opened directly with:

```text
?privacy=1
```

## Browser-authorized deletion

Each browser receives two unrelated random values:

1. an anonymous install UUID
2. a private deletion token

Only the SHA-256 hash of the deletion token is attached to database rows. The raw token stays in local storage until the user explicitly presses **Delete my Tasteprint data**.

The deletion RPC requires both the install UUID and the raw deletion token. The server hashes the submitted token and only deletes rows where both values match. This prevents someone who learns an install UUID from deleting another browser's data.

After a successful deletion, the local browser IDs and deletion token are cleared and the page reloads with a fresh anonymous identity.

Deletion is browser-specific. Another device/browser has its own independent anonymous identity and credential.

## Raw-data retention

The current production target is **180 days maximum** for raw anonymous profile and event rows.

`supabase/schema.sql` includes the trusted maintenance function:

```sql
tasteprint_prune_old_data()
```

It deletes raw rows older than 180 days. The function is deliberately not executable by anonymous or authenticated public clients. Once Supabase is connected, schedule it from a trusted Supabase cron/operator context.

Aggregate counts may outlive individual rows because the public aggregate output does not expose browser/session identifiers.

## Short result IDs

The schema now includes the backend half of short result links.

`tasteprint_create_profile(...)` creates a completed profile and assigns an unguessable 10-character hexadecimal `short_code`.

`tasteprint_shared_profile(short_code)` exposes only the fields needed to render a deliberately shared Tasteprint result:

- short code
- creation timestamp
- archetype
- travel mode
- score vector

It does **not** expose install IDs, session IDs, owner hashes, referral tokens, or analytics events.

The frontend data API already exposes `TasteprintAnalytics.resolveSharedProfile(code)`. The current public links continue using the stateless encoded-vector format until the real Supabase project is connected; after that, the UI can progressively prefer shorter database-backed URLs without breaking old links.

## Activate Supabase

1. Create a Supabase project.
2. Open the SQL editor and run `supabase/schema.sql`.
3. In Supabase project settings, copy the Project URL and public anon key.
4. In the GitHub repository, open **Settings → Secrets and variables → Actions**.
5. Add repository variable `VITE_SUPABASE_URL` with the Supabase Project URL.
6. Add repository secret `VITE_SUPABASE_ANON_KEY` with the public anon key.
7. Re-run the GitHub Pages workflow, or push another commit to `main`.
8. From a trusted Supabase cron/operator context, schedule `tasteprint_prune_old_data()` to run regularly.

The anon key is designed to be used by public browser applications. Security comes from row-level security and narrow security-definer RPCs, not from pretending the public key is private. The workflow stores it as a GitHub secret simply to keep configuration tidy.

## Verify it

Open the deployed app and run this in the browser console:

```js
TasteprintAnalytics.remoteEnabled()
```

It should return `true` after the environment values are included in the production build.

Useful data/privacy helpers:

```js
TasteprintAnalytics.localEvents()
TasteprintAnalytics.clearLocalEvents()
TasteprintAnalytics.deleteMyData()
TasteprintAnalytics.resolveSharedProfile('0123abcdef')
TasteprintAnalytics.sessionId()
TasteprintAnalytics.installId()
```

To inspect the aggregate dashboard, open the deployed site with:

```text
?stats=1
```

The dashboard calls only the aggregate `tasteprint_public_stats()` RPC. It never reads raw profile rows.

## Percentiles

`tasteprint_percentiles(scores)` exists in the SQL schema, but returns unavailable until at least 50 completed profiles exist. That prevents Tasteprint from presenting fake population precision during the earliest testing phase.

The minimum sample constant is checked by the repository test suite so the frontend contract and SQL threshold cannot silently drift apart.

## Referral attribution

Every outbound friend challenge receives a short random `ref` token. A recipient carries that token through the challenge flow, allowing the event stream to connect:

- challenge created
- challenge opened
- challenge completed
- remote comparison unlocked

The token is not a name or account identifier.

## Local fallback

Without Supabase, event instrumentation writes a rolling buffer of the most recent 200 events to local storage. This is useful for development and keeps analytics failures from breaking the product.

The privacy panel can export or clear that buffer. Clearing local activity alone intentionally preserves the deletion token so the user does not lose the ability to delete remote rows later.

## Remaining work before a larger public launch

- create/connect the actual production Supabase project
- configure the two GitHub Actions environment values
- schedule the trusted 180-day pruning function
- wire the new short codes into the public result/challenge URL UI
- QA deletion against the real Supabase project
- add abuse/rate-limit protection if traffic becomes meaningful
- review the production schema before collecting data at scale
