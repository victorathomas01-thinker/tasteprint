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

The configured Plans follow-up closes the local integration gap between browser runtime, the shared Auth client and REST/RPC transport. A fully intercepted synthetic production-bundle suite now runs at both base paths, including actual download and shared-client logout behavior. It caught and fixed initial account recovery clearing the Plans screen. All default review builds remain disabled; no actual JWT/RLS/hosted or physical-device certification is claimed. Existing Passport read/prune calls are explicitly represented, not silently ignored.

The privacy lifecycle follow-up adds gated participant whole-record erasure, complete paginated participation export with blocked-content redaction and explicit old unclaimed-invitation cleanup. These are locally tested controls, not a complete approved retention/account-privacy program. The proposed whole-record policy still requires review before real use. Block relationships are not erased when a plan is removed, and no recurring job is installed. See `PLAN_PRIVACY_LIFECYCLE.md`. This advances Phase 4 foundations while hosted integration, broader privacy operations, catalog verification and real-device/pair validation remain outstanding.

The recovery increment adds a CI gate for an isolated synthetic backup/teardown/restore rehearsal: safe refusal, transactional abort on unexpected dependencies, conflict failure without partial restore, complete-row fingerprint equality, reapplication and post-restore permissions/behavior. No application functionality, migrations, hosted service, scheduled job or deployment is activated. `SOCIAL_RECOVERY_REHEARSAL.md` records local evidence and the remaining provider/Auth/JWT/operational gates. Phase 4 remains development-ready groundwork rather than certified hosted operation.

The founder approved PR #24 synthetic-only staging under the documented restrictions. Execution is waiting for a dedicated Free-plan project and staging-only credentials, not another approval of the same scope. `STAGING_PROJECT_SETUP.md` records requirements and the handoff. Production/real data, paid or unrelated services and public deployment remain unapproved. Hosted tests have not run.

Full-roadmap execution now tracked requirement by requirement in `TASTESOCIAL_EXECUTION.md`. Discovery detail/deep-link/filter milestone adds source-aware individual item pages and duration/distance/availability/category controls. All Node/build, root/Pages browser, configured synthetic Plans and local SQL/recovery gates passed; no hosting, merge, account activation or deployment occurred.

Catalog workbench: structured local editing, strict atomic CSV/JSON imports, draft/review/approval/withdrawal, manual source verification dates, stale exclusion, history and exports now work on a separate review branch. No authenticated role or publishing claim. All 27 Node suites, syntax gate, build and eight root/Pages browser suites passed; intercepted configured Plans builds passed. See `CATALOG_CONTRIBUTOR_GUIDE.md`. Next correctness issue: remove unsupported legacy Escape/challenge compatibility percentages found during full audit.

Truthful comparison correction: legacy same-phone Escape and cross-device challenge no longer display arbitrary compatibility percentages or a fixed progress ring. Actual quiz dimension counts/differences replace them; links/scoring/Passport are preserved. All 28 Node suites, syntax/build, nine root/Pages browser suites plus the final-CSS focused root check and both intercepted configured Plans builds passed. No data or infrastructure changes.

Private friend connections now have review-only SQL/client/UI: expiring one-use invite, recipient claim, explicit sender confirmation, selected-only sharing, block, redacted export and removal. The default build is gated off. Both Plans and Friends now bind each rendered action to its displayed account before any request. All 29 Node suites, syntax/build, ten default browser suites at both bases, both configured feature builds, local SQL/races and scoped plan/friend recovery tests passed. No hosted activation; Friends is outside the exact PR #24 approved staging scope. Next: authenticated shared shortlist → jointly selected option → private plan.

Persistent Together shortlist code now joins confirmed Friends to Plans: immutable suggestions, independent interest/current choices, atomic one-plan conversion, separately approved time/place, private calendar export and fresh repeat proposals. Connected builds remove simulated participant actions. Direct SQL tests cover separate connections, Auth deletion, block redaction, erasure without resurrection, 50-option caps, concurrent conversion and parent/child restore with unrelated data fingerprints. 31 Node suites, syntax/build, eleven default browser suites and all three configured bundle suites at both bases passed, plus all local SQL/recovery gates and 3 ML tests. Source and screenshots: `SHARED_SHORTLIST_REVIEW.md`. Next priority is legacy Passport account-change safety and bounded Auth recovery, followed by genuine local Auth/API integration while hosted setup is pending. No merge, deployment or external activation.

## Account boundary correction

Passport operations now bind initiating accounts across asynchronous requests; late old-account results cannot clear or overwrite new local state. Initial Auth recovery is ordered, new quiz results survive merges, clear/delete exclude concurrent sync, and private social routes do not automatically access the unrelated Passport table. Transport deadlines cover Auth recovery and JSON parsing. See ACCOUNT_OPERATION_REVIEW.md and the full execution ledger. Hosted recovery and real-device behavior remain unverified.

## Genuine local account integration

The previously failing local Auth harness now passes with genuine Supabase Auth sessions, PostgREST authorization and separate mobile browser contexts. Two fixture accounts independently choose and approve the same versioned plan; invalid/nonmember access is denied and real local Auth deletion cascades social records. No backend interception, external services or real participants. See LOCAL_AUTH_REVIEW.md for reproduction and the important remaining email/hosted/Edge/physical-device limitations.

## Public build and loading

Build-time checks now prevent accidental private VITE credentials from entering browser output. Account-free routes no longer request the optional Supabase SDK; the actual production network test covers six routes. Configuration/deployment in production is unchanged. See PUBLIC_BUILD_REVIEW.md for evidence and limitations.

## Private reflection

Participants can optionally save their own attendance, enjoyment and repeat intent after an agreed plan's start. Each answer is private to its author and tied to the exact revision; independent export/removal works even when blocked. Server enforcement and genuine disposable Auth/browser/restore tests cover the boundary. A repeat intent links to choosing another idea, without inventing consent. This remains a default-off review feature; see PRIVATE_REFLECTION_REVIEW.md. No hosted or real-user collection.

## Consumer navigation and Saved

Discover, Together, Friends, Plans, Saved and Passport now have direct header links. Campaigns, Next Moves and business tools remain under keyboard-accessible More. Saved contains deliberately saved catalog ideas and links to current details; assessment recommendations remain in Next Moves. Missing IDs and unreadable storage are preserved explicitly. The homepage offers discovery before an optional assessment. No backend/data migration or production change. See CONSUMER_NAVIGATION_REVIEW.md.
