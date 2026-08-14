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

## Campaign Studio

Open:

```text
?campaignAdmin=1
```

Campaign Studio is the first source-free authoring surface. It can:

- create campaign identity, brand accent, landing copy and result copy
- import a client catalog from CSV or JSON
- validate required catalog fields and duplicate IDs
- reject non-HTTPS outbound catalog URLs
- preview imported offers before launch
- save local campaign drafts in browser storage
- edit/delete saved local drafts
- launch the actual Tasteprint campaign runtime from a saved draft
- export the current catalog as CSV
- download a CSV starter template
- export a full campaign manifest as JSON

Local drafts are intentionally browser-local. They make campaign creation and portfolio demos much faster without pretending there is already a hosted multi-user CMS. The next production step is a database-backed campaign registry/publish flow.

### CSV catalog format

Supported headers:

```text
id,name,description,tag,modes,archetypes,ctaLabel,href
```

Separate multiple modes or archetypes with `|`:

```text
coastal-weekend,Coastal Weekend,Four nights by the water,Coast,Coastal Romantic|City + Coast,Golden Hour Romantic|Slow-Life Escapist,Explore,https://example.com/coastal
```

The importer also accepts `cta_label`, `cta`, `url`, or `link` as aliases for canonical fields.

### JSON catalog format

Campaign Studio accepts either a raw catalog array or a full object with a `catalog` array:

```json
{
  "catalog": [
    {
      "id": "offer-id",
      "name": "Offer name",
      "description": "...",
      "modes": ["Coastal Romantic"],
      "archetypes": ["Golden Hour Romantic"],
      "ctaLabel": "Explore",
      "href": "https://client.example/offer"
    }
  ]
}
```

## Campaign manifest

Source-controlled campaigns live under `campaigns/` as JSON. Browser-local Campaign Studio drafts use the same shape, so a downloaded draft can later be promoted into source control or a future database-backed registry.

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

Catalog entries declare the Tasteprint travel modes and optional archetypes they are designed for.

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

## Adding a source-controlled campaign

1. Build it in `?campaignAdmin=1` or duplicate `campaigns/aster.json`.
2. Give it a unique ID and client-safe copy/theme/catalog.
3. If it came from Campaign Studio, download the manifest JSON.
4. Place the manifest under `campaigns/` and register it in `campaign-config.js`.
5. Run `npm test`.
6. Open `?campaign=<id>` and review the experience.
7. Open `?campaignReport=<id>` to verify the reporting surface.

The CI campaign test verifies manifest integrity, configurable question/scoring behavior, CSV/JSON ingestion, catalog ranking, required admin/runtime assets, campaign analytics events, and reporting contracts.

## Still to build before a full commercial platform

- database-backed campaign registry and publish workflow
- hosted multi-user administration, authentication and permissions
- optional post-result lead capture with explicit consent and client-specific privacy terms
- campaign-level conversion events beyond outbound CTA clicks
- production asset/image management
- real client QA across brand assets, product feeds and analytics destinations
- first client campaign and case-study metrics
