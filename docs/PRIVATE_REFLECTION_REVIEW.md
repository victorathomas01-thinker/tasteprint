# Private post-plan reflection

An authenticated participant can optionally record attendance, enjoyment and whether they want to do something together again. The form appears after an agreed plan's start. Answers belong to the exact plan revision, remain private to that account and can be edited, exported or erased. A positive repeat intent links back to Friends to choose another idea; no other person's response or fresh consent is invented.

The new additive SQL has RLS and no raw client grants. Scoped security-definer RPCs derive identity from Auth and enforce membership, blocks, current revision, scheduled state and server time. A participant cannot answer for or read the other person. Own exports/erasure work after blocking. Removing a plan/participation or an affected account cascades its feedback. Own erasure preserves the plan and other person's answer. There is no free text, automatic scoring, telemetry or merchant reporting. Existing shared self-reported completion is separate. Nothing is verified attendance, booking or purchase evidence.

The form preserves edits after failed requests, keeps privacy controls open, clears stale answers after deletion, labels dropdowns explicitly and discards results when its host is removed by navigation or Auth change. Strict client validation/readback prevents a failed write from being called saved. Anonymous discovery and all six modules remain available.

Activation requires VITE_PRIVATE_REFLECTION_ENABLED=true plus Plans and a separately approved schema. Default false. No hosted activation is included or authorized by the older PR #24 staging scope.

Verification:

- Node: typed answers, invalid states/metadata, post-start eligibility, actor-bound transport, strict readback/export and no identity fields in writes.
- PostgreSQL: reapplication, grants/RLS, anonymous/nonmember/raw-access denial, stale and future rejection, independent answers, blocked export/own deletion, preserved other answer and plan-erasure cascades.
- Actual local Auth/PostgREST and production browser: full mutual plan journey, explicit synthetic fixture passage to past time, private feedback readback, other-account invisibility, scoped custom-format feedback backup/atomic duplicate failure/delete/restore with parent data preserved, and Auth deletion cascade. The fixture timestamp change occurs only inside the disposable database; it does not model a production edit or new approval.
- Browser failure injection: retained unsaved selections, no success claim during outage, own export/removal, no stale answer after erasure, 375/1280 layout and no late repopulation after host removal. Screenshots are synthetic in docs/screenshots/plan-reflection.

Limitations: no email sign-in delivery, hosted provider/Edge deletion/restore or physical-device proof; no real-user usefulness evidence. Own export fails explicitly above 10,000 answers pending pagination. Retention is manual until plan/account deletion; no background job. Feedback does not yet influence ranking or generate notifications. More authenticated contributor, notification and navigation work remains in the full ledger.

Validation completed: 35 Node scripts, syntax gate, production build, all 13 default browser suites at both bases (including focused Pages Friends/shortlist follow-ups), all three configured private-social browser suites at both bases, and the complete social SQL authorization/race/recovery gate passed. Genuine local Auth reflection/restore and synthetic mobile screenshots passed. One earlier Pages Friends screen timeout did not reproduce in its focused rerun; diagnostics were added, and no cause is asserted. Hosted/device limitations remain.
