# Tasteprint consolidated integration candidate (review-only)

Prepared 2026-11-12. **Not a release, production deployment, backend activation, or authorization to merge.**

## Versions that must remain stable
- Consumer main: acca63e45dbde456aeb194088af6abde99ddf7dd. Existing GitHub Pages product demo must not be rebuilt as part of this review.
- Independent tastesocial-demo/main: 4b88f2777c1c2ecd7020b73623390d4142941ba3. The public sample-data demo has its own repository and must not be republished as part of this integration.
- This review candidate derives from PR #57 head 3327c1e83c0ef3d9c31d90ca4239c5e23dacbdf0, which was 118 commits ahead of production main. It covers that branch's ancestry, NOT necessarily every open PR: review sibling and parallel branches explicitly before calling the stack complete.
- Source PRs stay open while validating the combined head. Do not delete their branches.

## Forbidden without separate approval
- Pushing to main, merging this review, triggering workflow_dispatch for Pages, deploying hosted/consumer data, changing Pages settings, or modifying the existing deployed demo.
- Applying SQL to production, activating real Supabase/social features, using real user data, sending real invitations, publishing unreviewed venue listings, paid upgrades, or collecting external analytics.
- Using a production project for staging. Synthetic-only staging scope has been approved in docs/SOCIAL_STAGING_APPROVAL.md but is not configured. Project selection and all safety preflights still apply.

## Acceptance sequence
- [ ] Compare this candidate to frozen main, concentrating on original routes, Passport, result sharing, storage, authentication, security, and privacy.
- [ ] Identify open feature PRs on sibling branches not represented by this candidate, recording exact differences.
- [x] Verify full CI on the combined PR head, not just stacked parents — [GitHub Actions run 43329058383](https://github.com/victorathomas01-thinker/tasteprint/actions/runs/43329058383) passed on 24c62eee; includes JavaScript, Playwright, local SQL, synthetic recovery, Deno, and Python ML. This does **not** establish hosted staging or physical-device quality.
- [x] Build backend-disabled public demo and verify its **automated** guided journeys without republishing the existing demo (CI run above). Physical-device and accessibility review remain separate gates.
- [ ] Ensure demo-specific storage cannot read, erase or overwrite production keys under the shared GitHub Pages owner origin.
- [ ] Validate old-to-new route parity with explicit tests, and record intentional changes.
- [ ] For hosted RLS/auth/private-plan checks, use only separately approved/configured synthetic staging after the prescribed preflight.
- [ ] Resolve Charlotte catalog approvals and ownership of regular source rechecking before publication.
- [ ] Complete physical iPhone/Android and accessibility checks before real-user pilots.
- [ ] Prepare rollback plan and obtain explicit final approval before any merge or deployment.

## Operational safety
The existing Pages workflow deploys only for pushes to main or explicit workflow_dispatch, not this review branch. Opening a draft PR should run validation CI without publishing. Do not change that workflow as part of review.

Tracking issue: https://github.com/victorathomas01-thinker/tasteprint/issues/58

## Side-branch reconciliation audit (2026-11-12)

Git ancestry checks against the combined development head identified two independent open PRs with commits not in the head's ancestry:

- PR #7 (ML cluster validation) was two commits behind the integrated candidate. Its cluster-count guard and three regression tests were absent from the candidate. Reapplied equivalent changes on this review branch to prevent a KMeans/silhouette scoring error for invalid cluster counts. Added a dedicated Python ML CI job. This is a review-branch-only change; the original PR remains open.
- PR #10 (workspace RPC authorization) was one commit behind on separate history. However, the current combined branch already contains the critical fail-closed SQL changes: null-role checks in workspace invitations, IS DISTINCT FROM owner comparisons in workspace lifecycle and membership logic, and the synthetic workspace-authorization SQL test file. Its unique commit is **not** evidence the authorization patch is missing. Do not blindly cherry-pick it over newer definitions. Confirm regression suite results and actual hosted permissions separately before release.

The remainder of the checked branch heads were ancestors of this candidate, including the consumer assessment and studio-conflict sibling branches. This is a scoped branch coverage check, not confirmation of all active source PRs or production readiness.

## Current release decision

**2026-11-12: automated integration candidate PASSED, public release BLOCKED.** The 24c62eee CI run completed successfully with all required jobs, including ML test coverage, private social authorization/recovery local integration, public-demo build and browser assertions at root and Pages base, and Deno publishing loopback tests.

Outstanding blockers: an approved and configured dedicated synthetic-only Supabase staging target for hosted RLS/Auth/recovery verification; physical iPhone/Android testing; the founder's specific Charlotte catalog editorial/maintenance decisions; and release/rollback review. Do not imply local mock or loopback results establish hosted Supabase behavior. The proposed branch must remain unmerged, and main/Pages must remain on the existing deployment until approval.
