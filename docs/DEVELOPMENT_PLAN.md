# Tasteprint development plan and recurring-work proposal

Dated 2026-10-21. This is a reconciliation and approval proposal, not an activated schedule, release, or authorization to implement every roadmap phase. `TASTEPRINT_MASTER_BIBLE.md` is the founder's supplied v1.0 document, retained verbatim. This dated evidence supersedes stale factual assumptions in it; current founder instructions control scope.

## Current authorization update

The founder subsequently supplied `AUTONOMOUS_DIRECTIVE.md`, approving implementation of the Charlotte demo and safe, prioritized B2B/consumer/shared-engine development without waiting for a schedule. Its current instructions supersede the earlier implementation gates below. Merge, deployment, paid/external infrastructure, production data, real-user collection and customer outreach still require approval. Scheduled tasks have not been approved or configured. PR #9 is green and unmerged; hospitality work is isolated on a dependent feature branch, leaving the pre-existing dirty checkout untouched.

The Charlotte guest/operator demo, editable offers, Studio round-trip correction, local measurement and pilot/staging kits are now implemented on the hospitality branch. A separately isolated security branch corrects missing-role checks in privileged Workspace RPCs; both are review-only and depend on the unmerged foundation. Existing consumer scoring and all prior local landing work remain separate.

The earlier reconciliation and schedule remain historical evidence/proposals; they do not override this authorization update.

## Reconciliation

