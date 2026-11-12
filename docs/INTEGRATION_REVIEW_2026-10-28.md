# Integrated TasteSocial review build — 2026-10-28

Branch: `review/tastesocial-build-2026-10-28`, against unchanged main `acca63e`. This is a consolidated development review build, not a release or deployed site. It preserves the focused PR history, original dark Tasteprint design, six consumer modules, Passport, campaigns, Studio and Workspace. It combines the development stack through PR #47 with the independently based consumer journey fixes in #48. The separate reproducible-dependency branch adds a lock and CI installation control without changing application dependencies. No protected branch was updated.

## What a user can do

- Discover and save specific referenced items without an account, edit optional interests, retain existing quiz results and complete all six consumer assessments into Passport.
- Use reviewed catalog records when the optional backend gate is configured; stale/withdrawn/missing records and service failures are explicit. Nothing silently substitutes bundled examples for failed reviewed listings.
- In the locally configured synthetic build, use separate actual Auth accounts to connect, share selected interests, shortlist an item, state individual practical requirements and make version-bound mutual plans. Private feedback and opt-in in-app updates remain separate from business analytics.
- Save explicit private account copies of interests/saves across separate sessions; export or erase them without overwriting unrelated data or resurrecting old erased copies.
- Use owner/editor Studio collaboration without silently replacing a newer team draft or a deleted/recreated campaign. Local conflicting edits remain exportable; deliberate reload and retry work.
- Reach explicit campaign-unavailable screens even when a conflicting legacy quiz-module flag is appended. Delayed presentation work no longer steals deliberate keyboard answer focus.

## Verification evidence

Full unit tests, JavaScript syntax checks and production build passed. The syntax command is not style linting or TypeScript checking. All **20 default browser suites at both root and /tasteprint/** passed on the combined application code, using the fresh locked installation on the dependency branch. Each of the six real assessment journeys completes and contributes to the same Passport. A controlled-paint keyboard regression fails with the old code and passes with the fix. GitHub checks are green for focused PRs #47 and #48.

Reporting SQL, private-social SQL and backup/teardown/restore checks passed in owned disposable PostgreSQL. Genuine pinned local Auth, PostgREST, PostgreSQL and separate browser accounts passed at root and Pages base paths: credential-return cleanup, reused/expired link handling, durable logout, access isolation, public reviewed discovery, private copies, bilateral requirements/choices/plans, privacy operations, updates, creator preservation, Studio conflict/recreated-ID handling and a concurrent edit with exactly one winner. Synthetic fixtures only. This integration evidence predates the separate atomic publishing follow-up; that follow-up has its own review and verification.

The first combined browser attempt stopped on a preference-refresh click waiting for navigation; its exact mechanism was not traced. A later complete run on the corrected combined application passed every suite at both bases. The separate keyboard focus race was deterministically reproduced and fixed, not dismissed as a flaky test. The earlier failed attempt is not counted as passing evidence.

## Boundaries and remaining requirements

The default preview intentionally leaves backend features disabled. Configured browser fixtures are distinguished from genuine locally owned services. No hosted Supabase, actual email delivery, deployed Edge function, physical iOS/Android, assistive-technology certification, maintained real-city catalog, real-user retention, merchant verification or conversion is claimed. HTTP requests and local page checks do not prove those outcomes. The Bible ledger remains partial where these requirements need evidence or implementation.

The founder's existing hosted permission remains only PR #24 at `f4befb8b441d2c03751369b347b6158d6edb0108`. The dedicated isolated Free project and securely stored staging-only credentials are still needed; newer schemas need expanded approval before any hosted installation. Follow STAGING_PROJECT_SETUP.md. No infrastructure was activated, no personal/social data collected, no external outreach, no merge into main, no deployment and no paid service. Scheduling remains unapproved and is not configured.

Next independent engineering: finish the service-only atomic campaign publication follow-up and validate the actual Edge runtime. Then continue the remaining canonical-route, accessibility/performance and operational catalog gaps. A maintained catalog, named isolated staging and physical-device/user pilot evidence remain central launch requirements; public stranger discovery, Circles and monetization do not become launch-ready merely because the pair flow passes local tests.
