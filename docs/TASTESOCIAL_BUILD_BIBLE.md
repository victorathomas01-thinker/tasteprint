# TASTESOCIAL — BUILD BIBLE
## Version 0.1.0 · Vision, Product Architecture, Engineering Roadmap & Commercial Strategy

**Date:** October 21, 2026  
**Status:** Founder-approved strategic direction; implementation plan subject to milestone and deployment gates  
**Parent product:** Tasteprint  
**Working initiative / codename:** TasteSocial  
**Primary repository:** `https://github.com/victorathomas01-thinker/tasteprint`  
**Live site:** `https://victorathomas01-thinker.github.io/tasteprint/`  
**Audience:** Founder, Codex, future contributors, early testers, and prospective collaborators  

> **Core thesis:** Help people discover what they like, discover what they share with others, and turn those interests into real-world plans and lasting connections. Businesses participate by offering genuinely relevant products, experiences, events, and clearly disclosed promotions—not by controlling who or what is deemed the “best match.”

**Working product promise:** **Find what you love. Find your people. Make something happen.**  
**Operating sequence:** **Discover → Connect → Do → Reflect → Discover again.**

---

# PART I — WHAT WE ARE BUILDING

## 1. Executive directive

TasteSocial is a proposed **social discovery and real-world action layer for Tasteprint**, not an unrelated app, an automatic company rebrand, or a license to replace the existing product. Tasteprint currently has six modules and a cross-domain Passport that infer expressed preferences; TasteSocial would use those preferences to help friends, partners, and opt-in nearby adults discover mutual interests and agree on things to do together.

**Fundamental reorientation:** Previous Tasteprint plans prioritized B2B hospitality campaigns, with a consumer recommendation platform in parallel. This build **elevates social and consumer usefulness to the primary product direction**, while preserving business campaigns as an optional revenue and partnership channel. Do not immediately discard existing hospitality or campaign code; fit it into the revised architecture.

TasteSocial is *not*: a dating app; a feed optimized for scrolling; a popularity/follower contest; a direct-message network at launch; a second mandatory quiz after every brand discovery; a marketplace where payment secretly controls “compatibility”; or a claim that a recommendation equals a sale or friendship.

TasteSocial *is*: a reusable preference profile; discovery of actual things; transparent interest overlap; private friend-to-friend invitations; mutual choice and plan coordination; an optional, privacy-conscious directory of people sharing interests within a chosen city; and eventually trusted business participation.

The founding test is behavioral: **Does using TasteSocial make it easier for people to choose something together and actually do it?** If not, more quizzes, badges, social features, or paid placements do not solve the core problem.

## 2. Nonnegotiable product principles

1. **Real life beats screen time.** Optimize for meaningful decisions, mutually agreed plans, useful redemptions, and repeated real-world activity—not minutes in app or infinite feeds.
2. **Useful alone, better together.** A new user gets value from individual discovery even if no friend joins. A friend invitation makes the result more useful. Local discovery must not require an existing large network.
3. **One Passport, no quiz fatigue.** Reuse existing Tasteprint preferences; ask only the extra question actually needed for a decision (e.g. availability, budget, group size). Official branded campaigns can be fun *optional* experiences.
4. **Explain common ground.** Show the actual overlapping interests, preferences, and tradeoffs. Never invent a scientifically precise human-compatibility percentage.
5. **Mutual choice, not pressured attendance.** Interested, both interested, time/place agreed, and attended are distinct states. Do not imply commitment or attendance from a like, view, or click.
6. **Local with privacy.** Chosen city or discovery region is sufficient for nearby profiles. Do not disclose exact locations, routine, live GPS coordinates, or attendance plans to strangers by default.
7. **Safety is a launch prerequisite.** Private-by-default accounts, profile visibility controls, blocking, reporting, rate limits, abuse handling, and consent-based connections precede public stranger discovery.
8. **Truthful rankings and incentives.** Organic results are based on documented relevance and practical constraints. Sponsored placement is visibly labeled and cannot purchase “best match” status.
9. **Respect the established brand.** Preserve Tasteprint's current dark visual system and familiar interactions. Social design should feel like the same product, not generic luxury hospitality or a newly invented theme.
10. **Ship complete useful slices.** Favor one real end-to-end friend-to-friend flow over six half-connected dashboards. Validate with actual users before scale.

## 3. Naming, brand, and navigation

**Default for development:** `Tasteprint` stays the public-facing product and repository name. `TasteSocial` is the working name for this build/initiative, with public naming reserved for founder approval. The social layer may eventually be called *Together*, *Circle*, or *TasteSocial*; choose labels only after testing comprehension.

Proposed first-class destinations, not necessarily all visible on day one:

| Area | Job | First implementation |
| --- | --- | --- |
| **Discover** | Find things in existing domains | Existing Escape, Wear, Watch, Move, Eat, Live + actionable catalogs |
| **Passport** | Understand and selectively share one's tastes | Existing Passport with consent-based profile sharing |
| **Together** | Compare with a friend, find common options | **First social MVP** |
| **Plans** | Propose, accept, schedule, track a shared experience | **First social MVP**, initially small |
| **Similar Tastes** | Opt-in nearby people with overlapping interests | Later, after account/safety foundations |
| **Campaigns** | Optional licensed/official brand experiences | Preserve existing Studio and fictional demos |
| **For Business** | Verified offerings, campaigns, partner insights, promotions | Staged according to evidence and audience |

Avoid presenting all proposed tabs as functioning before they exist. Use readiness labels, existing routes, and feature flags. Do not make every user take a hotel quiz after finishing Escape.

## 4. Target users and key jobs

**Primary first user:** an adult wanting to decide what to do with a friend, partner, roommate, or small existing group: a restaurant, film, cultural activity, class, trip, event, or product to try together. They are underserved when discussions become “I don't know, what do you want to do?” and everyone's tastes or constraints differ.

**Second user:** an adult who has opted in to meeting others in their city through particular shared interests. They need a reason to connect and an activity to do, but also privacy, permission, and a way to say no without friction.

**Future business user:** a venue, retailer, hotel, entertainment company, organizer, or brand that has a relevant offering and wants to reach well-suited individuals/groups, measure legitimate actions, or publish an official branded Tasteprint experience. **This buyer and willingness to pay are hypotheses to validate, not established facts.**

