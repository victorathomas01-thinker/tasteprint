# Dedicated Supabase staging setup — approved synthetic-only scope

Founder approval: synthetic-only staging for PR #24, subject to the documented restrictions. Approved implementation baseline: `f4befb8b441d2c03751369b347b6158d6edb0108`. No isolated project has been selected, configured or tested yet. Production, real user data/credentials, production deployment/merge and unrelated services remain outside scope.

## 1. Cost and isolation requirements

Create a **new project in a separate Free-plan organization**, suggested names `Tasteprint Staging` / `tasteprint-synthetic-staging`. Do not clone, branch, restore, transfer or link production. Choose US East (N. Virginia) if available for the initial Charlotte-oriented work; another nearby Free region is fine.

Expected Supabase cost: **$0/month** while the organization remains Free. The official pricing source currently lists 500 MB database, 50,000 monthly active users, 5 GB egress, 5 GB cached egress and 1 GB file storage. This rehearsal should use only a handful of synthetic accounts and a small, bounded dataset; no file buckets or load testing are required.

Important limits:

- The two-active-Free-project limit applies across organizations where you are Owner/Administrator. Creating another organization does not evade it. If no slot is available, stop; do not pause/delete production or upgrade automatically.
- Plan selection is organization-wide. A project in a paid production organization is not a Free project. Pro advertises from $25/month; additional paid project compute may add charges. Neither is approved.
- No paid compute, IPv4 add-on, custom domain, PITR, log drain, paid branching, external SMTP/SMS, OAuth provider, notification service or external frontend host. Do not add a payment method/upgrade to resolve a test issue.
- Free projects may pause after roughly a week of inactivity. No keepalive cron will be installed. Free is not a production availability commitment, and paid automatic backup/PITR features are not assumed.
- Confirm the dashboard actually says **Free / $0** at creation. Stop and report any checkout, charge, upgrade or quota conflict before proceeding.

Pricing checked 2026-10-21 against Supabase's official GitHub documentation/source because this workspace receives HTTP 403 from supabase.com. This is source evidence, not verification of your account's bill or the deployed dashboard. Reconfirm at creation:

