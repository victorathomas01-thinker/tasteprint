# Private plan backend foundation — review only

The next social milestone is authoritative mutual plans. This PR prepares a minimal two-participant database/API seam using existing Supabase Auth contracts. It does not create a project, activate credentials, apply a hosted migration, collect real data or connect the browser demo to real accounts.

## Locally proven behavior

- Creator identity and every response come from auth.uid(), not a caller-provided actor ID. Participants alone can read plans/responses. Browsers cannot directly rewrite plan or response rows; invitation hashes are never browser-readable.
- The creator receives a random 256-bit invitation once; only its SHA-256 hash is stored. A signed-in holder may claim it once within seven days. Self-claims, replay, revoked/expired invitations and blocked pairs fail. Two concurrent sessions racing a token produce exactly one recipient, with no overwritten membership.
- Claiming does not mean interest. Each participant explicitly expresses interest; one approval cannot schedule. Details carry a revision; both must approve the same revision. Changes reset approvals. Cancellation/decline close the proposal. Completion is actor-specific self-report, never verified attendance.
- The invitation deadline is removed after claim, so an accepted future plan does not expire seven days after creation. Pending expired plans reject mutations; the client derives their expired display state. Basic outstanding-invitation cap is serialized per creator, but is not a production rate limiter.
- Blocks deny both participants’ read/response paths. Creator deletion remains possible while blocked/expired. Foreign-key deletion of either Auth participant removes the entire shared plan, invitation and responses; this is a deliberate local prototype policy requiring staging/product review.

## Code and validation

`supabase/social-plans.sql`: additive, transactional/idempotent schema, private RLS/grants, hashed capability claims, actor-bound transition RPCs and deletion. No existing Workspace/reporting security file changes. `scripts/check-social-plans.sh` applies/reapplies it in pinned disposable PostgreSQL without network/ports or real identities, checks pgcrypto in the Supabase-style managed extensions namespace, runs the SQL role/state matrix, and races claims in separate database sessions. No live migrations run in CI.

`private-plans-client.js` is an unmounted transport factory for a future approved UI. Disabled configuration fails before reading a session; Auth bearer identity stays out of request bodies; invitation tokens go only in POST bodies; timeouts, session/network failures and unavailable records surface explicitly, without local fallback or raw token/error reflection. `test:private-plans-client` uses synthetic transport fixtures, not real JWT/PostgREST certification.

Run `npm test`, `npm run build`, `npm run test:browser`, `bash scripts/check-workspace-reporting.sh`, and `bash scripts/check-social-plans.sh`. CI runs both independent synthetic SQL gates. Existing consumer/company browser behavior remains unchanged.

## Boundaries before any actual connected pilot

This is private capability-based invitation, not a verified friend network. The first authenticated holder can claim a forwarded link; the creator must recognize the recipient before assenting. No contacts, friend directory, profile discovery, notifications or automatic email delivery exist. Browser plans still use the explicit local simulation. No real Auth flow, redirects/recovery, hosted PostgREST permissions or physical devices have been certified.

Before activation: review exact SQL/rollback, domain/Auth redirects and environment handling; finish connected invite/recipient identity display and approval UI; enforce gateway rate limits/abuse ownership, approved retention/pruning and selective participant export/removal (including blocked cases); test account lifecycle, lost responses, actual JWT denials and two-account/two-device behavior. The SQL currently deletes a whole shared record when a participant account is removed; no standalone preference/Passport sync is added. Company ownership/verification/publishing remains separate from social identity/state.

No provider tier or cost has been verified or approved. The current local stack needs no new paid API, notification provider or external preview hosting. Review provider Auth-email/compute/storage/egress/backup limits and a cost ceiling before creating or activating staging. Preserve rollback artifacts and restrictive access; migration/application to any external project requires explicit founder approval.
