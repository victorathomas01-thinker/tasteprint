# Tasteprint development instructions

Read `docs/TASTEPRINT_MASTER_BIBLE.md` as the standing product vision and engineering standard. Its roadmap is a plan, not blanket authorization to implement or activate every phase. Read `docs/DEVELOPMENT_PLAN.md` for the dated reconciliation, priorities, pilot proposal and automation approval status. Current user instructions take precedence over these documents.

- Prioritize trustworthy B2B hospitality pilots; protect the six consumer modules, Passport, Next Moves and shared preference contracts. Keep the current stack and make the smallest cohesive change.
- Inspect branch, upstream, status, untracked files, open PRs and relevant docs before editing. Preserve uncommitted work. Use an isolated branch/worktree when appropriate; never reset, clean or overwrite local work. Do not include unrelated changes in commits.
- Phase 0 campaign corrections and tests are authorized. The Charlotte demo design and recurring schedules are proposals awaiting founder approval; do not activate either from this document alone.
- No merge, deployment, production migration/data change, paid service, real guest/contact data, customer outreach or scope expansion without explicit founder approval. Do not enable scheduled jobs until their schedule and permissions are approved. Do not modify `pages.yml` to bypass this boundary.
- Production reporting must be authenticated and tenant/role-scoped. Never replace failed production metrics with local/demo data. Published campaign links must not fall back to private drafts or bundled fiction.
- Keep anonymous analytics, Passport accounts, Workspace operations and consent leads separate. Never print credentials or send PII into analytics. Current ranking is deterministic; the ML lab uses synthetic data.
- Run `npm test` and `npm run build` for relevant PRs; add behavioral regression tests for defects. Reporting changes also require `bash scripts/check-workspace-reporting.sh` (Docker, synthetic local PostgreSQL only). Run Python tests when applicable. Preserve observer-idempotence coverage and check root and `/tasteprint/` browser routes.
- Label outcomes precisely: locally verified, local demo, backend code only, unverified, planned or blocked. Green mocks do not prove production readiness. Report exact test evidence, limitations, changed files and the next required approval.
- Keep campaign fix PRs separate from ML PR #7 and unrelated landing/navigation work. Explain major technical decisions in plain language and document how to reproduce validation.
