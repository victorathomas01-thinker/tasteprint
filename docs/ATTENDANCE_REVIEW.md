# Attendance usability correction

Private reflection now clears and disables enjoyment when attendance is not reported as attended. Switching back enables a new answer; stale enjoyment cannot be submitted. Client validation explains invalid answers without exposing backend responses.

The older friend-visible completion action is now labelled “Share that I went” with an explicit self-report note. Both the client action and database RPC reject completion before a valid agreed start time. This does not verify attendance or count as a business conversion. Existing private feedback remains private.

Validation: all 39 Node scripts, JavaScript syntax check, production build, 15 browser suites at root and Pages paths, and configured Plans/Friends/shortlist suites passed. Disposable local SQL authorization and recovery suites passed. Genuine local Auth/PostgREST/browser tests passed, including future-completion HTTP denial and persisted attended → did-not-attend → attended feedback transitions. Root fixtures only simulate elapsed time; no hosted service was activated.

Changed components: plans-core.js, plans-view.js, reflection-view.js, supabase/social-plans.sql and their Node/SQL/browser/genuine-stack regressions. Hosted migration, physical-device validation and actual follow-through remain unverified. Review-only SQL is outside the PR #24 staging approval.
