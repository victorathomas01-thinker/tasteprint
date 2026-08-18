# Tasteprint Privacy Model

Tasteprint deliberately separates data by purpose instead of building one master user table that can quietly connect everything.

## Four data zones

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
