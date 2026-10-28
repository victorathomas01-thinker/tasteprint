# Together: specific shared interests and film shortlists

Based on #17 (editable interests/catalog), itself based on #16 (consolidated integration). Earlier PRs/dirty checkout remain untouched; no merge into main or deployment.

## What a person can do

1. In Passport, choose likes/avoids and allow individual liked interests in friend links. No quiz or account required.
2. In Discover, save a specific film. Open Together, expand Choose what to share, check only the films to include, optionally choose broad preference fields, and create/copy the snapshot link.
3. Open it in another browser with its own local interests. Together shows exact overlapping interests, films both saved and the sender’s explicit shortlist. It recommends specific films based on independent fits, penalizing the weakest fit rather than averaging taste vectors. A saved item supplies an explicit preference signal; hard exclusions remain dominant.
4. Save or dismiss options privately. Suggest creates a local proposal draft and a catalog-ID idea link, suitable for discussing through normal chat. User-entered titles/HTTPS links remain possible and get no invented fit data.
5. The decision state demo is now collapsed and explicitly simulated. Opening it demonstrates separate interest, versioned bilateral detail approval, reapproval after edits, cancellation and self-report. It does not contact or impersonate a real recipient.

The shared shortlist is a versioned link snapshot, not a live collaborative list. Copies cannot be revoked or guaranteed private. v1 links remain compatible, and v2 exposes only selected allowed values. Dislikes and private saves never flow to friend links or anonymous analytics. Plan drafts disappear on reload; interest/saves persist only in the browser.

## Architecture and evidence

`together-core.js` adds the backwards-compatible allowlisted snapshot codec and actual interest/item intersection. `catalog-core.js` independently fits every participant, includes explicit saved-item preference and applies 65% minimum +35% mean fit; partner status is ignored. `together.js` uses the shared safe item renderer and real catalog instead of generic activity categories, and separates normal proposals from local participant simulation. Catalog source/licensing/availability limitations from #17 still apply. Mobile privacy access remains in the footer rather than floating over controls.

Validation: full 22-suite npm test and production build; five Playwright suites (legacy hotel/operator, navigation, Phase 0, Together, item discovery) at both root and /tasteprint/. SQL security remains byte-for-byte unchanged from #13; local reporting/authorization gate was rerun during consolidation. Browser tests cover two independent contexts, share allowlisting, shared saved film, real overlap, specific ranking, hidden simulation, detail reapproval/cancellation, malformed links, missing items, malicious custom titles, storage failures and responsive widths. Screenshots are in docs/screenshots/item-discovery. Physical phones, live source playback and real pair usefulness remain unverified.

## Ordered next milestone

First verify the official film references and content metadata manually (outbound access to the publisher is blocked here), then run a founder-led synthetic walkthrough against normal chat. No real-person recruitment or data collection has been initiated. Before any actual account-connected pilot, approve a minimal staging configuration/cost envelope and security acceptance matrix below. Public nearby discovery, Circles, contributor administration and commercial features stay later priorities.

Interactive local production preview is running at http://127.0.0.1:4194/tasteprint/ in this workspace with backend configuration cleared. Reproduce with `TASTEPRINT_REVIEW_PORT=4194 npm run review` (or the default free port 4193). This is not a public deployment. `test:preview` now also proves an occupied HTTP port cannot be mistaken for the requested build.
