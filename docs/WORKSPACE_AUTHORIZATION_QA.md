# Workspace RPC authorization correction

A local PostgreSQL test reproduced an authorization defect in the existing backend source: for a signed-in nonmember, `tasteprint_workspace_role(...)` returns NULL. SQL comparisons such as `NULL <> 'owner'` and `NULL NOT IN (...)` evaluate to unknown, not true, so an `IF` rejection could be skipped.

The correction makes absent roles fail closed: owner-only operations use `IS DISTINCT FROM 'owner'`; invitation creation explicitly rejects a NULL role. Both the original definitions and their later replacements are corrected, so installation order cannot silently restore the old guard.

Affected operations: invitation creation, member-role changes, member removal, ownership transfer and workspace deletion. Intended Owner/Admin invitation capabilities and explicit owner lifecycle actions remain available. No production database was contacted, inspected, changed or tested; the production deployment state is unverified.

Run `bash scripts/check-workspace-reporting.sh`. It uses a disposable local PostgreSQL container and synthetic identities. The new authorization suite exercises nonmembers, members of another tenant, Admin/Editor/Analyst/Viewer denials for owner operations, allowed invitation roles, owner-only transfer, and deletion by the new owner after transfer. Changes are rolled back inside the synthetic test. The test reproduced nonmember invitation creation before the correction and passes after it.

`npm test` and `npm run build` also pass. These local tests do not validate live JWT issuance, PostgREST configuration, Edge Function deployment or a production installation.

Before any real pilot, an approved staging run must apply the canonical order in `SUPABASE_SETUP.md`, including the updated `workspaces.sql`, `workspace-member-refs.sql`, `workspace-lifecycle.sql` and `workspace-reporting.sql`. Verify direct unauthorized API calls in separate browser sessions, not just button visibility. Treat production activation as blocked until the security changes have been reviewed, staged and explicitly approved for release. Do not restore the old role comparisons as a rollback strategy.
