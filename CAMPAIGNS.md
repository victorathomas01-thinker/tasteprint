# Tasteprint Campaign Engine

Tasteprint can run as the default Escape product or as a branded client campaign without forking the scoring application.

## Try the fictional demo

Open the deployed app with:

```text
?campaign=aster
```

The fictional **Aster & Tide** campaign demonstrates client theme/copy overrides, scoring emphasis, catalog matching, CTA instrumentation, and the optional post-result lead form. Its lead form is explicitly `demoOnly`, so contact details entered into that portfolio demo are discarded rather than stored.

The reporting surface is available at:

```text
?campaignReport=aster
```

Without Supabase it reports only campaign events stored in the current browser. With Supabase connected and the campaign SQL extensions installed, it can use aggregate production reporting without exposing raw event rows or lead contact data.

## Campaign Studio

Open:

```text
?campaignAdmin=1
```

Campaign Studio can:

- create campaign identity, brand accent, landing copy and result copy
- import a client catalog from CSV or JSON
- validate required catalog fields, duplicate IDs and HTTPS outbound URLs
- configure optional post-result lead capture
- require custom explicit-consent copy and a privacy URL for real lead capture
- preview imported offers before launch
- save/edit/delete local campaign drafts in browser storage
- launch the actual Tasteprint runtime from a saved draft
- export catalogs as CSV and full manifests as JSON
- publish/unpublish a validated campaign when the production registry is connected
- show the public campaign registry once the backend is active

Local drafts remain browser-local. Publishing is a separate privileged operation.

### CSV catalog format

Supported headers:

```text
id,name,description,tag,modes,archetypes,ctaLabel,href
```

Separate multiple modes or archetypes with `|`.

## Published campaign registry

`supabase/campaign-registry.sql` creates `tasteprint_campaigns`, a registry for campaign manifests with `draft`, `published`, and `archived` states.

The browser does not get direct table access. Public reads go through:

- `tasteprint_public_campaign(campaign_id)`
- `tasteprint_public_campaign_index()`

For explicit production QA, open:

```text
?campaign=<id>&published=1
```

This forces the published registry version to win over a browser-local draft with the same ID.

### Secure publish path

Publishing is intentionally not authorized with a Vite environment value or public Supabase key. `supabase/functions/publish-campaign/index.ts` requires a server-side `TASTEPRINT_PUBLISH_TOKEN`, re-validates the manifest, then uses `SUPABASE_SERVICE_ROLE_KEY` inside the Edge Function to write the registry. Campaign Studio does not save the operator token.

To activate publishing:

1. Run `supabase/campaign-registry.sql`.
2. Deploy `supabase/functions/publish-campaign`.
3. Set a strong `TASTEPRINT_PUBLISH_TOKEN` Edge Function secret.
4. Configure the frontend `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values.
5. Publish a test campaign from Studio and verify `?campaign=<id>&published=1`.

This is currently a secure single-operator workflow. Multi-user roles and client permissions belong to the later hosted-admin phase.

## Optional post-result lead capture

Lead capture is deliberately **after** the Tasteprint result. A campaign can omit it completely or add:

```json
{
  "leadCapture": {
    "enabled": true,
    "collectName": false,
    "title": "Want this match in your inbox?",
    "body": "We can send the matched details and next steps.",
    "consentText": "I agree that Brand may contact me about this result.",
    "privacyUrl": "https://brand.example/privacy",
    "consentVersion": "v1",
    "submitLabel": "Send my match",
    "successText": "Got it. Your request was submitted."
  }
}
```

For a non-demo campaign, `privacyUrl` must be HTTPS. The browser requires the user to check the consent box, and the `capture-lead` Edge Function independently requires `consent: true` before accepting a contact.

`supabase/leads.sql` creates `tasteprint_campaign_leads`. That table has RLS enabled and no public read/write policy. The browser cannot query it directly. `supabase/functions/capture-lead/index.ts` checks that the campaign is currently published and that lead capture is enabled, then writes through the service role.

Email/name are never included in `tasteprint_events`, campaign conversion properties, or the aggregate campaign report. The lead table stores an email hash alongside the contact so repeat submissions for the same campaign can be safely upserted.

To activate real lead capture:

1. Run `supabase/leads.sql` after the core schema and campaign registry.
2. Deploy `supabase/functions/capture-lead`.
3. Publish a campaign with `leadCapture.enabled: true`, explicit consent copy and an HTTPS privacy URL.
4. Test a submission and verify the contact exists only in the restricted lead table.
5. Verify `?campaignReport=<id>` increases lead/conversion counts without exposing contact details.

## Conversion analytics

The commercial event contract includes:

- `campaign_view`
- `campaign_result_match`
- `campaign_cta`
- `campaign_lead_view`
- `campaign_lead_submit`
- `campaign_conversion`

Lead submission automatically records a privacy-safe `lead_submit` conversion after the contact endpoint succeeds. `campaign-conversion.js` also exposes a deliberately small conversion API for `booking_intent`, `checkout_start`, `purchase_confirmation`, and `custom` events. It accepts structured campaign metadata, not names, emails or free-form notes.

`supabase/campaigns.sql` aggregates views, matches, CTA clicks, lead-form views/submits, total conversions, CTA rate, lead completion rate, conversion rate, per-item CTA activity and conversion types. Contact records are not exposed through this RPC.

## Campaign manifest

Source-controlled campaigns live under `campaigns/` as JSON. Browser-local Campaign Studio drafts and database-published campaigns use the same basic shape. A campaign can define identity, theme, landing/result copy, question overrides or complete questions, scoring multipliers, optional lead capture, and a catalog.

Catalog entries declare the Tasteprint travel modes and optional archetypes they are designed for. The current matcher intentionally stays interpretable: travel-mode overlap is the strongest signal, with archetype overlap as a secondary signal.

## Adding and publishing a campaign

1. Build it in `?campaignAdmin=1` or duplicate `campaigns/aster.json`.
2. Give it a unique ID and client-safe copy/theme/catalog.
3. Configure lead capture only when there is a real follow-up use case and privacy policy.
4. Validate the catalog and preview the local draft.
5. Download the JSON manifest if you want a portable/source-controlled copy.
6. Run `npm test` before shipping code changes.
7. When the production registry is active, publish from Campaign Studio.
8. Open `?campaign=<id>&published=1` to verify the database-backed version.
9. Open `?campaignReport=<id>` to verify CTA, lead and conversion reporting.

The CI campaign test covers manifest validation, question/scoring configuration, CSV/JSON ingestion, catalog ranking, admin/runtime assets, analytics/reporting contracts, the public campaign registry, publish authorization, lead storage boundaries, and the capture-lead function contract.

## Still to build before a full commercial platform

- activate and QA the registry, lead table and Edge Functions against the real production Supabase project
- hosted multi-user administration, authentication and permissions
- production asset/image management
- real client QA across brand assets, product feeds and analytics destinations
- first client campaign and case-study metrics
