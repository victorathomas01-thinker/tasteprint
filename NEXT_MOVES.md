# Tasteprint Next Moves

`?next=1` is the action layer that turns Tasteprint from a result generator into a lightweight decision aid.

## Why it exists

A named archetype is fun, memorable and shareable, but it does not solve much by itself. A recommendation engine is more useful when it helps someone move from “that sounds like me” to “this is the one thing I want to try next.”

Next Moves therefore keeps the interaction deliberately small:

1. finish a first-party Tasteprint module;
2. see three recommendation lanes with different tradeoffs;
3. mark one lane you would actually try;
4. Tasteprint saves that idea locally;
5. later, mark it Trying, Done or Not for now.

The system keeps at most one active move per module. A new active idea from the same domain moves the previous one into dismissed history instead of creating an endless aspirational to-do list.

## Psychology without dark patterns

The feature is designed around low-friction, autonomy-preserving ideas rather than pressure tactics:

- **Curiosity earns attention.** Archetypes and reveal language make the exploration enjoyable.
- **Small choice sets reduce overload.** Recommendation intelligence presents three meaningfully different lanes instead of a long ranked feed.
- **User agency stays visible.** The user decides which lane is worth trying; Tasteprint does not silently turn a score into a commitment.
- **One active experiment keeps the next action manageable.** The goal is not to create another backlog.
- **Progress becomes visible without streak pressure.** Saved → Trying → Done is useful state, not a gamified obligation.
- **Uncertainty remains honest.** Fit-confidence language describes the model's own separation/stability, not certainty about the person.

These are product-design principles, not clinical or behavioral-science claims about an individual user.

## Local-first storage

Next Moves uses:

```text
tasteprint.next-moves.v1
```

The record is allowlisted to:

- module
- result key
- recommendation ID
- recommendation name/icon/copy
- Saved / Trying / Done / Dismissed status
- created/updated timestamps

It does not contain:

- free-text diary entries;
- email/account identity;
- raw quiz answers;
- precise location history;
- contacts;
- demographic/protected attributes.

The history cap is 30 records.

## Privacy controls

`privacy-extensions.js` adds Next Moves to the existing Privacy & data dialog. Users can export the local decision memory as JSON or clear it independently.

The export does not contain the Supabase Auth session, account email, raw answers or campaign lead contacts.

## Relationship to recommendation feedback

When a user presses **I'd try this** in the recommendation-intelligence panel, the existing structured feedback record stores the selected recommendation ID. Next Moves listens for that local structured event and turns the selected lane into a decision card.

No additional remote analytics event is required for Next Moves itself. The action memory is primarily for the user, not a pretext for collecting more behavioral data.

## Future option

If users clearly value cross-device Next Moves later, the same sanitized records could receive an optional account-sync table. That should remain opt-in and separate from anonymous product analytics, just like Passport sync.