## 5. What differentiates it from general AI and existing social apps

The differentiator is **not** “we use AI,” “we have quizzes,” or “our compatibility score is scientific.” A general-purpose AI assistant can propose restaurants or movies, and incumbents already provide social graphs, event catalogs, invitations, reviews, and coupons.

Potential differentiators to *prove*:

- Reusable **cross-domain preference memory** the individual controls, rather than one-off prompts or merchant-specific quizzes.
- Shared recommendation logic that protects the **least-satisfied member** of a group rather than just averaging everybody into a mediocre compromise.
- Transparent “**why we both might like this**” explanations plus constraints and meaningful alternatives.
- A simple loop from interest to mutual agreement to an actionable plan, with follow-up that can improve future matching.
- Social graph formed through shared decisions and real-world experiences, not popularity metrics.
- Business catalog participation grounded in the actual interest/intent signal without secretly altering organic ranking.

Treat all five as product hypotheses. Run comparative user tests against normal group chat, Google/Maps-style searching, and an AI prompt before claiming superiority.

---

# PART II — EXISTING TASTEPRINT BASELINE

## 6. What already exists, and what does not

**Repo baseline as checked October 21, 2026. Re-verify before touching code.**

Existing on `main` at last check: commit `acca63e45dbde456aeb194088af6abde99ddf7dd`. Existing first-party modules and infrastructure:

- Six live consumer modules: **Escape, Wear, Watch, Move, Eat, Live**. Each is based on forced-choice tradeoffs and interpretable domain scores/archetypes, with recommendation interfaces.
- **Passport** aggregates a shared ten-dimensional preference representation across modules: novelty, structure, social energy, aesthetic sensitivity, comfort, energy, serenity, sentiment, curiosity, spontaneity. Code uses the canonical keys in `platform-core.js`; preserve those contracts. Latest result from each module has equal weighting.
- **Next Moves** is a local-first action memory with Saved / Trying / Done / Dismissed states; don't turn its simple personal reminders into public plans or pretend local status equals verified activity.
- Existing result-card sharing, anonymous friend challenge/score comparison, and privacy-limited referral telemetry. **These do not constitute a signed-in friendship network or mutual cross-device attendance agreement.**
- Rule-based recommendation and explanation infrastructure. Separate `ml_lab/` analyzes synthetic data; **no trained real-user production taste model**.
- Optional Supabase/Postgres/Auth/RLS/Edge Functions for account sync, workspaces, publishing, reporting, referral aggregation, and consented campaign leads; **live backend activation and end-to-end production testing remain unverified**.
- Branded campaign Studio, Aster & Tide fictional campaign, and a fictional Demo Hotel CLT guest-experience slice under development. These are optional campaign/merchant capabilities, not a new required quiz for every consumer.
- Vite, JavaScript/HTML/CSS, GitHub Pages, Node regression suites, GitHub Actions, plus Playwright browser tests on newer feature branches. Keep the existing stack unless clear evidence warrants a change.

**Open review branches / PRs as checked:**

