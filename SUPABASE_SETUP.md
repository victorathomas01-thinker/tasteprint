# Tasteprint Supabase Setup

You do not need Supabase to demonstrate Tasteprint. Use `?tour=1` for the backend-free product tour.

Supabase is only the persistence/multi-user layer: cross-device Passport, real aggregate data, hosted Campaign Workspaces, authenticated publishing and real consent lead storage.

## Before touching Supabase

The static site should already work on GitHub Pages with **no** Supabase values configured.

Check these first:

```text
?tour=1
?workspace=1&demo=1
?campaignAdmin=1&workspace=demo-workspace&hosted=aster
?next=1
```

If those routes work, the portfolio/demo is not dependent on the backend.

## Values that are safe to put in the browser build

Tasteprint needs only two public project values in GitHub Actions:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

The publishable key is a public client credential. Security must come from RLS and narrow APIs.

The repository still accepts the historical fallback variable:

```text
VITE_SUPABASE_ANON_KEY
```

Do **not** place a secret/service-role key in any `VITE_*` value. Vite values are shipped to the browser.

## Server-only secrets

Supabase Edge Functions may use the project secret/service-role credential supplied in their server environment. That credential can bypass normal row-level rules and must never be copied into:

- GitHub Pages variables;
- JavaScript client files;
- a campaign manifest;
- a URL;
- browser local/session storage;
- screenshots or bug reports.

The CI privacy guard scans browser clients for backend-secret markers.

## SQL order

Create a Supabase project, open the SQL Editor, and run these repository files in this order:

```text
1. supabase/schema.sql
2. supabase/referrals.sql
3. supabase/campaigns.sql
4. supabase/campaign-registry.sql
5. supabase/workspaces.sql
6. supabase/workspace-member-refs.sql
7. supabase/workspace-lifecycle.sql
8. supabase/leads.sql
9. supabase/passport-sync.sql
10. supabase/intelligence.sql
```

Why the Workspace files are split:

- `workspaces.sql` creates the tenant/RLS model;
- `workspace-member-refs.sql` makes browser member references workspace-scoped so the same account cannot be correlated across tenants;
- `workspace-lifecycle.sql` adds ownership transfer/deletion and makes nonessential audit references nullable for clean account deletion.

## Edge Functions

Deploy:

```text
publish-campaign
capture-lead
delete-account
```

The repository includes `supabase/config.toml`:

- `capture-lead` is the one intentionally public submission function and performs its own origin/consent/campaign checks;
- `publish-campaign` requires a signed-in user and re-checks Owner/Admin workspace membership server-side;
- `delete-account` requires a signed-in user and refuses to delete an account that still owns a Campaign Workspace.

## Allowed origins

The current admin/PII Edge Functions allow:

```text
https://victorathomas01-thinker.github.io
http://localhost:5173
http://127.0.0.1:5173
```

If Tasteprint moves to another real domain, add it server-side through:

```text
TASTEPRINT_ALLOWED_ORIGINS
```

Do not replace the allowlist with `*` for authenticated admin or contact-data functions.

## Supabase Auth redirect URLs

Add the GitHub Pages site to the Supabase Auth redirect allowlist so passwordless magic links can return to Tasteprint.

The important production routes are based under:

```text
https://victorathomas01-thinker.github.io/tasteprint/
```

The app constructs its own `?profile=1` / `?workspace=1` return URLs.

## GitHub Actions values

In the GitHub repository settings, configure:

Repository variable:

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
```

Repository variable:

```text
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_KEY
```

You can leave the legacy `VITE_SUPABASE_ANON_KEY` unset when the current publishable-key path is verified.

Then push/re-run the Pages workflow.

## Retention jobs

Schedule these from a trusted Supabase cron/operator context:

```sql
select public.tasteprint_prune_old_data();
select public.tasteprint_prune_old_leads();
```

Targets:

- anonymous raw product rows: 180 days maximum;
- explicit-consent raw lead contact rows: 90 days by default.

Aggregates can outlive raw rows when they do not expose the underlying identity/contact data.

## First production smoke test

Use a test email/address you control. Do not test with someone else's personal data.

Check in this order:

1. Default Escape still completes.
2. `TasteprintAnalytics.remoteEnabled()` returns `true`.
3. `?stats=1` loads the aggregate RPC rather than local fallback.
4. Create a short shared Escape result/challenge and resolve it in another browser.
5. Open `?profile=1`, sign in with a magic link, complete modules in two browsers, and verify Passport merging.
6. Open `?workspace=1`, create a workspace.
7. Create an Editor invite, accept it in a different browser/session, and verify the Editor can edit but cannot publish.
8. As Owner/Admin, publish a test campaign and verify `?campaign=<id>&published=1`.
9. Verify an Analyst can see aggregate metrics but cannot edit.
10. Enable a test non-demo lead campaign with a valid privacy URL, submit your own test email, and verify no contact value appears in analytics or Workspace.
11. Test anonymous browser deletion.
12. Transfer/delete any owned Workspace and then test Auth account deletion.
13. Run the trusted intelligence summary only after structured feedback exists.
14. Run both pruning functions manually once before scheduling them.

## Security checks before real users

- Run Supabase Security Advisor after applying the schema.
- Verify RLS is enabled on every authenticated per-user/per-tenant table.
- Verify no browser role can select from `tasteprint_campaign_leads`.
- Verify Editors cannot publish by calling the API manually.
- Verify a user in Workspace A cannot read/update Workspace B campaign rows.
- Verify public campaign RPCs never return `workspace_id`, Auth IDs or lead contact values.
- Verify invite tokens are one-time and expired invites fail.
- Verify account deletion refuses while the account owns a Workspace.
- Rotate any secret immediately if it is ever pasted into a public place.

## What not to do

Do not:

- turn off RLS because something is easier to debug;
- use a secret/service-role key in frontend JavaScript;
- put raw emails/names into analytics event properties;
- put Workspace invite tokens into analytics;
- expose a “download all leads” button to every Workspace role;
- keep raw contact data forever because storage is cheap;
- claim population percentiles, viral rates or learned recommendation improvements before sample gates and real evidence exist.

The safest production path is boring on purpose: minimal public keys in the client, explicit user consent, narrow server functions, tenant-scoped RLS, bounded raw-data retention and a static/local fallback when the backend is unavailable.
