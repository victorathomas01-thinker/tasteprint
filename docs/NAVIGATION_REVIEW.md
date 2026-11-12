# Business and consumer entry integration

This branch brings the previously uncommitted landing/navigation slice into review without modifying its original checkout. It is stacked on the Charlotte hotel demonstration branch. Nothing here was merged or deployed.

- Home offers clear personal-discovery and business paths, the six existing consumer modules, Passport and Next Moves.
- Business entry links the fictional Charlotte guest demo, operator walkthrough, Studio, explicit local report and Workspace demo.
- Campaign directory exposes only the two reviewed bundled demonstrations (Aster and Demo Hotel CLT), supports search/empty state and never enumerates local/private drafts.
- Shared navigation/resource links connect first-party features. Branded hotel pages retain their own hotel header rather than inserting a consumer menu into the guest journey.
- `campaignGuide`, campaign/result/challenge, Passport, invitation and admin routes take precedence over marketing entry. Escape links are explicit `?module=escape` now that the bare root is a landing page.

`npm test` includes navigation route/private-draft regressions and the existing hospitality/consumer suites. `npm run build` compiles the app. `test:navigation:browser` checks real Home → business → hotel operator → directory → guest links, search/empty states, private-draft exclusion, Aster and responsive widths against a running built preview. `test:hospitality:browser` also runs to protect guest/operator flows, all six consumer entries, Escape/shared results, Passport and Next Moves. PR CI runs both browser suites.

The original checkout's uncommitted files remain unchanged and uncommitted. This review branch copies them, integrates the hotel work and adds targeted corrections; it does not replace or clean that checkout. Hosted publication, public-directory enrollment, billing and production data collection are outside this change.

Use the local preview from this navigation checkout for the combined experience: `npm run dev -- --host 127.0.0.1 --port 5184 --strictPort --base /tasteprint/`. The root, `?business=1` and `?campaigns=1` are the three new entry points. They are local functionality, not a live public release.
