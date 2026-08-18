# Tasteprint Campaign Workspace

Campaign Workspace is the multi-user administration layer for Tasteprint Drops. It is designed so the public portfolio can demonstrate the workflow even when no Supabase project is connected, while the production path uses authenticated tenant isolation rather than a shared browser-entered publish secret.

## Demo-first route

Open:

```text
?workspace=1
```

If Supabase is not configured, the route automatically renders a fictional local workspace. Nothing is uploaded. The demo lets a reviewer switch among Owner, Admin, Editor, Analyst and Viewer roles, see the permission differences, inspect the privacy boundary, open the fictional Aster & Tide campaign, and view the Experience QA scorecard.

You can also force the local demo after Supabase is connected:

```text
?workspace=1&demo=1
```

This means a portfolio review, class demonstration or client pitch never depends on a live database being healthy.

## The user problem

Tasteprint is not meant to be a personality quiz with prettier CSS. The product problem is decision overload in taste-heavy categories: people can browse hundreds of destinations, clothes, shows, workout styles, meals or living environments without becoming more confident about what will actually fit them.

The product therefore uses a two-part experience:

1. a playful identity/reveal layer that makes preference discovery enjoyable enough to finish and share;
2. a decision layer that narrows the output into explainable recommendations and a concrete next move.

Campaign Workspace applies the same rule to branded work. A campaign should earn attention with curiosity and identity, but it is not considered high quality if it fails to give the user useful options before asking for contact information.

## Experience QA

`workspace-core.js` includes a deterministic campaign review used by the Workspace and Campaign Studio bridge. It is a product-quality heuristic, not a psychological diagnosis or conversion guarantee.

It checks whether a campaign:

- states a clear value promise;
- gives multiple concrete recommendations rather than one disguised advertisement;
- has enough catalog breadth for recommendations to be meaningfully different;
- delivers the result before asking for follow-up contact;
- uses explicit consent and an HTTPS privacy URL for real lead capture;
- uses HTTPS outbound catalog links;
- avoids artificial urgency / dark-pattern copy;
- avoids sensitive-attribute targeting fields.

Privacy failures are blocking. Quality misses lower the score and explain what should change.

The design intent is simple: reduce cognitive load, preserve user agency, make the payoff immediate, keep uncertainty honest, and give the result somewhere useful to go.

## Roles

The initial role model is deliberately small:

- **Owner**: all campaign permissions, invites and member-role management.
- **Admin**: create/edit/publish/archive campaigns, view aggregate metrics and create invite links.
- **Editor**: create and edit hosted drafts, but cannot publish.
- **Analyst**: read the workspace and aggregate campaign metrics, but cannot edit.
- **Viewer**: read-only workspace access.

Publish permission is checked again on the server. Hiding a button in the browser is never treated as authorization.

## Tenant isolation

Run `supabase/workspaces.sql` after the core schema and campaign registry. It creates:

- `tasteprint_workspaces`
- `tasteprint_workspace_members`
- `tasteprint_workspace_invites`
- `tasteprint_workspace_campaigns`

RLS is enabled on the workspace and hosted-campaign tables. The helper `tasteprint_workspace_role(workspace_id)` resolves only the current authenticated caller's role. Hosted campaign reads/writes are restricted to members of that workspace, and editor/admin/owner permissions are separated.

The public `tasteprint_campaigns` registry remains distinct from private hosted drafts. Publishing copies a validated workspace manifest into the deliberately public registry.

## No invitee email database

Workspace invitations intentionally do not require Tasteprint to store an invitee email address.

`tasteprint_create_workspace_invite(...)` generates a high-entropy one-time token. Only its SHA-256 hash is stored in `tasteprint_workspace_invites`; the raw token is returned once so the inviter can copy the link.

The recipient signs in normally, opens the invite link, and `tasteprint_accept_workspace_invite(...)` hashes the supplied token and consumes the matching unexpired invitation.

The member-list RPC does not return Auth user UUIDs. It exposes a short hashed `member_ref`, role, join time and `is_me` flag. The owner can use that `member_ref` to change/remove a non-owner member.

## What Workspace does not expose

The Workspace UI intentionally has no route/API for browsing:

- raw anonymous Tasteprint event rows;
- anonymous install/session IDs;
- browser deletion hashes;
- Passport score history for consumers;
- campaign lead emails/names;
- user contact lists;
- raw quiz answer selections.

Campaign reports remain aggregate. Restricted lead-contact storage remains a separate service-role path.

## Authenticated publishing

The old single-operator publish-token UI is hidden by `studio-workspace-bridge.js` and is no longer used by `campaign-remote.js`.

Production publishing now requires:

1. a valid Supabase Auth user session;
2. a real `workspace_id` in the Studio URL;
3. server-side membership in that workspace;
4. Owner or Admin role.

The `publish-campaign` Edge Function verifies the user token, verifies workspace membership with the backend client, validates the manifest, rejects sensitive targeting keys/unsafe script URLs, checks workspace ownership of an existing campaign ID, and only then uses the backend secret key to write.

The browser never receives the secret/service-role key.

## CORS

The authenticated publish function no longer uses wildcard CORS. The repository includes the GitHub Pages origin and local Vite origins, and additional production origins can be supplied through:

```text
TASTEPRINT_ALLOWED_ORIGINS
```

as a comma-separated server-side Edge Function environment value.

## Hosted Studio bridge

Open a hosted campaign from Workspace and the URL looks like:

```text
?campaignAdmin=1&workspace=<workspace-uuid>&hosted=<campaign-id>
```

`studio-workspace-bridge.js` can copy the hosted manifest into the existing local editor, keeps ordinary local preview behavior intact, adds Experience QA, adds a Save to team workspace action for editors, and exposes authenticated publish/unpublish only to Owner/Admin roles.

The local editor remains usable with no backend at all.

## Production activation order

For the workspace layer:

1. run `supabase/schema.sql`;
2. run `supabase/campaign-registry.sql`;
3. run `supabase/workspaces.sql`;
4. deploy the updated `publish-campaign` Edge Function;
5. configure the GitHub Pages URL in Supabase Auth redirects;
6. configure the public project URL/key in the frontend build;
7. if using a custom deployment origin, add it to `TASTEPRINT_ALLOWED_ORIGINS`;
8. create a Workspace account and test Owner → invite → Editor → hosted draft → Owner publish across two browsers.

The existing local demo remains available before, during and after production activation.
