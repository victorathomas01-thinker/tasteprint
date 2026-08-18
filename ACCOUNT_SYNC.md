# Tasteprint Optional Account + Passport Sync

Tasteprint remains **local-first and usable without an account**. Account sync exists only for people who explicitly want the same Passport history on multiple browsers/devices.

## User flow

1. A user can complete any Tasteprint module and build a local Passport without signing up.
2. In `?profile=1`, the optional account card can send a passwordless Supabase magic link when the backend is configured.
3. After the user follows the link, the browser restores the Supabase Auth session and performs a bidirectional Passport merge.
4. Local-only snapshots upload. Remote-only snapshots download. Matching snapshots deduplicate by a stable client key.
5. The normal Passport rule still applies after merging: only the latest result from each module contributes one equal vote to the master Tasteprint.
6. Future module completions are synced automatically while the account is signed in.
7. Signing out keeps the local Passport on that browser.

There is still no account or email wall before a result.

## Data boundaries

Three data paths remain deliberately separate:

### Anonymous product data

The existing `tasteprint_profiles` / `tasteprint_events` path uses an anonymous browser install ID and private deletion token. It does not receive the Auth user ID or account email.

### Optional account-backed Passport

`tasteprint_passport_snapshots` stores:

- `user_id` from Supabase Auth
- stable snapshot client key
- module ID
- timestamp
- archetype/mode labels
- module score vector
- mapped master score vector
- duplicate-suppression signature

It does **not** duplicate the Auth email, store raw answer selections, copy anonymous install IDs/deletion hashes, or contain campaign lead data.

Supabase Auth itself necessarily stores the account email because email is the selected passwordless authentication method.

### Campaign leads

Consent-based campaign email/name capture remains in the separate restricted campaign-lead path. Signing into Passport does not opt the user into campaign follow-up.

## Merge rules

`account-core.js` provides deterministic merge helpers.

- Local and remote histories are sanitized through the same Passport schema.
- A signed snapshot uses `module_id + signature` as its stable client key.
- Older snapshots without a signature use a deterministic module/timestamp/result-label fallback.
- The merge is a union, not “cloud always wins” or “device always wins.”
- Duplicate client keys collapse to one snapshot.
- Histories remain capped at the platform's 60-snapshot limit.
- The backend also exposes `tasteprint_prune_my_passport(60)` so old synced rows do not grow without bound.

This means signing in on a new device can pull history without destroying local results that were created before the sign-in.

## Database security

Run:

```text
supabase/passport-sync.sql
```

after the core `supabase/schema.sql` migration.

The table references `auth.users(id) ON DELETE CASCADE` and has RLS enabled. Authenticated users can select/insert/update/delete rows only where `auth.uid() = user_id`.

The browser uses the user's Supabase JWT for normal Passport reads/writes. The service-role key is never placed in Vite variables or the GitHub Pages bundle.

## Passwordless authentication

`account-sync.js` uses Supabase Auth magic-link sign-in through `signInWithOtp`.

The production Supabase Auth URL configuration must allow the deployed callback URL, including the GitHub Pages app path. The client sends the user back to:

```text
?profile=1&auth=return
```

The same `VITE_SUPABASE_URL` and public anon/publishable key used by the rest of Tasteprint are sufficient for the browser Auth client. No Auth secret belongs in frontend configuration.

## Account deletion

There are intentionally two separate delete actions.

### Delete anonymous browser data

The Privacy & data dialog uses the existing browser deletion token to delete anonymous profile/event rows. If the user is signed into Passport, this does **not** silently delete the optional account or synced Passport.

### Delete optional account + synced Passport

`supabase/functions/delete-account/index.ts` verifies the user's bearer session, then uses the service role server-side to delete that Auth user. `ON DELETE CASCADE` removes the synced Passport rows.

This Edge Function must be deployed before the production account-delete button can succeed.

Deleting the account does not automatically delete anonymous browser analytics because those rows deliberately do not contain an account identity. The user can reset the anonymous browser path separately.

## Production activation

1. Create/connect the Supabase project.
2. Run `supabase/schema.sql` and the existing commercial migrations as needed.
3. Run `supabase/passport-sync.sql`.
4. Add the GitHub Pages app URL to Supabase Auth allowed redirect URLs.
5. Deploy `supabase/functions/delete-account`.
6. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for the Pages build.
7. Test magic-link sign-in on one browser.
8. Complete modules before and after sign-in and verify merge behavior.
9. Sign into a second browser/device and verify remote history is pulled.
10. Verify sign-out keeps the local Passport.
11. Verify clear-synced-Passport removes both the remote rows and current local history.
12. Verify account deletion removes the Auth user and synced rows while leaving anonymous deletion as a separate choice.

## Current limitations

- Production Supabase is not connected yet, so the deployed public build shows the account-sync card as unavailable/local-only until credentials and migrations are activated.
- Account sync is email magic-link only in this version. Social OAuth is intentionally deferred.
- This is a single-user consumer account model, not the separate multi-user client/agency permission model needed for Campaign Studio.
- Manual mobile/email-client callback testing is still required.
- The system provides privacy-oriented controls but does not claim legal compliance certification.

## Regression coverage

`scripts/check-account.js` tests the local/remote union model, stable keys, round-trip shape, PII separation, six-module compatibility, RLS/schema markers, passwordless Auth wiring, account deletion boundary, and the Passport replace hook used by remote merges.
