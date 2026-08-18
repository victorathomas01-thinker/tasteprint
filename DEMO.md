# Tasteprint Backend-Free Demo

Open:

```text
?tour=1
```

The Demo Tour is the recommended portfolio / class / client walk-through. It is intentionally static-friendly and does not need Supabase.

## The one-sentence pitch

> Tasteprint makes choosing easier by turning a few instinctive tradeoffs into a small, explainable set of things that actually fit you.

The archetype is the memorable hook. The decision support is the product.

## Five-minute walkthrough

1. **Escape** — show the quick forced-choice interaction and a complete result.
2. **Module hub** — show that the product expands across Wear, Watch, Move, Eat and Live.
3. **Passport** — show the reusable cross-domain preference map.
4. **Next Moves** — show how a deliberately selected recommendation becomes a small Saved → Trying → Done experiment.
5. **Aster & Tide** — show a fictional branded commercial experience.
6. **Campaign Studio** — load Aster locally, edit it, and show Experience QA.
7. **Campaign Workspace demo** — switch Owner/Admin/Editor/Analyst/Viewer roles and explain tenant/privacy boundaries.
8. **Stats / referral dashboards** — demonstrate that unavailable cross-device data is labeled honestly rather than fabricated.
9. **Privacy & data** — show export/delete/reset boundaries.

## What works without Supabase

- all six consumer modules;
- local Passport/history;
- recommendation intelligence and structured feedback;
- Next Moves;
- Story/share generation where the browser supports it;
- stateless Escape result/challenge links;
- fictional Aster & Tide campaign;
- local Campaign Studio;
- fictional Campaign Workspace role/permission demo;
- Experience QA;
- local analytics fallback;
- local referral/share-outcome dashboard fallback;
- privacy/data controls.

## What Supabase adds

- real cross-device Passport sync;
- backend short links;
- real population/referral aggregates;
- hosted private team workspaces/drafts;
- authenticated role-gated campaign publishing;
- real explicit-consent lead storage;
- trusted aggregate recommendation feedback review.

The backend adds persistence and multi-user/cross-device capability. It is not required to demonstrate why the product is enjoyable or useful.

## Why the demo uses fictional data

A portfolio demo should not need fake customer identities, fake leads, fake population percentiles or fake conversion claims. Aster is explicitly fictional. Workspace team members are fictional labels stored only in temporary browser state. Analytics dashboards visibly distinguish local fallback from real backend aggregates.

That keeps the demo useful without teaching the wrong privacy habits.
