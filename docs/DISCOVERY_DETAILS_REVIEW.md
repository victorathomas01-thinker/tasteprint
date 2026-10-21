# Discovery details and hard constraints

Users can open a specific item, inspect source/provenance and unknown practical facts, save it privately, compare it in Together, or prefill a private plan. Missing IDs show an explicit unavailable state. Filters cover category, search, saved items, USD budget, duration, distance, step-free access and availability. Browser Back, refresh and direct links preserve browsing controls. No tastes or private plan data are encoded in these links.

`discovery-core.js` contains pure browsing/query-state functions. `discovery.js` reuses the existing catalog, ranker, interest storage and card renderer; it does not add another recommendation algorithm. `catalog-core.js` rejects malformed display metadata before ranking or rendering. No dependencies added.

Validation: all 26 Node suites and production build passed. Seven browser suites passed at `/` and `/tasteprint/`, including item deep links/reload/Back, unknown IDs/HTML strings, category and unknown-duration exclusion, persistence, storage failure, keyboard controls and mobile overflow. Workspace SQL, social authorization/privacy/race SQL and social recovery rehearsal passed in isolated synthetic PostgreSQL. Enabled Plans bundles were separately checked with intercepted synthetic sessions at both bases. Screenshots in `screenshots/discovery-details/` preserve the dark design.

These six official film references remain independently unchecked here. There are no new real restaurants/events, price/access guarantees, bookings or externally enabled accounts. The existing large main-bundle warning remains; physical devices and hosted Supabase remain unverified. A contributor/source-maintenance workflow is next, followed by account-backed friend/shortlist functionality and reflection.
