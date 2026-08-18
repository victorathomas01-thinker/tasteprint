# Tasteprint Campaign Engine

Tasteprint can run as the default Escape product or as a branded client campaign without forking the scoring application.

## Try the fictional demo

Open:

```text
?campaign=aster
```

The fictional **Aster & Tide** campaign demonstrates client theme/copy overrides, scoring emphasis, catalog matching, CTA instrumentation and the optional post-result lead form. Its lead form is `demoOnly`, so contact details entered into the portfolio demo are discarded rather than stored.

The aggregate report is:

```text
?campaignReport=aster
```

Without Supabase it reports only current-browser campaign events. With Supabase connected and the campaign SQL installed, it can use aggregate production reporting without exposing raw event rows or lead contact data.

## Campaign Studio

Open:

```text
?campaignAdmin=1
```

Campaign Studio can create campaign identity/brand/copy, import CSV or JSON catalogs, validate catalog data and HTTPS links, configure optional post-result lead capture, save/edit/delete local drafts, preview the real campaign runtime, and export catalogs/manifests.

The Studio remains completely usable without Supabase.

`studio-workspace-bridge.js` now augments Studio with two things:

1. **Experience QA** — a live quality/privacy review that checks value clarity, useful output, recommendation breadth, value-before-data, consent, safe links, autonomy-preserving copy and sensitive-targeting fields.
2. **Workspace handoff** — when Studio is opened from an authenticated Campaign Workspace, editors can load/save hosted drafts and Owner/Admin roles can publish.

The old browser-entered shared operator publish-secret section is hidden and is no longer the active publish authorization path.

### CSV catalog format

```text
id,name,description,tag,modes,archetypes,ctaLabel,href
```

Separate multiple modes/archetypes with `|`.

## Campaign Workspace

Open:

```text
?workspace=1
```

Without Supabase, this automatically renders a fictional local team demo. A reviewer can switch Owner/Admin/Editor/Analyst/Viewer roles, inspect permission differences, see the privacy architecture and Experience QA, and open Aster/Studio. Nothing is uploaded.

With Supabase active, `supabase/workspaces.sql` provides private tenant workspaces, membership roles, hosted campaign drafts and one-time invite links.

Workspace membership tables do **not** store member email/name columns. Invitations use random one-time tokens; only SHA-256 token hashes are stored. The browser member-list RPC returns a short hashed `member_ref`, role, join time and `is_me`, rather than exposing Auth user UUIDs.

Role model:

- **Owner** — full campaign and member management.
- **Admin** — create/edit/publish/archive, aggregate metrics and invite links.
- **Editor** — create/edit hosted drafts, no publishing.
- **Analyst** — read + aggregate metrics.
- **Viewer** — read-only.

See `WORKSPACES.md`.

## Published campaign registry

`supabase/campaign-registry.sql` creates `tasteprint_campaigns`, the deliberately public/published registry.

Browsers do not get direct table access. Public reads go through:

- `tasteprint_public_campaign(campaign_id)`
- `tasteprint_public_campaign_index()`

For explicit production QA:

```text
?campaign=<id>&published=1
```

forces the published registry version to win over a browser-local draft with the same ID.

Private hosted drafts live separately in `tasteprint_workspace_campaigns`.

## Authenticated publish path

Publishing now uses the signed-in Workspace user rather than a shared secret typed into the browser.

`campaign-remote.js` sends:

- the public Supabase API key in `apikey`;
- the signed-in user's Auth JWT in `Authorization`;
- the selected `workspace_id` in the request body.

`supabase/functions/publish-campaign/index.ts` then:

1. verifies the user JWT;
2. verifies membership in the supplied workspace;
3. requires Owner/Admin role;
4. re-validates the campaign manifest;
5. rejects sensitive identity/contact targeting keys;
6. rejects unsafe script/`javascript:` content;
7. checks that an existing public campaign ID belongs to the same workspace;
8. writes only after those checks pass using a backend secret/service credential.

