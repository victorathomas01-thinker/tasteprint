# TasteSocial full-roadmap execution ledger

Updated 2026-10-21. Specification: `TASTESOCIAL_BUILD_BIBLE.md` plus the founder’s ordered 126-requirement roadmap. Latest explicit execution mandate supersedes historical milestone pauses; production/external/data/merge restrictions remain. This ledger does not claim launch readiness.

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

## Requirement-by-requirement baseline

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
| 16 | Catalog metadata | P | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 17 | Ingestion/dedupe/removal | P | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 18 | Specific item ranking | C | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 19 | Evidence-based explanations | C | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 20 | Hard exclusions | P | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 21 | No fabricated matches/listings | C | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 22 | Independent nonpartner ranking | C | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 23 | Polished Together flow | P | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 24 | Friend preference comparison | P | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 25 | Overlap and differences | P | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 26 | Shared specific shortlist | P | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 27 | Suggest/save/dismiss/interest | P | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 28 | Group recommendation ranking | C | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 29 | Fairness across participants | C | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 30 | Explain group suitability | C | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 31 | User-added ideas | C | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 32 | Mutual decision workflow | P | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 33 | Remove simulated remote actions when authenticated | P | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 34 | Useful without social network | C | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 35 | Staging Auth/database audit | P | PRs #20–#25; supabase/social-plans.sql + social-plan-privacy.sql; private-plans-client.js; plans-view.js; SQL/direct API/recovery and intercepted browser suites |
| 36 | Costs/migration/rollback documentation | C | PRs #20–#25; supabase/social-plans.sql + social-plan-privacy.sql; private-plans-client.js; plans-view.js; SQL/direct API/recovery and intercepted browser suites |
| 37 | Authentication/Passport sync | P | PRs #20–#25; supabase/social-plans.sql + social-plan-privacy.sql; private-plans-client.js; plans-view.js; SQL/direct API/recovery and intercepted browser suites; hosted Auth/PostgREST verification pending isolated staging project |
| 38 | Account-free discovery | C | PRs #20–#25; supabase/social-plans.sql + social-plan-privacy.sql; private-plans-client.js; plans-view.js; SQL/direct API/recovery and intercepted browser suites |
| 39 | Secure friend invitations | M | PRs #20–#25; supabase/social-plans.sql + social-plan-privacy.sql; private-plans-client.js; plans-view.js; SQL/direct API/recovery and intercepted browser suites; hosted Auth/PostgREST verification pending isolated staging project |
| 40 | Friend accept/remove/sharing | M | PRs #20–#25; supabase/social-plans.sql + social-plan-privacy.sql; private-plans-client.js; plans-view.js; SQL/direct API/recovery and intercepted browser suites; hosted Auth/PostgREST verification pending isolated staging project |
| 41 | Backend persistent plans | P | PRs #20–#25; supabase/social-plans.sql + social-plan-privacy.sql; private-plans-client.js; plans-view.js; SQL/direct API/recovery and intercepted browser suites; hosted Auth/PostgREST verification pending isolated staging project |
| 42 | Plan state machine | C | PRs #20–#25; supabase/social-plans.sql + social-plan-privacy.sql; private-plans-client.js; plans-view.js; SQL/direct API/recovery and intercepted browser suites |
| 43 | Same-version approval | C | PRs #20–#25; supabase/social-plans.sql + social-plan-privacy.sql; private-plans-client.js; plans-view.js; SQL/direct API/recovery and intercepted browser suites |
| 44 | Edit invalidates approval | C | PRs #20–#25; supabase/social-plans.sql + social-plan-privacy.sql; private-plans-client.js; plans-view.js; SQL/direct API/recovery and intercepted browser suites |
| 45 | Schedule/reschedule/cancel | C | PRs #20–#25; supabase/social-plans.sql + social-plan-privacy.sql; private-plans-client.js; plans-view.js; SQL/direct API/recovery and intercepted browser suites |
| 46 | No actor impersonation | C | PRs #20–#25; supabase/social-plans.sql + social-plan-privacy.sql; private-plans-client.js; plans-view.js; SQL/direct API/recovery and intercepted browser suites |
| 47 | Expire/revoke/block/access | P | PRs #20–#25; supabase/social-plans.sql + social-plan-privacy.sql; private-plans-client.js; plans-view.js; SQL/direct API/recovery and intercepted browser suites; hosted Auth/PostgREST verification pending isolated staging project |
| 48 | RLS/direct API tests | P | PRs #20–#25; supabase/social-plans.sql + social-plan-privacy.sql; private-plans-client.js; plans-view.js; SQL/direct API/recovery and intercepted browser suites; hosted Auth/PostgREST verification pending isolated staging project |
| 49 | Account deletion/export/retention | P | PRs #20–#25; supabase/social-plans.sql + social-plan-privacy.sql; private-plans-client.js; plans-view.js; SQL/direct API/recovery and intercepted browser suites; hosted Auth/PostgREST verification pending isolated staging project |
| 50 | Notifications | M | PRs #20–#25; supabase/social-plans.sql + social-plan-privacy.sql; private-plans-client.js; plans-view.js; SQL/direct API/recovery and intercepted browser suites |
| 51 | Private calendar exports | C | PRs #20–#25; supabase/social-plans.sql + social-plan-privacy.sql; private-plans-client.js; plans-view.js; SQL/direct API/recovery and intercepted browser suites |
| 52 | Coherent mobile navigation | P | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 53 | Simple onboarding | P | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 54 | Search/categories/filter/details | C | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 55 | Save/suggest/share/plan actions | P | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 56 | Narrow reliable catalog | P | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 57 | Evaluate restaurant/coffee/activity categories | P | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 58 | Accurate maintained sources | P | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 59 | Post-experience feedback | P | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 60 | Attendance evidence distinction | C | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 61 | Privacy-conscious funnel | P | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites |
| 62 | Real iOS/Android checks | B | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites; needs actual external setup, authorized participants/content, physical devices, moderation owner, or measured pilot evidence as applicable |
| 63 | Recovery/performance/a11y/browser checks | P | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites; hosted Auth/PostgREST verification pending isolated staging project |
| 64 | Resolve pilot usability friction | B | PRs #17–#18; interests-core.js, catalog-core.js, discovery.js, together.js; check-discovery/check-together unit and browser suites; needs actual external setup, authorized participants/content, physical devices, moderation owner, or measured pilot evidence as applicable |
| 65 | Catalog admin tools | M | catalog-core.js/catalog.js and company editor; no authenticated contributor workflow yet |
| 66 | CSV/bulk tools | M | catalog-core.js/catalog.js and company editor; no authenticated contributor workflow yet |
| 67 | Dedupe/source checks | P | catalog-core.js/catalog.js and company editor; no authenticated contributor workflow yet |
| 68 | Last verified tracking | P | catalog-core.js/catalog.js and company editor; no authenticated contributor workflow yet |
| 69 | Stale listing flags | P | catalog-core.js/catalog.js and company editor; no authenticated contributor workflow yet |
| 70 | Contributor/review roles | M | catalog-core.js/catalog.js and company editor; no authenticated contributor workflow yet |
| 71 | Edit history/correction/removal | P | catalog-core.js/catalog.js and company editor; no authenticated contributor workflow yet |
| 72 | Private-data separation | P | catalog-core.js/catalog.js and company editor; no authenticated contributor workflow yet |
| 73 | Contributor entry instructions | M | catalog-core.js/catalog.js and company editor; no authenticated contributor workflow yet |
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

Known limitations found in audit: the full app’s existing account-sync module still expects the separate Passport schema, so the approved social-only staging harness must isolate that module. The ~705 KB main bundle needs performance work. No authenticated friend directory, shared shortlist, contributor roles, public safety operations or merchant-authorized promotions exist yet. These are tracked as outstanding work, not completed phases.
