# Tasteprint Privacy Model

Tasteprint deliberately separates data by purpose instead of building one master user table that can quietly connect everything.

## Five data zones

### 1. Anonymous consumer product data

Used for product analytics, Escape share profiles, referral attribution and structured recommendation feedback.

May contain anonymous install/session IDs, score vectors, result labels and allowlisted event properties.

Does not intentionally contain account email, campaign lead contacts, raw answer selections, precise location history, contacts or protected-attribute profiles.

### 2. Optional account-backed Passport

Used only when a user explicitly chooses cross-device Passport sync.

Supabase Auth holds the login email. The Passport table stores the Auth user ID plus sanitized Passport snapshots. The email is not copied into anonymous analytics.

### 3. Campaign Workspace administration

Used by authenticated people creating branded Tasteprint campaigns.

Workspace tables contain tenant IDs, role membership and hosted campaign manifests. They do not contain member email/name columns. Invite links use one-time random tokens and only token hashes are stored.

Workspace UI does not provide raw anonymous-consumer or raw-lead browsing.

### 4. Explicit-consent campaign leads

Used only when a real campaign enables post-result contact capture and the user explicitly consents.

Lead contact values are sent to the restricted lead Edge Function/table. They are not copied into Tasteprint analytics events, Workspace membership, Passport or recommendation-intelligence records.

### 5. Private social connections, shortlists and plans (review-only)

Selected friend projections, independently submitted interest/choices and versioned plans are a separate account-backed purpose. They are not copied into anonymous analytics, Workspace reports or merchant catalogs. Authentication alone does not make a profile discoverable or share private Passport answers. See the gated implementation and lifecycle sections below.

## Browser keys versus backend secrets

The frontend may contain a Supabase publishable/legacy anon key. That key is treated as public and receives only the privileges allowed by Postgres roles/RLS.

Secret/service-role keys must exist only in trusted backend environments such as Edge Functions. The repository regression suite scans browser client files for server-secret markers.

## Row Level Security

Every authenticated per-user or per-tenant table is expected to use RLS and least-privilege policies.

Examples:

- Passport rows match `auth.uid()`.
- Workspace campaign rows require membership in the row's `workspace_id`.
- Editors can write hosted drafts but cannot publish.
- Publishing checks Owner/Admin membership again server-side before using any elevated backend key.

Browser UI state is never considered sufficient authorization.

## Shared links

Public result/challenge links intentionally contain only data required to reconstruct the shared experience. Stateless links use compact score vectors/checksums. Backend short profiles expose only deliberately shared result fields through narrow RPCs.

Referral tokens are anonymous attribution identifiers, not account/user IDs.

## Deletion

Anonymous browser data uses a private deletion token. The database stores only its SHA-256 hash.

Optional Auth account deletion is separate because anonymous analytics were intentionally not keyed to that account.

Next Moves is local-first and can be exported/cleared independently.

## Campaign publishing

Campaign manifests are not allowed to become a hidden sensitive-targeting channel. The Experience QA and server publish validation reject sensitive identity/contact targeting keys. The server also rejects unsafe script/javascript URL content and non-HTTPS catalog links.

Authenticated publishing enforces:

1. valid user JWT;
2. valid workspace ID;
3. membership in that workspace;
4. Owner/Admin role;
5. campaign-ID ownership for updates/unpublishing;
6. server-side manifest validation.

## CORS

Authenticated admin Edge Functions should use an explicit origin allowlist rather than `*`. The public GitHub Pages origin and local development origins are supported by the current publish function, with additional origins supplied through a server environment value.

## Logging rule

Do not log:

- API secret/service-role keys;
- Auth bearer tokens;
- raw workspace invitation tokens;
- raw campaign lead contact values;
- private deletion tokens.

Error messages returned to clients should describe the failed operation without echoing credentials.

## Demo mode

A product demo should not require a database full of fake people.

Campaign Workspace has a fictional local demo that exercises role/permission UX and Experience QA without uploading anything. All six consumer modules, Passport, recommendation intelligence, Next Moves, Campaign Studio and the fictional campaign continue to have backend-free local behavior.

## Regression guard

`scripts/check-privacy-boundaries.js` checks several structural boundaries in CI, including:

- browser clients contain no secret/service-role key markers;
- Workspace RLS and hashed invitations exist;
- publishing verifies user/tenant/role on the server;
- wildcard CORS is not used by authenticated publishing;
- Workspace browser code does not request internal audit/user IDs it does not need;
- Workspace actions are not sent into anonymous consumer analytics.

Automated checks reduce accidental regressions but do not replace a production security review, Supabase Security Advisor review, dependency updates, physical-device testing or incident-response planning.

## Together review prototype (not deployed)

Together is a separate social purpose. It reads only a minimal selected projection from the local Passport (or editable starting values); a manually shared fragment link carries checked curiosity/serenity/energy values and a seven-day client expiry. No raw answers, names, account identifiers, plan details or history are shared. Fragment values are not sent as HTTP request targets. Together routes suppress anonymous page-view telemetry. Link contents are readable/alterable by their holder and identity is not verified; client expiry is not authoritative revocation. Do not share sensitive information. Plans and personal saves are memory-only, erased on reload, not Next Moves or account sync. No social backend or social graph is activated.

