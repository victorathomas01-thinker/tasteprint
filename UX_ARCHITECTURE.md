# Tasteprint entry and navigation

The root URL is the product landing page. It gives people two paths: personal discovery and business experiences. Shared navigation and resource links remain available across the existing screens. Existing query-string URLs remain supported, including campaign, invitation, result and challenge links.

## Destinations

| Destination | URL | Purpose |
| --- | --- | --- |
| Home | `?` | Explain Tasteprint and choose a starting point |
| Discover | `?modules=1` | Choose a consumer module |
| Campaigns | `?campaigns=1` | Search the curated campaign showcase |
| For businesses | `?business=1` | Create → guest preview → reporting → team workflow |
| My Passport | `?profile=1` | Review combined preferences, history and account options |
| Next Moves | `?next=1` | Save and track recommendations |
| Escape | `?module=escape` | Enter travel discovery directly |

All six consumer experiences share Passport and result-level feedback, comparison and sharing. These contextual controls stay beside the result rather than becoming competing global navigation items. Privacy and the product tour are in the shared footer. Business reporting, referrals and team tools are linked from the business page.

## Adding capabilities in stages

1. Add consumer modules to the existing `platform-core.js` registry and implement their runtime and completion contract. The landing grid reads that registry; do not duplicate module lists there.
2. Add business destinations to `BUSINESS_TOOLS` in `navigation-core.js`. Give each tool a concrete task, an accurate readiness label and a working route.
3. Add reviewed bundled campaigns to the existing static registry in `campaign-config.js`. The directory reads this registry and excludes local drafts and remote records. It is a curated showcase, not automatic publication of Studio drafts or a hosted marketplace. The bundled campaigns are the fictional Aster & Tide travel demo and the fictional Demo Hotel CLT hospitality demo. The business page links to the guest experience, operator walkthrough and explicit local reporting.
4. Connect hosted operations separately: activation, permissions, published-directory policy and backend end-to-end tests must precede claims about production publishing, bookings, leads or shared reports.

Public entry routing lives in `navigation-core.js`; `landing.js` owns rendering and campaign search; `navigation.js` owns the shared shell; `navigation.css` scopes the entry-page presentation. Feature scoring and campaign functionality remain in their existing modules. Recognized feature routes take priority over public entry flags, so a shared result or invitation cannot accidentally become a marketing page.

## Validation

Run `npm test` (including `test:navigation` and hospitality coverage), `npm run build`, and the Playwright `test:hospitality:browser` / `test:navigation:browser` commands against the built preview. Browser checks should cover home → all six modules, the complete Escape flow, result sharing controls, Passport → Escape, business tools, campaign search/empty state, campaign guest flow, back navigation, mobile widths and keyboard focus. Use both root and GitHub Pages base paths. Bundled demo and browser-local tools work without Supabase; hosted functionality needs separate backend validation.


This branch integrates the pre-existing uncommitted landing/navigation work into the hospitality branch without changing the original dirty checkout. The hotel operator `campaignGuide` route is recognized as a feature route; it must never resolve to the marketing homepage. Branded hotel pages keep their own hotel header. No source changes in this branch imply a live deployment.
