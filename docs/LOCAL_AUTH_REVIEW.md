# Genuine local authentication and social integration

Run `npm install`, install Playwright Chromium (or set PLAYWRIGHT_CHROMIUM_EXECUTABLE), start Docker, then `npm run test:social:local`. Requires Node 22+, Linux access to its Docker internal bridge addresses and the three pinned public images. Docker may download missing images; no hosted project or paid service is created.

The runner creates an owned internal Docker network and three disposable services. Containers have no published host ports and no external egress through that network. A temporary HTTP proxy binds only to 127.0.0.1 and serves a production Vite build. Public signup, anonymous users, phone authentication and external delivery are disabled. All three accounts use synthetic.invalid addresses and random test-only passwords. Credentials live only in process memory and mode-600 files in an owned temporary directory; only the generated anon public key enters the bundle. It neither reads staging credentials nor uses production secrets. Cleanup removes only recorded container IDs, its network and its temporary files, including on handled interruption.

Images are pinned by digest in scripts/check-local-social-stack.js: PostgreSQL 17, supabase/gotrue v2.197.0 and PostgREST v14.18. Auth runs its actual migrations; the auth.uid helper then accepts PostgREST JSON claims as well as legacy individual claims. These migrations and a minimal bootstrap model do not represent the complete managed Supabase platform.

Verified with genuine services, without intercepted backend responses:

- Admin creates three disposable confirmed accounts; password sign-in and refresh rotation issue genuine sessions.
- Account-bound RPCs establish an independently confirmed friendship. Raw relationship access, an unrelated participant, forged signatures and expired tokens are denied.
- Two isolated mobile-sized browser contexts receive those genuine sessions and load the configured production application. This is seeded session recovery, not an email/password login form test.
- Friends → shared catalog suggestion → independent interests and choices → one private plan → revised date/place → independent approvals of revision 2. One approval leaves the plan unscheduled.
- Mobile plan route fits 375 pixels; no outside-origin browser requests or page errors.
- Actual local Auth deletion cascades the connection, shared shortlist and affected private plan. This is not the application's deployed delete-account Edge Function.

CI runs this after installing Chromium. Existing SQL, restore/concurrency and intercepted failure-injection suites remain complementary.

Still unverified: hosted Supabase settings/networking/provider backup and recovery, email sign-in/delivery/account recovery, deployed Edge Functions, production upgrades, physical iOS/Android and real participant usefulness. The dedicated staging project is still required for the separately approved PR #24 hosted recovery rehearsal. Newer social schemas are outside that hosted approval; nothing here applies them to a cloud project.
