# Charlotte catalog validation — 2026-11-02

Branch: `feature/charlotte-catalog-review`, based on PR #56 at `14f8b31b81a5720165d6e208f24ef618f1b18671`. This is a stacked development review, not a production release.

## Passed locally

| Command / check | Evidence and limits |
|---|---|
| `npm test` | Entire existing test chain plus new Charlotte regression suite passed. Synthetic preferences/participants only. |
| `npm run lint` | Dependency-free JavaScript syntax gate passed; not a TypeScript/style certification. |
| `npm run build` | Production bundle builds with backend gates unchanged. No publication. |
| `npm run test:charlotte` | 23 unique source identities; 19 reviewable / four withdrawn holds; five original source IDs/revisions preserved; field-specific evidence timestamps/expiry; explicitly unknown facts; no invented vectors, user-relative distances, durations or live availability. |
| Recommendation samples | Empty preferences produce coffee/art/nature/walking variety. Irrelevant saved IDs/quiz vectors do not suppress it. Explicit coffee/art/nature preferences rank matching options first. Avoids and both participants' hard requirements apply before mixing; participant order and sponsorship do not change the result. |
| Practical constraints | Four explicitly free-general-admission candidates; three venue-reported step-free routes; two satisfy both. Unknown final museum fees/café purchases never pass a hard cost requirement. No entries pass unverified distance, duration or live-availability requirements. Admission is not total outing cost. |
| Import/review regression | Whole-batch import; legacy CSV compatibility; CSV preserves review expiry and held status; original IDs can receive newer revisions; expired review cannot be approved/exported. No automatic source-date refresh or publication. |
| `npm run test:browser` | All 23 default browser suites at `/` and `/tasteprint/` passed (46 suite runs), including consumer modules, campaigns, Passport, business, Together, navigation, local workbench, privacy/error paths and mobile layouts. Chromium, not physical iOS/Android. |
| `npm run test:catalog:configured` | Both base paths passed. Intercepted local public-catalog fixture presents the 19 Charlotte candidates, honest starter label and varied first four; combined $0 admission + step-free filter returns only greenhouse/McColl; details show qualifications/deadline; mobile/tablet/desktop overflow checks pass. No hosted service, official-source navigation or real visitor data. |
| Focused final browser reruns | Configured catalog and Discover suites at both base paths passed after the final ranking/cost-scope copy changes. |
| `npm run test:public-demo` | CI-mode local artifact/preview checks passed under Node 24.19.0 and 22.23.4; exact-artifact readiness, backend refusal/stripping, mobile/desktop journey and isolated storage. No GitHub Pages upload or publication. |
| `npm run test:social-sql` | Disposable local PostgreSQL checks passed, including idempotent SQL application, existing RLS/actor/tenant/role/race contracts and new expiry denials at approval, publication, anonymous public projection and checked shared-plan conversion. |
| `bash scripts/check-workspace-reporting.sh` | Synthetic local reporting/role/tenant/editor/revision/atomic-publication checks passed. No production credentials or database. |
| `npm run test:social-recovery` | Scoped synthetic backup/restore and rollback/reapplication checks passed. |
| `npm run test:social:deno` | Genuine local pinned Auth + PostgREST + PostgreSQL, SDK/browser flow and Deno 2.6 handler checks passed at `/`, including separate catalog author/reviewer/publisher, anonymous discovery/Saved/withdrawal, two-account plans, privacy/recovery and Workspace publication authorization. Synthetic local publication is a test transaction, not publication of Charlotte listings or a hosted deployment. |
| Preservation and release boundaries | All 16 original dirty files and 14 unfinished accessibility files retain their recorded SHA-256 hashes; PR #56 worktree stays clean. Production main remains `acca63e45dbde456aeb194088af6abde99ddf7dd`; public demo remains `4b88f2777c1c2ecd7020b73623390d4142941ba3`. No workflow configuration changed. |

No local failing tests remain. GitHub PR checks run separately; do not equate local passing evidence with a completed hosted CI run.

## Components changed

- `catalogs/charlotte-field-review.json`: canonical primary-source field evidence, exact UTC checks, unknowns, maintenance policy and editorial holds.
- `catalogs/charlotte-pilot-draft.json`: generated 23-candidate import pack; no consumer-catalog activation.
- `scripts/lib/charlotte-catalog.js`, `scripts/prepare-charlotte-catalog.js`: deterministic local preparation, consistency check and upcoming/overdue review report; no source crawler or scheduler.
- `catalog-core.js`: optional conservative review expiry and eligibility-first editorial variety when no usable positive taste evidence exists.
- `catalog-editor-core.js`, `catalog-editor.js`: expiry/status survive CSV and editing; legacy CSV remains supported; explicit listing-status control and dynamic candidate count.
- `discovery.js`: review deadline in item provenance and clear cost-filter scope. Original dark design and optional-first flow preserved.
- `supabase/catalog-contributors.sql`, `supabase/shortlist-requirements.sql`: additive optional-expiry validation and denial checks; no hosted application or new role grants.
- Regression scripts and status/founder documentation accompany those changes. No dependencies, frameworks, credentials, account/social gates or business modules changed.

## Still unverified / needs founder action

- Official-page checks are not independent venue inspections or live booking/stock information. HTTP 200 is not proof that a publisher's text is current. The evidence retains seasonal ambiguity, conflicting schedules and year-unspecified closure alerts.
- Four candidates remain held: Rowe, Projective Eye, Queen City Art and Quest/Latta. Others retain explicitly unknown admission totals, physical access or restrictions. See [founder review](CHARLOTTE_CATALOG_FOUNDER_REVIEW.md).
- The founder must select/approve editorial candidates, decide Charlotte-city versus nearby-metro coverage and assign maintenance ownership. Most reviewable records expire around November 9; program/closure holds require earlier checks.
- No real-user pilot, physical-device QA, independent accessibility inspection, live availability, hosted schema migration, connected catalog activation or public release was performed. Existing separate accessibility work remains unfinished and preserved.
- Optional expiry requires the accompanying SQL updates before a future connected import. This task does not authorize applying them to hosted infrastructure.
