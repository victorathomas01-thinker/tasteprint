# Tasteprint Campaign Engine

Tasteprint can now run as the default Escape product or as a branded client campaign without forking the scoring application.

## Try the fictional demo

Open the deployed app with:

```text
?campaign=aster
```

The fictional **Aster & Tide** campaign demonstrates:

- client theme tokens
- client landing/result copy
- per-question copy overrides
- per-dimension scoring multipliers
- a client catalog
- Tasteprint-to-catalog matching
- partner CTA instrumentation
- a clear fictional-demo label so portfolio visitors are not misled

The reporting surface is available at:

```text
?campaignReport=aster
```

Without Supabase it reports only campaign events stored in the current browser. With Supabase connected and `supabase/campaigns.sql` installed, it can use aggregate campaign reporting without exposing raw event rows.

## Campaign manifest

Campaigns live under `campaigns/` as JSON. `campaign-config.js` is the registry and validation/transform layer.

A campaign can define:

```json
{
  "id": "brand-id",
  "name": "Brand Name",
  "theme": {
    "accent": "#...",
    "accentSoft": "rgba(...)"
  },
  "copy": {
    "title": "...",
    "lede": "...",
    "start": "...",
    "catalogTitle": "..."
  },
  "questionOverrides": {
    "0": { "title": "...", "subtitle": "..." }
  },
  "scoring": {
    "dimensionMultipliers": {
      "comfort": 1.1
    }
  },
  "catalog": []
}
```

A campaign may also provide a complete `questions` array instead of `questionOverrides`. That allows a client-specific discovery experience while reusing the same result engine.

## Catalog matching

Catalog entries can declare the Tasteprint travel modes and archetypes they are designed for.

```json
{
  "id": "offer-id",
  "name": "Offer name",
  "description": "...",
  "modes": ["Coastal Romantic"],
  "archetypes": ["Golden Hour Romantic"],
  "ctaLabel": "Explore",
  "href": "https://client.example/..."
}
```

The current matcher intentionally stays interpretable: travel-mode overlap is the strongest signal, with archetype overlap as a secondary signal. This makes early client campaigns easy to explain and tune.

The Aster & Tide demo uses `href: null`, so its CTA records a demo interaction without pretending a fictional booking page exists.

## Analytics and reporting

The commercial layer adds:

- `campaign_view`
- `campaign_result_match`
- `campaign_cta`

All campaign events include a `campaign_id`. Result-match events also include the user's archetype, travel mode, and matched catalog item IDs. CTA events include the selected catalog item and rank.

`supabase/campaigns.sql` defines `tasteprint_campaign_stats(campaign_id)`, which returns aggregate campaign views, result matches, CTA clicks, CTA rate, unique campaign sessions, and per-item click counts. The reporting function does not expose raw event rows.

No raw quiz answers are added to campaign analytics.

## Adding another campaign

1. Duplicate `campaigns/aster.json`.
2. Give it a unique ID and client-safe copy/theme/catalog.
3. Register it in `campaign-config.js`.
4. Run `npm test`.
5. Open `?campaign=<id>` locally and review the experience.
6. Open `?campaignReport=<id>` to verify the reporting surface.

The CI campaign test verifies manifest integrity, configurable question/scoring behavior, catalog ranking, required assets, campaign analytics events, and reporting contracts.

## Still to build before selling this as a full campaign platform

- production-grade CSV/JSON catalog ingestion rather than source-controlled manifests
- optional post-result lead capture with consent and client-specific privacy terms
- campaign-level conversion events beyond outbound CTA clicks
- campaign administration rather than developer-edited JSON
- real client QA across brand assets, product feeds, analytics destinations, and conversion definitions