| PR | Area | Status at bible creation |
| --- | --- | --- |
| [#9](https://github.com/victorathomas01-thinker/tasteprint/pull/9) | Campaign reporting/routing/security | Open / unmerged |
| [#10](https://github.com/victorathomas01-thinker/tasteprint/pull/10) | Workspace role security | Open / unmerged |
| [#11](https://github.com/victorathomas01-thinker/tasteprint/pull/11) | Fictional Charlotte hotel campaign | Open / unmerged |
| [#12](https://github.com/victorathomas01-thinker/tasteprint/pull/12) | Consumer/business navigation | Open / unmerged |
| [#13](https://github.com/victorathomas01-thinker/tasteprint/pull/13) | Integrated review of #9–#12 including #10 security files | **Draft / unmerged**; combined GitHub Actions tests reportedly/independently confirmed passing |
| [#7](https://github.com/victorathomas01-thinker/tasteprint/pull/7) | Independent ML lab validation | Open / unmerged; unrelated |

Integration branch: `integration/tasteprint-hospitality-security-review`, head `155eef4739513522e897c3da862a753732b5ec70` at last check. `main` is still the production deployment source. Do not assume the integration branch is deployed, live-tested on Supabase, or approved to merge. Preserve **all original uncommitted founder work** and PR branch history.

A new TasteSocial branch should be **based on a freshly inspected suitable commit** (normally the secure integration review branch when appropriate), not on stale assumptions. An isolated PR must remain separate from the unresolved hospitality/security release decision. Do not backport unfinished social functionality onto the public site by accident.

## 7. Existing visual system: nonnegotiable

The established general Tasteprint UI is **dark charcoal/navy with blue and lime/sage accents**, not a cream luxury-hotel website. Relevant baseline CSS includes `styles.css` with dark `#090b0d` background, `#5b8cff` blue accent, dark panels/cards, and `navigation.css` with accent `#c7f089` for some entry UI. Preserve existing typography, high-density functional cards, rounded treatments, animations, result visuals, badges, Passport, and established navigation language where appropriate.

Allowed: improving hierarchy, contrast, accessibility, responsiveness, interactivity, and clarity. Not allowed without founder approval: global restyling into beige/cream hospitality visuals, replacing the brand with generic glossy dating/social UI, or adding an unrelated design system. A hotel's own branded campaign may look different **inside that partner experience** only.

High-priority outstanding founder UX feedback:

- Some campaign questionnaire answer labels/icons lacked sufficient contrast.
- The questionnaire needs a functioning **Back** action to change earlier responses, plus clear progression.
- Business tools need unobtrusive, accessible `ⓘ` explanations for unfamiliar concepts, including what reports measure.
- Hotel guest and general Escape/travel discovery must be clearly distinguished; do not duplicate quizzes unnecessarily.

Codex should confirm which issues still exist after PR #13, reproduce them, fix via focused PRs, and run keyboard/mobile/contrast regressions. For icons/tooltips, support focus and tap, not hover alone.

## 8. Preserve the previous bible without freezing the old strategy

Existing `docs/TASTEPRINT_MASTER_BIBLE.md`, `docs/DEVELOPMENT_PLAN.md`, `docs/AUTONOMOUS_DIRECTIVE.md`, `PLATFORM.md`, `PRIVACY_MODEL.md`, `REFERRALS.md`, `NEXT_MOVES.md`, `CAMPAIGNS.md`, and `WORKSPACES.md` contain valuable engineering context and validated guardrails.

**Precedence:** latest explicit founder instructions > this TasteSocial product direction for TasteSocial work > historical commercial prioritization in the older bible; existing security/privacy/test contracts still apply. **Do not erase historical docs or represent previous strategic assumptions as verified current requirements.** Explicitly document changes in strategy rather than silently rewriting the old product history.

---

# PART III — CORE SOCIAL EXPERIENCE

## 9. One Passport; no repeated brand quiz requirement

Users may discover their tastes through existing modules and refine them with saves, skips, ratings, or structured feedback. A Passport is *their* profile, not a permanent label and not something businesses own.

A typical friend use case:

1. Alex uses Tasteprint Watch and Eat or has a partially complete Passport.
2. Alex chooses “Find something together,” and sends Jordan a private share/invitation link.
3. Jordan can compare expressed, consented preferences; if Jordan has no Passport, the flow offers a very short optional set of choices rather than demanding six module completions.
4. TasteSocial suggests actual options both might like and explains common ground and tradeoffs.
5. Alex proposes one; Jordan can say “Interested,” “Not for me,” or suggest an alternative.
6. They explicitly agree on details and save the plan; later, either may optionally record that they tried it.

**Failure mode to avoid:** pushing eight extra hotel questions or requiring someone to join a social graph before seeing any value. Reuse existing score vectors and ask contextual constraints only if they materially change the choice.

## 10. Together: friends-first compatibility

**MVP capability:** connect existing friends via private links, compare shared interests, and create a joint shortlist. An account is not required to enjoy standalone discovery; a durable, mutually updateable plan may require authentication and/or a carefully designed limited-scope capability system.

Display:

- Interests both have explicitly expressed, including overlap at item level (if available) and domain-level preference patterns.
- Differences as neutral tradeoffs, not incompatibility diagnoses.
- Ranked *things to do or try*, not a mysterious people-rating percentage.
- Several differentiated options: strongest joint fit; one person’s favorite balanced by the other’s acceptable range; a mutual wildcard.
- Eligibility constraints (availability, cost, accessibility, distance, age appropriateness, dietary restrictions, etc.) when users choose to supply them. Never infer sensitive constraints from profile scores.

For pair/group fit, test a deterministic, explainable aggregation:

- Calculate each participant's item preference fit independently using evidence-backed catalog data.
- Apply **hard filters** for mutually accepted constraints; no hidden tradeoff can override a hard exclusion.
- Prefer items with strong shared scores while penalizing very poor fit for one member; compare a mean+minimum / fair-min compromise approach with simple averaging.
- Do not pretend the average taste vector alone solves conflicting needs.
- Require a human-readable “Why this works for both” explanation with any meaningful tradeoffs.
- No numeric match percentages until scoring has transparent denominators, empirical calibration and tested interpretation; use “Strong shared fit,” “Interesting compromise,” “Wildcard” instead.

This ranking model is an engineering hypothesis, not a validated social-psychology predictor. Test with pairs/groups and revise based on revealed choices.

## 11. Shared Plans: from interest to actual agreement

**Working feature name:** “Let's Do It” or “Make a Plan.” Name is flexible; the state distinctions are not.

Model at least:

| State | Meaning | What it is *not* |
| --- | --- | --- |
| `saved` | Individual bookmark or personal Next Move | Not a shared invitation |
| `proposed` | One person proposes an option | Not bilateral consent |
| `interested` | One participant expresses interest | Not attendance or a promise |
| `mutual_interest` | All required participants affirm interest | Not a dated booking |
| `scheduled` | Required participants explicitly agree on date/place/details | Not a verified venue booking |
| `completed_self_reported` | Participant(s) report having done it | Not objectively verified attendance |
| `declined`, `cancelled`, `expired` | Honest closure paths | Not a failure to be gamified |

The first meaningful deliverable is **one two-person flow** that accurately and securely handles proposal → recipient response → mutual interest → confirm details → cancellation → optional retrospective feedback. Add groups later.

- A sender must be able to withdraw an invitation.
- A recipient must be able to decline without public embarrassment, messaging or algorithmic punishment.
- Changes to time/place require affirmative agreement; no unilateral editing of an accepted plan.
- A *private* calendar-export or share action may be offered after agreement, but not automatically added to someone else's calendar.
- Reminders are opt-in and modest. No guilt-based streaks or public flake scores.
- Attendance can be **self-reported**; only an authorized ticket/QR redemption or partner integration may be called verified attendance/conversion, and even then distinguish transaction from presence.
- Existing Next Moves may provide personal saved items; a social plan is a **separate state machine/data purpose**, not a silent expansion of local Next Moves into shared personal information.

### Suggested two-person example

Jordan and Alex both enjoy atmospheric films and unusual local venues. The app recommends a real film screening with a sourced venue/date, if that data is available, or lets one person add a link and manually supply the details. Both explicitly click interested. They select a mutually workable date and agree to go. Afterward, each can privately mark whether it happened. The app offers another suggestion **only if they want one**.

## 12. Later: Similar Tastes, city-level opt-in

A dedicated **Similar Tastes** tab may show adults who **explicitly opt in** to appearing in a *broad chosen city/region* and intentionally reveal selected interests. Do not default profiles to discoverable merely because they sync a Passport.

The promise is not “show everybody with your scores”; it is “show nearby people who opted in and share particular interests, with something you could mutually do.”

Early candidate card:

- Approved display name or pseudonym/avatar, never required full legal name.
- Chosen discovery region (e.g. Charlotte area), not live GPS or distance-to-home.
- **User-approved shared** interests and a short, evidence-backed commonality explanation.
- A non-creepy request to connect or invite through a specific interest/activity.
- Access to blocking, reporting and privacy explanation without deep navigation.

**No mandatory public friend counts, popularity ranks, gender/appearance/romance matching, direct message inbox, address-based map pins, public future attendance rosters, or stranger access to private Passport answers.** Consider broader city-area disclosure only if privacy-safe even in sparsely populated regions. A blocked account must not be able to see or contact its blocker through alternative application paths.

Start with adult-only use (18+) and age-appropriate onboarding; do not claim age verification if only self-declared. Require moderation/abuse-response, spam prevention, reporting, and privacy/deletion processes *before* opening opt-in discovery to actual strangers. If operational moderation isn't feasible, keep Similar Tastes disabled or private-invite-only.

## 13. Later: Circles and repeated experiences

Small opt-in groups may organize around recurring real-world interests—film clubs, restaurant explorers, arts events, recreational activities—rather than endless chat rooms. Consider simple invitation-only Circles first, with one recurring activity, stable membership and a shared shortlist. Avoid complex event hosting, ticketing, chat, location streaming and public communities until demonstrated demand and safety operations exist.

**North-star hypothesis:** people who coordinate **repeat experiences with the same people** may form stronger connections than those who merely exchange interests. Do not claim the app has created lasting friendships from analytics alone; ask users directly.

---

# PART IV — DISCOVERY, CATALOGS & BUSINESSES

## 14. Discovery must recommend actual things

Six modules cannot remain only beautiful personality outcomes forever. Each is an **entry point into actionable discovery**. Preserve module identity and explainability while gradually upgrading recommendations to grounded items where feasible.

Examples:

- **Watch:** films, screenings, shows, group movie nights.
- **Eat:** dishes, restaurants, cafés, food events, products or shared dining decisions.
- **Escape:** destinations, hotels, experiences and trips; do not duplicate a separate hotel quiz as a mandatory step.
- **Wear:** apparel/styles/products or shared shopping/gifting inspiration.
- **Move:** recreational activities and nonmedical fitness preferences, not clinical prescriptions.
- **Live:** environment/neighborhood preference discovery, carefully avoiding housing discrimination, safety guarantees or precise location exposure.

Start with **one** well-evidenced catalog and user journey rather than building a massive synchronized inventory. For real-world local plans, offer carefully sourced verified examples **and/or a simple user-entered URL/title**, with transparent provenance. If showing fictional demonstration listings, label them everywhere; no false events, prices, locations, hours or bookability.

A catalog item should expose the source and freshness of crucial claims. Avoid silently trusting a business's marketing language as independent fact. A generic web page URL is not an approved data API. Review licensing, review-text limits, reuse rights, storage policies, data access and actual cost before proposing Yelp/Google Places/TMDB/Ticketmaster or similar integrations; choose after evaluating product need. **No unauthorized scraping**.

## 15. Hotels: distinguish discovery from guest companion

The existing Charlotte demonstration is an **optional on-property/brand campaign**: “You are at this hotel; which of its experiences might fit you?” It is not a marketplace for choosing among multiple hotels, and it is *not* required after Escape.

In future, **Escape** might independently rank many hotels (partner and nonpartner) from a licensed/curated catalog. A partnered hotel may optionally show a rich verified profile, actual offerings, and a link to its own separate guest companion experience; **do not force the traveler to redo the same core taste questionnaire**.

Preserve the existing PR #11 hotel demo and PR #12 navigation as optional business examples pending founder release decision. Improve its contrast/back navigation and explanation UX as needed; do not throw away working code or make hotels the center of the social product.

## 16. Partner profiles, organic matches and sponsored exposure

**Core rule:** An organic match has a genuinely computed ordinal position. A paid opportunity can buy **clearly marked exposure**, not a fabricated best-match score.

- **Free/nonpartner listings:** remain eligible when source data and requirements support them.
- **Partner profile:** may include verified business-managed copy, links, offerings, image rights, contact/booking links, special offers, and authenticity/last-updated fields. A `Partner` badge describes a commercial relationship; it does *not* on its own disclose paid ranking placement.
- **Sponsored placement:** use conspicuous `Sponsored`/`Ad` labels, eligibility/relevance floors, position caps, separated organic score, and a documented insertion rule. Do not covertly boost the same organic score or hide otherwise relevant nonpartners.
- **Practical constraints:** closed/unavailable/too-far/over-budget options should not be presented as bookable or available because someone paid.
- **Business data:** businesses do not receive raw Passport vectors, identifiable friend/plan graphs, other merchants' data, or private presence details. Prefer aggregated performance metrics with thresholds and consent for anything more.

Potential placements: one relevant sponsored suggestion after primary organic matches, or a separate “Partner offers you may like” section. This is an experiment for when Tasteprint actually has users, **not an approved claim that ad inventory exists today**.

## 17. Official branded and licensed campaigns

Tasteprint Campaign Studio remains valuable, but it should offer **optional shareable editorial/brand experiences**, not replace the basic discovery feed.

Example: an authorized coffee brand runs “Find your signature drink” and maps the user's tastes or a short playful interaction to verified menu offerings. The campaign can be shared or compared with friends, and provide ordering links or legitimate codes. Entertainment brands might commission licensed character, music, film or fictional-world campaigns **only with proper rights**.

What a brand may pay for *before* we have our own audience:

- Creative/technical production and hosting of an official campaign distributed through **the brand's existing audience**.
- An accurate product/experience finder with business-provided catalog data and consent-based measurement.
- Shareability, comparative results or a fun group-decision extension that the brand's normal website doesn't offer.

**Business problem to validate:** Does a campaign solve a buying, discovery, engagement or group-selection problem measurably better than the existing ecommerce website, a simple branded quiz, or general-purpose AI? Do not claim conversion uplift without controlled evidence.

User preference data should not be shared with participating brands by default. Joining a campaign is not consent to transfer a Passport or social graph to the campaign sponsor. Present explicit, narrow opt-ins when information is actually needed.

## 18. Future coupons, referral codes, partner offers, and rewards

Coupons and referral codes are promising **phase-later mechanisms** to bridge Tasteprint discovery to real-world action. Design the contracts now; do not build a full financial/rewards system until validated partner demand.

Possible offers:

1. **Relevant welcome coupon:** an eligible user discovers a participating café or venue and receives a legitimate merchant-authorized code, terms, expiration and redemption instructions.
2. **Shared-plan offer:** a participating venue makes a group-friendly deal available to a mutually interested pair/group, if the venue approves the terms and can fulfill it.
3. **Referral reward:** with explicit terms, a referrer and/or invited friend receives a lawful benefit following a verified eligible action. Protect against self-referrals and fraudulent redemptions.
4. **Event/booking attribution:** authorized tagged outbound link, code, or business-side verification records an eligible redemption—not an inferred sale merely from clicks or RSVP.

**Critical principles:**

- A coupon is not available until an actual business has authorized it. Fictional demos must say *sample offer / not redeemable*.
- Clear price, eligibility, location, exclusions, expiration, per-person and capacity limits, and partner support/fulfillment owner.
- No misleading scarcity, automatic paid enrollment, fake “exclusive” deal, or reward tied to revealing private friendships/sensitive interests.
- Avoid spammy mass invitations and engagement farming. Limit code issuance, enforce one-time use/server-side validation where necessary, and set refund/reversal policies.
- Keep **coupon claimed**, **click-through**, **code redeemed**, **purchase confirmed**, and **attendance verified** as separate event types. Verify through the merchant/approved integration before claiming a real conversion.
- No deep personal/social data disclosed in redemption payloads. A merchant should receive only an entitlement/code and minimal approved attribution.
- Revenue share, offer terms, privacy/disclosure, consumer protection and tax/accounting obligations require human business/legal review before a real deployment.

**Business monetization sequence hypothesis:** optional commissioned branded campaign (can use brand's traffic) → verified partner profiles and paid business tools → sponsored relevance-gated discovery after consumer traction → coupons/referral redemptions with actual merchants and valid attribution. No claim that ads/referrals will pay our bills before usage and economics are demonstrated.

---

# PART V — TECHNOLOGY, DATA AND SAFETY

## 19. Technical philosophy

Keep the established **vanilla JavaScript + Vite + GitHub Pages + optional Supabase/Postgres** stack for as long as it serves the first usable social loops. Prefer reusable pure functions and small runtime modules over a frontend rewrite. Leverage the existing Passport mapping, scoring, Next Moves, campaign engine, privacy boundaries, tests and CI.

Social features will eventually require a **server-authoritative identity and state layer** to make two-device mutual responses trustworthy. Browser-local storage is appropriate for demonstrations and personal draft lists, but it cannot truthfully establish that another authenticated user agreed to an event. Do not fabricate network synchronization with fake local toggles.

Suggested logical modules (names illustrative, avoid unnecessary scaffolding):

- `taste-social-core`: normalized, consented interest projection from Passport and items.
- `group-fit`: explainable multi-person eligibility and ranking over one trusted catalog contract.
- `shared-plan-core`: explicit state machine with validations and deterministic tests.
- `together`: friend/guest UI, invitation/shortlist interaction and responsive flows.
- `social-auth` / `social-storage`: optional account and authorized persistence when approved.
- `discovery-directory`: opt-in only, later safety-gated nearby adult discovery.
- `partner-offers`: business catalogs and sponsored disclosure; later code redemption.

Don't add these files by default merely to match this list; map onto the actual source code first.

## 20. Data model proposal (not a command to create every table)

Start with minimal persisted entities once staging is approved. Candidate objects:

| Concept | Typical purpose / essential fields |
| --- | --- |
| `social_profiles` | Auth user ID, chosen display name, broad discovery region, visibility controls, approved public interest projection, timestamps |
| `friend_connections` | Two consenting account IDs, status, initiator, created/updated timestamps, block checks |
| `interest_shares` | Private versioned share token/capability, explicit fields shared, expiry, revocation state, audit metadata |
| `catalog_items` | Canonical item ID, category, source/provenance, display info, actual linked destination, observed/verified timestamp, constraints, tags |
| `shared_plans` | Owner/creator, item or user-submitted link, visibility, coarse location, proposal state, immutable version, optional private agreed date/place |
| `plan_participants` | Explicit invited actor, response status, response timestamp, consent for detail changes, relation to plan version |
| `social_blocks` and `reports` | Enforced denial/abuse handling and operational review trail, minimized sensitive content |
| `partner_profiles` | Business/workspace association, verified attributes, catalog and paid-placement disclosure metadata |
| `offer_redemptions` | Only after approved pilot: scoped code hash/token, eligibility, expiry, redemption/reversal state, merchant-reconciled evidence |

Prefer existing workspaces/campaign tables for verified merchant ownership, without merging business clients' data with consumer social identities. All authenticated/personal tables need tenant/user scoped RLS, proper indexes, constrained enums/state transitions, revocable tokens, retention/deletion, and direct-API denial tests. Avoid secret invite tokens in URLs that never expire or appear in analytics logs; hash tokens at rest where applicable. Explicitly plan migration compatibility and no cross-tenant leaks.

Treat the proposal table as a backlog, not an implementation requirement for MVP 1. Don't create a giant social schema while only demonstrating two friends choosing a movie.

## 21. Security, trust and privacy controls

TasteSocial introduces a **new social data zone** distinct from existing anonymous events, private Passport accounts, Workspace business administration, and consent leads. No automatic bridging between these zones. Extend `PRIVACY_MODEL.md` explicitly before any deployed social collection.

**Minimum requirements before connected-user release:**

- Per-user privacy: private account default, explicit friend sharing, explicit public discovery opt-in, select which interests to expose, invisible mode, block/unblock, export/delete and revoke shared links.
- Account/auth lifecycle: secure passwordless or equivalent flow, JWT validation, token expiration, redirect safety, session changes, proper logout. Avoid social impersonation via unauthenticated client-provided user IDs.
- Invite restrictions: friend-only or capability-limited invitations; server-side participant checks; anti-spam/rate limits; invalid/stale/replayed link tests.
- Plan state: all participants explicitly assent to a proposed time/place; edits trigger reapproval; no exposing exact private plan details to strangers.
- Moderation: usable report/abuse path, operational decision owner, blocking, escalation/retention policy; don't pretend fully automated moderation is equivalent to human handling.
- Discovery: coarse chosen city only at first, no GPS proximity/radius leak or home/work inference; strict adult-only policy for stranger discovery, with truthful age-gating status.
- Data minimization: don't send emails, real names, free-text conversations, private schedules, precise location history, exact social edges, or unapproved preference vectors to anonymous analytics or partner reports.
- Direct API tests: owner/nonmember/blocked/expired/revoked/anonymous permissions and cross-tenant isolation in disposable PostgreSQL and approved staging.
- UI accessibility: high contrast, keyboard, visible focus, understandable status and rejection labels, mobile responsiveness, reduced motion, no reliance on color alone.

A public stranger-discovery feature cannot be called ready until operational safeguarding exists. Until then, **private friends-first is the safer and more commercially prudent launch**.

## 22. Metrics that measure real value without surveillance

Use a staged funnel and clear evidence labels:

| Event | Meaning | Confidence / limitations |
| --- | --- | --- |
| `discovery_result_viewed` | A recommendation was shown | Not interest or action |
| `item_saved` | Person expressed interest | Not a plan |
| `share_link_created` / `invite_opened` | Invite was created/opened | Not delivered or accepted |
| `plan_proposed` | Proposal existed | Not mutual interest |
| `plan_interest_mutual` | All required participants expressed interest | Not agreed date or booking |
| `plan_scheduled` | Required participants explicitly accepted details | Not attendance |
| `plan_completed_self_reported` | One or more users said they did it | Not independently verified |
| `offer_redeemed_verified` | Merchant confirms code/redemption under rules | Not necessarily social attendance |
| `repeat_plan_created` | Same consenting participants made a later plan | Proxy for continued use, not proof of friendship |

Instrument narrowly, with opt-outs/retention and honest source/denominator labels. No public list of who plans to visit a location. Favor aggregated product data and small-sample caveats. **Primary qualitative questions:** Did this help you decide faster? Would you have made this plan anyway? Did the people actually enjoy it? Would you use it again?

Potential north-star: *mutually agreed, actionable plans that participants say were useful* per active invitation cohort. Do **not** label it verified attendance without independent evidence. Avoid designing growth loops around intrusive contact discovery or coerced sharing.

## 23. Technical quality / release gates

Every scope-relevant PR should run:

- `npm test`; `npm run build`; relevant existing module distribution/Passport/share/privacy tests.
- `bash scripts/check-workspace-reporting.sh` for any SQL/workspace/report/auth change, plus newly added social RLS/state-machine tests on disposable PostgreSQL.
- Browser smoke tests at `/` and `/tasteprint/`; desktop and mobile widths, focus navigation, proper Back behavior, share flows, and offline/error handling. Use existing Playwright setup where available.
- Tests for mutual consent, decline, cancellation, expiry/revocation, blocked users, changes after agreement, account boundaries and no data leakage.
- Check that fictional sample items and local stats are visibly labeled. Never silently substitute demo activity when production services fail.
- Full test/build after integrating with PR #13 so work does not silently lose the Workspace security corrections or break any of the six modules.

Real mobile Safari/Chrome and actual hosted Auth/PostgREST require separate staging/physical-device checks. A green mocked browser run is **not** certification of a deployed social feature. The social branch must remain review-only until human launch approval.

---

# PART VI — DEVELOPMENT ROADMAP

## 24. Scope and priorities

**Principle:** Time estimates are engineering planning ranges, *not* a requirement to wait until those dates. Codex may complete work faster in focused cloud sessions; it should not race ahead into unapproved production data collection or public stranger discovery.

### Phase 0 — Reconcile and correct foundations (first)

**Outcome:** Stable integration branch plus an accurate review of founder-reported UX issues.

- Reinspect `main`, PRs #9–#13, original local work, CI and security patch inclusion.
- Avoid modifying original PRs or the dirty working checkout.
- Fix any low-contrast choice labels/icons, missing Back button, progress/selection clarity and business `ⓘ` explanations in a focused branch based on the secure integration work.
- Keep the **original dark Tasteprint design** intact; correct campaign-scoped overrides.
- Confirm Passport, six modules, sharing, Studio, partner demos and route priorities still work.
- Produce screenshots and plain-language browser walkthroughs, with explicit unresolved gaps.

**Gate:** All integration tests green; reviewer can navigate existing flows without unreadable choices, missing navigation or false report claims. No merge/deploy implied.

### Phase 1 — TasteSocial prototype: shared taste to joint recommendation

**Outcome:** A working, genuinely useful **friends-first Together** experience that does not need a public social network.

- Reuse existing shareable Passport/challenge data with a clearly consented, minimal taste projection.
- Build pairwise common-ground explanation and a deterministic small-group fit ranking over a *small, grounded catalog*.
- Show ranked alternatives and tradeoffs; don't bury imperfect options or make partners appear inherently more compatible.
- Link to real verified items where available, or support an honest user-added idea/link and manually supplied details; no fictitious local availability.
- Offer Save and Suggest as distinct actions. Demonstrate both-side decision flow with explicit **demo mode** if there is no authoritative backend; do not impersonate the remote recipient.
- User-test the experience with a few pairs of actual friends *without collecting their data into unapproved production services*; test against ordinary text-message coordination.

**Gate:** Two friends can understand their overlap, agree on an interesting shortlist, and choose something concrete; strangers/social matching not required. Tests pass. No false real-time agreement.

### Phase 2 — Secure mutual plans and account-backed staging

**Outcome:** Two real devices can exchange an invitation and see true mutual status in approved staging.

- Prepare minimal Auth/RLS/plan/participant architecture and exact staging/cost/security/rollback plan.
- **Pause for explicit approval** before creating or activating any external Supabase project, permissions, secrets, paid services or live data.
- Once approved, implement authenticated invitation links, statuses, withdrawals, mutual interest, plan-detail reapproval, cancellation, optional post-plan self-report, block/revoke rules.
- Prove direct API denials and cross-user state; verify no client can mark another person's interest or completion.
- Keep individual discovery available without requiring signup; request Auth only when shared persistent state becomes necessary.

**Gate:** Two-browser/two-account authenticated staging suite plus user walkthrough, deletion and recovery scenarios. No public launch until approved.

### Phase 3 — Friends-first real-world MVP

**Outcome:** Small, permissioned real-user test of Discover → Together → Plans.

- Complete real-device/accessibility checks and a reliable catalog / user-entered idea path.
- Invite a small consenting test cohort through normal founder-led recruitment; no automated outreach.
- Track privacy-safe funnel and gather qualitative feedback on decisions, actual follow-through, satisfaction and repeat use.
- Improve the biggest measured failures (e.g., bad match, hard invite acceptance, stale location, inability to agree on a date).

**Gate:** People find value beyond an AI chat or group text; founders can explain and measure it without fabricated attribution. Iterate or pivot if that evidence is weak.

### Phase 4 — Similar Tastes nearby (safety-gated)

**Outcome:** Opt-in adults in a broad region can discover others with shared interests and request a connection tied to an activity.

- Only after moderation, blocking, reporting, age policy, rate limiting, privacy settings, abuse triage and support ownership exist.
- Start city-level with hidden-by-default accounts; no geolocation feed, no stranger DM requirement.
- Evaluate safety and actual mutual connection quality in a limited rollout; avoid exposing sparsely populated personal traits.

**Gate:** Privacy/safety operational readiness and positive opt-in results. **Do not launch this merely because the UI works.**

### Phase 5 — Trusted business catalogs and branded experiences

**Outcome:** Real offerings can participate while organic trust is preserved.

- Validate 5–10 appropriate businesses/operators about the actual use case: real-world plans, product/event discovery, special group offers, or official campaigns.
- Use existing Studio/workspace infrastructure for optional official experiences; avoid a second mandatory quiz.
- Build minimal verified partner profiles and source/provenance-aware catalogs; keep nonpartners in independent ranking where data allows.
- Give participating merchants aggregate honest performance reports; private Passport/friend data is off limits.
- Test business willingness to pay using a narrow pilot with clear deliverables and actual authorized content.

**Gate:** At least one permissioned business pilot with a clear, measured usefulness question—not a fabricated revenue lift story.

### Phase 6 — Coupons, referrals, transparent paid placements

**Outcome:** Test whether Tasteprint can generate attributable, *merchant-verified* real-world value.

- Choose one very narrow partner offer/code redemption pilot with explicit business authorization and a testable fulfillment path.
- Define coupon validation, limits, fraud prevention, expiration, reversals and support policy; report verified redemptions separately from clicks/RSVPs.
- Evaluate clearly labeled sponsored placements only once there is enough audience to estimate relevance and harm to organic trust.
- Add referral rewards only when legitimate anti-abuse controls, terms, economics and user disclosures exist.

**Gate:** Economically useful legitimate redemptions and no evidence that paid placement destroys recommendation quality.

### Phase 7 — Expansion only after proof

Potential future products: invitation-only interest circles, recurring group activities, richer cross-category catalogs, affiliate integrations, improved feedback/calibration and optional ML ranking, official licensed entertainment campaigns, creator/community programs, more regions and business verticals. Each requires a user-demand case, technical estimates, safety review and measurable success metric.

**No immediate mandate** for a full direct-messaging platform, public feed, follower economy, comprehensive Yelp-like inventory, GPS friend radar, native mobile apps, credit-card wallet, ticket inventory, affiliate accounting, medical/identity profiling, or unproven production AI models.

---

# PART VII — CUSTOMER DISCOVERY AND BUSINESS STRATEGY

## 25. Consumer validation experiments

Run low-cost tests in order:

1. **Current friend comparison:** show 5–10 pairs existing Passport comparison; ask whether similarities/differences feel understandable.
2. **Choice comparison:** each pair tries TasteSocial's shared recommendation flow versus normal group chat or asking AI. Measure whether it helps choose a concrete option with less friction.
3. **Plan completion:** invite a modest opt-in cohort to propose and confirm one real activity with someone they know; gather self-report and honest reasons when plans don't occur.
4. **Repeat behavior:** do users voluntarily come back for another shared decision within a few weeks? What felt redundant?
5. **Nearby matching research:** only exploratory interviews first; measure willingness to appear publicly, privacy concerns, and whether activity-led introductions feel safer/more valuable than profiles alone.

Founder performs outreach; Codex drafts guides, feedback capture forms, metrics definitions and studies. No claims of representative demand from tiny samples.

## 26. Business discovery: who might pay and why

Potential paying segments (test, don't assume): independent venues and event operators; cafés/restaurants with experiences; museums/cinemas/art spaces; local brands; boutique hotels; ecommerce consumer brands; entertainment rights-holders.

Possible value propositions:

- **Intent:** people expressed interest in a concrete outing, product or experience rather than seeing a generic ad.
- **Group decisions:** a venue/product is a good mutual option for multiple people, potentially valuable for group bookings.
- **Discovery:** user finds a business they may never have searched for.
- **Official content:** sponsored branded quizzes and product-finders distributed through the business's *own* audience, even before TasteSocial grows.
- **Attribution:** legitimate clicks, requests, codes and merchant-verified redemptions when supported.

Critical questions: Who has budget? Where does traffic come from? Can they measure a real action? Is the improvement worth the setup/support costs? What competitor (site, marketing tool, social ad, events platform) already solves this better? Who owns catalog freshness and offer redemption? Would a single venue value this without a large consumer network?

**Two plausible near-term commercial tracks:**

- *Track A: Official campaigns for brands using their own traffic.* Existing Studio is relevant; prove usefulness beyond a static quiz, and preserve separate, opt-in customer data boundaries.
- *Track B: Merchant-supported group plans or offer pilots.* Potentially stronger social differentiation but depends on working plans and sourcing real events/offers. Measure actual conversions, not projected reach.

Long-term sponsored-discovery revenue is *contingent on consumer scale*. Do not position sponsored ranking as today's main revenue engine. Test prices and terms with real buyers instead of setting unsupported universal prices.

## 27. Product growth without dark patterns

- Friend-to-friend invitations to **do a specific thing** are more compelling than generic referral links.
- Shareable common-ground summaries should reveal only invited-and-approved information.
- Post-experience reflection may lead to another relevant suggestion, but never punish inactivity or encourage oversharing.
- Optional group offers can drive new discovery if genuine and correctly disclosed.
- Referral rewards, if activated, must not encourage unsolicited spamming, fake accounts or disclosure of private friend relationships.
- Social privacy, trust, and useful matches are product assets; don't trade them away for short-term sponsored impressions.

---

# PART VIII — CODEX OPERATING CONTRACT

## 28. Your role and permission boundaries

Codex should act as a **long-term senior product engineer**, not an indiscriminate code generator. Its job is to inspect current truth, find the smallest dependency-ordered useful slice, implement safe code on an isolated branch, test it, prepare a focused PR, and report actual evidence.

**Permitted by default for this planning/build effort:** repo inspection; architecture mapping; local/synthetic demos and deterministic algorithms; test improvements; UX fixes reproducing reported issues; technical specs; isolated branches and review PRs for agreed phases. Current user instructions and prior approval gates still control exact implementation scope.

**Require explicit founder approval:** any merge into `main`; live GitHub Pages deployment; external preview service deployment if it has costs/data/privacy consequences; live Supabase installation/migration; real-user social data collection; email/SMS/push invitation sending; production location discovery; business outreach; any use of paid APIs, coupons, payment transactions, ad sales, referral rewards, or long-running cloud agents; changing public branding; introducing third-party user identity providers; releasing moderation-dependent features.

**Preserve uncommitted changes and open PRs.** Check `git status`, upstream, branch graph and PR stack. Never `reset --hard`, clean/delete unknown work, force-push shared branches, or blur unreviewed security fixes into a demo. Use the vetted PR #13 integration as a reference point, then recheck changes after any merges.

**No mass scaffolding.** A Bible is a strategic plan and guardrail, not blanket authorization to create every database table, screen, social feature, and paid service in one sprint. Keep each PR reviewable and testable.

## 29. How to decide what to work on

Use this order:

1. A concrete security/privacy regression or actively broken user flow.
2. A complete approved consumer social slice that creates an actual decision for friends.
3. Necessary trustworthy data, account sync and mutual state infrastructure.
4. Evidence-backed discoverability and catalog quality.
5. Opt-in safe local social networking, only when operational prerequisites exist.
6. Business pilots, rewards, and monetization once the user value is evident.
7. Cosmetics/expansion only when they improve an identified outcome.

Ask one founder question only if it changes the core use case, brand direction, external risk/cost, user consent, or commercial promise. Handle routine UI/code decisions independently and explain them afterward.

## 30. Required review outputs

For each task/PR, provide:

- Summary of **what users can actually do now**.
- Changed files and concise reason for each architectural seam.
- Evidence: exact SHA, test/build/browser/SQL status, real vs simulated data boundaries.
- Screenshots of main mobile/desktop interaction as appropriate, preferably from the established **dark** Tasteprint design.
- What remains unverified: real accounts, device QA, live data, business fulfillment, moderation, legal/licensing.
- Security/privacy considerations and any new data being stored or shared.
- Explicit next approval needed and a recommended single next milestone.

**Test milestones by user behavior**, not just by “all tests green.” A functioning shared-plan screen that nobody wants to use isn't product success.

## 31. First execution brief for Codex

1. Read this Bible **and** existing Tasteprint docs, then inspect the current GitHub repo and branches. State discrepancies succinctly.
2. Identify a safe base retaining PR #13 combined fixes. **Do not merge or deploy**.
3. Reproduce and fix questionnaire contrast, functional Back navigation, and accessible Business Tools information controls while preserving the true dark Tasteprint aesthetic; if already fixed, demonstrate evidence rather than duplicating work.
4. Audit existing Passport share, friend comparison and Next Moves contracts. Find the thinnest feasible **Together** slice: share minimal preferences, display actual common-ground and useful joint options, support a proposal without faking a remote response.
5. Write a precise MVP state machine and privacy threat model for cross-device mutual plans. Implement pure logic, local demonstration and tests first. Present a separate minimal Supabase staging proposal rather than activating it.
6. Make one or more focused review PRs, run regressions, capture accessible mobile/desktop screenshots, and provide a five-minute walkthrough for the founder.
7. Stop before deployment, collecting personal data or implementing public Similar Tastes until approved.

**Success for the first TasteSocial build:** a friend can receive a privacy-conscious link, recognize meaningful shared interests, see a worthwhile ranked suggestion, and understand how a proposed real-world activity would be agreed upon—without requiring another eight-question quiz, an existing large social network, a new design system, or an invented social backend.

---

# PART IX — OPEN FOUNDER DECISIONS, DEFAULTS & VERSIONING

## 32. Default assumptions to avoid stalling

These are **defaults for prototypes**, not final public policy:

- Product brand remains **Tasteprint**; `TasteSocial` is an initiative/build name.
- Friends-first planning is the MVP; opt-in people discovery is a later safety-gated phase.
- Adults-only for future stranger discovery; no child/teen public matching in initial design.
- Users pick a broad city/region if they later choose visibility; no live GPS sharing.
- Existing six modules and Passport remain; no hotel quiz as a universal second step.
- Shared plans and social graphs are private by default.
- Sponsored placements are separate, explicit and relevance-gated; partner status alone is not a sponsored disclosure.
- Demo/test catalogs must be source-grounded or clearly fictional; no fake real-world prices, events or rewards.
- No separate native iOS/Android app, new frontend framework or paid ranking ML requirement for the first MVP.

## 33. Decisions to validate with users rather than assume

1. **What first shared decision?** Restaurants/coffee, local events, movies/screenings, or an item any user can manually suggest? Favor the smallest option with reliable concrete data and short time to real-world action.
2. **When is signup worth it?** Ideally only when persistent mutual agreement/account-to-account delivery requires it.
3. **What is shown to friends?** Full Passport vs category summaries vs item-level shared interests. Start minimal and user-controlled.
4. **What should “Similar Tastes” mean?** Shared saved items, broader preference vectors, complementary interests, activity willingness—or a blend, but never a dubious objective human-compatibility score.
5. **How much coordination happens in-app?** Keep scheduling and agreement simple; deep chat is deferred.
6. **Which business proposition converts?** Brand-funded interactive content with their audience, partner profiles, or actual redemption-backed local group plans?
7. **Which verified outside data source can support the first catalog?** Compare licensing/freshness/cost, not superficial feature checklists.

## 34. Version history

- **TasteSocial Build Bible v0.1.0 (2026-10-21):** First coherent social-first product vision based on founder discussion. Real-world Discover → Connect → Do, friends-first Together, explicit mutual plans, future opt-in city-level Similar Tastes, business catalogs, official campaigns and eventual legitimate coupon/referral monetization. Reuses the existing Tasteprint stack, Passport, modules, sharing, partner campaign engine and security branches. Defines testable milestones and strict launch gates. **Not an instruction to replace the original bible or merge unreviewed PRs.**

### Five-sentence pitch

**Tasteprint learns what you like across the things you do. TasteSocial helps you discover what you and your friends might enjoy together. Instead of stopping at compatibility or recommendations, it helps people agree on real activities and discover others nearby who share their interests—only when they opt in. Businesses can eventually offer accurate listings, official interactive experiences and relevant, transparently labeled promotions. Success is measured by useful choices, shared plans, and legitimate real-world outcomes—not another feed to scroll.**
