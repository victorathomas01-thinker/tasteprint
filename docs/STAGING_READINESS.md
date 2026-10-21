# Staging and pilot-readiness procedure

This is preparation only. No Supabase project, paid service, production database, real data collection or deployment was activated. Use existing stack/components; a new framework, LLM service, CRM/PMS integration or billing system is unnecessary for this pilot.

## Current release blockers

- PR #9 must be reviewed for campaign routing, reporting/data-source correctness and its ownership/role SQL wrapper. Local SQL and controlled browser tests pass; live JWT/PostgREST behavior is unverified.
- The separate Workspace RPC authorization fix must be reviewed before any real team data is used. Missing-role SQL comparisons previously allowed some nonmember operations in a disposable test. Verify both original functions and later replacement migrations.
- The fictional hotel demonstrates local guest/operator value, not cross-device analytics, real availability, fulfillment or validated willingness to pay.
- Anonymous event ingestion allows client-generated events; delivery and abuse resistance are not guaranteed. Before a real pilot, define rate limits, monitoring, missing-event caveats and what counts as an event/session. Do not label clicks as bookings or interpret demo activity as revenue lift.
- No committed npm lockfile exists; dependency reproducibility and existing Actions/bundle warnings deserve a separate maintenance increment rather than a silent package upgrade in the demo PR.

## Minimum architecture and approval gate

Retain Vite/GitHub Pages for presentation and the existing Supabase Auth/Postgres/RLS/RPC/Edge Function source for hosted operations. Start in a separate staging project with synthetic identities/records and no guest contact collection. Propose free-tier use only after current limits are checked; no price or included-usage claim is made here. Founder approval is required for project creation, provider access, credentials, settings and any budget. Secrets go through secure environment settings, never chat, catalogs, VITE variables or logs.

Initial staging needs only public lookup, anonymous event ingestion, authenticated workspaces/publishing and scoped reporting. Real leads and Passport sync/deletion may remain off until separately needed. The fictional local demo must remain usable without any backend.

## Installation / configuration

1. Review the exact commit and complete canonical SQL order in `SUPABASE_SETUP.md`; rehearse migrations against disposable data. Use the reporting/authorization Docker runner as a local gate, not a substitute for staging.
2. Confirm RLS, least-privilege grants and security-definer search paths. The raw campaign aggregate stays service-role-only. Only Owner/Admin/Analyst of the registry-owning tenant may obtain reports.
3. In approved staging, apply the reviewed SQL in the documented order. Verify reapplication and rollback strategy before production changes. Never roll back by restoring anonymous metrics grants or fail-open role comparisons.
4. Deploy only the approved staging Edge Functions; configure explicit staging/production origin allowlists and Auth redirects, including the `/tasteprint/` path. These are external changes requiring approval.
5. Supply only the public project URL/publishable client key to the Vite build. Keep all server-secret/service credentials in the provider's server environment. Do not assume proxy placeholders can serve as raw local secrets.
6. Run the actor/tenant tests below through actual signed-in sessions and direct RPC/API calls. No real guest information is needed.

## Required live-staging test matrix

| Actor / state | Must pass | Must fail |
| --- | --- | --- |
| Anonymous | Deliberately published campaign read | Raw event/lead/tenant reads, team reports, invites, publication, lifecycle actions |
| Signed-in nonmember | Own account/session controls | Every other tenant's team/report/invite/member/lifecycle action |
| Owner | Own-team draft, report, authorized invite/role/transfer/delete, publish | Cross-tenant access and campaign-ID takeover |
| Admin | Own-team draft/report, lower-role invite and publication | Owner-only member/lifecycle operations; invitation of another admin |
| Editor | Own-team draft changes | Report RPC, publication, invites and owner operations |
| Analyst | Own-team aggregate report | Draft writes, publication, invitations and owner operations |
| Viewer | Own-team read-only presentation | Metrics, writes, publication, invites and owner operations |
| Conflicting campaign IDs | Real registry-owning tenant gets its report | Another team's colliding draft obtains the same metrics |
| Missing/offline/stalled/invalid backend | Visible error and retry/unavailable page | Local numbers or private drafts silently replacing production content |

