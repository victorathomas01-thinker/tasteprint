# Selected software and data projects

Computer Science student at UNC Charlotte (expected graduation: December 2027). I build practical software in JavaScript and Python, with a particular interest in usable interfaces, data systems, automation, and testing.

These links distinguish what is **available to try**, what is **implemented in the default branch**, and what is **still under development**.

## Featured work

### [Tasteprint — explainable preference and recommendation platform](https://github.com/victorathomas01-thinker/tasteprint)

**JavaScript · HTML/CSS · GitHub Pages · Python · scikit-learn · SQL / Supabase architecture**

- [Public consumer demo](https://victorathomas01-thinker.github.io/tasteprint/): six interactive recommendation modules, a shared ten-dimension preference Passport, explanations and shareable output.
- Engineering work: module scoring, cross-module state, responsive presentation, regression and privacy checks, CI, and a separate reproducible ML lab on **synthetic** profiles.
- Current limitation: optional hosted Supabase and social features are not enabled on the published demo. Broader changes are in [unmerged integration PR #59](https://github.com/victorathomas01-thinker/tasteprint/pull/59).

### [Personal Job Agent — job discovery and safe application preparation](https://github.com/victorathomas01-thinker/agent-test)

**Python · SQLite · Playwright · employer public APIs · unittest**

- Imports and filters listings, tracks review outcomes, and rehearses form preparation without unattended submission.
- Engineering focus: employer-source adapters, deduplication, heuristic eligibility, private local data handling, receipts, and safe browser boundaries.
- The larger dashboard/ranking workbench is in [unmerged PR #3](https://github.com/victorathomas01-thinker/agent-test/pull/3). This is a local tool, not a hosted service or automatic submitter.

### [Marvel Rivals Stat Tracker — Chrome extension](https://github.com/victorathomas01-thinker/marvel-rivals-stat-tracker)

**JavaScript · Chrome Manifest V3 · DOM parsing · browser storage · CSV/JSON**

- Reads match-detail pages, detects opposing heroes in losses, and renders a ranked threat summary.
- Demonstrates browser-extension APIs, state persistence, event deduplication, and extracting actionable metrics from page content.
- Current default branch requires an unpacked installation and may need parser updates when Tracker.gg changes. Hardening and automated Chromium testing are in [unmerged PR #15](https://github.com/victorathomas01-thinker/marvel-rivals-stat-tracker/pull/15).

### [Sandwich Maker REST API — coursework project](https://github.com/victorathomas01-thinker/Assignment5)

**Python · FastAPI · Pydantic · SQLAlchemy · SQLite · MySQL**

- Implements 25 CRUD endpoints across five related entities with request validation and predictable error handling.
- Includes nine automated SQLite CRUD/integrity tests. The [portfolio and GitHub Actions CI PR](https://github.com/victorathomas01-thinker/Assignment5/pull/1) adds automated test execution.
- Based in part on an instructor-provided starter; the project is not a production-deployed API.

## Additional demos

- [TasteSocial synthetic demo](https://victorathomas01-thinker.github.io/tastesocial-demo/demo.html) — public static preview of newer Tasteprint discovery/social concepts; **no real accounts, friend consent, or bookings**.
- [Throwback TV](https://github.com/victorathomas01-thinker/throwback-tv) — browser-only nostalgic channel-guide and scheduling prototype, currently paused; **no television playback or streaming-account integration**.

## What I want to improve next

- Validate and release the tested code behind the existing flagship demos, without breaking their current published versions.
- Build a **separate, real-data SQL + Power BI analytics case study** using public or properly anonymized data. This is a planned project, **not yet a completed portfolio item**.
- Add polished screenshots, accessible walkthroughs, reproducible demo fixtures, and specific measured results as they become available.

I prefer precise claims over inflated feature lists: a passing local test or synthetic demo is not evidence of real customers, production availability, or a deployed backend.
