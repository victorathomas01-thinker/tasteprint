# Bounded account session recovery

The HTTP request boundary already had a deadline, but private views first called the account SDK outside that boundary. A stuck refresh could leave a screen waiting forever before HTTP started. The same applied to Passport, Workspace and Studio initialization.

A shared SDK recovery helper now bounds lookup to ten seconds, keeps null/session semantics distinct internally, returns only generic errors and discards late completion of the timed-out promise. Existing shared current-session callers preserve their previous null-on-unavailable contract; no new authenticated data is substituted. Passport initialization keeps its actor/revision guards. Workspace and Studio recovery use the same helper. This cannot cancel an SDK refresh already in progress: a later genuine Auth event is still processed through existing lifecycle handlers.

Configured Workspace initialization failure now clears cached team data and shows an unavailable screen with Retry and an explicitly separate fictional-demo link. It no longer automatically renders the local demo after a connected failure. Backend-disabled and intentionally selected demos remain available. Studio missing/failed role lookup retains no claimed team role, instead of describing an unconfirmed account as a viewer; existing database authorization and role permissions are unchanged.

Tests exercise never-settling and late-success/late-failure providers, synchronous/null/provider errors, value-free errors, and the actual Workspace/Studio initialization functions in isolated synthetic contexts. Existing account-switch regressions continue to execute the actual Passport runtime.

No schema, credentials, hosted configuration, production or paid-service change. Remaining audit item: Workspace's older Auth callback still awaits data operations inside the SDK callback and its data loads need full actor/epoch isolation. This is tracked for the next focused correction, not claimed fixed here. Hosted login/email/recovery, deployed Edge Functions and physical devices remain unverified.

Validation completed: 37 Node scripts, syntax gate, production build, 14 default browser suites at root/Pages, configured Plans/Friends/shortlists at both bases, genuine local Auth/feedback/restore, and Workspace reporting/authorization SQL passed. The Workspace/Studio initialization error cases are executed from actual source with synthetic boundaries; genuine hosted Workspace login is not claimed. No failing check remains in this correction.
