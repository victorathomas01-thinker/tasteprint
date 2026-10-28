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

## Account recovery timeout

The SDK session lookup before private requests is now bounded, including Passport, Workspace and Studio startup. Connected Workspace failure is an explicit unavailable screen with retry, without automatic demo substitution. Studio unconfirmed membership no longer claims a viewer role. Further Workspace Auth-callback/account-switch isolation is the next security task; see AUTH_RECOVERY_REVIEW.md.

## Workspace account boundary

Workspace Auth work now runs outside the SDK callback lock and stays bound to its initiating account/team. Old responses cannot restore previous private team data or tab titles, and inaccessible team links do not pick a different team. Genuine local browser invitation, editor role, removal and sign-out are verified. SQL now supports Supabase's managed crypto namespace and declares intended draft privileges explicitly, with positive/negative role tests. Business/Saved do not auto-sync unrelated Passport history; Saved also avoids anonymous page events. No hosted migration; Studio and legacy invitation return handling remain work. See WORKSPACE_ISOLATION_REVIEW.md.

## Studio team editing

The team bridge now mounts on the actual editor layout and remains idempotent. Hosted operations stay bound to their initiating account; stale work cannot overwrite newer local edits or continue publishing under another account. An editor can save another teammate's draft without changing its original creator, proven against genuine local Auth/PostgREST. Local/demo UI and disabled-editor publishing are also checked. No hosted publishing or new migration. Remaining concurrency/email/physical-device limits are in STUDIO_ISOLATION_REVIEW.md.

## Attendance usability correction

Private feedback no longer retains enjoyment after “did not attend.” The separate shared self-report action explains friend visibility and is unavailable before the agreed start, with server enforcement. Full automated validation and genuine synthetic local service flow passed; see ATTENDANCE_REVIEW.md. No hosted migration or actual attendance verification. Next: private in-app updates, then remaining catalog/account/pilot gaps in the execution ledger.

## Private in-app updates

More → Updates provides optional shared friend/plan activity, independent seen status, upcoming agreed dates, visible-data export and erase-on-disable. Default-off and per-account opt-in. Private reflection answers never emit notices. Local SQL, injectable browser and genuine two-account Auth/PostgREST checks cover authorization, persistence, erasure and account isolation. No email/push/background reminders or hosted activation. See PRIVATE_UPDATES_REVIEW.md; next independent work is authenticated catalog contribution/review.

## Account-based catalog contribution and review — 2026-10-26

The local workbench now links to a default-off account-bound team queue. Synthetic accounts have completed structured local editing, explicit upload, independent review and separate publication to the public catalog API. Authors cannot approve or publish their own records; edits invalidate publication, stale source checks are excluded and removal/history are version guarded. No role is assigned automatically and no catalog role grants private user-data access. Consumer Discover/Together still use bundled references in this milestone. See CATALOG_TEAM_REVIEW.md for validation, scoped recovery and limitations. No hosted schema or real listing was activated. Next: connect consumer discovery to reviewed catalog data.

## Reviewed listings reach consumer discovery — 2026-10-26

An optional consumer gate now reads the reviewed public catalog for Discover, Saved, Together, shortlist candidates and selected-item plan prefills. Anonymous reads carry no personal preferences or user credentials; ranking stays local. Empty, failed and withdrawn records have distinct honest states, with no fallback to private drafts or bundled examples. Existing plans remain usable independently. Real local publication → anonymous discovery/save → withdrawal and authenticated source-link prefills passed; configured root/Pages tests also cover two-browser selected sharing, group suggestions and recovery. No maintained real catalog or hosted activation is claimed. See REVIEWED_CATALOG_DISCOVERY.md; next independent milestone is private cross-device interest/save persistence.

## Private interest/save copies across sessions — 2026-10-26