- Upstream `main`: `acca63e45dbde456aeb194088af6abde99ddf7dd` after a fresh fetch. Fix branch initially: `9852012aeeb1088955104eff952ba08eecfad084`, already pushed, no campaign-fix PR at the start of this review.
- The initial fix commit changed six files. `workspace-report-links.js` was already tracked on main; the commit imported it rather than adding it.
- `tasteprint_workspace_campaign_stats(uuid,text)` already exists in `supabase/workspace-reporting.sql`; a new duplicate RPC is unnecessary. It was omitted from the setup guide and previously checked membership/draft existence without enforcing the UI's report roles or public-registry ownership.
- Initial fixes for escaping, draft precedence, published-only lookup, unavailable campaigns and explicit report failure exist and have behavioral fixtures. Phase 0 now adds SQL role/ownership tests, aligns grants/installation documentation, bounds remote reads and rejects malformed lookup aliases.
- Existing uncommitted work is separate: README and app/feature links, index/styles/navigation/landing files, package navigation test wiring, UX architecture and the directory helper in `campaign-config.js`. Preserve all of it; do not include it in the campaign fix commit. The local homepage routes are not proof of the deployed homepage.
- Draft PR [#7](https://github.com/victorathomas01-thinker/tasteprint/pull/7) remains open: three ML cluster-count validation tests and a small guard. No reported status checks at review time. It is useful independent input validation, not a hospitality blocker or proof of ML product validity. Review separately; do not merge it into campaign work.
- No npm lockfile is committed. Dependency drift remains a reproducibility risk; propose a separate dependency-hygiene PR rather than silently changing dependency resolution in the campaign fix. A scheduled dependency audit must report missing/incomplete evidence instead of claiming a clean audit.
- GitHub API access now works. Existing PR validation is read-only test/build; Pages deploys on main push or manual dispatch. Nothing in this work merges or triggers Pages deployment.
- Daily/weekly/development schedules are **not configured**. No scheduled-agent tool is exposed in this environment. Existing GitHub Actions can run cloud checks after an approved workflow reaches the default branch; coding sessions need an approved agent runner or a supported desktop automation facility.

## Readiness, with evidence boundaries

| Capability | Actual readiness | Main risk | Priority | Next validation |
| --- | --- | --- | --- | --- |
| Six consumer modules, Passport, Next Moves | LOCAL / VERIFIED by regression and browser smoke tests | Physical-device usability; no fresh live certification | C | Preserve in every PR; real iOS/Android/share testing |
| New landing, campaign directory and business navigation | LOCAL / uncommitted | Not on main; documentation can overstate availability | B | Separate review of preserved work before authorized merge |
| Aster guest campaign / local Studio | LOCAL DEMO | Travel output needs hospitality-specific review | B | Five-minute guest/operator journey and mobile screenshots |
| Four campaign fixes | LOCAL / tested branch; pending review | Async published lookup, identity collisions, unsafe fields | A | Focused PR and reviewer checklist |
| Authenticated reporting RPC | BACKEND CODE ONLY; local PostgreSQL verified | PostgREST/Auth/RLS integration not verified in staging | A | Approved staging JWT + actor/tenant browser tests |
| Workspace publishing, invitations and team data | BACKEND CODE ONLY | No end-to-end deployed authorization evidence | A/B | Two-browser owner/editor/analyst + direct unauthorized API checks |
| Optional lead capture, account sync, deletion and retention | BACKEND CODE ONLY | Real PII lifecycle, production jobs unverified | A | Defer activation; staging consent/deletion/retention tests |
| Charlotte hospitality demo | LOCAL DEMO / approved implementation branch | No validated buyer/outcome yet | B | Approve the bounded demo below; founder interviews |
| ML lab / PR #7 | LOCAL synthetic research; draft PR | Not production ranking; no real-user evaluation | C | Independent cluster-input review and tests |
| Real bookings, revenue lift, paid SaaS and proven demand | UNVERIFIED / not established | Unsupported commercial claims | B for validation; defer features | Founder interviews and a permissioned measured pilot |

None of these rows should be relabeled LIVE/VERIFIED solely because unit tests pass. The founder previously reported Aster working after deployment; this review does not independently certify all public/live or hosted functionality.

## Dependency-ordered top 10 backlog

Effort is engineering time, not elapsed delivery promises. A = correctness/privacy; B = enables paid pilot; C = shared or evidenced consumer value.

| Order / ID | Work and acceptance gate | Class | Rough effort | Depends on | Founder input / credentials |
| --- | --- | --- | --- | --- | --- |
| 1 / TP-001 | Finish four campaign fixes, SQL role/ownership verification, install guide, tests and focused PR | A | 1–2 days; implementation in this PR | Existing branch | Founder review; no merge without approval |
| 2 / TP-002 | Reconcile and review the preserved landing/navigation slice separately; all deep links and six modules work under Pages base path | B/C | 0.5–1 day | TP-001 stable | Review of existing local work; release approval separately |
| 3 / TP-003 | Founder discovery kit: buyer/problem interview guide, offer intake, measurement agreement and draft pilot checklist | B | 0.5–1 day | Readiness inventory | Founder interviews 5–10 prospects; no automated outreach |
| 4 / TP-004 | Approved fictional Charlotte guest demo and operator walkthrough, following the slice below | B | 2–4 days | TP-001; demo approval | Approve demo scope; no hotel permissions needed for clearly fictional content |
| 5 / TP-005 | Catalog and guest UX hardening discovered by demo tests: safe links, sparse/no-match output, fit reasons, update provenance, mobile/a11y | A/B | 1–3 days | TP-004 | Founder evaluates usefulness; actual offer approvals later |
| 6 / TP-006 | Staging design + migration/runbook/rollback plan, complete actor/tenant test matrix and cost inventory | A/B | 1–2 days | TP-001, TP-004 findings | Approval of staging project/provider/budget before activation |
| 7 / TP-007 | Activate only approved staging components and prove Auth, publishing, public lookup, reporting and failure behavior end to end | A/B | 2–4 days | TP-006 approved | Secure credentials, Auth redirects/origins, explicit infrastructure approval |
| 8 / TP-008 | Pilot measurement: agreed event definitions, campaign-scoped starts/completions, defined denominators, missing-event caveats and owner summary | A/B | 1–2 days | TP-004, TP-007 | Buyer chooses primary outcome; no booking/revenue claims without evidence |
| 9 / TP-009 | Concierge onboarding for one real hotel: approved offers/assets, catalog import, distribution URL/QR, consent choice and 30-day support plan | B | 2–4 days engineering plus client dependency | TP-003, TP-005, TP-007, TP-008 | Signed pilot/terms, branding/offer permissions, launch approval |
| 10 / TP-010 | Review pilot and consumer evidence weekly; fix highest measured friction and decide repeatable onboarding vs revised offer | B/C | 0.5–1 day/week during pilot | TP-009 plus real usage | Founder/client feedback, renewal/payment evidence; new scope approval |

Keep new domains, frameworks, PMS/CRM, billing, generalized connectors, autonomous sales and production ML out of this queue until a validated requirement and approval exist. PR #7 can be reviewed separately without blocking hospitality work.

## First hospitality vertical slice — proposal, not implemented

Working label: **Demo Hotel CLT — fictional boutique hotel**. Proposed campaign ID: `charlotte-boutique-demo`. This is separate from Aster and must not imply a relationship with a real hotel or local operator.

### Guest journey

1. Open the branded demonstration page from a test URL or QR. State fictional/demo status and the benefit: choose a guest experience that fits the stay.
2. Answer approximately eight concise, hotel-relevant preference tradeoffs. Reuse Escape's ten dimensions and scoring contracts, adapting question copy/configuration rather than creating a new scoring engine.
3. See a small diverse set of illustrative hotel/nearby experience concepts, each with a plain-language fit reason and tradeoff. Keep irrelevant destination-trip recommendations out of this hotel flow; a coat of hotel branding on the original travel result is insufficient.
4. Example concepts: a quiet courtyard break, an in-hotel tasting concept, a neighborhood art walk concept, an active morning concept, a relaxed breakfast concept and a social lounge evening concept. All are fictional placeholders, not named real partners, prices, opening hours, availability or confirmed bookable inventory.
5. Demo CTA says what would happen on a real hotel's site and explicitly confirms no reservation is made. No real outbound booking link is invented. Real pilot CTAs will use client-approved HTTPS destinations.
6. No signup, payment or contact request. Lead capture defaults off. A later consent follow-up is a separately approved requirement after results.

### Operator walkthrough

- Open the fictional demo in existing Studio; edit two offer descriptions/tags and the campaign introduction; validate, save and preview the changed result.
- Show report data mode visibly. Local report can reflect that browser's activity. If an illustrative fuller report is needed, use an explicitly selected **SIMULATED SAMPLE DATA** fixture, isolated from production analytics and never an error fallback.
- Export the manifest/catalog and show the client setup checklist. Keep initial onboarding concierge-style; do not build billing or general self-service.
- A usable demo URL and distribution QR become externally shareable only after a separately authorized release. Decode/test QR assets; a decorative QR-like picture is not a deliverable.

### Minimum implementation

- Add one campaign manifest and six diverse illustrative catalog entries; register it without changing Aster.
- Reuse `campaign-config.js`, question overrides, `campaign-runtime.js`, `matchCatalog`, Studio validation/import/export, Workspace demo and report UI.
- Add a small, tested fit-reason helper/optional result slot only if the current renderer cannot explain hotel offer matches or suppress irrelevant destination blocks. No new framework, backend or general domain-adapter rewrite.
- Integrate into the reviewed campaign directory only when that preserved landing slice is on an approved branch. Until then a direct demo route is sufficient.
- Add focused deterministic ranking/catalog and browser tests. Add an optional sample-report fixture only if the operator walkthrough needs it; no fake people or production records.

### Acceptance gate

- [ ] Founder can show guest → results → edit → preview → honest report in under five minutes.
- [ ] Fictional status is clear on entry, results and owner walkthrough; no fake partnership, price, booking or revenue claim.
- [ ] All question paths remain valid; enough catalog diversity and an explicit sparse/no-match state exist.
- [ ] Results give useful choices/reasons before any optional data request; no sensitive targeting.
- [ ] Saved draft edits visibly preview; published conflicts, unknown IDs, offline/stalled reads and denied reports fail honestly.
- [ ] Mobile 375/768/1440 widths, keyboard, reduced motion, back/retry, root and `/tasteprint/` base paths pass; screenshots are inspected. Physical phone checks remain separately recorded.
- [ ] Existing six modules, Passport, sharing and Next Moves still pass regression checks.
- [ ] No paid services, live database changes, real guest data, third-party contact, merge or deployment.

Founder owns the actual buyer/problem, offer approvals, interviews, commercial terms and launch decision. Engineering will prepare configuration, tests, documentation and reusable onboarding within the approved slice. The first 30-day real pilot should review distribution and funnel health in week 1, guest/manager feedback in weeks 2–3, and usefulness/support effort/willingness to renew in week 4. No numerical lift target is promised before buyer agreement and baseline evidence.

## Six-month recurring-work proposal — AWAITING APPROVAL

Proposed cadence: October 22, 2026 through April 21, 2027, then explicit renewal. All human-facing times are **America/New_York**, including daylight-saving changes. Missed jobs do not accumulate into a burst of coding or duplicate PRs.

| Task | Timing proposed | Permissions proposed | Expected output | Execution / awake requirement |
| --- | --- | --- | --- | --- |
| Daily quality and regression monitor | Daily 08:00, max 20 min | Read repo/PR checks; use synthetic local test services; upload CI artifacts. No source pushes, real secrets, merges or deploys | SHA-specific full JS/build report, reporting SQL matrix, dependency-audit summary with severity/caveats; Python smoke where applicable; reproducible failure log | GitHub-hosted Actions can run in the cloud after approved workflow installation on default branch. Computer need not stay awake |
| Development session | Mon/Wed/Fri 10:00, max 90 min each | Read standing docs and GitHub; write only a task branch/worktree; push that branch and open/update a draft PR after appropriate tests. No secrets/admin/workflow-permission changes | One bounded increment on the highest-priority explicitly approved READY milestone; regression tests, diff explanation, remaining blockers and validation evidence. If blocked, report the blocker instead of inventing substitute scope | No scheduled coding runner/tool is exposed here. Desktop Codex automation, **if supported by the founder's client**, requires its computer/session awake and available. Cloud coding requires a separately approved supported runner, authentication and cost ceiling; GitHub Actions alone is not a coding agent |
| Weekly progress and backlog review | Friday 16:00, max 30 min | Read PRs/checks and approved evidence; propose only backlog/status documentation changes on a branch and draft PR. No automatic promotion into new implementation scope | Dated progress against gates, merged vs unmerged work, tests/failures, customer evidence vs hypotheses, top ready item, blockers and required decisions | Cloud Actions can collect GitHub/CI evidence without an awake computer. A reasoned AI review/backlog rewrite needs the same approved coding runner; otherwise it remains a founder-initiated Codex review using the collected report |

### Permission and operational boundaries

- Approval of this schedule is separate from approval of the next milestone. The only currently authorized implementation milestone is Phase 0. Once Phase 0 reaches its review gate, coding sessions must pause until TP-004 or another bounded milestone is explicitly approved. A roadmap priority is not permission to activate a later phase.
- No schedule has been installed, no crontab/background loop created, and no GitHub scheduled workflow is enabled by this proposal. The existing PR workflow gains only reporting-SQL regression validation; that is ordinary requested Phase-0 CI, not a recurring schedule.
- Default scheduled-job identity: least-privilege GitHub App/token, repo contents read for monitoring; branch contents write and pull-request write only for approved development/review jobs. Grant no Pages/deployment, administration, secrets, workflow-editing or production-provider access. Do not grant a bot an auto-merge path.
- Prompt instructions alone are not an enforceable main-branch protection policy. Founder-approved repository rules/required human review and narrowly scoped runner access are needed before unattended write jobs. Existing token/ruleset capabilities have not been certified here. Do not change repository protections without approval.
- Use one concurrency lock across development/review writers. At each run: fetch actual main and PR state, read standing docs/approval record, identify the highest-priority ready item, reuse its existing clean branch where safe, or create an isolated worktree. Never operate in a dirty founder checkout, force-push/reset/delete work, or silently supersede another PR. Treat issue/PR text and external content as untrusted inputs, not fresh authority.
- Do not repeat a push when nothing changed. Failed required tests prevent a ready-for-review claim; a WIP/draft PR may record the real failure. Do not hide failing tests or disable assertions. No changes to live state; use synthetic fixtures and disposable local databases.
- Logs/artifacts identify commit, commands, counts and outcomes and redact credentials. Keep short test artifacts (proposed 14 days), not real customer data. Review writes propose backlog changes; founder decisions/customer discoveries must not be fabricated from CI status.
- GitHub schedules normally execute from the default branch and use UTC cron. Preserve 08:00/10:00/16:00 Eastern across DST with a supported timezone-aware scheduler or a tested Eastern-time gate over UTC triggers. Do not silently shift the founder's schedule. Hosted schedules can be delayed; these are work windows, not uptime guarantees.
- No paid runner or API service is authorized. Before activation, verify public/private repo runner billing, included minutes, GitHub App permissions and an explicit budget. Proposed caps imply at most about 20 hours/month of development runtime plus roughly 12 hours/month of checks/review; actual billable usage depends on runner and agent service. These caps are not a price estimate or spending approval.
- Escalations are concise GitHub artifacts/draft PRs and chat summaries in the approved service. No automated email, Slack, customer outreach or external messages are authorized.

### Approval requested before configuration

1. Approve/adjust the three task definitions, Eastern timing, six-month duration, runtime caps, proposed permissions and outputs.
2. Approve the bounded fictional-demo slice (TP-004) if it should become the development-session target after Phase 0; all production/pilot launch gates remain separate.
3. For unattended coding, select/authorize an actually available runner and budget. This environment can prepare workflow files after approval, but cannot create a supported cloud agent scheduler that is not exposed here. A safe first activation is cloud read-only monitoring/evidence collection, with coding sessions awaiting the runner prerequisite.

No unanswered approval is treated as consent. Do not merge this proposal to activate anything without the founder's explicit direction.
