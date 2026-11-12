# Private-plan staging — SYNTHETIC SCOPE APPROVED; NOT CONFIGURED OR RUN

The founder approved synthetic-only staging for Tasteprint PR #24 under the documented safety restrictions. Approved implementation baseline: `f4befb8b441d2c03751369b347b6158d6edb0108`. No isolated Supabase project has been selected or configured, and no hosted tests have run. Existing local SQL/recovery and intercepted-browser results remain separately labeled.

Follow `STAGING_PROJECT_SETUP.md` for exact project, cost, permission, credential and handoff instructions. This approval persists: do not request approval again for the same scoped synthetic operations once the dedicated target is configured.

## Approved scope

- A new, isolated Free-plan staging project, separate from production, with an explicitly supplied project reference/URL and staging-only credentials. Expected cost $0; a paid plan/add-on or quota conflict requires stopping, not upgrading or altering production.
- Minimal Supabase Auth and Data API for synthetic accounts, private plans and recovery. Admin-create confirmed fake accounts and use password sign-in; no email/SMS/push or invitation delivery to real people.
- Apply/reapply only `supabase/social-plans.sql` and then `supabase/social-plan-privacy.sql`. These create four social tables, restricted RLS/grants, hashed capabilities, actor-bound transitions and privacy controls. Do not install unrelated application schemas, Edge Functions, storage, paid APIs or services.
- Use actual ordinary user JWTs/public credentials for actor/anonymous/blocked/nonparticipant authorization tests. Reserve staging Admin/DB credentials for synthetic fixture administration and scoped schema/backup/recovery operations.
- Exercise invitations, replay/expiry/revocation, concurrent claims, independent interest, same-version agreement, rescheduling, cancellation, private export, erasure, blocks and synthetic account lifecycle, recording actual/untested outcomes honestly.
- Rehearse recovery of only the known synthetic social tables in the identified staging target. Restrict archives, quiesce only our own synthetic writers, preserve managed Auth/provider state and unrelated objects, restore exact rows and retest RLS/grants. The proposed whole-plan erasure and manual old-invite cleanup apply only to synthetic data in this approval.
- Use a local isolated Auth/Plans harness for real-API browser testing; no frontend is published/deployed. Clean up only this run's known synthetic fixtures and temporary secrets/archives; retain restrictive schema/RLS and report the remaining state.

## Mandatory preflight and stop conditions

Verify project reference, HTTPS URL, database host/user, TLS, approved commit, owner-confirmed Free plan and an empty or explicitly recognized synthetic-only application dataset before writes. A missing target/credential is a configuration dependency. A mismatch, unexpected data/users, unknown database owner/permissions, blocked network, certificate problem or charge/upgrade stops the run. Do not substitute production credentials, weaken TLS/RLS or guess another target.

No account-wide production export or provider recovery is authorized. A staging database credential is intentionally privileged inside the dedicated project, so it cannot be treated as safe merely because an environment variable is named staging.

The full application currently starts Passport own-history read/prune alongside Auth. This approval does not authorize installing its schema or silently treating those calls as successful. Use the isolated test harness; report full-app Auth coupling separately. `npm run review` clears backend configuration, `test:plans:configured` intercepts traffic, and `test:social-recovery` is local-only. None is a hosted test command.

## Recovery boundaries

Prefer preserving the restricted schema while fixing frontend issues. If exercising approved synthetic table teardown/restore, bind the procedure to the explicitly identified project, known fixture IDs and exact reviewed object inventory. Do not use `scripts/sql/teardown-social-recovery-fixture.sql` on hosted infrastructure: it is intentionally guarded for a local fixture database and is not a hosted rollback artifact.

Local evidence is documented in `SOCIAL_RECOVERY_REHEARSAL.md`: guarded transactional teardown, late-conflict restore rollback, exact complete-row fingerprints, reapplication and post-restore RLS/behavior. Auth/provider state was preserved in place, not backed up/restored. Hosted versions, actual Auth/API permissions, ownership, TLS and recovery remain unverified until the configured run.

A hosted recovery report must state precisely what was archived/restored, versions, fingerprints/check outcomes, permissions, cleanup and retained state; exclude tokens/passwords/archive contents. Do not imply provider backups, whole-database recovery, recovery of Auth secrets or production readiness.

## Outside this approval

Production infrastructure/credentials/data or changes; real users/social data; merge or production deployment; external frontend hosting; paid services/add-ons or billing changes; unrelated service/schema activation; email/SMS/push delivery; whole-project/database/provider restore, project deletion, PITR or signing-key changes. Stop and request approval before any such operation. Physical-device/real-pair pilot, broad account export/removal/retention, moderation/rate-limit operations and catalog verification remain separate requirements before real-user use.