Threat model: forwarded/tampered links, HTML/URL injection, unilateral agreement and leakage to analytics/business reports. Prototype controls include field allowlisting, bounded decode, expiry checks, output encoding, HTTPS-only supplied links without credentials, no network plan storage, visibly simulated friend responses, and versioned bilateral detail approvals. There are no accounts/blocks in this local prototype; it must never be represented as safe connected-user authorization.

Connected staging requires separate approval: existing Supabase Auth identities, server-authoritative participant-only plan transitions, version-checked approvals, hashed expiring/revocable single-purpose invitations, block checks on every read/write path, RLS/direct-API denials, rate limits, deletion/retention, private defaults and operational abuse support. No automatic connection to anonymous events, Workspace tenants or leads. Do not activate live social collection from this proposal.

## Explicit interests and item discovery (development only)

`tasteprint.interests.v1` stores allowlisted liked/avoided interest IDs, explicitly shareable liked IDs, saved catalog IDs and dismissed IDs on this browser. This separate versioned record preserves all existing module-history and account-sync contracts. No free-text profile, contact information, raw quiz answers or private schedule is stored there. Interests and item decisions are not uploaded or included in business metrics. Discover suppresses anonymous page telemetry; local save/edit events are UI signals only. Sharing permissions default off and cannot include a disliked interest.

Passport export includes this record. Privacy controls can export/clear it separately; local Passport reset also clears it. Existing account export/deletion and cloud sync do not include this local-only store, which is stated in the UI. Real-user collection and account-backed interest sync remain unapproved.

## Together interest/item snapshots (v2, development only)

The v2 fragment link includes only individually approved liked interest IDs, explicitly selected saved film IDs and optional checked broad preference values. Dislikes, other saves, history, identity and plan details remain absent. The sender UI rechecks current sharing permissions and saved state at link creation. Old v1 score-only links still decode. Recipients see an immutable snapshot and actual intersections with their local explicit interests/items, not a synchronized social graph. Anyone holding a link can read/change it; client expiry is not server revocation. Withdrawing permission prevents inclusion in new links, but cannot recall links already sent.

A film idea link contains only its public catalog ID. Private plan drafts stay in page memory; all participant-response controls sit inside an explicit local simulation disclosure. No cross-device mutual choice or verified attendance is claimed. Actual authenticated shared shortlists and plans remain a separately approved staging milestone.

## Company profile drafts (development only)

`tasteprint.company-drafts.v1` holds at most ten browser-local fictional company drafts, each with bounded business descriptions/HTTPS links and up to 30 structured offerings. It contains no Passport, raw answers, leads, account identity, verification proof or social plans. Company Studio can export or clear its own draft. These records are not uploaded, published, listed in the real catalog or included in consumer telemetry. Local ranking reads the viewer's own allowlisted interests; it never sends them to a business. Normal demo routes do not read private drafts; preview must be explicit, while published routes fail unavailable until a real publishing backend is approved. Browser verification/freshness/availability claims are discarded.

## Private plan backend foundation (not activated)

The review-only social schema is separate from anonymous events, Passport sync, Workspace administration, company drafts and leads. It holds Auth actor references, private idea/title/details, bounded one-use invitation hashes, per-participant interest/revision approvals and self-report timestamps. No email/name/contacts, raw quiz answers, public discovery or business report join is introduced. The sender receives an invitation capability once; plaintext tokens are not stored. Both actors are denied reads/responses when blocked; no browser role can rewrite another participant’s response or read invite hashes. Creator delete cascades records, and deletion of either Auth participant currently removes the entire shared plan. That shared-deletion policy, selective participant export/removal, retention and operational abuse controls require review before live use. Tests use disposable synthetic identities only. No social DB has been installed or connected.

## Private Plans screens (development only, explicit activation gate)

Plans is a separate authenticated consumer purpose, disabled unless an expressly approved build enables its feature gate and backend. It never substitutes Together simulation for failed remote state. Invitation fragments are consumed into page memory and removed from the visible address; there is no analytics, local token storage or automatic invitation delivery. Auth changes clear visible records and invalidate pending client results. Existing shared Auth credentials stay within the existing Auth storage contract.

The accessible plan record and participant responses may be intentionally downloaded as private JSON. Agreed time/place/title may be explicitly exported as a static calendar file, excluding tokens and attendee email. These exports contain private shared information: keep or share them intentionally. Blocks deny both actors' plan access and are manageable through own-row RLS. Creator-only permanent deletion removes the whole shared record and remains possible by ID while blocked. This is not recipient-selective deletion, full account export, a retention job or certified real-user privacy readiness. See `docs/PRIVATE_PLANS_UI_REVIEW.md` and `docs/SOCIAL_STAGING_APPROVAL.md`; no live social collection has been enabled.

## Plan participation lifecycle (review-only follow-up)

