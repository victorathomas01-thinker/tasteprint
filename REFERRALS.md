# Tasteprint Referral Attribution

Tasteprint Escape has a friend-challenge loop that can be measured without building a social graph or storing names.

The referral system now has three layers:

1. `referral.js` decorates outbound challenge links with a short anonymous creator-session token and records share-sheet outcomes.
2. `referral-core.js` defines the privacy-safe funnel math used for local fallback/testing.
3. `supabase/referrals.sql` adds the cross-device aggregate RPC used by `?growth=1` once Supabase is connected.

## What gets attributed

When someone creates a friend challenge, Tasteprint records a session-scoped `referral_token` on the `challenge_create` event. The same token is placed in the shared URL as `ref=...`.

If a recipient opens the link, the token is carried as the event row's `referral_id` through the challenge flow. This lets aggregate reporting connect:

```text
challenge create
→ share outcome
→ recipient open
→ recipient completion
→ comparison unlock
→ optional same-session reshare
```

The token is not a name, account ID, contact, email address, or permanent person identifier.

## Share outcomes

`referral.js` now records `challenge_share_outcome` with one of these states:

- `shared` — the browser's native share action completed
- `copied` — the challenge URL was copied to the clipboard
- `show` — Tasteprint had to reveal the link for manual copying
- `cancelled` — the native share sheet was dismissed

A successful browser callback is useful product telemetry, but it is **not proof a message was delivered or read**. The growth dashboard says this explicitly.

## Aggregate metrics

`tasteprint_referral_stats()` returns only aggregate counts/rates. It never returns the referral tokens themselves.

The report includes:

- challenge actions
- distinct creator-session tokens
- successful share actions
- share-outcome counts
- recipient opens
- attributed recipient opens
- distinct recipient sessions
- attributed recipient sessions
- recipient completions
- comparison unlocks
- creator tokens that produced at least one open
- creator tokens that produced at least one completion
- same-session downstream sharers
- attribution coverage
- creator-token activation rate
- completion-producing creator-token rate
- recipient completion rate
- same-session reshare rate

## Rate gates

Tasteprint deliberately hides unstable rates early.

Creator-token effectiveness rates require at least:

```text
20 distinct creator-session tokens
```

Recipient completion requires at least 20 **attributed recipient opens**.

Same-session resharing requires at least 20 **attributed recipient sessions**.

The counts can still be visible before those thresholds, but the UI says the rates are still collecting rather than turning tiny samples into false certainty.

These thresholds are product-review minimums, not claims of statistical significance for every experiment.

## Why the denominators matter

Recipient completion is calculated from attributed opens, not every historical challenge open. That prevents older/unattributed links from artificially depressing a referral conversion rate that cannot actually be connected to a creator token.

Same-session resharing also uses attributed recipient sessions as its denominator.

## Local fallback versus real cross-device reporting

Without Supabase, `?growth=1` can still summarize challenge creation and share-sheet outcomes recorded on the current browser.

It intentionally does **not** pretend it knows what happened on a friend's device. Cross-device token activation, recipient conversion, and resharing stay marked as backend-required until the aggregate RPC is active.

Once the backend is connected, `growth.js` calls:

```text
tasteprint_referral_stats()
```

and switches to a real cross-device aggregate view.

## Privacy boundary

The public referral RPC returns no:

- referral-token values
- install IDs
- session IDs
- owner hashes
- email addresses
- account IDs
- contact-list data
- raw event rows
- sender/recipient pair records

It is intentionally impossible to use the public dashboard to answer “who sent this to whom?”

## No social graph

Tasteprint does not build a sender-recipient graph. A creator token is session-scoped and used only as an anonymous attribution key for the invite loop.

This also means some useful growth questions remain intentionally approximate. For example, same-session resharing undercounts a recipient who returns on a later session and shares then.

## Production activation

Run after `supabase/schema.sql`:

```text
supabase/referrals.sql
```

Then ensure the public Vite Supabase URL/key are configured and redeploy GitHub Pages.

Open:

```text
?growth=1
```

The page should switch from local-only mode to the cross-device aggregate report.

## Regression coverage

`scripts/check-referrals.js` verifies:

- the new analytics event exists
- referral tokens connect creator events to recipient outcomes
- creator-token rate gating
- downstream same-session resharing
- the growth dashboard loads the aggregate RPC
- the public SQL aggregate does not expose raw identity/referral fields
- the public build loads the growth assets

## What this unlocks

Once real traffic exists, Tasteprint can answer practical product questions without guessing:

- Are people creating challenges but not actually sharing them?
- Are shared links getting opened?
- Do recipients finish the quiz?
- Do completed comparisons make recipients want to create their own challenge?
- Is the bottleneck the share message, the recipient flow, or the comparison payoff?

Those are the useful viral-loop questions. They are more actionable than simply counting raw shares.
