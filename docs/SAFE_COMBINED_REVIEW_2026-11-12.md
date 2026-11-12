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
- [ ] Verify full CI on the combined PR head, not just stacked parents.
- [ ] Build backend-disabled public demo and verify guided journeys at mobile and desktop widths, without republishing the existing demo.
- [ ] Ensure demo-specific storage cannot read, erase or overwrite production keys under the shared GitHub Pages owner origin.
- [ ] Validate old-to-new route parity with explicit tests, and record intentional changes.
- [ ] For hosted RLS/auth/private-plan checks, use only separately approved/configured synthetic staging after the prescribed preflight.
- [ ] Resolve Charlotte catalog approvals and ownership of regular source rechecking before publication.
- [ ] Complete physical iPhone/Android and accessibility checks before real-user pilots.
- [ ] Prepare rollback plan and obtain explicit final approval before any merge or deployment.

## Operational safety
The existing Pages workflow deploys only for pushes to main or explicit workflow_dispatch, not this review branch. Opening a draft PR should run validation CI without publishing. Do not change that workflow as part of review.

Tracking issue: https://github.com/victorathomas01-thinker/tasteprint/issues/58