Use two clean browser contexts plus direct API calls; confirm Auth tokens expire/refresh and redirects are correct. Verify a public manifest contains only deliberate campaign content, not tenant/audit/contact/Passport fields. If consent leads are approved later, test disabled/no-consent requests, restricted reads, explicit success/failure, retention and deletion using controlled test records only.

## Operations before release

- **Backup/restore:** agree on required recovery point/time and provider retention/cost. Test an export/restore with synthetic staging data. Do not export production/PII without explicit authorization.
- **Rollback:** preserve a reviewed frontend artifact and manifest/catalog version. Pause the campaign or return an honest unavailable screen when data/auth is broken. Database authorization must remain restrictive during rollback. Rehearse the exact migration approach in staging; don't claim a rollback exists merely because SQL files are stored.
- **Monitoring:** report errors by operation/status and commit, not bearer tokens, invite tokens, contacts or raw quiz choices. Add a health check for published lookup and authenticated reporting with an approved synthetic test account; no monitoring service is activated by this document.
- **Abuse/rate limits:** define who owns event/capture throttling, payload limits and incident response. A public API key and CORS are not authorization or spam protection.
- **Retention:** raw anonymous-data and consent-lead pruning must be scheduled and verified in the provider only after approval. Code targets are not proof a job runs.
- **Cost:** verify current provider limits, runner minutes, usage alerts and a founder-approved ceiling. Stop rather than auto-upgrade on a quota failure.

## Launch gate

A real pilot requires reviewed security changes, passing signed-in staging tests, approved catalog/branding/distribution/metrics/privacy terms, real-device QA, an operating contact and explicit founder approval to merge/deploy and collect real activity. Until then, ship reviewable development branches, local previews and documentation only.

## TasteSocial staging delta — proposal only

Social-first priority supersedes the historical hospitality-first staging scope above. Do not activate all existing campaign/analytics/lead capabilities merely to test two friends choosing a film.

Minimum next staging slice: existing Supabase Auth with approved redirects/session recovery; private, explicitly selected Passport interest sync separate from anonymous telemetry; participant-scoped plan records; immutable detail revisions and per-participant approvals bound to a revision; single-purpose expiring/revocable invitations stored as hashes. Use in-app status changes first; email/SMS/push invitations and paid delivery are not authorized. Connected data must never trust actor IDs or approvals supplied by another participant’s browser. Add blocks before connected-user access, not just before public discovery.

Required direct-API matrix: anonymous, owner, invited recipient, nonparticipant, blocked account, expired/revoked/replayed token, stale revision, deleted account; test participant spoofing, unilateral schedule/approval, changes after agreement, retention/export/deletion and concurrent responses. Require two synthetic accounts and two browser contexts on actual hosted Auth/PostgREST after separate infrastructure approval. Local demos do not certify this.

Costs remain UNVERIFIED: no provider project/tier or budget has been selected, no current quota/price documentation was fetched, and no free-tier promise is made. Before activation, review project/compute/storage/Auth-email/egress limits, backup/restore and any billing exposure with the founder. Retain local-only review if an acceptable zero-spend or expressly approved budget cannot be guaranteed. No paid notifications, catalog API or separate preview hosting is needed for this stage.

Rollback design: additive staging-only schema/feature gate, versioned migrations rehearsed on disposable data, synthetic export/restore, disable social writes/invites on failure while preserving private read/export/delete access and restrictive RLS. Keep the last reviewed frontend artifact. An exact SQL rollback must accompany actual migrations; none are applied or claimed by this proposal.

### Review-only private-plan implementation

See `PRIVATE_PLANS_REVIEW.md` for the locally tested schema/RPC/client seam and explicit remaining gates. `supabase/social-plans.sql` is NOT part of the canonical live installation sequence yet. Do not apply it to a real project or assume the existing local plan UI now synchronizes. Both the old Workspace authorization runner and the independent social runner must pass, then actual JWT/PostgREST and connected UI tests require approved staging. The foundation uses a first-holder capability, not verified friend identity, and currently cascades whole-plan deletion when either account is deleted. Those policies and selective export/removal must be reviewed before any real data.
