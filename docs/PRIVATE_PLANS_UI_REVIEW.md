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
