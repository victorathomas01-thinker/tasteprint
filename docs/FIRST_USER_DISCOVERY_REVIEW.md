# Smallest first-user discovery slice

**Subsequent Charlotte milestone:** the original five-candidate snapshot below is superseded by the [23-candidate field review](CHARLOTTE_CATALOG_FOUNDER_REVIEW.md), with 19 qualified for editorial review and four holds. No listings have been published. Historical #56 findings and validation below describe that PR's original scope.


Source of truth: the founder-requested Tasteprint First User Audit. This branch implements entry → optional visit intent → immediate item recommendations → private device Save, and prepares an unpublished Charlotte content draft. It does not activate accounts/social gates, change production settings, merge, or publish a site/catalog.

## User behavior

Home emphasizes discovery and a private saved list; all six assessments remain in an optional disclosure and the module hub. Business tools remain available. Discover puts item cards before advanced controls, with a collapsed optional visit-interest flow and a collapsed practical-filter form. Only populated categories are offered; an existing deep-link category remains visible so its empty result can be corrected. Active filters stay expanded. Unknown/stale cost, duration, access and availability still fail hard requirements.

Visit interests exist only in page memory and are never added to a share URL, telemetry or account copy. Category is an ordinary URL browsing filter, clearly distinguished from temporary interests. Skip does not save preferences. Explicit Remember merges likes only on this device, preserves hard avoids, sharing consent and saves, and refuses unreadable storage. Save retains keyboard focus at the item and says that no upload/sharing happened. Optional account-copy-enabled builds explain that copies are managed in Passport, not automatically synchronized; no Auth request is added for this copy.

## PR #55 diagnosis

The historical CI failure was reproduced from its log: build succeeded, then `owned artifact preview becomes ready` failed after ten seconds. Exact historical runtime conditions were not recoverable. Attempts with the original source under Node 24/forced color/CI settings and Node 22.23.4/CI settings both passed locally; the original cause is **not confirmed**. Do not attribute it to ANSI colors or resource pressure as a fact.

The old check depended on a console URL and then a successful HTML response. The replacement checks the owned process and exact freshly built `demo-build.json`, without relying on console formatting, with a 30-second overall deadline and bounded individual requests. A different/stale artifact cannot establish readiness. Failure includes stripped, bounded preview diagnostics. Tests cover an unrelated HTTP responder, delayed readiness, no readiness logs, process exit and a stalled request. Existing strict-port protection remains.

## Charlotte founder draft

`catalogs/charlotte-pilot-draft.json` contains five real, public-source-checked candidate listings: Not Just Coffee (7th Street), Amélie's (NoDa), Mint Museum Uptown, Bechtler Museum of Modern Art and UNC Charlotte's McMillan Greenhouse. Source URLs, checked timestamps, original factual summaries and verification limits accompany each record. No logo, image, review text or personal contact record was imported. No business is presented as a partner or ownership-verified.

The workbench's **Load Charlotte source-checked draft** button only fills an empty import field. It refuses to overwrite existing text, including edits typed while the module loads. Validate/import is a separate explicit action and creates draft workflow records, not approved or published entries. Existing local drafts, account data and consumer catalog selection remain independent. A stale draft still needs fresh review.

Prices, hours, duration, distance and availability are intentionally unknown. Mint's official accessibility page reports elevator access; the UNC source explicitly reports an accessible greenhouse while stating the outdoor gardens are not wheelchair-accessible. The greenhouse entry is scoped accordingly. Source-reported access is not an independent site inspection or assurance of current elevator operation, approach routes or all facilities. Confirm needs and current conditions before use. Hard limits never turn an unknown fact into a match.

Sources checked read-only over HTTPS:

- https://www.notjust.coffee/ — About/Visit, 7th Street name/address and coffee offering.
- https://ameliesfrenchbakery.com/noda-charlotte-nc/ — official location/café and coffee metadata; no unverified street address copied.
- https://www.mintmuseum.org/plan-your-visit/mint-museum-uptown/ and https://www.mintmuseum.org/accessibility/ — identity/address, collections and reported elevator access.
- https://www.bechtler.org/visit — identity and public location.
- https://gardens.charlotte.edu/visiting-the-gardens/ — greenhouse scope and explicit distinction from inaccessible outdoor paths.

Still needed: founder review of scope and usefulness; broader coffee/art coverage; field-specific, current access/price/time information where practical; maintenance ownership; separately approved publishing. This pack is not a live Charlotte inventory or event schedule. Only read-only official-page checks were used; no bulk crawler, third-party API, paid credentials, outreach or public offering activation.

## Verification

Run `npm test`, `npm run lint`, `npm run build`, `npm run test:browser`, `npm run test:catalog:configured` and `npm run test:public-demo`. The default browser matrix adds actual mobile/desktop first-user flow coverage at root and Pages paths. Connected catalog tests preserve no-private-draft/no-bundled fallback rules; public-demo checks retain storage isolation. Existing account/social authorization and business modules remain untouched.

All pre-existing modified/untracked files in the original and accessibility worktrees were hashed before implementation. Recheck these hashes before handoff. Do not incorporate or overwrite that unfinished accessibility work in this branch. Physical devices, screen readers, maintained source facts and hosted real accounts remain separately unverified. Exact final results are reported with the PR.
