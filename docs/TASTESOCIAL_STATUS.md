# TasteSocial development status — 2026-10-21

The founder’s complete technical roadmap now orders consolidation → editable interests and specific catalog items → useful Together shortlists → authenticated mutual plans → consumer pilot → contributor tools, with nearby discovery/Circles/commercial work gated by evidence and safety. It supersedes historical B2B-first priorities. No roadmap phase authorizes live activation, personal-data collection, merging, deployment, paid infrastructure or public social launch.

## Consolidated review build

Branch `integration/tastesocial-development` starts at #15 `84dcb6a`, which already contains #14 `5467397` and #13 `155eef4` in order. All three remote checks passed when inspected; main is still `acca63e`. No merge conflict/cherry-pick was needed. Original dirty checkout and prior PRs are preserved; security SQL is identical to #13. ML PR #7 remains separate.

`npm run review` provides a temporary local production preview at `/tasteprint/` with backend configuration cleared. It does not push/deploy anything or require an external preview service. `npm run test:browser` builds and runs all four browser suites at both root and Pages paths, with server readiness, strict ports and cleanup. CI now validates review PRs regardless of their base branch, so stacked work cannot silently miss checks. Pages deployment workflow is unchanged.

Verified locally: six module entries, Escape completion/share, Passport and Next Moves, Studio edited preview, campaign reports/error contracts, business/campaign routing, questionnaire Back/progress/contrast, Together share in separate contexts and explicit local plan simulation. Desktop/mobile responsive, reduced-motion and keyboard checks use Chromium. Full JS/build/SQL and both-base-path browser validation are required for this branch.

Remaining dependencies: real iOS/Android QA; a pair-based usefulness study; source freshness and maintained real catalogs; approved Auth/DB staging with participant-scoped RLS, immutable version approvals, expiring/revocable invitations and direct API denial tests. Existing real backend sync/reporting is source code, not certified hosted functionality. No real user pilot, public social network or partner fulfillment is active.

## Subsequent safe increments

#17 adds private editable interests and specific film discovery without altering old Passport history/sync. The Together item increment replaces generic ideas with the same catalog, actual explicit overlap and selected-item snapshots; real mutual persistence remains gated. Preview defaults to browser-safe port 4193 (4190 is blocked by fetch/browser policy). Local review and CI use the same temporary production-build runner. Current source references have not been verified because publisher fetches are blocked; no fake availability or live inventory is substituted. The next milestone is source review plus a narrow pair decision walkthrough, followed by approved account-backed staging; later roadmap phases are not marked complete.

## Company direction update

The founder requested company-owned taste profiles, official website links and relevant event/product/activity posts. A local-only company adapter/editor preserves hotel campaigns, reuses explicit Passport interests and organic catalog matching, and treats ownership verification separately from listing truth/freshness. This does not change the next consumer priority: secure mutual plans. Production verification/publishing, personal data and external infrastructure remain unapproved.

## Private Plans consumer increment

The next isolated branch implements the consumer invitation/Plans screens, own-account responses, revision review, rescheduling/cancellation, private calendar/JSON export and block/unblock/deletion controls on top of the private-plan foundation. The default build stays explicitly disabled. A source-view browser harness uses synthetic two-participant transport; real PostgreSQL authorization and transport contracts are tested separately. This is not hosted or real-device certification. `PRIVATE_PLANS_UI_REVIEW.md` records exact boundaries and `SOCIAL_STAGING_APPROVAL.md` narrows the next external approval to synthetic private-plan staging. Current browser runner has seven suites at each base path. Real identity UX, selective privacy removal/retention, gateway limits, source verification and approved two-device testing remain ahead of any real pilot. Nearby discovery, Circles and paid/commercial expansion remain later.

### Next ordered work, with honest phase boundaries

1. Review the stacked PRs as one development build; do not merge until explicitly approved. Consolidation/code checks are local evidence, not production certification.
2. Rehearse the gated UI against approved synthetic hosted Auth/PostgREST; identity comprehension, recovery, lost responses and actual session behavior are not proven by the source-view harness.
3. Finish selective participant export/removal, approved retention and abuse/rate-limit operations before collecting any real social data. Current creator/account deletion removes the whole shared record.
4. Verify a narrow set of real catalog sources and practical metadata. Six named film references are useful specific items but not a maintained local venue/events inventory; unavailable source access is not freshness verification.
5. Validate the complete Discover → Together → Plans decision on actual iOS/Android, keyboard and a founder-approved small friend-pair pilot. No user-value/attendance/repeat-use evidence exists yet.
6. Use that evidence to prioritize persisted shared shortlists, richer Passport/account sync and contributor catalog administration. Current selected-item links are snapshots, not a synchronized collaborative shortlist.
7. Only then revisit opt-in nearby discovery/Circles and real company verification/publishing. Website links and locally matched offerings already have a fictional prototype; ownership checks, authorized content and merchant fulfillment are not implemented.

This completes more local implementation of the plan/privacy/calendar parts of the roadmap, not whole account, MVP, social-network or commercial phases. Scheduling remains unapproved and no recurring tasks are configured.
