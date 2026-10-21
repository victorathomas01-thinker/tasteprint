# Together prototype review

TasteSocial now takes consumer social discovery priority per the founder’s latest instruction and full Build Bible retained in TASTESOCIAL_BUILD_BIBLE.md. Older B2B-first plans remain historical; security and release gates continue to apply. PR #13 remains unmerged; this work stacks on Phase 0, without changing earlier PRs or original dirty work.

## Five-minute walkthrough

1. Open `?together=1`: dark Tasteprint UI, Passport-derived preferences or adjustable starting values. Choose the fields to include, create the link, copy and open in another browser context. No second quiz is required.
2. Recipient sees the shared fields and compares with their own values. Alternatively use the invented sample friend. Review three ranked editorial activity ideas and neutral differences. Exclude physically active ideas to demonstrate a hard constraint.
3. Save is personal and page-local. Suggest creates a local proposal. Or enter an actual film/activity title and optional HTTPS source; supplied sources are unverified, not platform listings.
4. Express your interest, explicitly simulate friend interest, propose date/place, then approve as each simulated participant. Only both approvals produce scheduled. Editing details invalidates both approvals. Withdraw/cancel, decline and self-report are separate states.
5. Reload: local plan disappears. The link contains only selected preferences, never the plan. No remote person was invited or agreed.

## Implementation seams

`together-core.js`: allowlisted preference projection/link codec, fair-minimum item ranking, explicit plan transitions. `together.js`: review-only route/UI and memory state. `together.css`: existing dark tokens/responsive controls. Navigation exposes only this functioning prototype; no speculative Similar Tastes tabs. Existing modules, Next Moves, campaigns and security SQL remain intact.

Catalog is three editorial activity formats, not fabricated venues/events. No license, inventory, availability, price, merchant affiliation or real-world safety claim. User-entered titles/links provide a concrete decision path but are not automatically ranked using invented metadata. Preferences are patterns, not claims of shared item-level interests. Ranking uses 60% weakest participant +40% mean fit, not people compatibility percentages; it needs pair testing.

## Next milestone and approval boundary

Next: founder walkthrough/pair feedback on whether choosing a concrete film/activity is easier than group chat. Then approve a minimal connected staging experiment, not a public launch. Reuse optional Supabase Auth; add only participant-scoped versioned plans/approvals and hashed scoped invites. Require anonymous/nonmember/blocked/expired/revoked/replayed/direct-API denial tests, two-account/two-browser checks, retention/deletion and abuse ownership before any real social data. No new project, migration, credentials or paid plan has been activated. Public stranger discovery stays disabled.

Evidence commands: `npm test`, `npm run build`, `bash scripts/check-workspace-reporting.sh`; Playwright `test:phase0:browser`, `test:together:browser`, `test:hospitality:browser`, `test:navigation:browser` using PLAYWRIGHT_CHROMIUM_EXECUTABLE and TASTEPRINT_TEST_URL. Run against built `/` and `/tasteprint/`. Screenshots in docs/screenshots/together. Physical phones, hosted Auth/PostgREST, external catalog freshness, real agreement and product demand remain unverified.

Local validation passed: 21 JS suites; root and Pages production builds; disposable PostgreSQL role/tenant/reporting checks inherited from integration; all four browser suites at both base paths. PR #14 CI passed at Phase 0 SHA 5467397. Browser checks also cover injection-safe custom titles, HTTPS source handling and no Together anonymous events. Existing build warns about the large main bundle; no framework/dependency rewrite was introduced. No physical-device or real pair study has occurred.
