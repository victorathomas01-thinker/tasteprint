# Editable interests and specific-item discovery

This records the #17 increment. Subsequent Together integration is documented in [TOGETHER_ITEMS_REVIEW.md](TOGETHER_ITEMS_REVIEW.md).

Based on the consolidated review build (#16), without modifying its branch or earlier PRs.

Users can optionally select likes/avoids and approve individual liked interests for future friend links in Passport, with no new quiz. Existing quiz history/scoring remains unchanged. `?discover=1` recommends six named Blender films from a validated editorial catalog; users can search, save, hide, restore and consider an item together. New preferences and item decisions remain local, exportable and clearable, separate from existing account sync.

Current catalog scope is deliberately narrow: original descriptions/tags, known film titles and official project reference URLs. Attempts to fetch studio.blender.org were blocked by this environment (curl returned 000); no source is marked verified, no price/runtime/accessibility/playback is asserted, and all availability is unknown. Users must check the official reference. This is real-item recommendation, not a certified live local-outings catalog. No scraping, copyrighted images, API key, licensing purchase or third-party service was introduced. Restaurants/cafés remain an evaluation priority but need reliable source/freshness ownership before listing real operating details.

`interests-core.js` sanitizes versioned explicit choices; `interests.js` handles resilient local storage/editor. `catalog-core.js` validates records, source URLs, revisioned updates, deduplication, withdrawals and freshness, enforces every participant’s exclusions and ranks items independently for each person before applying 65% minimum fit +35% mean. Unknown/unverified/stale fields never satisfy hard cost/time/distance/access/availability requirements. Partner/sponsored metadata does not affect organic ranking. `catalog.js` is the small bundled catalog, `item-view.js` the safe shared renderer, and `discovery.js` the first item browser.

The contract supports film/restaurant/café/event/product/hotel/activity records with tags, attributes, coarse location, provenance, constraints, links and availability. Only films are populated or advertised. JSON is the developer ingestion seam; contributor UI/CSV moderation is later roadmap work. There is no general-purpose inventory integration or backend.

Walkthrough: Passport → choose Animation Like, Drama Avoid, optionally allow Animation sharing → Save interests → Find specific things → inspect Spring → Save → reload → search → apply maximum cost 0 to see unknown metadata excluded → clear filter → Consider together. Until the next Together increment, the old prototype still shows generic activity ideas; do not represent its current link format as sharing the new interests.

Validation: `npm test`, `npm run build`, `npm run test:browser` (both root and Pages paths); focused `test:discovery` and `test:discovery:browser`. Synthetic checks cover old-history compatibility, private defaults, conflicts, dedup/update/removal, unsafe URLs, stale/unknown metadata, participant symmetry/exclusions and sponsor invariance. Browser checks cover edits/reload, persistence, item search/save/dismiss, hard-filter empty state, blocked storage and mobile widths. Physical devices, external playback, actual pair usefulness and hosted account integration remain unverified.

Next: carry only explicitly approved interest/item snapshots into Together, show actual overlap and specific joint shortlists, retain honest local proposal boundaries. No infrastructure or public launch is authorized by this increment.
