# Tasteprint — Remaining Work Without Supabase

Snapshot: 2026-08-18

This file exists so we can separate backend activation from the remaining real-world validation work. Supabase setup is intentionally excluded here.

## 1. Physical-device QA

Test the real consumer flows on actual devices rather than assuming desktop/browser emulation is enough.

- iPhone Safari challenge links
- iPhone Safari result links
- Android Chrome challenge links
- Android Chrome result links
- Story/share-card generation on iOS
- Story/share-card generation on Android
- Desktop share/download fallbacks
- Safe-area behavior, keyboard overlap, orientation changes, copied links, and platform-specific font/rendering differences

## 2. Manual accessibility QA

Automated accessibility guards already exist, but real assistive-technology testing still needs to happen.

- Keyboard-only navigation
- VoiceOver on iPhone and/or Mac
- NVDA or another Windows screen reader if available
- TalkBack on Android if available
- Confirm focus order, labels, live announcements, dialogs, quiz controls, and result/share actions are understandable without sight

## 3. Real user testing

Put Tasteprint in front of people who were not involved in building it and avoid explaining the product before they try it.

Initial target: roughly 10–30 people.

Questions to answer:

- Do users immediately understand the forced-choice interaction?
- Are the choices fun enough to finish?
- Does the result create a genuine “that sounds like me” moment?
- Do users understand why recommendations fit?
- Is the recommendation set small enough to reduce overload but broad enough to feel useful?
- Do users use “I’d try this” and Next Moves?
- Do users naturally want to take another module?
- Where do users hesitate, misunderstand, back out, or abandon the flow?
- Does Passport feel useful after several modules rather than merely decorative?

Do not optimize only for completion. The core product question is whether Tasteprint reduces decision uncertainty while still feeling enjoyable.

## 4. Tune scoring/recommendation weights from real behavior

The infrastructure for structured feedback, confidence, diversity, returning-user behavior, and review-only learning already exists.

Do not claim the model has “learned” from synthetic calibration.

After sufficient real feedback, review:

- archetypes users repeatedly rate as poor fits
- recommendation lanes users repeatedly ignore
- recommendation lanes users actually choose
- recurring higher/lower dimension corrections
- archetype collisions
- whether model-fit confidence predicts satisfaction
- whether returning users behave differently from cold-start users

Any scoring change should become a versioned model update, be simulated against the valid response space, and be compared with the previous version before release.

## 5. First real Tasteprint Drop / client

Run one real branded campaign with a small business, creator, local destination, hotel, restaurant group, clothing brand, campus organization, or another suitable partner.

The goal is not merely to say a client used Tasteprint. We need enough real data to build an evidence-based case study around:

- starts
- completion rate
- result/recommendation interaction
- CTA behavior
- optional lead conversion where appropriate
- qualitative user feedback
- whether the experience made choosing easier than browsing the full catalog

Do not invent benchmark numbers or case-study claims.

## 6. Final product audit and demo readiness

Before treating the current build as launch-ready:

- verify the latest combined CI suite passes
- verify GitHub Pages deploys the exact tested revision
- inspect every major public/demo route
- remove awkward copy, broken links, stale labels, and duplicate controls
- confirm all demo-only data is explicitly fictional
- confirm unavailable backend metrics remain clearly labeled instead of simulated
- confirm the backend-free tour still works with no Supabase configuration
- run the complete 5-minute demo from `?tour=1`

## What is already built

The standalone product build is largely complete:

- Escape, Wear, Watch, Move, Eat, and Live
- Passport and local cross-domain history
- structured recommendation intelligence
- Next Moves
- Story sharing and friend comparison
- local analytics/referral fallbacks
- privacy/export/reset controls
- fictional Aster & Tide campaign
- Campaign Studio
- local Campaign Workspace demo
- hosted Workspace/account/Supabase architecture scaffolding
- Experience QA / sensitive-targeting guardrails
- backend-free demo tour

## Product principle to preserve

Tasteprint should not become “a personality quiz with extra steps.”

The intended loop is:

**curiosity → quick tradeoffs → satisfying identity reveal → explainable recommendations → one user-chosen next action → optional reflection**

The memorable archetype earns attention. Reducing decision overload is the actual problem being solved.

Avoid turning the product into an endless feed, streak system, urgency machine, or data-harvesting excuse.
