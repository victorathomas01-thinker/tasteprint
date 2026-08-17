# Tasteprint Campaign Engine

Tasteprint can run as the default Escape product or as a branded client campaign without forking the scoring application.

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

Campaign Studio can:

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
- publish/unpublish a validated campaign when the production registry is connected
- show the public campaign registry once the backend is active

Local drafts remain browser-local. Publishing is a separate privileged operation.

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

## Published campaign registry

`supabase/campaign-registry.sql` creates `tasteprint_campaigns`, a registry for campaign manifests with `draft`, `published`, and `archived` states.

The browser does **not** get direct table access. Public campaign reads go through two narrow RPCs:

- `tasteprint_public_campaign(campaign_id)` — resolves one published manifest
- `tasteprint_public_campaign_index()` — returns minimal metadata for currently published campaigns

The consumer runtime can resolve a published campaign before the quiz initializes. For explicit production QA, open:

```text
?campaign=<id>&published=1
```

This forces the published registry version to win over a browser-local draft with the same ID.

### Secure publish path

Publishing is intentionally not authorized with a Vite environment value or public Supabase key. Anything compiled into the browser bundle should be treated as public.

`supabase/functions/publish-campaign/index.ts` is the privileged write layer. It:

1. receives a validated manifest from Campaign Studio
2. requires `x-publish-token`
3. compares it against the server-side `TASTEPRINT_PUBLISH_TOKEN`
4. uses `SUPABASE_SERVICE_ROLE_KEY` only inside the Edge Function
5. re-validates the campaign and catalog server-side
6. increments the campaign version and marks it published
7. can archive/unpublish an existing campaign

Campaign Studio asks the operator for the publish token only when they click Publish/Unpublish. Tasteprint does not save that token to local storage or the campaign manifest.

To activate this after creating the production Supabase project:

1. Run `supabase/campaign-registry.sql`.
2. Deploy `supabase/functions/publish-campaign`.
3. Set a strong `TASTEPRINT_PUBLISH_TOKEN` as an Edge Function secret.
4. Ensure the function has its normal server-side `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` values.
5. Configure the public frontend `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values.
6. Use Campaign Studio to publish a test campaign.
7. Verify it with `?campaign=<id>&published=1`.
8. Test unpublishing and confirm the public resolver no longer returns it.

This is currently a secure **single-operator** workflow. Multi-user roles, invitations and client permissions belong to the later hosted-admin phase.

## Campaign manifest

Source-controlled campaigns live under `campaigns/` as JSON. Browser-local Campaign Studio drafts and database-published campaigns use the same basic shape.

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

## Adding and publishing a campaign

1. Build it in `?campaignAdmin=1` or duplicate `campaigns/aster.json`.
2. Give it a unique ID and client-safe copy/theme/catalog.
3. Validate the catalog and preview the local draft.
4. Download the JSON manifest if you want a portable/source-controlled copy.
5. Run `npm test` before shipping code changes.
6. When the production registry is active, enter the operator token and publish from Campaign Studio.
7. Open `?campaign=<id>&published=1` to verify the database-backed version.
8. Open `?campaignReport=<id>` to verify reporting.

The CI campaign test verifies manifest integrity, configurable question/scoring behavior, CSV/JSON ingestion, catalog ranking, admin/runtime assets, campaign analytics, reporting contracts, the public campaign registry, and the secure publish-function contract.

## Still to build before a full commercial platform

- activate and QA the registry/publish flow against the real production Supabase project
- hosted multi-user administration, authentication and permissions
- optional post-result lead capture with explicit consent and client-specific privacy terms
- campaign-level conversion events beyond outbound CTA clicks
- production asset/image management
- real client QA across brand assets, product feeds and analytics destinations
- first client campaign and case-study metrics