`supabase/social-plan-privacy.sql` adds caller-scoped participation export and whole-shared-record erasure, including for a blocked recipient. Export withholds blocked shared content and the other person's identity/response; only the caller's own response/role and plan ID remain. The proposed first-pair removal policy erases the plan, invitation and both responses permanently, matching existing account-deletion cascades; block relationships and existing downloads remain. The UI requires confirmation and explains that this differs from cancellation. This is not a full account export or per-person redaction that retains the other person's copy. Approval of this policy remains part of the real-user gate.

Explicit cleanup removes only the caller's unclaimed plans expired at least seven days ago. No scheduled retention job is configured or running. See `docs/PLAN_PRIVACY_LIFECYCLE.md` for pagination/account-change safeguards, validation and remaining account-wide/operational requirements. No live social migration has been applied.

## Private friend connections (review-only, disabled by default)

`social-friends.sql` adds a private social-zone connection, not a public profile directory or Workspace data. Each invitation sends only an explicitly chosen display alias and allowlisted interest tags. No quiz history, private dislikes, saved items, city, contact list or raw Passport vector is added to the friend share. The full app's existing optional Passport account sync remains a separate purpose; its hosted compatibility is not proven by these friend tests.

A 256-bit, seven-day capability is hashed at rest. Claiming binds the Auth JWT actor and creates a pending request; only the inviter may confirm it. Claims are serialized, replay/self/blocked/expired requests fail, and a unique unordered-pair index prevents duplicate relationships. Aliases are unverified; users must compare account IDs through a trusted channel. The UI scrubs invitation fragments, never stores their codes in local storage, and leaves delivery to the user.

No client has direct table access, including token hashes. Authenticated RPCs scope reads/writes to actual participants and enforce shared block rules in both directions. Only the acting participant can update their projection. Every Friends request binds the displayed account to the actual session before sending; session changes clear private UI and invalidate late responses. RPC/backend errors have no local success fallback. Anonymous analytics suppresses this route.

Either participant can revoke/remove the whole connection while blocked or expired; Auth deletion cascades it. Own export includes the caller's contribution, with the other person's details redacted when inaccessible. Removing a friend does not erase existing shared plans or recalled downloads: use plan privacy tools for plans. Accepted connections persist until explicit removal or Auth deletion; expired pending rows have no scheduled cleanup yet. An outstanding-invitation cap and total relationship bound protect resource use; they are not full gateway rate limiting or a moderation service.

`VITE_PRIVATE_FRIENDS_ENABLED=false` is the default. This schema is outside the PR #24 hosted-staging approval and has not been installed externally. Local SQL/restore and intercepted production-bundle tests do not prove hosted Auth/PostgREST, email recovery, safeguarding operations or real-device behavior. No public discovery or stranger messaging is enabled.

## Account-backed shared shortlists and repeat proposals (review-only)

`social-shortlists.sql` permits only a confirmed, unblocked two-person connection. Each immutable participant suggestion has separate per-actor responses and one current choice per participant. Both must independently choose the same unchanged suggestion before the server creates one mutual-interest plan. It does not invent time/place approvals or a booking. Row locks make concurrent conversions idempotent. Public catalog IDs supplied by a caller are not authority for source metadata; the UI matches title/link against the bundled catalog or labels the idea participant-added/unverified.

A planned or erased proposal can be explicitly suggested again as a fresh option. No responses, choices, schedule or approvals are copied. Erased plan IDs cannot silently be recreated from old choices. Source availability and rights need checking again. Removing a friend connection cascades its options, responses and choices but preserves already created plans. Removing a plan erases the plan data, not separately shared suggestion snapshots or explicit repeat copies; withdraw your own suggestion or remove the connection to remove those. Downloads cannot be recalled.

Own shortlist exports remain available while blocked, excluding other-person identities, responses and idea text. Raw table access is revoked and RLS enabled; scoped RPCs enforce the JWT actor. No secret invite tokens, private schedules or anonymous telemetry are added to shortlist data. `VITE_PRIVATE_SHORTLISTS_ENABLED=false` remains default; enabling requires the Friends and Plans gates and a separately approved schema. No new schema has been installed externally.

## Private post-plan reflections (review-only account/social zone)

`social-reflection.sql` stores only the authenticated actor's typed attendance, enjoyment and repeat-intent answers for an exact plan revision. It accepts submissions only after the start of a mutually agreed plan; block, membership and revision checks apply. No other participant can read these answers. They never change shared approval/completion, recommendation scores, business reporting or anonymous analytics. They remain self-reports, never verified attendance or commercial conversions.

Raw table access is revoked with RLS enabled. Actor-scoped RPCs provide read/update/export/own erasure; own exports and erasure remain available when blocked. Plan deletion, participation erasure and affected Auth deletion cascade feedback. Until explicitly removed, older revision answers are retained for the actor's own export; there is no background retention job. Exports fail explicitly above 10,000 answers rather than truncate. Existing downloads cannot be recalled.

`VITE_PRIVATE_REFLECTION_ENABLED=false` is the default and requires the private Plans gate. The additive schema is outside the approved PR #24 hosted rehearsal. Local disposable fixtures only; no hosted schema or real feedback collection has been enabled.
