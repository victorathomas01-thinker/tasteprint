# Demo Hotel CLT: guest and operator walkthrough

Status: implemented locally on an isolated branch, not deployed. Demo Hotel CLT and all six offers are fictional. No real partner, price, schedule, menu, availability or booking is represented. Contact collection is disabled. No paid or production infrastructure was activated.

## Local preview

From the hospitality checkout, run `npm install --package-lock=false`, then `npm run dev -- --host 127.0.0.1 --port 5180 --strictPort --base /tasteprint/`.

Open the local server's `/tasteprint/` path with:

- Guest: `?campaign=charlotte-boutique-demo`
- Operator walkthrough: `?campaignGuide=charlotte-boutique-demo`
- Studio: `?campaignAdmin=1&edit=charlotte-boutique-demo`
- Honest local report: `?campaignReport=charlotte-boutique-demo&demo=1`

A stable public demo URL and a distributable QR are deliberately withheld until release approval. A local-server URL is not a public customer preview.

## Five-minute walkthrough

1. Open the guest page. Confirm fictional-hotel status. Answer eight hotel-relevant single-choice questions.
2. Review three distinct ideas with a reason and a tradeoff. Expand an action; it explains an illustrative next step and makes no reservation. No signup or contact form appears.
3. Open the operator guide, then Studio. Change the introduction, an offer name and two descriptions using the labeled fields. Save draft & preview, retake and confirm those edits. Hotel questions, scoring and demo safeguards must remain intact.
4. Open the explicit local report. Confirm actual browser-local views/starts/completions/actions. Retakes are counted again; no guest or revenue data is invented. A different browser begins at zero.
5. Export the manifest/catalog and review `HOTEL_PILOT_KIT.md`.

## Implementation seams

- `campaigns/charlotte-boutique-demo.json`: fictional branding, eight questions, six offers, tradeoffs and demo/privacy settings.
- `hospitality-core.js`: deterministic selection over the existing `matchCatalog` ordering, distinct offers and honest no-match alternatives. Uses the original travel vectors; no trained model or new general vertical framework.
- `hospitality.js` / `hospitality.css`: optional hospitality result presentation and demo-only action details. Original consumer result rendering remains the default.
- `hospitality-guide.js`: backend-free hotel-operator walkthrough and setup checklist.
- `studio-manifest.js`: retains the fields the Studio form does not edit; the team bridge uses the same manifest interface. Offer fields and CSV/JSON retain tradeoffs.
- `analytics.js` / `campaign-report.js`: campaign-scoped local starts/completions and explicit local reporting. Fictional hotel telemetry is not posted to a configured backend. Hotel results do not silently enter consumer Passport history.

## Verification

- `npm test`: existing suites plus `test:hospitality`.
- `npm run build`: production compilation; existing bundle-size warning remains.
- `npm run test:hospitality:browser`: repeatable Playwright guest/operator test, with a local built preview running. `TASTEPRINT_TEST_URL` selects the root or Pages-base server; `PLAYWRIGHT_CHROMIUM_EXECUTABLE` can select an already installed Chromium. Otherwise run `npx playwright install chromium`. `TASTEPRINT_SCREENSHOT_DIR` optionally saves review screenshots. Playwright is pinned as a development-only dependency; it is not shipped in the product bundle. PR CI installs Chromium and checks the built app.
- `bash scripts/check-workspace-reporting.sh`: existing synthetic database/reporting regression coverage. The separate Workspace authorization PR is a prerequisite for staging, not silently included in this demo branch.
- Hotel suite exhausts 65,536 answer paths, requires three distinct recommendations and verifies all six offers are reachable as a first recommendation. This is a correctness/reachability check, not a real-population distribution claim.
- Tests cover deterministic reasons, sparse/no-match/empty catalogs, safe URLs and escaping, tradeoff CSV/JSON roundtrip and preservation of questions/scoring/demo flags in Studio.
- Browser walkthrough covers guest completion, demo action, scoped events/report, no lead collection, Passport separation, operator edit/save/preview, mobile/tablet/desktop widths, keyboard and the `/tasteprint/` base path.

Screenshots: [guest desktop](screenshots/hotel-guest-desktop.png), [results desktop](screenshots/hotel-results-desktop.png), [results mobile](screenshots/hotel-results-mobile.png), [operator](screenshots/hotel-operator-desktop.png).

## Remaining verification / boundaries

Physical iOS/Android/native-share tests, real hotel usefulness, production Supabase/PostgREST/JWT/Edge Functions, cross-device reporting, abuse handling and availability fulfillment are not established by this demo. Authenticated and production failure behavior is inherited from PR #9 and tested with local SQL/controlled browser fixtures; it is not evidence of a live backend.

No new domain, billing, booking/CRM/PMS integration, learned personalization, real contact storage or simulated production metrics was added.
