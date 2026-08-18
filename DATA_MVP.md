# Tasteprint Data MVP

The repository contains a production-oriented data-layer scaffold. Tasteprint still works as a static GitHub Pages app when no backend is configured.

The architecture has four deliberately separated remote data zones plus one local-only decision surface:

1. **Anonymous consumer product data** — analytics, Escape share profiles, referral events and structured recommendation feedback.
2. **Optional account-backed Passport sync** — Supabase Auth plus per-user Passport snapshots.
3. **Authenticated Campaign Workspace administration** — tenant membership/roles and hosted campaign manifests.
4. **Explicit-consent campaign contacts** — restricted lead storage used only by campaigns that enable it.
5. **Local Next Moves** — a browser-only record of recommendation lanes the user deliberately marked as worth trying.

Keeping these paths separate prevents an optional email login, team account or campaign lead from silently becoming the identity key for anonymous consumer analytics.

## Anonymous consumer product data

The browser instrumentation intentionally avoids names, emails, account IDs, precise location history, contacts, raw answer choices and free-text learning feedback.

A completed Escape share profile may store an anonymous profile/browser/session ID, SHA-256 owner hash for deletion, optional short share code, 10-dimensional score vector, archetype, travel mode, referral token and completion timestamp.

The event stream stores product/funnel events such as quiz starts/completions, result views, Story sharing, challenge/referral events, campaign events and structured recommendation-intelligence events.

Recommendation feedback is constrained to fixed fields such as a 1–4 result rating, an existing module dimension plus higher/lower direction, qualitative model-fit confidence, cold-start/returning state and selected recommendation ID. It does not accept arbitrary free text or demographic/protected-attribute recommendation features.

Referral events use a short creator-session token rather than a person identifier. Aggregate reporting can connect challenge creation to downstream opens/completions without exposing the token itself.

See `INTELLIGENCE.md` and `REFERRALS.md`.

## In-product privacy controls

The persistent **Privacy & data** control explains whether the current build is local-only or connected to remote analytics and exposes the distinction between anonymous product data, optional account sync and campaign contact data.

It can export local analytics/structured feedback/current Passport data, clear local analytics, perform browser-authorized anonymous deletion, manage/delete the optional Passport account separately, and expose independent Next Moves export/clear controls through `privacy-extensions.js`.

Open directly with:

```text
?privacy=1
```

## Browser-authorized anonymous deletion

Each browser receives an anonymous install UUID and unrelated private deletion token. Only the SHA-256 hash of the deletion token is attached to anonymous database rows.

The deletion RPC requires both install UUID and raw deletion token. The server hashes the submitted token and only deletes matching rows.

Anonymous reset and optional account deletion remain separate because the anonymous data path deliberately does not use account identity.

## Anonymous raw-data retention

The production target is **180 days maximum** for raw anonymous profile and event rows.

`supabase/schema.sql` includes:

```sql
tasteprint_prune_old_data()
```

The trusted function is unavailable to public browser roles. Aggregate counts may outlive individual raw rows.

## Short Escape result IDs

`tasteprint_create_profile(...)` creates a completed Escape profile and assigns an unguessable 10-character hexadecimal `short_code`.

`tasteprint_shared_profile(short_code)` exposes only the fields needed to render a deliberately shared result. It does not expose install/session IDs, owner hashes, referral tokens or analytics events.

`short-links.js` progressively prefers `?p=` result and `?c=` challenge links when Supabase is configured; stateless encoded-vector links remain the backend-free fallback.

## Optional account-backed Passport

`supabase/passport-sync.sql` creates `tasteprint_passport_snapshots` with authenticated RLS. Rows are scoped to `auth.uid()` and contain sanitized Passport snapshots, not raw answers or the user's Auth email.

`account-sync.js` uses passwordless Supabase Auth magic links and performs bidirectional local/cloud union. Signing out keeps the browser-local copy.

`supabase/functions/delete-account/index.ts` performs authenticated account deletion server-side using an elevated backend credential. The Passport table cascades from `auth.users`.

See `ACCOUNT_SYNC.md`.

## Campaign Workspace administration

`supabase/workspaces.sql` adds authenticated tenant administration without making customer data broadly visible to team users.

It creates:

- `tasteprint_workspaces`
- `tasteprint_workspace_members`
- `tasteprint_workspace_invites`
- `tasteprint_workspace_campaigns`

Workspace membership/invite tables intentionally contain no email/name columns. Invitations use high-entropy one-time tokens; only SHA-256 token hashes are stored. Browser member lists use short hashed `member_ref` values rather than Auth user UUIDs.

Hosted campaign rows are tenant-scoped by RLS. Editors can create/update hosted drafts. Owner/Admin roles can publish, but that permission is checked again in the Edge Function before an elevated backend key is used.

The Workspace browser UI has no raw anonymous-consumer-data or raw-lead-contact browser.

See `WORKSPACES.md` and `PRIVACY_MODEL.md`.

## Authenticated campaign publishing

The active publishing path no longer accepts a shared operator secret typed into the browser.

`campaign-remote.js` sends a signed-in user's Auth JWT plus the selected workspace ID. `publish-campaign` verifies the user, checks Owner/Admin membership and checks campaign ownership server-side before writing.