- [Official pricing source, pinned revision](https://github.com/supabase/supabase/blob/9b4a47c6dc6a82cec945fc38d59477970cbe8afa/packages/shared-data/plans.ts)
- [Organization billing and Free-project limits](https://supabase.com/docs/guides/platform/billing-on-supabase) · [pinned source](https://github.com/supabase/supabase/blob/9b4a47c6dc6a82cec945fc38d59477970cbe8afa/apps/docs/content/guides/platform/billing-on-supabase.mdx)
- [Cost controls](https://supabase.com/docs/guides/platform/cost-control) · [Backups](https://supabase.com/docs/guides/platform/backups)

## 2. Create the project — founder dashboard steps

1. Sign into your own Supabase account, preferably with account MFA already enabled. Do not share your login, MFA code or recovery codes.
2. Create/select the separate **Free** staging organization. Confirm the Free-project slot is available.
3. Click **New project**; choose that organization, the staging name, Free/default resources and a region. Generate a new strong database password unrelated to production and save it in the secure secret store described below.
4. Wait for the project to become healthy. Record its **project reference**, project URL (`https://<ref>.supabase.co`), region, PostgreSQL server version and confirmed plan. The project reference and URL are safe to send in chat.
5. Leave the project empty. Do not import production, install all Tasteprint SQL, add real accounts, publish campaigns, create storage buckets, deploy Edge Functions or enable Realtime publications. I will apply only the scoped social migration chain after preflight.

No additional team member or organization-wide access token is necessary for the test runner. You retain organization ownership. Administrative credentials below are limited to this dedicated project.

## 3. Configure Auth and API — staging only

In **Authentication → Sign In / Providers** (dashboard labels may vary):

- Keep email/password authentication enabled. Disable public new-user signup for this private rehearsal. Leave anonymous sign-in, phone/SMS, external OAuth and invitation delivery unused/disabled.
- Keep normal email-confirmation protection; I will create **already-confirmed synthetic accounts through the Admin API**, not public signup or `inviteUserByEmail`. Example identifiers: `tasteprint-staging-a@synthetic.invalid`. They are placeholders, not real inboxes, and no email/SMS will be sent. Account passwords will be generated privately for this run.
- Keep default signing keys/JWT settings. Do not rotate production keys or disable Auth security to make tests pass. Natural-expiry/email-recovery tests will be reported separately if not exercised.

In **Authentication → URL Configuration**, reserve only these local test URLs:

```text
Site URL: http://127.0.0.1:4237/tasteprint/
Additional redirect: http://127.0.0.1:4237/tasteprint/?profile=1&auth=return
```

This is a local, execution-environment browser origin, not a hosted site. The first password-based API/recovery tests do not send email or require redirects. If a different port/private origin is needed, I will document the exact change rather than add wildcards, production URLs or a new external host.

Keep the Data API available for the `public` schema so authenticated RPC/RLS can be tested. Do not grant anonymous access or disable Row Level Security. No unrelated schema or endpoint needs activation. Retain TLS enforcement. Any optional network allowlisting must allow the staging runner without buying an add-on or opening production access.

## 4. Credentials and permissions to provide securely

Use the coding environment's secret manager. If unavailable, use a separate ignored credential file outside every repository, with directory mode 700 and file mode 600, for example `/workspace/.tasteprint-staging/credentials.env`. **Do not paste secret values into chat, commit them, put them in a PR, or reuse production values.** The placeholder inventory is [staging/credentials.env.example](staging/credentials.env.example); it is not a dotenv loader or an implemented hosted runner.

| Setting | Where to obtain it / purpose | Secret? |
| --- | --- | --- |
| `TASTEPRINT_STAGING_PROJECT_REF` | Dedicated project's reference, supplied explicitly as the only permitted target | No |
| `TASTEPRINT_STAGING_URL` | Project Settings / Connect: `https://<ref>.supabase.co` | No |
| `TASTEPRINT_STAGING_PUBLISHABLE_KEY` | Project Settings → API Keys: publishable `sb_publishable_...` key; legacy staging `anon` key is an alternative | Public, still project-specific |
| `TASTEPRINT_STAGING_ADMIN_KEY` | Same staging project's server secret `sb_secret_...` key; legacy staging `service_role` is an alternative. Used only to create/delete synthetic Auth fixtures | **Yes — bypasses RLS** |
| `TASTEPRINT_STAGING_DB_HOST`, `_DB_PORT`, `_DB_USER`, `_DB_NAME` | Dashboard **Connect**: direct Postgres or session-pooler parameters below | Host/user not secret |
| `TASTEPRINT_STAGING_DB_PASSWORD` | New staging database password. Needed for exact scoped DDL, archive/restore and ownership/grant inspection | **Yes — privileged within staging** |
| `TASTEPRINT_STAGING_DB_SSLROOTCERT` | Absolute path to an appropriate trusted CA file when required for `verify-full` TLS | Certificate is public; file path is environment-specific |
| `TASTEPRINT_STAGING_APPROVED_COMMIT` | `f4befb8b441d2c03751369b347b6158d6edb0108` | No |

The Admin key does not replace the DB password: Auth administration and PostgreSQL migrations/backup are different interfaces. The database credential must own or be permitted to create/alter/drop the approved social objects, grant/revoke their API access, and reference `auth.users`. The project's database `postgres` credential can perform this in the isolated project; its authority is why it must never point at production. No account password, Supabase personal access token, production key or organization billing/admin delegation is requested.

Public/participant/blocked/nonparticipant tests will use the **publishable key and ordinary signed-in user JWTs**, never the Admin key to prove RLS. Administrative access is reserved for fixture setup, scoped migration/recovery and verification. Neither the Admin key nor database password may enter any `VITE_*` variable, browser bundle, test report or CI log.

If you prefer not to provide the Admin key, synthetic Auth fixtures can be created/deleted manually in the dashboard, but automated Auth lifecycle coverage will then require those manual steps and must be labeled accordingly.

## 5. Database connectivity without a paid IPv4 add-on

Copy parameters from **Connect**; do not invent a pooler hostname:

- Preferred: direct endpoint `db.<ref>.supabase.co`, port `5432`, user `postgres`, database `postgres`, if this execution environment reaches IPv6.
- IPv4-only fallback: **Session pooler**, port `5432`, dashboard-provided `*.pooler.supabase.com` hostname, user `postgres.<ref>`, database `postgres`.
- Do **not** use transaction pooling on port `6543` for recovery/session-state tests. Do not buy the IPv4 add-on.

Require TLS hostname verification (`sslmode=verify-full`) using the correct trusted certificate chain for the chosen endpoint. Download the direct endpoint's root certificate from database settings when necessary; a shared pooler may use a different chain/system trust. I will verify connectivity and certificates and stop if they cannot be verified, rather than lower TLS verification. Use PostgreSQL client tools compatible with the actual server major version; do not assume the hosted server matches the local PostgreSQL 17 fixture.

The environment must reach the project over HTTPS `443` and the approved database endpoint over TCP `5432`. If workspace egress policy blocks either, tests stop with the exact connectivity limitation. I will not substitute a different project, buy network features or claim a hosted pass from local mocks.

[Official connection modes and TLS guidance](https://supabase.com/docs/guides/database/connecting-to-postgres).

## 6. What I will do after configuration

Reply **“staging configured”** with the public project reference/URL, confirmed Free plan/region and the secure location or secret-variable names. Do not include key/password values. No further approval is needed for operations already inside the approved scope.

1. Pin PR #24's approved commit; validate the public URL, project reference, database endpoint/user and TLS match the explicitly named staging target. Inspect only that target. Check that application data is empty or consists solely of this rehearsal's known synthetic fixtures. Unexpected users/data, an ambiguous target, charges, missing permissions or connectivity failure stop the run.
2. Inventory the clean staging baseline without exporting managed Auth secrets. Apply only `supabase/social-plans.sql`, followed by `supabase/social-plan-privacy.sql`; reapply to check idempotence. Do not apply `schema.sql`, Passport/workspace/campaign/lead SQL or Edge Functions.
3. Create a bounded set of confirmed synthetic Auth accounts with generated passwords and obtain actual user JWTs through password sign-in. Test ordinary actor/anonymous/blocked/direct-API permissions, invite claim/replay/expiry, same-revision agreement, rescheduling, cancellation, privacy export/erasure and account cascades. Never send invites or test mail to real people.
4. Archive only the four synthetic social tables into a restricted temporary file; preserve Auth/provider state and unrelated objects. Quiesce our own synthetic writers, use a target-bound transactional recovery procedure for the approved social objects, restore, compare complete row fingerprints and re-run authorization checks. The local fixture-only teardown SQL is **not** used against hosted infrastructure. Managed/provider-level restores, project deletion, whole-database restore, PITR and signing-key changes remain outside scope.
5. For a real-API browser check, use a local isolated Auth/Plans harness based on the approved modules, without loading unrelated application integrations. The full app currently initializes Passport read/prune alongside Auth; this scope does not authorize adding its schema or ignoring those requests as successful tests. Report the full-app Auth coupling as unverified until separately resolved. No frontend is published or deployed.
6. Remove this run's synthetic fixtures and temporary credentials/archives where safe; preserve restrictive schema/RLS and report the exact retained staging state. Never delete the project or erase anything outside the known fixture IDs.
7. Report commit, project reference, server/client versions, migrations, actual API/recovery results, remaining skipped/unverified cases, cleanup, costs observed and any requested scope change. Keep tokens/passwords/backup contents out of the report.

The existing `npm run test:social-recovery` remains **local-only**, and `npm run test:plans:configured` still intercepts all backend requests. Neither becomes a hosted test merely because credentials are present. `npm run review` intentionally clears backend configuration. I will not label those commands as staging execution.

## 7. Approval boundary

Your synthetic staging approval persists. A missing project/secure credential is a configuration dependency, not a request to reapprove the same work. I will stop and request approval before paid resources, production access or changes, real user data, public hosting, merge/production deployment, unrelated service activation, email/SMS/push delivery, project/provider-wide recovery or any other operation outside this scope.
