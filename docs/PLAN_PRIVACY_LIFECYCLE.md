# Private-plan privacy lifecycle — review-only development increment

## User behavior and policy proposed for review

The gated Plans screen adds a **Plan privacy and cleanup** disclosure. Both participants can export their own participation across plan pages, remove participation by plan ID (including while blocked/expired), and manually clean up their own old unclaimed invitations. The existing creator-only delete button remains compatible.

For this first two-person build, removing participation permanently erases the **whole shared plan**, invitation and both responses. This follows the existing Auth-account deletion cascade rather than introducing retained personal-data tombstones or transferring a creator's private content. The UI explains the effect on both participants and requires explicit confirmation. This is erasure, not cancellation or hiding a personal copy. Existing exports/downloads cannot be recalled. Block relationships are retained by plan erasure, so removing a plan cannot undo another person's safety choice. The whole-record erasure policy is a review proposal and requires approval before real-user collection; it is not activated by this branch.

Participation export returns the caller's role and own interest/approval/self-report. When a plan is readable, it also includes shared content already accessible to that account. When either account has blocked the other, shared content, the other actor's identity and response remain absent; the caller can still obtain their own response and plan ID to exercise removal. Invitation capabilities/hashes never appear. This is **not** a complete account or block-list export.

Manual cleanup removes only the caller's unclaimed plans whose invitation deadline expired at least seven days ago. Accepted plans, recent expiry, other accounts' plans and missing deadlines are preserved. It cascades invitation/response records. No timer, cron, scheduled task or external pruning job is configured. This is one narrow retention control, not an approved platform-wide retention policy or a legal compliance claim.

## Small architecture change

`supabase/social-plan-privacy.sql` is an additive, transactional/reapplicable review-only migration **after** `social-plans.sql`. It adds three authenticated, fail-closed RPCs: `tasteprint_export_my_plan_participation(p_after uuid,p_limit integer)`, `tasteprint_remove_my_plan_participation(p_plan_id uuid)` and `tasteprint_cleanup_my_expired_plan_invites()`. Actor identity always comes from auth.uid(); no caller-selected actor parameter exists. Existing raw-table grants/RLS and Workspace security are unchanged.

Exports use ordered UUID cursors, default 100/max 200 records per page, with an explicit next cursor. The transport reads every page, binds the entire operation to the same account, validates progression and rejects duplicate/malformed/looping pages. It stops with an error rather than downloading partial success after its 100-page limit. Export is not a single point-in-time snapshot across requests: concurrent changes can require repeating it. The UI/download metadata say so. Auth changes also invalidate the view's pending operation before any download.

`private-plans-client.js` carries these contracts; `plans-view.js` adds explicit controls and corrects the confirmation copy so deletion never falsely says it affects only the caller. No new dependency/framework, Passport sync, company access, notification or anonymous analytics event is introduced.

## Reproduction and evidence

- `npm test`: existing regressions plus `test:plan-privacy` for pagination, invalid/duplicate/looping responses, account changes, disabled configuration, scoped calls and errors without partial fallback.
- `bash scripts/check-social-plans.sh`: pinned disposable PostgreSQL, migration/reapplication, anonymous/no-session/nonparticipant denials, blocked-content redaction, caller-only responses, recipient erasure/cascades, 120-record export across pages, exact cleanup boundaries and the existing concurrent invitation-claim test. No live connection.
- `npm run test:plans:configured`: real compiled route/shared Auth/transport at root and Pages paths, with all backend traffic intercepted. A blocked recipient downloads a redacted participation export and erases the record; cleanup uses the exact RPC. These mocked responses do not establish hosted RLS/JWT correctness.
- `npm run test:browser` and `npm run build`: preserve the existing consumer/campaign/company flows and disabled default gate.

Before hosted staging, review the exact migration chain and proposed erasure/duration policy; obtain named-project/configuration/cost approval. Before real collection, validate actual Auth/API behavior, complete account-wide export/removal/retention procedures, incident/rate-limit operations, real-device checks and catalog verification. No merge, deployment, infrastructure activation or personal-data collection is included.
