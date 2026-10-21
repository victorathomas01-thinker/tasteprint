# Campaign fixes: validation and operating contract

## What changed

`campaign-config.js` resolves ordinary previews from saved drafts first, then bundled campaigns, then fetched published manifests. Explicit `published=1` links use only the fetched published manifest. Invalid IDs are rejected rather than normalized into another campaign. Published lookup failures return no campaign; `campaign-runtime.js` renders an unavailable screen and recovery links. Registry/report requests are bounded to 10 seconds. The runtime also tolerates a missing application container.

`campaign-report.js` escapes dynamic HTML, uses the signed-in JWT, and calls `tasteprint_workspace_campaign_stats(p_workspace_id, p_campaign_id)`. Production errors show a retry action without reading browser-local events. Missing, wrong-campaign or invalid metric response shapes fail visibly rather than manufacturing zero counts. `demo=1` is an explicit local-report mode; a backend-free build without a workspace may also demonstrate local activity. A report with a workspace ID always needs production configuration unless demo mode is explicitly selected. `workspace-report-links.js`, imported by `workspace.js`, carries the selected workspace into report links.

`supabase/workspace-reporting.sql` already existed before this PR. It now permits only Owner/Admin/Analyst and verifies both the hosted draft and the registry's owning workspace. A different team's colliding private draft does not grant access to the real campaign's metrics. The unscoped aggregate in `campaigns.sql` is service-role-only even before the wrapper is installed or if that migration is reapplied. No migration was applied to production.

## Reproduce locally

```bash
npm test
npm run build
bash scripts/check-workspace-reporting.sh
cd ml_lab
PYTHONDONTWRITEBYTECODE=1 OMP_NUM_THREADS=2 OPENBLAS_NUM_THREADS=2 /workspace/.venvs/tasteprint-ml/bin/python -m unittest -v test_ml_lab.py
```

The Python command uses the cloud environment's existing virtualenv; elsewhere use the Python environment installed from `ml_lab/requirements.txt`.

The SQL runner creates a disposable PostgreSQL 17 container from a digest-pinned official image, without published ports or network access, and deletes it on exit. Docker must be running; the first image download needs registry access. It installs actual repository migrations and uses synthetic `auth.users` and an `auth.uid()` fixture. It tests grants, anonymous access, missing authentication, each role, nonmembers, a cross-workspace campaign-ID collision, aggregate values/denominators and migration reapplication. It does **not** test Supabase JWT issuance, PostgREST, Auth redirects, Edge Function deployment or real production data.

The Node campaign suite tests real module logic with controlled network/DOM fixtures: authenticated endpoint and request arguments, failures without fallback, escaping, draft vs published conflicts, invalid identifiers, unavailable campaign rendering, missing containers and the existing observer-settling regression. Browser smoke tests supplement these fixtures; they do not substitute for authenticated staging tests.

## Browser/manual checklist

- [ ] Load Aster, finish the quiz, and verify branded recommendations and the demo-only lead notice.
- [ ] Load Aster in Studio, edit its title, save and preview. Verify the edited title and a local-draft label; delete the draft and verify the bundled version returns.
- [ ] With a local draft present, open `?campaign=aster&published=1`. With no configured published registry it must show unavailable, never the saved draft.
- [ ] Open missing, empty and malformed campaign IDs. No generic quiz or exception should appear; recovery links work.
- [ ] Open a local report with HTML-like identifiers/catalog labels. They display as text, never DOM elements.
- [ ] Open `?campaignReport=aster&demo=1`; verify the visible local data-source label.
- [ ] Open a report with a workspace UUID but missing backend/session; verify an error and retry, no local metrics.
- [ ] In an **approved staging** project, test Owner/Admin/Analyst success and Editor/Viewer/nonmember/anonymous rejection via direct RPC calls. Verify colliding private drafts cannot expose another team's metrics.
- [ ] Simulate HTTP denial, offline, a stalled request and an invalid response. Production reports must show an error; public campaign links must show unavailable.
- [ ] Repeat on mobile widths and with keyboard/reduced motion, using both `/` and `/tasteprint/` base paths. Check navigation and no render loop.

## Data truth and deployment boundary

Views and CTA metrics count events, not verified people or purchases. `cta_rate` is CTA events / campaign-view events; repeated clicks can exceed 100%. Local events are a rolling browser buffer, not representative usage. Missing/offline events and unverified ingestion limit attribution. These fixes do not establish completed bookings, revenue lift or production security certification.

Follow the migration order in `SUPABASE_SETUP.md` only after founder approval, starting in staging. Rollback of application code must never restore anonymous reporting grants; a failed backend should fail visibly. Do not disable RLS or regrant public report access to make an older build appear functional.
