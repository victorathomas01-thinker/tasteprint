# Social migration recovery rehearsal — local synthetic evidence

`npm run test:social-recovery` starts its own pinned PostgreSQL 17 Docker container with **no network or published ports**. It accepts no database URL, project credential or hosted target. It creates the explicitly named `tasteprint_social_recovery_fixture` database, minimal synthetic Auth references and unrelated sentinel data, then applies the existing social core and privacy migrations. It never activates a project, writes to production or creates a scheduled task.

## What the rehearsal proves

1. A fixture-only teardown refuses a different database even with opt-in, and refuses its own database without opt-in. Refusal preserves data.
2. An unexpected dependent view causes restrictive DROP to abort the entire transaction, including earlier RPC drops. No CASCADE escape is used.
3. A private, data-only custom-format archive covers exactly the four social tables. Auth/provider state and unrelated application data are not archived or dropped.
4. The authorized fixture teardown removes only the named social RPCs/tables/helper. The normal reviewed migration chain recreates schema, permissions and RLS.
5. A conflicting target row causes restore to fail; single-transaction restore leaves the target fingerprint unchanged rather than overwriting data or committing a partial archive.
6. A successful restore reproduces the canonical complete-row fingerprint across plans, response versions, timestamps, invitation hashes and blocks. Migration reapplication preserves it.
7. Actual role checks after restore prove anonymous restrictions, recipient membership, blocked-content redaction, both revision approvals, pending hashed invitation claim and participant-erasure cascades. Auth references and unrelated sentinel data remain intact.

The archive and expected-failure logs live in an owned `mktemp` directory under `umask 077`, are never printed/uploaded, and are removed along with the owned container on exit. This is a synthetic local fixture, not a real-data backup service, encryption policy, provider backup or hosted restore certification. The fingerprint is compared internally; private row content is not emitted as evidence.

## Files and CI

- `scripts/check-social-recovery.sh`: starts/owns the disposable environment, runs guards, archive, teardown, restore and verification, and cleans up its own resources.
- `scripts/sql/seed-social-recovery.sql`: invented scheduled/pending/blocked plans and unrelated sentinel.
- `scripts/sql/fingerprint-social-recovery.sql`: canonical row ordering for exact content comparison.
- `scripts/sql/teardown-social-recovery-fixture.sql`: transactional, guarded **test-only** teardown. This is not an approved hosted rollback script.
- `scripts/sql/check-restored-social.sql`: post-restore role/behavior checks.
- Pull-request CI adds this gate alongside existing JS, SQL, build and browser checks. No deployment workflow changes.

## Remaining external approval and recovery work

Default/review builds still disable connected Plans. Before external staging, approve one isolated project, current provider costs/limits, public configuration, Auth redirects, exact reviewed migration chain and private synthetic test scope. Existing Passport Auth consumers must also be reviewed; the Plans flag is not provider isolation.

A hosted rehearsal still needs verified provider Auth references/ownership, extensions, actual JWT/PostgREST grants, approved secure archive handling/storage, recovery access, concurrent-write quiescence, provider backup/restore limits, rollback window and real hosted recovery evidence. The fixture excludes Auth/provider backup and restore; it does not prove those services survive a provider-level incident. Do not export real data, disable RLS, apply this test teardown to a hosted project or treat local passing tests as approval to deploy.