The function also rejects sensitive identity/contact targeting fields, unsafe script/`javascript:` content and invalid catalog links. It uses an explicit origin allowlist rather than wildcard CORS.

Backend secret/service-role keys remain Edge-Function-only and are never valid `VITE_*` configuration.

## Structured recommendation intelligence

`intelligence.js` stores up to 100 local structured result-feedback records under:

```text
tasteprint.intelligence-feedback.v1
```

When remote anonymous analytics are enabled, the same allowlisted signals can be emitted as anonymous events.

`supabase/intelligence.sql` provides a trusted aggregate review function with a 50-feedback minimum review gate and explicit no-auto-weight-update behavior.

The 50-record gate means “enough to start reviewing,” not “statistically sufficient for every model change.”

## Next Moves

`next-moves.js` stores up to 30 local decision records under:

```text
tasteprint.next-moves.v1
```

A record contains only the module, result key, selected recommendation ID/name/icon/copy, state and timestamps. It has no free-text diary, account email, raw answers, contacts, precise location history or demographic profile.

Next Moves is intentionally local-only in the current product. No additional remote event is required simply because a user wants to remember a recommendation.

See `NEXT_MOVES.md`.

## Referral attribution

Every outbound Escape friend challenge receives a short random creator-session `ref` token. A recipient carries it through challenge creation/share outcome/open/completion/comparison and optional same-session downstream reshare.

`supabase/referrals.sql` adds:

```sql
tasteprint_referral_stats()
```

The function returns only aggregate loop metrics. It never returns referral tokens, install IDs, session IDs, owner hashes, raw event rows or sender/recipient pair records.

The public dashboard lives at:

```text
?growth=1
```

Referral rate claims are independently sample-gated.

## Frontend public key vs backend secret

The browser public/publishable Supabase key is expected to be recoverable from the client bundle. Security therefore comes from least-privilege database grants, RLS and narrow server/API surfaces.

Backend secret/service-role keys bypass RLS and must remain in trusted backend environments only.

`scripts/check-privacy-boundaries.js` scans the main browser clients so accidental secret-key references fail CI.

## Activate Supabase

For the complete current backend:

1. Create a Supabase project.
2. Run `supabase/schema.sql`.
3. Run `supabase/referrals.sql`.
4. Run `supabase/campaigns.sql`.
5. Run `supabase/campaign-registry.sql`.
6. Run `supabase/workspaces.sql`.
7. Run `supabase/leads.sql` if real consent lead capture is needed.
8. Run `supabase/passport-sync.sql` for optional account sync.
9. Run `supabase/intelligence.sql` for trusted feedback aggregation.
10. Deploy `publish-campaign`, `capture-lead` (if needed) and `delete-account` Edge Functions.
11. Add GitHub Pages callback URLs to the Supabase Auth redirect allowlist.
12. Set `VITE_SUPABASE_URL` and the public client key used by the frontend build.
13. Add extra trusted publishing origins through server-side `TASTEPRINT_ALLOWED_ORIGINS` if necessary.
14. Re-run the GitHub Pages workflow or push another commit.
15. Schedule `tasteprint_prune_old_data()` from a trusted cron/operator context.

The existing `VITE_SUPABASE_ANON_KEY` variable name is historical and can hold the current public/publishable key. New Workspace/campaign code also recognizes `VITE_SUPABASE_PUBLISHABLE_KEY`.

Never expose a secret/service-role key as a Vite variable.

## Verify it

After production environment values are present:

```js
TasteprintAnalytics.remoteEnabled()
```

should return `true`.

Useful local/privacy helpers include:

```js
TasteprintAnalytics.localEvents()
TasteprintAnalytics.deleteMyData()
TasteprintIntelligence.localFeedback()
TasteprintIntelligence.summary()
TasteprintNextMoves.list()
TasteprintNextMoves.summary()
TasteprintWorkspace.remoteEnabled()
```

Useful routes:

```text
?profile=1     optional Passport sync
?stats=1       aggregate anonymous analytics
?growth=1      referral-loop aggregates
?workspace=1   Campaign Workspace or automatic local demo
?next=1        local Next Moves
?privacy=1     privacy/data controls
```

## Percentiles and learning gates

`tasteprint_percentiles(scores)` returns unavailable until at least 50 completed Escape profiles exist.

This is distinct from the 50-feedback intelligence review gate and 20-sample referral-rate gates. Each threshold protects a different type of claim.

## Local fallback

Without Supabase, analytics keeps a rolling local event buffer, Passport remains local-first, recommendation feedback remains local-first, Next Moves remains local, the referral dashboard limits itself to current-browser telemetry, Campaign Studio stays usable, and Campaign Workspace renders a fictional local permission/Experience-QA demo.

Backend failure therefore does not destroy the portfolio/demo value or the core consumer experience.

## Remaining production work

- create/connect the actual Supabase project;
- configure the GitHub Actions project URL/public key;
- run migrations and deploy Edge Functions against that project;
- configure Auth redirects;
- schedule trusted 180-day pruning;
- QA anonymous deletion, short IDs, aggregate RPCs, referral attribution, Workspace tenant isolation/invites/roles, campaign publishing/leads, account sync and intelligence aggregates;
- add production abuse/rate-limit controls if traffic becomes meaningful;
- review the production schema/privacy terms before collecting data at scale.