Passport can explicitly save, restore, export and erase an account copy of interests, sharing choices and saved/hidden IDs. Conflicts, newer/unsaved device edits and account changes are guarded. Clearing Passport atomically erases the account choice copy and quiz history; erasure markers stop late writes and tested non-overwriting archive restoration. Real local Auth sessions verified copies, actual quiz download, other-user preservation and a delayed restore versus clear. These are manual copies, not automatic merging. Source private page analytics are excluded and a forced-order regression protects unavailable campaigns from late default rendering. Full local suite/build/browser/SQL evidence and limits are in PRIVATE_PREFERENCES_REVIEW.md. No hosted activation, actual-device or real-user claim.

## Practical requirements for both people — 2026-10-26

Default-off shared shortlists now let each person explicitly share budget, duration, access, availability and interest exclusions. The other person can read but cannot alter these requirements. A material change clears both choices; unknown or stale facts cannot pass hard limits. Current reviewed identity/facts are enforced again by the database for choosing and proposing, including rejection of old API bypasses. Existing plans stay separate. Owned genuine two-account Auth/API/browser flow and SQL authorization/atomicity tests passed; full production preview compatibility checks are recorded in SHARED_SHORTLIST_REQUIREMENTS.md. No real catalog, hosted migration, precise location or actual availability guarantee. Shared distance remains deliberately pending a reliable reference-origin design. Next: verify account sign-in return links with genuine local Auth, then remaining recovery/reproducibility and pilot gaps.

## Genuine one-time sign-in returns — 2026-10-26

Local generated links now exercise actual Auth redirects and browser SDK callback handling, including durable sign-out, reused/expired links and preservation of an existing valid session. Failed returns show a fixed accessible notice and remove provider error/credential parameters. A failed team return cannot silently accept an invitation as the existing account; a fresh successful return preserves the intended claim flow. New team invitations default to read-only Viewer. Root/Pages evidence and email/hosting/device limitations are recorded in AUTH_RETURN_REVIEW.md. This does not prove actual email delivery or activate a hosted service. The earlier reflection confirmation race found in CI was corrected on the shared parent branch with a pending-write regression. Next independent work: prevent overlapping Studio editors from silently overwriting one another’s team drafts.

## Team draft conflict protection — 2026-10-28

Updated Studio saves against the loaded team version, so an older editor cannot silently replace a newer draft through this UI. Conflicts preserve visible edits and browser backups; exporting, deliberately reloading and retrying works. New IDs insert without overwriting a racing creator. A small separately approved migration advances revisions on all updates while retaining existing RLS/identity controls. Genuine root/Pages Auth/API/browser checks cover stale saves and a concurrent race with exactly one winner. See STUDIO_DRAFT_CONFLICTS.md for verification and older-writer/hosted publishing limits. The latest sign-in correction also handles fragment-only returns and preserves typed Workspace fields. No main merge, deployment or external migration.

## Integrated consumer review — 2026-10-28

The consolidated development branch now combines the review stack through Studio conflict protection with six actual keyboard assessment journeys and campaign-route corrections. A delayed-paint focus defect found by CI was reproduced with controlled animation callbacks and fixed; all six results persist into Passport. All 20 browser suites passed at root and Pages paths, alongside full unit/build/syntax, local SQL/recovery and genuine two-account root/Pages evidence. See INTEGRATION_REVIEW_2026-10-28.md for exact scope, the earlier failed browser attempt, follow-up branches and outstanding external/physical/pilot requirements. No main merge or deployment.

## Transactional campaign publication — 2026-10-28

A real legacy service-upsert takeover was reproduced in a rolled-back disposable fixture. The new service-only publication transaction locks role and public-ID ownership, requires current saved team contents and commits public/team records together. Losing concurrent tenants and failed second writes leave both records safe. Studio follows the acknowledged revision for the next edit. The actual handler/SDK/local Auth/API/browser publish→edit→archive flow passed at root and Pages, alongside SQL, full unit/build/syntax and Deno publisher type checking. See ATOMIC_CAMPAIGN_PUBLICATION.md for exact runtime boundaries and the separate default browser matrix result. Hosted migration/Edge deployment and independent brand verification remain unapproved/unverified.
