# Private in-app updates

The optional Updates destination under More shows recent changes to private friend connections and shared plans, with links to review current details. A participant joining, responding, approving, changing details or cancelling can update the other opted-in participant's inbox. Upcoming agreed plans within seven days are displayed with local dates. This is a refreshable in-app inbox, not email, push delivery or a background reminder service.

Two gates: VITE_PRIVATE_UPDATES_ENABLED defaults false and requires configured Plans and Friends. Each account must then explicitly turn updates on. Enabling starts from that moment, without backfilling earlier activity. There are no anonymous/public inboxes, third-party services or private reflection notifications. Shared shortlist-only actions are not yet included.

## Architecture and privacy

Review-only supabase/social-updates.sql adds account preferences, bounded receipts and trusted source triggers after Plans/Friends. Raw tables and emitter/trigger helpers are not client-accessible. Authenticated RPCs only read/change the caller's preference, project currently authorized inbox/plan data or mark that caller's exact receipt sequence seen. A newer update invalidates an older seen acknowledgement. Other people cannot see seen status.

Receipts store source IDs, actor/receiver IDs, kind, sequence and timing, not copied titles, profiles, tokens, locations or private answers. Titles are projected from current authorized sources. Blocking immediately hides the source in reads; removing the source deletes receipts. Auth deletion cascades preferences/receipts. Disabling erases the caller's inbox and serializes against emission so a concurrent update cannot reinsert after opt-out. Export contains only currently visible data; it is not a complete account or plan export and downloaded copies cannot be recalled.

One latest update per source thread, at most 500 per account. Entries older than 30 days are omitted and lazily erased on that receiver's inbox read or next update. Inactive accounts can retain expired rows until next use, opt-out, source/account removal or an approved maintenance job; no scheduled maintenance job is activated. Original source state remains in Plans/Friends under their own retention rules.

updates-client.js validates server projections and binds each request to the displayed account. updates-view.js clears old content on failed refresh and rejects late responses after account changes. updates-runtime.js uses the existing singleton Auth lifecycle; anonymous analytics and unrelated Passport auto-sync are excluded. Existing campaign/account/consumer routes retain precedence. Titles are safely escaped. No new framework or dependency.

## Validation

Node regressions cover strict response validation, canonical route precedence, public configuration dependencies and actor-bound transport. Local SQL tests cover default-off/no backfill, grants/emitter denial, independent accounts, seen sequence races, block projection, opt-out/source/Auth deletion and upcoming plan authorization/time filtering. The browser suite checks the actual disabled route at root/Pages, then an injectable source view for opt-in/read/export/off, injection, mobile overflow, outage and late logout. The genuine disposable Auth/PostgREST build tests two accounts, persisted seen state after reload, another account's independent unread state, opt-out erasure and no notifications for private feedback. See execution/status ledger for final results.

No hosted schema applied; this schema is outside the approved PR #24 recovery rehearsal. Real devices, real-user usefulness, hosted setup, provider email recovery and proactive notification delivery remain unverified or unimplemented. Production remains disabled.

Final local result: full npm test, syntax check, production build, all 16 browser suites at root and /tasteprint/, configured Plans/Friends/shortlist suites at both bases, complete local SQL suite and genuine disposable Auth/PostgREST/browser suite passed. Focused loading checks also verify eight unconfigured routes do not load the optional Auth SDK. The Saved outside-click regression now clicks the footer: the heading can legitimately sit under the expanded More menu. No unresolved test failure.
