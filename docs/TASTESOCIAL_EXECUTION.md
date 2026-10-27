# TasteSocial full-roadmap execution ledger

Updated 2026-10-26. Specification: `TASTESOCIAL_BUILD_BIBLE.md` plus the founder’s ordered 126-requirement roadmap. Latest explicit execution mandate supersedes historical milestone pauses; production/external/data/merge restrictions remain. This ledger does not claim launch readiness.

Baseline: latest complete review tip `d3dec6a` (PR #25), descending from #9–#24. `main` remains `acca63e`. Original dirty `/workspace/tasteprint` is untouched. All review PRs remain unmerged.

Codes: **C** implemented on review branches with local evidence (not deployed); **P** partial, prototype, or lacking connected verification; **M** missing independent engineering work; **B** external input/permission/evidence required. A B row does not imply all related engineering is blocked.

## Dependency-ordered execution

1. Preserve secure integration and regression coverage; fix reproducible errors first.
2. Complete usable individual discovery: item detail/deep links, catalog validation, constraints, saved items and accessible navigation.
3. Build practical catalog contribution/import/review/history, keeping unpublished data out of recommendations.
4. Complete reflection and feedback, consented preference handling, and repeat-plan entry without attendance claims.
5. Secure friend identity/connections, shared shortlist persistence and in-app notifications; extend direct-API and deletion tests.
6. Complete staging harness/account recovery once the dedicated Free project and credentials arrive. Continue independent engineering while waiting.
7. Integrate mobile end-to-end journey and performance/accessibility/security audit; gather physical-device and founder-approved pilot evidence.
8. Build invitation-only group/recurring features after pair identity/state foundation; keep public directory disabled until safeguarding is operational.
9. Extend business ownership/review/catalog workflow; offers/sponsorship/billing stay inactive until actual merchant authorization and evidence.
10. Evaluate expansion/ML/integrations against pilot evidence rather than inventing demand.

## Requirement-by-requirement status (baseline plus verified milestones)

| # | Requirement | State | Existing evidence / remaining gap |
|---|---|---|---|
| 1 | Review PR dependencies | C | PRs #9–#16; scripts/check-{campaign,workspace,navigation,phase0-browser}.js; scripts/check-workspace-reporting.sh |
| 2 | Stable integration branch | C | PRs #9–#16; scripts/check-{campaign,workspace,navigation,phase0-browser}.js; scripts/check-workspace-reporting.sh |
| 3 | Resolve overlapping changes | P | PRs #9–#16; scripts/check-{campaign,workspace,navigation,phase0-browser}.js; scripts/check-workspace-reporting.sh |
| 4 | Preserve functionality/security | C | PRs #9–#16; scripts/check-{campaign,workspace,navigation,phase0-browser}.js; scripts/check-workspace-reporting.sh |
| 5 | Local interactive preview | C | PRs #9–#16; scripts/check-{campaign,workspace,navigation,phase0-browser}.js; scripts/check-workspace-reporting.sh |
| 6 | Test routes/modules/social | P | PRs #9–#16; scripts/check-{campaign,workspace,navigation,phase0-browser}.js; scripts/check-workspace-reporting.sh |
| 7 | Visual/usability consistency | P | PRs #9–#16; scripts/check-{campaign,workspace,navigation,phase0-browser}.js; scripts/check-workspace-reporting.sh |
| 8 | Together dark design | C | PRs #9–#16; scripts/check-{campaign,workspace,navigation,phase0-browser}.js; scripts/check-workspace-reporting.sh |
| 9 | Responsive/keyboard/a11y/errors | P | PRs #9–#16; scripts/check-{campaign,workspace,navigation,phase0-browser}.js; scripts/check-workspace-reporting.sh |
| 10 | Actual status/dependencies | P | PRs #9–#16; scripts/check-{campaign,workspace,navigation,phase0-browser}.js; scripts/check-workspace-reporting.sh |
| 11 | Specific Passport interests | C | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 12 | Optional quick interest choices | C | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 13 | Editable sharing controls | C | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 14 | Legacy Passport compatibility | C | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 15 | Standard catalog architecture | C | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 16 | Catalog metadata | C | Structured fields and strict editor/server/public-read validation across supported categories; source/availability unknowns remain explicit. CATALOG_TEAM_REVIEW.md and REVIEWED_CATALOG_DISCOVERY.md; maintained real sources remain pending. |
| 17 | Ingestion/dedupe/removal | P | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 18 | Specific item ranking | C | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 19 | Evidence-based explanations | C | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 20 | Hard exclusions | P | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 21 | No fabricated matches/listings | C | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 22 | Independent nonpartner ranking | C | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 23 | Polished Together flow | P | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 24 | Friend preference comparison | P | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 25 | Overlap and differences | P | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 26 | Shared specific shortlist | C | PRs #29–#31; Friends/shortlist/plan code, SQL authorization/race/restore suites and LOCAL_AUTH_REVIEW.md genuine local JWT/browser evidence. Hosted installation and real-device validation remain pending. |
| 27 | Suggest/save/dismiss/interest | C | PRs #29–#31; Friends/shortlist/plan code, SQL authorization/race/restore suites and LOCAL_AUTH_REVIEW.md genuine local JWT/browser evidence. Hosted installation and real-device validation remain pending. |
| 28 | Group recommendation ranking | C | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 29 | Fairness across participants | C | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 30 | Explain group suitability | C | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 31 | User-added ideas | C | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 32 | Mutual decision workflow | C | PRs #29–#31; Friends/shortlist/plan code, SQL authorization/race/restore suites and LOCAL_AUTH_REVIEW.md genuine local JWT/browser evidence. Hosted installation and real-device validation remain pending. |
| 33 | Remove simulated remote actions when authenticated | C | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 34 | Useful without social network | C | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 35 | Staging Auth/database audit | P | PRs #20–#25; supabase/social-plans.sql + social-plan-privacy.sql; private-plans-client.js; plans-view.js; SQL/direct API/recovery and intercepted browser suites |
| 36 | Costs/migration/rollback documentation | C | PRs #20–#25; supabase/social-plans.sql + social-plan-privacy.sql; private-plans-client.js; plans-view.js; SQL/direct API/recovery and intercepted browser suites |
| 37 | Reliable Auth/Passport sync | P | Genuine local password/refresh Auth, quiz history download and explicit private interest/save copies across separate same-user sessions; PRIVATE_PREFERENCES_REVIEW.md. Hosted/email recovery and real devices pending; preference copies are manual, not automatic merging. |
| 38 | Account-free discovery | C | PRs #20–#25; supabase/social-plans.sql + social-plan-privacy.sql; private-plans-client.js; plans-view.js; SQL/direct API/recovery and intercepted browser suites |
| 39 | Secure friend invitations | C | PRs #29–#31; Friends/shortlist/plan code, SQL authorization/race/restore suites and LOCAL_AUTH_REVIEW.md genuine local JWT/browser evidence. Hosted installation and real-device validation remain pending. |
| 40 | Friend accept/remove/sharing | C | PRs #29–#31; Friends/shortlist/plan code, SQL authorization/race/restore suites and LOCAL_AUTH_REVIEW.md genuine local JWT/browser evidence. Hosted installation and real-device validation remain pending. |
| 41 | Backend persistent plans | C | PRs #29–#31; Friends/shortlist/plan code, SQL authorization/race/restore suites and LOCAL_AUTH_REVIEW.md genuine local JWT/browser evidence. Hosted installation and real-device validation remain pending. |
| 42 | Plan state machine | C | PRs #20–#25; supabase/social-plans.sql + social-plan-privacy.sql; private-plans-client.js; plans-view.js; SQL/direct API/recovery and intercepted browser suites |
| 43 | Same-version approval | C | PRs #20–#25; supabase/social-plans.sql + social-plan-privacy.sql; private-plans-client.js; plans-view.js; SQL/direct API/recovery and intercepted browser suites |
| 44 | Edit invalidates approval | C | PRs #20–#25; supabase/social-plans.sql + social-plan-privacy.sql; private-plans-client.js; plans-view.js; SQL/direct API/recovery and intercepted browser suites |
| 45 | Schedule/reschedule/cancel | C | PRs #20–#25; supabase/social-plans.sql + social-plan-privacy.sql; private-plans-client.js; plans-view.js; SQL/direct API/recovery and intercepted browser suites |
| 46 | No actor impersonation | C | PRs #20–#25; supabase/social-plans.sql + social-plan-privacy.sql; private-plans-client.js; plans-view.js; SQL/direct API/recovery and intercepted browser suites |
| 47 | Expire/revoke/block/access | C | PRs #29–#31; Friends/shortlist/plan code, SQL authorization/race/restore suites and LOCAL_AUTH_REVIEW.md genuine local JWT/browser evidence. Hosted installation and real-device validation remain pending. |
| 48 | RLS/direct API tests | C | PRs #29–#31; Friends/shortlist/plan code, SQL authorization/race/restore suites and LOCAL_AUTH_REVIEW.md genuine local JWT/browser evidence. Hosted installation and real-device validation remain pending. |
| 49 | Account deletion/export/retention | P | PRs #20–#25; supabase/social-plans.sql + social-plan-privacy.sql; private-plans-client.js; plans-view.js; SQL/direct API/recovery and intercepted browser suites; hosted Auth/PostgREST verification pending isolated staging project |
| 50 | Notifications | P | Opt-in private in-app friend/plan updates and upcoming-plan view, independent seen state; PRIVATE_UPDATES_REVIEW.md. No email/push/background delivery or shortlist-only notices. |
| 51 | Private calendar exports | C | PRs #20–#25; supabase/social-plans.sql + social-plan-privacy.sql; private-plans-client.js; plans-view.js; SQL/direct API/recovery and intercepted browser suites |
| 52 | Coherent mobile navigation | P | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 53 | Simple onboarding | P | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 54 | Search/categories/filter/details | C | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 55 | Save/suggest/share/plan actions | P | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 56 | Narrow reliable catalog | P | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 57 | Evaluate restaurant/coffee/activity categories | P | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 58 | Accurate maintained sources | P | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 59 | Post-experience feedback | C | Private per-account attendance/enjoyment/repeat intent, default-off; PRIVATE_REFLECTION_REVIEW.md, SQL/direct API/browser/restore evidence. Hosted and real-user validation pending. |
| 60 | Attendance evidence distinction | C | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 61 | Privacy-conscious funnel | P | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 62 | Real iOS/Android checks | B | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites; needs actual external setup, authorized participants/content, physical devices, moderation owner, or measured pilot evidence as applicable |
| 63 | Recovery/performance/a11y/browser checks | P | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites; hosted Auth/PostgREST verification pending isolated staging project |
| 64 | Resolve pilot usability friction | B | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites; needs actual external setup, authorized participants/content, physical devices, moderation owner, or measured pilot evidence as applicable |
| 65 | Catalog admin tools | C | Local structured workbench plus default-off account-bound team submission/review/publishing queue; CATALOG_TEAM_REVIEW.md. Consumer API integration and hosted activation pending. |
| 66 | CSV/bulk tools | C | Atomic local CSV/JSON preparation with explicit per-entry team upload; CATALOG_CONTRIBUTOR_GUIDE.md. No partial batch silently uploaded. |
| 67 | Dedupe/source checks | P | Client validation plus server canonical-source uniqueness/strict metadata/manual-source freshness. External source maintenance and rights verification still require human work; CATALOG_TEAM_REVIEW.md. |
| 68 | Last verified tracking | C | Explicit manual timestamps, validated against server time; independent review history, no auto-verification. CATALOG_TEAM_REVIEW.md. |
| 69 | Stale listing flags | C | Visible freshness plus server exclusion/approval-publication denial after 30 days. No scheduled maintenance job; CATALOG_TEAM_REVIEW.md. |
| 70 | Contributor/review roles | C | Scoped author/reviewer/publisher/admin RPCs, self-approval/publication denied even for admin, no signup/company privilege or role-escalation endpoint. Real local Auth/PostgREST evidence; CATALOG_TEAM_REVIEW.md. |
| 71 | Edit history/correction/removal | C | Exact-version workflow history, edits reset approval/publication, withdrawal and explicit own-record/history removal; local genuine scoped recovery. CATALOG_TEAM_REVIEW.md. |
| 72 | Private-data separation | C | No catalog grants to private social/Passport/Workspace data; public/editorial projections omit account IDs, no anonymous consumer analytics or unrelated Passport sync. Local authorization and browser evidence; CATALOG_TEAM_REVIEW.md. |
| 73 | Contributor entry instructions | C | CATALOG_CONTRIBUTOR_GUIDE.md now covers local and connected roles, independent review, publication, corrections and limits. No production admin access for contributors. |
| 74 | Opt-in public profiles | M | Private-plan blocks exist; public directory is absent and must stay disabled pending operational safeguards |
| 75 | Username/avatar/selected interests/region | M | Private-plan blocks exist; public directory is absent and must stay disabled pending operational safeguards |
| 76 | Explicit discovery opt-in | M | Private-plan blocks exist; public directory is absent and must stay disabled pending operational safeguards |
| 77 | Similar Tastes ranking | M | Private-plan blocks exist; public directory is absent and must stay disabled pending operational safeguards |
| 78 | Coarse geographic/interest filters | M | Private-plan blocks exist; public directory is absent and must stay disabled pending operational safeguards |
| 79 | Evidence-based commonality | M | Private-plan blocks exist; public directory is absent and must stay disabled pending operational safeguards |
| 80 | Mutual connection requests | M | Private-plan blocks exist; public directory is absent and must stay disabled pending operational safeguards |
| 81 | Activity-led introductions | M | Private-plan blocks exist; public directory is absent and must stay disabled pending operational safeguards |
| 82 | No private location/schedule leakage | C | Private-plan blocks exist; public directory is absent and must stay disabled pending operational safeguards |
| 83 | Adult eligibility | M | Private-plan blocks exist; public directory is absent and must stay disabled pending operational safeguards |
| 84 | Report/block/abuse/rate limits | M | Private-plan blocks exist; public directory is absent and must stay disabled pending operational safeguards |
| 85 | Moderation operations | B | Private-plan blocks exist; public directory is absent and must stay disabled pending operational safeguards; needs actual external setup, authorized participants/content, physical devices, moderation owner, or measured pilot evidence as applicable |
| 86 | Permissioned nearby pilot | B | Private-plan blocks exist; public directory is absent and must stay disabled pending operational safeguards; needs actual external setup, authorized participants/content, physical devices, moderation owner, or measured pilot evidence as applicable |
| 87 | Invitation-only Circles | M | Pair-only backend; generic catalog ranking supports >2 but no persisted group system |
| 88 | Interest-based Circles | M | Pair-only backend; generic catalog ranking supports >2 but no persisted group system |
| 89 | Multi-person comparison | P | Pair-only backend; generic catalog ranking supports >2 but no persisted group system |
| 90 | Recurring activities/shortlists/responses | M | Pair-only backend; generic catalog ranking supports >2 but no persisted group system |
| 91 | Repeat experience suggestions | M | Pair-only backend; generic catalog ranking supports >2 but no persisted group system |
| 92 | Private group management | M | Pair-only backend; generic catalog ranking supports >2 but no persisted group system |
| 93 | No follower/engagement farming | C | Pair-only backend; generic catalog ranking supports >2 but no persisted group system |
| 94 | Verified business profiles | M | Campaign Studio/Workspace and local company demo; no actual verified merchant or authorized offers |
| 95 | Business links/offerings | P | Campaign Studio/Workspace and local company demo; no actual verified merchant or authorized offers |
| 96 | Nonpartner organic eligibility | C | Campaign Studio/Workspace and local company demo; no actual verified merchant or authorized offers |
| 97 | Partner enhanced profiles | M | Campaign Studio/Workspace and local company demo; no actual verified merchant or authorized offers |
| 98 | Separate sponsored disclosure | M | Campaign Studio/Workspace and local company demo; no actual verified merchant or authorized offers |
| 99 | Generalize Campaign Studio | P | Campaign Studio/Workspace and local company demo; no actual verified merchant or authorized offers |
| 100 | Campaign-to-real-offering links | M | Campaign Studio/Workspace and local company demo; no actual verified merchant or authorized offers |
| 101 | No repeated brand quiz | C | Campaign Studio/Workspace and local company demo; no actual verified merchant or authorized offers |
| 102 | Brand/entertainment rights | B | Campaign Studio/Workspace and local company demo; no actual verified merchant or authorized offers; needs actual external setup, authorized participants/content, physical devices, moderation owner, or measured pilot evidence as applicable |
| 103 | Campaign review/publishing | M | Campaign Studio/Workspace and local company demo; no actual verified merchant or authorized offers |
| 104 | Aggregated merchant insights | P | Campaign Studio/Workspace and local company demo; no actual verified merchant or authorized offers |
| 105 | Permissioned business pilot | B | Campaign Studio/Workspace and local company demo; no actual verified merchant or authorized offers; needs actual external setup, authorized participants/content, physical devices, moderation owner, or measured pilot evidence as applicable |
| 106 | Authorized promotions | M | Campaign Studio/Workspace and local company demo; no actual verified merchant or authorized offers |
| 107 | Offer terms/expiry/limits | M | Campaign Studio/Workspace and local company demo; no actual verified merchant or authorized offers |
| 108 | Secure issuance/validation | M | Campaign Studio/Workspace and local company demo; no actual verified merchant or authorized offers |
| 109 | Referral/redemption abuse controls | M | Campaign Studio/Workspace and local company demo; no actual verified merchant or authorized offers |
| 110 | Merchant-confirmed redemption | B | Campaign Studio/Workspace and local company demo; no actual verified merchant or authorized offers; needs actual external setup, authorized participants/content, physical devices, moderation owner, or measured pilot evidence as applicable |
| 111 | Distinct conversion evidence | P | Campaign Studio/Workspace and local company demo; no actual verified merchant or authorized offers |
| 112 | Privacy-safe attribution | M | Campaign Studio/Workspace and local company demo; no actual verified merchant or authorized offers |
| 113 | Sponsored disclosures | P | Campaign Studio/Workspace and local company demo; no actual verified merchant or authorized offers |
| 114 | Evidence-led offer experiments | B | Campaign Studio/Workspace and local company demo; no actual verified merchant or authorized offers; needs actual external setup, authorized participants/content, physical devices, moderation owner, or measured pilot evidence as applicable |
| 115 | Billing only after demand | C | Campaign Studio/Workspace and local company demo; no actual verified merchant or authorized offers |
| 116 | Legitimate affiliate evaluation | B | Campaign Studio/Workspace and local company demo; no actual verified merchant or authorized offers; needs actual external setup, authorized participants/content, physical devices, moderation owner, or measured pilot evidence as applicable |
| 117 | Explicit/consented preference improvement | P | Evidence/approval gates retained; no claimed pilot, revenue, trained model or expansion |
| 118 | Real-user ranking evaluation | B | Evidence/approval gates retained; no claimed pilot, revenue, trained model or expansion; needs actual external setup, authorized participants/content, physical devices, moderation owner, or measured pilot evidence as applicable |
| 119 | ML only after evidence | C | Evidence/approval gates retained; no claimed pilot, revenue, trained model or expansion |
| 120 | Demand-led catalog expansion | B | Evidence/approval gates retained; no claimed pilot, revenue, trained model or expansion; needs actual external setup, authorized participants/content, physical devices, moderation owner, or measured pilot evidence as applicable |
| 121 | Repeat/group discovery | P | Evidence/approval gates retained; no claimed pilot, revenue, trained model or expansion |
| 122 | Integration evaluation | B | Evidence/approval gates retained; no claimed pilot, revenue, trained model or expansion; needs actual external setup, authorized participants/content, physical devices, moderation owner, or measured pilot evidence as applicable |
| 123 | Evidence-led geography | B | Evidence/approval gates retained; no claimed pilot, revenue, trained model or expansion; needs actual external setup, authorized participants/content, physical devices, moderation owner, or measured pilot evidence as applicable |
| 124 | Commercial/licensed expansion | B | Evidence/approval gates retained; no claimed pilot, revenue, trained model or expansion; needs actual external setup, authorized participants/content, physical devices, moderation owner, or measured pilot evidence as applicable |
| 125 | Native app only if justified | C | Evidence/approval gates retained; no claimed pilot, revenue, trained model or expansion |
| 126 | Ongoing privacy/security/performance/moderation | P | Evidence/approval gates retained; no claimed pilot, revenue, trained model or expansion |

## Active verification and blockers

- Latest PR #24 passed synthetic local PostgreSQL backup/restore, authorization and concurrency tests; it does not prove Supabase provider recovery. See `SOCIAL_RECOVERY_REHEARSAL.md`.
- Dedicated isolated Free Supabase project and securely supplied staging-only credentials remain missing. Exact requirements: `STAGING_PROJECT_SETUP.md`. No production credentials/data permitted.
- Real iOS/Android hardware, real-user research/recruitment, moderation ownership, merchant authorization, rights/licensing and paid/commercial operations require founder participation/approval. They cannot be truthfully replaced by mocks.
- No scheduled tasks, background service, deployment, merge or live-data collection has been enabled.
- Still-open engineering rows remain work, not external blockers. This document is updated per focused PR rather than marking a whole phase complete from a prototype.

## Milestone evidence log

- Baseline audit: reviewed AGENTS, both Bibles, existing status/PR stack, source contracts, tests, optional backend restrictions and dirty-worktree boundaries. Current implementation is a local-first development build with a substantial pair-plan backend, not a feature-complete public social platform.
- Discovery detail/constraint milestone: item pages, safe public deep links, persistent filter state, category/duration/distance/availability controls and malformed metadata rejection implemented. All 26 Node suites, build, root/Pages browser suites, both intercepted configured-Plan builds and all three SQL gates passed. See `DISCOVERY_DETAILS_REVIEW.md`. Hosted/real-device evidence remains absent.

Known limitations found in audit: the full app’s existing account-sync module still expects the separate Passport schema, so the approved social-only staging harness must isolate that module. The ~705 KB main bundle needs performance work. Private friend connection code has since been added (see milestone log); there is still no public directory, persistent shared shortlist, authenticated contributor roles, public safety operations or merchant-authorized promotion. These are tracked as outstanding work, not completed phases.

- Catalog workbench milestone: structured local editing, strict CSV/JSON atomic import, review notes, revision history, source date/staleness checks, withdrawal and reviewed export implemented. Authenticated contributor roles/publishing remain missing. See `CATALOG_CONTRIBUTOR_GUIDE.md`. All 27 Node suites, JavaScript syntax checks, production build and eight browser suites at both URL bases passed. Both configured Plans builds also passed with intercepted synthetic sessions; no SQL changed in this milestone.
- Full source audit found legacy Escape same-phone and challenge comparisons still display an arbitrary clamped compatibility percentage. Together does not. This defect was reproduced and corrected in the subsequent truthful-comparison milestone; historical finding retained here.

- Truthful comparison correction: removed clamped 43–98% human/travel match claims and a fixed 82% decorative ring from both legacy same-phone and cross-device challenge flows. Replaced them with explicit raw answer-dimension counts/differences and booking limitations. All 28 Node suites, syntax/build, nine browser suites at both bases, focused final-CSS root comparison and both configured Plans builds passed. See `PREFERENCE_COMPARISON_REVIEW.md`.

- Private friends milestone: hashed expiring one-use invite → authenticated claim → explicit inviter confirmation; independent selected sharing; blocks, redacted exports, revocation/removal and Auth cascades. Added disabled-by-default Friends route and per-request displayed-account binding to both Friends and Plans. All 29 Node suites, syntax/build, ten root/Pages browser suites, both configured Friends and Plans bundle suites passed; Workspace/social/privacy SQL, both invite races and local friend/plan restore checks passed. See `PRIVATE_FRIENDS_REVIEW.md`. Hosted Friends installation is outside PR #24 approval; no external schema applied. Shared shortlist and notifications remain missing.

- Shared shortlist milestone: confirmed pairs can add concrete sourced or participant ideas, independently express interest/choose, create one mutual-interest plan, then separately approve date/place in Plans. Explicit repeats start with fresh choices. Connected builds hide sample-person/simulated response controls, and private connection links never fall back to the unsigned demo. Shared Auth lifecycle now covers first-event logout and initial invite recovery. All 31 Node suites, syntax/build, eleven default browser suites at both bases, three configured production-bundle suites at both bases, local Workspace/social/privacy/direct API/concurrency/recovery gates and all 3 synthetic ML tests passed. See `SHARED_SHORTLIST_REVIEW.md`. No hosted or physical-device verification is claimed.

## Active audit findings to resolve next

- **Resolved in PR #31 — legacy account boundary:** optional Passport operations previously used the mutable global session across awaited requests. Account changes can affect which account receives merged data or which local state is cleared. Add operation-scoped actor/epoch guards and race regressions before any connected release. New private Plans/Friends/shortlist transports already bind each request to the displayed actor.
- **Resolved in PR #31 — recovery gap:** the shared HTTP deadline previously began after Auth session lookup, so a hung session lookup can leave a screen waiting. Bound the whole operation and reject late writes after timeout.
- **Scope/performance gap:** PR #31 removed automatic Passport sync on private social screens. The app still loads the optional Auth SDK with the default backend disabled. Isolate optional account behavior and measure loading.
- Next independent verification improvement: a disposable local Supabase Auth/PostgREST test stack can exercise genuine JWT/RLS flows while the dedicated cloud project remains unconfigured. Local-only synthetic testing does not activate cloud infrastructure or replace the approved hosted recovery tests.

- Account operation isolation: Passport sync/read/upsert/prune/clear and account deletion now capture the initiating actor and epoch, bind fresh session credentials before each HTTP call, discard late results, preserve quizzes completed during upload and prevent concurrent destructive merges. Auth subscription precedes initial recovery; private social routes no longer auto-sync unrelated Passport data. Shared HTTP deadline includes Auth lookup and JSON parsing, with no request after late Auth recovery. `scripts/check-account-isolation.js` executes the actual runtime with injected synthetic browser/provider boundaries. Remaining provider caveat: a client timeout cannot prove a server transaction was rolled back; hosted deletion/recovery and cross-device testing are still required.


- Genuine local Auth milestone: `npm run test:social:local` starts pinned disposable PostgreSQL, Supabase Auth and PostgREST on an internal network with no published container ports. A loopback-only proxy serves the configured production build. Genuine password-issued/rotated sessions enter separate browser contexts; no API interception. Two accounts choose the same catalog item, revise a proposal and independently approve that exact revision. Forged/expired JWTs, anonymous raw access and nonmember shortlist access fail; deleting a real local Auth fixture cascades its social records. This supersedes the earlier local harness initialization failure. Email delivery, hosted provider recovery, Edge Functions and physical phones remain unverified. See LOCAL_AUTH_REVIEW.md.

- Public build safety/loading: a Node-only Vite gate rejects undocumented public variables and private credentials before artifacts, with value-free errors. Both current publishable and legacy anon keys remain supported. Unconfigured production home/Discover/Passport/Plans/Friends/Together routes now skip the ~224 KB optional SDK chunk; observed distinct script responses across these routes total 510,585 bytes. Shared singleton remains used by configured builds. See PUBLIC_BUILD_REVIEW.md. Main bundle, hosted recovery, real device and field-performance work remain outstanding.

- Private reflection milestone: optional per-account attendance/enjoyment/repeat intent for exact agreed plan revisions after server-checked start time. Answers remain private, editable and exportable/removable even when blocked; no inferred partner attendance, ranking update, analytics or business conversion. Node, SQL authorization/clock/revision/cascade, injectable browser outage/erasure/late-response and genuine local Auth/PostgREST feedback/backup/restore evidence are in PRIVATE_REFLECTION_REVIEW.md. Default-off additive schema, outside PR #24 hosted approval. No real data collected; physical devices, hosted setup and actual usefulness remain unverified. Export over 10,000 answers needs pagination; retention is currently manual.

- Consumer navigation/Saved milestone: six primary destinations, secondary native More menu, immediate discovery before optional assessments, local catalog Saved page with current details, explicit unavailable IDs and preserved assessment Next Moves. Unreadable/newer saved data is left unchanged. Existing saved-only Discover query and campaign/private route precedence preserved. See CONSUMER_NAVIGATION_REVIEW.md. Mobile browser checks are not physical-device proof; local saves still lack approved cross-device syncing.

Next audit fix: private views look up the SDK session before their bounded HTTP transport. That initial recovery itself can hang. Bound shared SDK recovery and Passport initialization without changing actor/epoch guards; test a provider that never settles and late recovery. This is independent of the missing hosted project.

- Bounded SDK recovery: shared lookup and Passport/Workspace/Studio initialization now have a ten-second recovery deadline, late-promise isolation and generic errors. Configured Workspace failures clear team cache and show unavailable/retry instead of automatically rendering demo data; Studio failed/null role lookup has no claimed team role. Actual initialization-function regressions and existing Passport race tests are covered in AUTH_RECOVERY_REVIEW.md. No hosted activation.

Next security correction found during this audit: Workspace still performs awaited SDK/database work inside its Auth event callback, and older workspace data loads lack complete actor/epoch guards. Move work outside the SDK lock and reject old account/team responses. Studio account-change handling also needs review. These remain independent engineering work, not cloud-project blockers.

- Workspace isolation: synchronous Auth notifications with deferred actor-bound REST/RPC work, initial-session ordering, account/team generation guards, immediate data/tab-title clearing and no wrong-team/demo-owner fallback. Genuine local browser creation/invite/editor/revocation/logout now passes with real JWTs. Managed extensions-schema crypto and explicit campaign draft grants were required and fixed; SQL adds positive allowed editor access plus viewer/nonmember/cross-tenant denial and owner-token erasure. Business/Saved purpose guards prevent unrelated Passport sync and anonymous Saved telemetry. See WORKSPACE_ISOLATION_REVIEW.md. No hosted migrations/new tables. Studio late hosted operations and the legacy Workspace query-token/email-return flow remain subsequent engineering work, not completed claims.

- Studio isolation/team editing: corrected missing bridge mount, idempotent QA/team controls and hidden obsolete credential UI; actor-bound role/read/save/publish chain, early/late local-edit guards, explicit team reload and preserved original creator on editor upsert. Genuine local owner→editor collaboration now verifies metadata and role restrictions. See STUDIO_ISOLATION_REVIEW.md. No new migrations or deployed Edge/publication claim. Local drafts stay device-local; cross-editor server conflict detection remains missing.

Next usability correction: private reflection should clear/disable enjoyment when attendance changes to did-not-attend, and the older shared completion action must reject future agreed dates on both client and server. Existing reflection writes already enforce post-start server time; older shared completion does not yet. Address before notification/attendance funnel work.

- Attendance correction completed: private enjoyment clears/disables when not attended; the separate friend-visible self-report rejects future/missing dates on client and server and explains its visibility. Full Node/build/root+Pages/configured browser, local SQL/recovery and genuine local Auth/PostgREST evidence passed; see ATTENDANCE_REVIEW.md. No verified attendance/conversion claim. Next independent milestone: private opt-in in-app updates for shared invitations and plans; no email/push or external activation.

- Private in-app updates: default-off plus per-account opt-in, latest 500 source threads/30-day visible window, current-authority projection, independent seen sequence, erase-on-disable, no private reflection events, no business telemetry. Backend/browser validation and genuine local two-account evidence are in PRIVATE_UPDATES_REVIEW.md. No external delivery or hosted migrations. Next independent milestone: authenticated catalog author/reviewer roles and review workflow, preserving the local workbench and organic recommendations.

- Catalog team milestone: default-off account-bound drafts, separate author/reviewer/publisher roles, exact-version review/history, no self-approval, strict server metadata/source keys/freshness and public-only paginated read projection. Structured local drafts remain separate and explicitly transferred; existing local work is never silently replaced. See CATALOG_TEAM_REVIEW.md and CATALOG_CONTRIBUTOR_GUIDE.md for final validation and limits. No hosted activation or company verification. Next independent work is consumer loading of reviewed catalog entries, including withdrawn/missing/error behavior and source-aware group recommendations.

- Reviewed consumer catalog: default-off anonymous public reads, atomic bounded pagination, no bundled/private fallback, real current-item filtering/ranking across Discover/Saved/Together/plan prefills and persisted shortlist candidates. Withdrawn saved/shared IDs stay explicit snapshots; outage is not treated as removal. Source links survive proposal prefills without an action URL. See REVIEWED_CATALOG_DISCOVERY.md for Node/root+Pages/intercepted and genuine local evidence. No hosted changes or real content activated. Next independent work: account-private explicit interest/saved-item save/restore with conflict and account isolation safeguards.

- Private preference copies: default-off explicit save/restore/export/erase with own-only strict RPCs, conflict protection, revision tombstones, atomic quiz+choice clear, no private Passport analytics, preserved unsaved/newer device data and account/host isolation. Genuine separate same-user sessions and controlled delayed real restore/clear/archive tests passed; PRIVATE_PREFERENCES_REVIEW.md records evidence and remaining hosted/email/device limits. Campaign startup is also guarded against late default rendering over the unavailable screen. Next independent priorities are practical per-participant group constraints and completing authenticated sign-in/recovery verification before the pilot.
