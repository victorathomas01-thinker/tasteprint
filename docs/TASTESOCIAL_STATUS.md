# TasteSocial development status — 2026-10-21

The founder’s complete technical roadmap now orders consolidation → editable interests and specific catalog items → useful Together shortlists → authenticated mutual plans → consumer pilot → contributor tools, with nearby discovery/Circles/commercial work gated by evidence and safety. It supersedes historical B2B-first priorities. No roadmap phase authorizes live activation, personal-data collection, merging, deployment, paid infrastructure or public social launch.

## Consolidated review build

Branch `integration/tastesocial-development` starts at #15 `84dcb6a`, which already contains #14 `5467397` and #13 `155eef4` in order. All three remote checks passed when inspected; main is still `acca63e`. No merge conflict/cherry-pick was needed. Original dirty checkout and prior PRs are preserved; security SQL is identical to #13. ML PR #7 remains separate.

`npm run review` provides a temporary local production preview at `/tasteprint/` with backend configuration cleared. It does not push/deploy anything or require an external preview service. `npm run test:browser` builds and runs all four browser suites at both root and Pages paths, with server readiness, strict ports and cleanup. CI now validates review PRs regardless of their base branch, so stacked work cannot silently miss checks. Pages deployment workflow is unchanged.

Verified locally: six module entries, Escape completion/share, Passport and Next Moves, Studio edited preview, campaign reports/error contracts, business/campaign routing, questionnaire Back/progress/contrast, Together share in separate contexts and explicit local plan simulation. Desktop/mobile responsive, reduced-motion and keyboard checks use Chromium. Full JS/build/SQL and both-base-path browser validation are required for this branch.

Remaining dependencies: real iOS/Android QA; a pair-based usefulness study; source freshness and maintained real catalogs; approved Auth/DB staging with participant-scoped RLS, immutable version approvals, expiring/revocable invitations and direct API denial tests. Existing real backend sync/reporting is source code, not certified hosted functionality. No real user pilot, public social network or partner fulfillment is active.

## Subsequent safe increments

#17 adds private editable interests and specific film discovery without altering old Passport history/sync. The Together item increment replaces generic ideas with the same catalog, actual explicit overlap and selected-item snapshots; real mutual persistence remains gated. Preview defaults to browser-safe port 4193 (4190 is blocked by fetch/browser policy). Local review and CI use the same temporary production-build runner. Current source references have not been verified because publisher fetches are blocked; no fake availability or live inventory is substituted. The next milestone is source review plus a narrow pair decision walkthrough, followed by approved account-backed staging; later roadmap phases are not marked complete.