The browser never receives the backend secret key.

The authenticated function uses an explicit CORS origin allowlist rather than `*`. Additional trusted production origins can be supplied server-side through:

```text
TASTEPRINT_ALLOWED_ORIGINS
```

## Experience QA

A branded interactive can be psychologically engaging without becoming manipulative.

Tasteprint's deterministic campaign review treats privacy failures as blocking and rewards campaigns that:

- make the user payoff clear quickly;
- provide multiple concrete options with reasons;
- have enough catalog breadth that personalization is real rather than cosmetic;
- give the result before asking for contact details;
- use explicit consent/HTTPS privacy terms for real follow-up;
- use secure outbound links;
- avoid manufactured urgency/dark-pattern phrases;
- avoid demographic/medical/political/other sensitive targeting fields.

The score is a product heuristic, not a scientific personality or conversion claim.

The intended psychology is autonomy-preserving: curiosity makes the experience fun, progress/reveal makes it satisfying, a small choice set reduces overload, and the user chooses the next action.

## Optional post-result lead capture

Lead capture stays **after** the Tasteprint result. A campaign can omit it entirely or configure an explicit follow-up use case.

For a non-demo campaign, the privacy URL must be HTTPS. The browser requires explicit consent, and `capture-lead` independently requires consent before accepting contact data.

`supabase/leads.sql` creates the restricted lead table. It has RLS enabled and no public read/write policy. Contact email/name are not included in anonymous events, Workspace membership or aggregate campaign reports.

The Workspace UI intentionally does not provide a raw-lead browser. Aggregate metrics are enough for ordinary campaign collaboration; contact access remains a separate privileged business process.

## Conversion analytics

The commercial event contract includes:

- `campaign_view`
- `campaign_result_match`
- `campaign_cta`
- `campaign_lead_view`
- `campaign_lead_submit`
- `campaign_conversion`

The conversion API accepts structured campaign metadata, not names, emails or free-form notes.

`supabase/campaigns.sql` aggregates views, matches, CTA clicks, lead-form views/submits, total conversions, CTA rate, lead completion rate, conversion rate, per-item CTA activity and conversion types. Contact records are not exposed by the aggregate RPC.

## Campaign manifest

Source-controlled, local Studio, hosted Workspace and public registry campaigns use the same basic manifest shape: identity, theme, landing/result copy, question/scoring configuration, optional lead-capture configuration and catalog.

Catalog matching intentionally stays interpretable: travel-mode overlap is strongest, with archetype overlap as a secondary signal.

Campaign manifests are configuration, not a place to smuggle in user profiles. Authenticated publishing rejects sensitive-targeting keys.

## Production activation

1. Run `supabase/schema.sql`.
2. Run `supabase/campaigns.sql`.
3. Run `supabase/campaign-registry.sql`.
4. Run `supabase/workspaces.sql`.
5. Run `supabase/leads.sql` if real consent lead capture is required.
6. Deploy the updated `publish-campaign` Edge Function.
7. Deploy `capture-lead` if required.
8. Configure the GitHub Pages/auth callback URLs.
9. Configure the public Supabase URL/key in the frontend build.
10. Add any extra trusted origins to `TASTEPRINT_ALLOWED_ORIGINS`.
11. Test Owner → invite link → Editor → hosted save → Owner publish across separate browser sessions.
12. Verify `?campaign=<id>&published=1` and `?campaignReport=<id>`.
13. Verify an Analyst cannot edit and an Editor cannot publish, even by calling the API directly.

## Still requiring real-world work

- activate/QA the full campaign/workspace/lead stack in the real Supabase project;
- physical/mobile campaign QA;
- a real client campaign;
- case-study engagement/conversion metrics;
- client-specific asset/feed integrations when a real campaign needs them.

See `WORKSPACES.md`, `PRIVACY_MODEL.md`, and `ROADMAP.md`.
