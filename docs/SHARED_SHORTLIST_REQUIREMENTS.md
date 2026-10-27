# Shared shortlist requirements — review-only

This adds optional per-person requirements to accepted friends' shared shortlists. It is development code, default off, not a deployed service or an expansion of the PR #24 staging approval.

## User behavior

Each person can explicitly share a maximum listed cost in USD, maximum duration in minutes, confirmed step-free access, confirmed availability, and excluded interests from the existing twelve interest tags. Nothing is copied automatically from a private Passport. The friend sees the shared requirements but cannot edit them. No diagnoses, location, contact details or freeform private notes are collected by this form. Access requirements may still be sensitive; the form warns before sharing.

Saving a material change increments the connection's decision revision and clears BOTH people's shortlist choices. Interest responses remain distinct from choices. Unchanged normalized requirements do not invalidate choices. Each person must independently choose again, and converting the shared choice creates only a mutual-interest plan proposal. Scheduling still requires both people to approve the same plan revision in Plans. Existing plans are independent of later shortlist requirement changes.

Unknown, stale or missing facts cannot satisfy hard requirements. The candidate ranking considers every person's limits as well as their selected shared interests. An option must exactly match a currently published, independently reviewed catalog ID, title and website before its metadata can justify compliance. A caller-supplied catalog ID alone gives no authority. The server rechecks current facts at choice and proposal creation; a changed source can reject an old page. A failed proposal transaction leaves no orphan plan, recipient response or invitation.

Participant-added ideas remain supported. With active hard requirements and no matching reviewed facts, people may suggest and express interest, but cannot choose or convert an unverified idea. Requirements are never relaxed automatically. If all requirements are consciously erased, custom ideas can again be chosen with fresh decisions.

No distance is calculated. The current catalog has no reliable reference origin for its distance field; displaying it as a shared travel radius would be misleading. A later location design must define a reference area/origin and its privacy controls before enabling shared distance limits. This work does not claim roadmap requirement 20 is completely resolved.

Prices are source snapshots, may omit fees and are not quotes. Availability is not a booking or guarantee. Access facts still need appropriate human source verification. A review timestamp is an editorial check, not proof of attendance, availability, partner ownership or a business conversion. Website actions now say “Visit linked website” rather than claiming every source is official.

## Components and configuration

- `shortlist-requirements.js`: closed rule schema, normalization, summaries, per-person eligibility and decision snapshot validation.
- `shortlist-client.js`, `shortlist-core.js`, `shortlist-view.js`, `shortlist-runtime.js`: actor-bound checked operations, optional form, explicit share confirmation, own-only erasure, draft preservation, source eligibility and account-change cleanup.
- `supabase/shortlist-requirements.sql`: additive raw-revoked RLS tables, checked RPCs and enforcement triggers. Install only in an approved isolated environment, after `social-shortlists.sql` and `catalog-contributors.sql`.
- `VITE_SHORTLIST_REQUIREMENTS_ENABLED=false`: build gate requires public backend configuration, private Plans, Friends, Shortlists and reviewed catalog flags. Default builds and legacy RPC payloads are unchanged.

Only the authenticated JWT determines the actor; RPC payloads contain no actor ID. A connection row lock serializes requirement changes and choices. Expected decision revisions prevent stale approvals. Once any requirement change has occurred, a monotonic revision marker remains even after content erasure, preventing older clients from restoring choices. Public RPCs cannot execute the private context/eligibility helpers, access raw tables, or write another participant's rules.

Checked wrappers temporarily establish a transaction-local connection/revision context, call the existing canonical RPCs, then restore the context. Choice and plan-conversion triggers reject legacy bypasses for revised connections. Reapplying the original shortlist migration preserves these triggers. Direct database-owner maintenance without a JWT/SET ROLE can restore rows; this does not grant any API role raw access. Restoring requirement revisions from an old archive is a privileged recovery operation and must not roll back current erasure decisions. The local test covers legacy shortlist recovery with the new triggers; it does not authorize hosted recovery or claim a full new-table disaster recovery rehearsal.

Own rules remain exportable and erasable after blocking; exports redact the other person's details. Connection or Auth removal cascades rules and revision markers. Erasing one's own rules clears both choices but keeps the other person's rules. Downloads and preexisting plans remain separate. Records otherwise persist with the connection; there is no background retention job.

## Verification

Use synthetic data only:

```sh
npm test
npm run lint
npm run build
npm run test:social-sql
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser
npm run test:social:local
```

`check-shortlist-requirements.js` checks strict schema/client payloads and both-person ranking. The browser boundary suite runs at root and Pages base paths, including explicit consent, own-only updates, draft preservation, escaping, unavailable facts, responsive widths, blocked-state erasure controls and late account changes. Injectable UI checks are not live backend evidence.

The SQL suite applies/reapplies the migration and legacy definitions, tests authorization, revision reset/no-op/conflicts, helper grants, unknown/failing source facts, both participants' hard exclusions, direct legacy bypass denial, atomic conversion, blocked export/erasure and connection cascades. The owned genuine Auth/PostgREST/PostgreSQL integration enables the feature for two separately authenticated synthetic accounts and checks independent requirements, stale/legacy denial, choice reset, fresh joint choice, proposal, scheduling, a genuine concurrent rule-update/choice race and Auth deletion cascades. Hosted projects, real listings, email delivery, physical devices and real users remain unverified.

Final local verification: full `npm test`, JavaScript syntax (184 files), production build, all 19 default browser suites at both root and Pages paths, both configured legacy shortlist builds, SQL/reapplication/races/recovery, and the genuine synthetic local service flow passed. After visual review compacted the exclusions grid, focused root/Pages checks and full unit/syntax/build checks passed again. Screenshots at 375/768/1280 CSS pixels were inspected locally; these are Chromium emulations, not physical iOS/Android tests. Original 16 uncommitted user files remained byte-identical; main was unchanged at `acca63e45dbde456aeb194088af6abde99ddf7dd`.

CI follow-up: the initial remote run passed unit, syntax, build, SQL/recovery and root/Pages/configured browser gates but exposed a preexisting reflection status race during genuine service checks (`null` versus expected enjoyment). The reflection form retained its previous success message while the next write/readback was pending. It now replaces that status with Working and confirms only after readback. A delayed-write browser regression passes at both bases. The failure was fixed in the PR rather than dismissed as a test flake; CI is rerun on the correction.
