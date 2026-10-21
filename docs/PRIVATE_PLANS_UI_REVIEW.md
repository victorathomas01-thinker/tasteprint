# Private Plans consumer screens — development only

## What this increment implements

`?plans=1` adds the existing dark consumer navigation destination with an honest disabled screen in normal builds. A Together film proposal links into Plans using only its public catalog ID. The editor can prefill the official reference without putting private titles, schedules or recipient information into a query string. Individual discovery still needs no account.

For a separately approved staging build, the screens use the existing single Supabase Auth client and `private-plans-client.js`, never another Auth instance or a local fallback. The user can create a private invitation, manually send its link, explicitly join, express their own interest, propose zoned dates/place, approve the displayed revision, decline, cancel and self-report an experience. Changing details resets approvals in the existing authoritative SQL. The UI sends the displayed revision and requires review before consequential actions; stale requests show a failure and require refresh. No fake recipient buttons are mounted in Plans. Existing Together simulation stays explicitly labeled.

Invitations carry their random capability in a fragment, stripped from the current address immediately on mounting. The plaintext code is memory-only, never stored or included in telemetry/HTTP targets. Joining is explicit. If sign-in requires leaving the page, keep the original private link and reopen it afterward. There is no automatic delivery or persistent invite clipboard. The first authenticated holder can claim a forwarded invitation; account IDs are displayed as unverified identity references, with instructions to confirm through a separate trusted channel. This is not a verified friend network or polished identity directory.

Private calendar export is offered only after agreement. The downloaded RFC 5545 file includes title/time/place, revision and a stable plan ID, excludes tokens/attendee email, escapes control characters and folds UTF-8 lines. It is a static snapshot, not calendar synchronization or booking. JSON export contains the accessible shared record and both participant responses/IDs, without invitation tokens. It is not an entire-account export.

Block/unblock uses the existing own-row RLS contract. Blocking removes shared-plan access from both accounts; creator deletion by ID remains available even while blocked. Deletion removes the whole shared record and both responses permanently, matching the foundation's explicit review-only policy. Recipient-selective removal, ongoing retention/pruning and complete account export remain prerequisites for real collection. The block list and recent plans are bounded to 50 rows, with no promise of comprehensive pagination.

## Architecture

- `plans-core.js`: route-independent action eligibility, input/date validation, safe link handling and calendar generation.
- `plans-view.js`: small injectable consumer UI; no production mock or injected global transport. Clear visible/private memory on Auth changes and reject stale in-flight results.
- `plans-runtime.js`: route and explicit feature gate; reuse the existing Auth session and public backend configuration only when enabled.
- `private-plans-client.js`: JWT-bound read/list/responses, transitions, scoped blocks and creator deletion. No service-role key, caller-selected response identity or fallback statistics.
- `navigation-core.js`, `navigation.js`, `together.js`, `analytics.js`, `index.html`, `plans.css`: preserve legacy deep-link precedence, connect the route, suppress anonymous telemetry and retain the dark mobile design.

## Validation and limitations

Run `npm test`, `npm run build`, `npm run test:browser`, `bash scripts/check-social-plans.sh` and `bash scripts/check-workspace-reporting.sh`. Browser checks run at `/` and `/tasteprint/`. The built default route/error boundary is tested directly. Since activation remains prohibited, an isolated browser source-module harness mounts the same view with synthetic transport in two contexts; it does not certify the configured production bundle/Auth/PostgREST combination. The separate SQL runner tests real PostgreSQL permissions and concurrency; transport tests validate wire shape. These layers are evidence, not a substitute for approved hosted integration.

No live Supabase schema/settings, real identities, notifications, public discovery, deployments or paid services are activated. No real mobile device or user study has been run. The compiler's existing large-bundle warning remains. See `SOCIAL_STAGING_APPROVAL.md` for the exact next activation scope and remaining checks; this PR does not approve it.

## Configured production-bundle regression coverage

`npm run test:plans:configured` now builds the real enabled route at both `/` and `/tasteprint/` using a hardcoded synthetic project hostname/public key. It is available only in the check runner, never an interactive review mode. The browser seeds synthetic sessions into the existing Auth storage contract, then intercepts **all** backend traffic; unexpected external requests are aborted and fail the check. No source view is imported or mounted by this test, and no project is contacted.

The compiled runtime, shared Supabase Auth client and authenticated REST/RPC adapter now run together through catalog prefill, invitation, independent interest, revision approvals, rescheduling, real calendar/JSON downloads, error recovery, shared-client logout, block/unblock and creator deletion. JSON and calendar contents exclude invitation tokens. The existing Passport integration also reads its synthetic empty history and invokes its own retention RPC; these expected calls are explicitly mocked and cannot receive private plan content. Configuring Auth has effects beyond Plans, as called out in the staging proposal.

This regression exposed and fixes initial-session recovery clearing Plans: the Auth listener now treats the first session notification as initialization, keeps the same account's view stable, and clears/reloads only when the account identity actually changes. Logout clears the private screen. CI runs the configured checks in addition to the default seven-suite browser runs and SQL gates. Synthetic HTTP responses do not prove real JWT verification, hosted RLS/PostgREST behavior, email delivery, real devices or user value; those remain separate approval/validation gates.

## Subsequent participant privacy controls

`PLAN_PRIVACY_LIFECYCLE.md` supersedes the earlier creator-only limitation: a review-only additive migration and gated UI now let either participant erase a shared record, export caller participation across all pages (with blocked content redacted), and explicitly clean up old unclaimed invitations. The existing creator-only endpoint remains. Erasure removes both participants' shared record; it does not retain a separate copy or recall exports. Account-wide privacy/retention and approval of this proposed policy remain prerequisites for real use. No background cleanup or hosted activation occurs.
