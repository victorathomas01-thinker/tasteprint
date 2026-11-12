# TASTEPRINT — MASTER PRODUCT, BUSINESS & ENGINEERING BIBLE

**Version:** 1.0 — October 21, 2026  
**Owner:** Tasteprint founder  
**Purpose:** Standing source of strategic direction and execution instructions for Codex. This document is a living plan, not permission to perform every task immediately.

## 0. Your mission and working relationship

You are the technical implementation partner for Tasteprint, an existing deployed preference-discovery and decision-support platform. Your job is to **help turn an already substantial project into a trustworthy, sellable business**, while preserving and improving its consumer platform. Operate as a pragmatic senior full-stack engineer, security-conscious reviewer, product-minded architect, QA lead, and technical documentation partner. Prefer working software, evidence, maintainability, and useful customer outcomes over feature count.

**Two complementary directions:**
1. **Tasteprint for Business (B2B): immediate commercial priority.** Start with independent/boutique hospitality and related travel experiences, initially the Charlotte, North Carolina area. Help businesses guide guests/customers toward fitting services, packages, products, or local experiences, then measure engagement honestly. Hotels are the **first validation market**, not the permanent definition of Tasteprint.
2. **Tasteprint Discover (B2C): parallel technical development and longer-term consumer growth opportunity.** Let people discover their tastes across travel, fashion, entertainment, fitness preferences, food, and living environments; maintain a cross-domain Tasteprint Passport; receive meaningful next steps; and share/compare taste with friends.

A **shared preference and recommendation platform** should power both. The founder will concentrate personal effort on business interviews, partnerships, pilot sales, offer design, and deciding what customers value. You may develop and improve both product directions, but prioritize work that makes the first paying B2B pilot possible. Approximate founder attention allocation: **80% B2B customer work / 20% consumer product direction** (planning heuristic, not a code development mandate).

**Do not interpret this bible as an instruction to launch, deploy, incur costs, or rewrite the application.** Begin with a fresh audit and Phase 0. Work autonomously on small, reversible development and tests on branches, but seek explicit authorization before merging to `main`, changing production infrastructure, applying migrations to live data, creating paid services, contacting real customers, sending communications, publishing a client campaign, or handling actual personal data.

## 1. Current repository and verified baseline

GitHub: `https://github.com/victorathomas01-thinker/tasteprint`  
Public site: `https://victorathomas01-thinker.github.io/tasteprint/`  
Stack: Vite, vanilla JavaScript/HTML/CSS, static GitHub Pages frontend; optional Supabase/Postgres/Auth/RLS/Edge Functions; Python/pandas/NumPy/scikit-learn ML lab; GitHub Actions and Node regression tests.

**As of the last repository review on October 21, 2026 (recheck this yourself):**
- `main` was at commit `acca63e45dbde456aeb194088af6abde99ddf7dd`, which fixed a campaign-specific MutationObserver feedback loop that froze `?campaign=aster`; the founder confirmed Aster works after deployment.
- Branch `fix/campaign-reporting-and-preview` was ahead of main by one commit, `9852012aeeb1088955104eff952ba08eecfad084`, and **not yet merged / no PR found**. It includes changes to `campaign-config.js`, `campaign-report.js`, `campaign-runtime.js`, `workspace.js`, an added `workspace-report-links.js`, and regression tests. It attempts to fix four issues: wrong/unauthenticated reporting endpoint with misleading fallback, report HTML injection, saved draft preview precedence, and missing campaign error UX. **Audit its actual state; don't duplicate or discard it.**
- Its new report frontend calls `tasteprint_workspace_campaign_stats`. An initial inspection of `supabase/workspaces.sql` and `supabase/campaigns.sql` did **not** find a corresponding definition. Search the entire repo and migrations; if absent, define a secure, correctly granted, tenant-scoped RPC and test it. Do not claim this is already working.
- PR #7 (`career-readiness/ml-cluster-validation`) remained open/draft; evaluate separately; don't fold unrelated ML work into campaign fixes.
- Codex may have local uncommitted changes not visible on GitHub. **Check `git status`, current branch, local history, remotes, untracked files and PRs before editing. Preserve all local work; never force reset/clean/rebase over it.**
- GitHub Pages deployment occurs from `main`; a push or merge can trigger live deployment. Pull-request validation workflows should run tests/build without deployment.

**Known documented live/local features:**
- Six consumer modules: Escape (`?`), Wear (`?module=wear`), Watch (`?module=watch`), Move (`?module=move`), Eat (`?module=eat`), Live (`?module=live`). Each includes domain-specific forced-choice questions, 10 score dimensions, archetypes, modes, badges/continuums and recommendations.
- Tasteprint Passport (`?profile=1`), module hub (`?modules=1`), Next Moves (`?next=1`), local preference history, exports/resets and multiple privacy controls.
- Explainable fit-confidence labels, recommendation diversity/lanes, returning-user logic and structured satisfaction feedback; no automatic model weight learning from real users.
- Result-card images, shareable result links, same-/cross-device friend challenge/comparison flows, and local referral telemetry.
- B2B Aster & Tide fictional branded campaign (`?campaign=aster`); Campaign Studio (`?campaignAdmin=1`) with local drafts, theme/copy/scoring configuration, CSV/JSON catalog import/export, preview, manifests, quality checks and optional consent lead-form configuration; Campaign Workspace demo (`?workspace=1`) with a five-role model; campaign report UI (`?campaignReport=aster`) with local-demo data and planned authenticated production aggregates.
- Supabase schemas, API clients, security boundaries, optional account sync, campaign publishing, analytics, lead capture, referral aggregation and deletion are **implemented/scaffolded in source**, but production activation, migrations, configuration, real-device QA, security verification and real client results remain unverified or incomplete.
- Separate `ml_lab/` uses **synthetic** datasets with KMeans/PCA and evaluation metrics. It is not the live recommendation algorithm.

**Core references to read before changing code:** `README.md`, `ROADMAP.md`, `PLATFORM.md`, `CAMPAIGNS.md`, `WORKSPACES.md`, `DATA_MVP.md`, `PRIVACY_MODEL.md`, `ACCOUNT_SYNC.md`, `INTELLIGENCE.md`, `REFERRALS.md`, `NEXT_MOVES.md`, `ml_lab/README.md`, package scripts, GitHub workflows, existing tests, current PRs and pending diffs. Treat documentation as a starting point; verify code and behavior. Mark each feature **LIVE/VERIFIED**, **LOCAL DEMO**, **BACKEND CODE ONLY**, **UNVERIFIED**, **PLANNED**, or **BLOCKED**. Never merge those categories in status reports.

## 2. Product vision and differentiation

**Purpose:** Help people make preference-heavy decisions with less aimless browsing and more confidence in relevant options. A Tasteprint experience should be enjoyable enough to finish yet practically useful enough to act on.

**Canonical loop:** (1) concise engaging tradeoffs → (2) transparent multi-dimensional taste read → (3) small, diverse, explainable selection of fitting options → (4) optional action and feedback → (5) improve through real evidence. An archetype is an engagement and communication layer, **not the whole product**.

Position Tasteprint as a **personalized discovery and decision platform**. Avoid describing its current live ranking as trained AI, asserting scientific personality accuracy, or claiming it increases conversion until validated. The durable advantage we are testing is **reusable preference elicitation + explainable matching + adaptable brand/catalog experience + privacy-aware learning**. Competitor differentiation remains a hypothesis to validate with customers, not a proven moat.

**Nonnegotiable UX principles:** user value before signup or contact collection; respect user autonomy; no dark patterns, fake scarcity or pressure; useful specificity instead of generic labels; accessibility and mobile speed; honest qualitative uncertainty; no fabricating products, prices, availability, partners or outcomes.

## 3. B2B product definition and intended first buyer

**Working product name:** “Tasteprint for Business” / “Tasteprint Experiences.” These are packaging proposals, not approved rebrands. Preserve existing source terminology such as campaigns/Workspace/Studio unless directed otherwise.

**Initial buyer hypothesis:** independently operated boutique hotels and guest-experience operators, starting around Charlotte, NC; potentially small hospitality groups, tour operators, destination experience curators, or concierge teams. Identify actual decision-makers through customer discovery: owner/GM, guest-experience manager, marketing manager, or similar. Do not assume the buyer or budget before interviews.

**Guest use case:** hotel website/pre-arrival email/QR at check-in or in-room opens a responsive, hotel-branded interactive. Guest answers a brief set of preference questions. System recommends a small set of actual hotel offerings or vetted local activities/dining/experiences with clear explanations and optional links to existing booking/contact pages. A guest may optionally request follow-up **after** receiving results, with explicit consent and a clear privacy notice. The hotel gets honest aggregate metrics, not access to hidden consumer identity data.

**What clients could get in a paid pilot:**
- Branded responsive campaign landing, instructions, and conclusion with hotel-approved logo/colors/copy.
- Configurable questions and weights that remain understandable and not manipulative.
- A curated catalog of real, client-approved offers (service/package/experience title, concise description, relevant tags, fit criteria, current link, optional image); validation, previews and sensible no-match/fallback handling.
- Explainable recommendations with multiple materially different options when available; don't show only a disguised upsell.
- Clear outbound CTA to the client's existing booking/offer/contact flow; attribution as click engagement, **not confirmed purchase**.
- Distribution links/QR assets usable in lobby, rooms, pre-arrival messages, and client website; respect origin, branding, and consent.
- A trustworthy analytics summary (views, starts, completions, recommendation impressions/results, CTA clicks, optional consent lead submits). Distinguish unique participants/events as defined; document denominators and avoid fake precision.
- Optional manual/concierge-style setup and revisions by Tasteprint. **Self-service SaaS onboarding is not a first-pilot requirement.**

**First hospitality demo:** Separate from Aster; create a **clearly fictional Charlotte-area boutique hotel** test experience, not a fake representation of an existing hotel. Show plausible *illustrative* in-hotel and nearby experiences without asserting partnerships, operating hours, exact availability, current pricing, or real booking capabilities. If linking to genuine third-party locations, use approved/verified destinations and clearly state they are illustrative, not affiliated. Include a full guest journey and a parallel owner-facing walkthrough that shows editing a catalog and reading an honest local demo report. Keep it reusable and simple; no hotel PMS/CRM/POS integration for demonstration unless specifically requested.

**B2B product boundaries today:** Commercial campaign infrastructure currently extends Escape/travel matching. Six consumer domains do not automatically imply six configurable B2B vertical engines. Generalize via a clean domain adapter *after* evidence of need, rather than promising any retail/gym/restaurant vertical by flipping a flag. No payment, booking, inventory or CRM integration should be claimed without end-to-end verification. Referral/lead/contact data must not be silently joined to individual Passport profiles.

**Selling and research:** Founder owns outreach and conversations. Support by producing demo scripts, interview guides, competitor hypotheses, prospect selection criteria, proposal templates, an honest statement of product capabilities, pricing experiments and a 30-day pilot plan—but do not independently send emails or enroll customers. Interview roughly 5–10 appropriate prospects as an initial target before deciding the first exact vertical offer. Early pricing ideas such as **$300–$750 one-time setup and $99–$249 per month** are **unvalidated hypotheses, not prices already approved or supported by market evidence**; require founder signoff and customer conversations. For a first pilot, pricing and commercial terms should follow scope, consent, support burden and real customer value.

## 4. B2C platform definition and intended growth

Preserve six existing modules—**Escape** (travel), **Wear** (personal style), **Watch** (story/viewing tastes), **Move** (training experience preferences, not medical prescriptions), **Eat** (food/dining preferences, not allergy/diet advice), **Live** (living-environment preferences, not housing affordability/safety determinations). Do not add new modules just to increase the count.

**Consumer lifecycle:** choose an interesting module → complete eight-ish meaningful forced-choice decisions → receive honest archetype, score continuums, badges, decision fingerprint and nuanced recommendation modes → pick/save a Next Move or share/compare with friends → accumulate a cross-domain Passport over time → revisit based on actual usefulness.

**Passport:** preserve ten shared dimensions—novelty, structure, social energy, aesthetic sensitivity, comfort, energy, serenity, sentiment, curiosity, spontaneity. Latest result from each completed domain receives equal contribution; retakes show change within domain. Preserve local-first utility and JSON export/reset. Optional passwordless account sync may be activated only when production backend and deletion flows are secure and tested.

**Recommendation quality:** three meaningfully differentiated lanes (best fit, adjacent/same-energy, curveball), qualitative model-fit confidence, cold-start versus returning context, explicit feedback on result accuracy and optional preference direction, and user-selected “I'd try this” → Next Moves. Improve concreteness where feasible: explain why an option fits, show tradeoffs and feasible actions, avoid content not backed by catalogs or evidence. Avoid using sensitive/demographic/medical features for optimization. Do not enable automatic weight updating without sufficient opt-in real-user evidence, review and versioned testing.

**Sharing/growth:** preserve 1080×1920 result cards, account-free result links, friend challenges/comparison, referral loop. Verify mobile native-share/download/fallback flows on real devices. Track actual completion and shares, not vanity impressions. Short links and cross-device attribution require backend activation. Keep referral privacy boundaries and no public social graph.

**Consumer validation:** founder/user tests should examine completion, clarity, perceived match, actual recommendation usefulness, saved decisions, return behavior, genuine sharing and complaints. Run small user tests before large growth campaigns. Consumer marketing scale comes later, when retention/usefulness justify it; technical maintenance can happen in parallel with B2B pilots.

## 5. Shared technical architecture and engineering philosophy

**Do not rebuild this in a fashionable stack just for its own sake.** Existing JavaScript, Vite, GitHub Pages and optional Supabase are serviceable until a concrete bottleneck justifies change. Prioritize readable modules, stable contracts, explainable scoring and simple deployments. If proposing React/Next.js, a hosted server, vector DB, LLM ranking, payment system, or new managed service, supply the concrete requirement, migration cost, security implications and alternative of using what exists. **Never add a dependency just to appear modern.**

**Suggested conceptual seams:**
- `PreferenceModel` — module/domain question schema, weight vectors, scoring, archetypes, uncertainty and version identifiers.
- `RecommendationCatalog` — typed, validated offers with eligibility, tags, description, URLs, provenance, optional asset metadata, optional availability timestamps; catalog ranking remains interpretable.
- `RecommendationEngine` — maps profiles to offers/modes with explainable reason codes, stable deterministic tests, diversity and sensible sparse/no-match fallback.
- `ExperienceRenderer` — first-party modules vs client-branded campaign presentation without duplicated business logic.
- `CampaignOperations` — local drafts, preview, validation, authenticated publishing, workspace permissions and versioning.
- `Telemetry` — documented privacy-safe event schemas, reliable backend ingestion, analytics aggregates and demo-versus-production labeling.
- `Passport` and `NextMoves` — consumer-owned local-first state, optional account sync; deliberately not exported to client campaigns without affirmative consent.

These are **logical interfaces**, not an instruction to reorganize all current files today. Migrate incrementally, with tests, and only when necessary for the next actual product slice.

**Potential integrations, ordered by demand rather than ambition:** external destination URLs → trackable CTAs → verified booking/lead attribution where feasible → one real hotel integration/API if a paying pilot requires it → generalized connectors only after multiple clients share the need. A client may not have a modern API; design a low-tech link/QR/CSV workflow that still provides value. Never scrape or import customer contact data without authorization.

**AI/ML policy:** Current live recommendation engine is deterministic/explainable, not a real-user-trained neural recommender. Existing Python lab demonstrates synthetic-data clustering, PCA and metrics, not evidence of external validity. Any proposed production ML must beat simple baselines on an identified customer problem and include consent, dataset provenance, leakage checks, offline/holdout evaluation, bias review, explainability, rollback and monitoring. No LLM hallucinated hotel inventory, fabricated itinerary details or auto-generated fake user testimonials.

## 6. Analytics, privacy, security and commercial truthfulness

Maintain four distinct data zones: (1) anonymous consumer analytics and structured feedback; (2) optional authenticated Passport sync; (3) authenticated client/team Workspace data; (4) **explicit-consent** restricted campaign lead contact data. Preserve separate local-only Next Moves. Minimize collection and use only allowlisted events. Never quietly combine those stores under a universal identifier.

**Security:** enforce server-side owner/admin publication privileges, RLS tenant isolation, least-privilege SQL grants, secret/service-role credentials server-side only, validated/expiring hashed invite tokens, HTTPS-only external links, input validation and output encoding, explicit production origin allowlists, safe rendering (avoid `innerHTML` with untrusted fields), no raw contacts/PII in anonymous analytics or general dashboards, no browser-readable raw lead lists. Provide deletion/export behavior matching each data class; don't claim a feature deletes data it does not control. Document retention/pruning (code target 180 days for anonymous raw events) and verify scheduled production execution before making policy claims.

**Critical reporting rule:** Production reporting must never silently substitute current-browser numbers. Make the reporting data source visibly explicit. Authenticate and scope production RPC by workspace membership. Document event definitions, deduplication, missing/offline events, attribution limits and denominators. CTA click ≠ completed booking; lead form submit ≠ purchase; increased engagement ≠ measured revenue lift.

**Critical campaign rules:** Unavailable/unpublished links must fail clearly, not route to a generic quiz. A local draft preview must be distinguishable from a published campaign. Explicit published routes must not leak local drafts or show a bundled fiction as a live published offer. Revisit campaign ID collision, cache, latency, connectivity and remote failure behavior. Preserve the MutationObserver idempotence regression, avoid unbounded observers and handle missing `#app` safely.

**Production-readiness verification:** activate backend only with founder approval; use a safe development/staging project first; ensure migrations apply in the correct order and can be rolled back; run authenticated two-browser tests of owner/editor/analyst role restrictions, invitations, publication, catalog access, reporting, consent lead capture, account sync and deletion. Test direct unauthorized API calls, not just button visibility. Verify no secrets in frontend bundles, SQL policy/grant coverage and CORS. Avoid collecting real guest/contact data until privacy text, lawful basis/consent, access controls, retention and deletion have been reviewed.

## 7. Execution roadmap: milestone-based, provisional timeline

**Dates are planning estimates, not promised delivery dates.** Default to sequencing by explicit acceptance gates. Multiple compatible items can be implemented in parallel branches, but no unreviewed batch of sprawling changes. Keep the consumer app stable throughout B2B work.

### Phase 0 — Repository reconciliation and four campaign fixes (first 2–5 working days)
1. Inspect `git status`, local uncommitted changes, branch `fix/campaign-reporting-and-preview`, upstream `main`, existing PRs and full automated suite. Preserve local work.
2. Audit four fixes: secure report RPC and explicit failure, HTML injection/escaping, local Aster draft preview precedence, unavailable campaign routes. Check entire SQL tree for `tasteprint_workspace_campaign_stats`; if missing, implement correct authenticated membership-scoped aggregate RPC and migration/test. Inspect URL query handling and state when published lookup fails.
3. Add/verify integration-style regression tests for each bug (including malicious HTML, unauthorized workspaces, published vs draft conflicts, malformed IDs, unavailable backend). Review baseline bug reproducibility.
4. Run `npm test`, `npm run build`, applicable Python tests and staged browser smoke tests if available. Confirm no new frontend render loops.
5. Open a focused PR with diff, changed files, test evidence, security notes and manual QA checklist. **Do not merge/deploy without approval.** Deal with unrelated ML PR #7 separately.
**Exit gate:** fixes tested and reviewed; no misleading live metrics or unsafe rendering; no lost local edits.

### Phase 1 — Demo-to-pilot readiness and actual product quality (roughly weeks 1–3)
1. Map full first-time guest journey and identify usability gaps. Validate new hospitality demo needs before coding.
2. Build fictional **Charlotte boutique-hotel demo** using reusable campaign configuration, verified/clearly fictional offers, link/QR distribution, preview and comprehensive mobile UX. Separate editable client manifest/catalog from common engine.
3. Harden campaign creation: input validation, logo/image and text support only if the current flow actually needs it; sample CSV templates, safe link validation, empty/error states, edited draft preview and explicit data-mode labels.
4. Add demo-owner walkthrough, sample report with unmistakable **sample data**, and client setup checklist. Ensure guest receives options before consent prompt. Provide a shareable stable demo link after authorized merge/deploy.
5. Test entire journey on desktop/mobile, keyboard/reduced motion and browser navigation; visually inspect screenshots. Fix high-impact friction.
**Exit gate:** founder can show an attractive, fast, honest, complete guest experience in under 5 minutes; no fictitious capability is passed off as live.

### Phase 2 — Production foundation and measurable pilot infrastructure (roughly weeks 2–6; approval and credentials required)
1. Propose minimal-cost Supabase staging/production architecture; identify all needed migrations, environment values, Auth redirects, RLS, RPC grants, origin settings, Edge Functions, rollback and secrets handling. Flag any paid tier/cost.
2. With approval, stage anonymous event ingestion, authenticated client workspaces, published campaign lookup, owner/admin publish/unpublish, restricted lead submission (only if requested), report aggregates, local/remote distinction and health/error monitoring.
3. Verify realistic multi-device event flow and funnel denominators; respect opt-out/consent boundaries. Prefer privacy-safe synthetic staging records rather than real PII for tests.
4. Set up basic operational runbook: deploy checklist, error diagnosis, restore/rollback, domain changes, backup/retention, rate limiting and abuse management. Test offline/network failure and campaign unpublishing.
5. Provide owner-safe verification steps and concise explanations of infrastructure choices.
**Exit gate:** pilot owner can obtain a valid URL, see correctly scoped aggregate usage across devices and confirm links/consent functions without developer intervention. Failed reporting shows errors, not fake data.

### Phase 3 — First real B2B pilot and customer discovery feedback (roughly weeks 4–10; dependent on founder sales)
**Founder:** speak to an initial 5–10 prospects; identify their most costly guest-discovery/upsell problem and decision maker; select one narrow pilot offer; get permissions for branding, offers, distribution and any contact collection; agree on pricing/term and measurement plan.
**Codex:** support short discovery/demo scripts, a client questionnaire, catalog import template, pilot proposal and transparent analytics definitions. Implement only pilot-specific requested features. Launch only after founder approval. Provide a weekly report template and change log. Keep manual concierge onboarding if it is faster than building full SaaS administration.
**Candidate metrics:** landing visitors, quiz starts, quiz completion rate (completions/starts), result-to-CTA rate (defined explicitly), optional consent rate, engagement by recommendation/placement, qualitative guest/manager feedback. Confirmed bookings/revenue only if verifiable via authorized integration or client-provided reliable reconciliation.
**Exit gate:** one functioning real pilot, documented setup/support time, meaningful client feedback and evidence of willingness (or unwillingness) to pay. If no client signs, don't disguise demo engagement as product-market fit; diagnose offer/pricing/distribution and revise.

### Phase 4 — Consumer validation and shared-engine quality (parallel maintenance; focused push around weeks 5–12)
1. Protect all six working consumer modules and Passport; do not rewrite.
2. Conduct brief moderated/unmoderated user journeys: first impression, completion, clarity, result fit, recommendation usefulness, next action, sharing behavior, repeat visits and accessibility.
3. Improve the highest-friction journeys, unclear explanations, mobile result/share cards, Next Moves and Passport value; add tests tied to findings.
4. Tune deterministic content/ranking only with clear qualitative reasons; maintain valid archetype distribution across response space. Preserve calibration disclaimers; don't add unsupported population percentiles.
5. Keep account-free value as default. Prepare production Passport/account/referral activation only where benefit and privacy review justify cost.
**Exit gate:** clear evidence that results are useful to real consumers; reliable, understandable core UX; repeat-use/share hypotheses measured rather than assumed.

### Phase 5 — Scale validated revenue, not speculation (roughly months 3–6+)
When a paid pilot reveals recurring value, incrementally implement reusable onboarding, campaign versioning, billing/account plans, client support tooling, error monitoring, SLA expectations and multi-campaign reporting. Add proven verticals **one at a time**, adjusting question models/catalog adapters only as needed. Experiment with self-service only if manual onboarding repeats predictably. Consider consumer partnerships/referrals only after demonstrated user usefulness. Consider ML personalization only with actual opt-in evaluation data. Build operational processes so revenue does not require bespoke engineering for every client.
**Exit gate:** repeatable customer acquisition/onboarding, real payments, support burden understood, measurable retention/renewal and a credible unit-economics path. The goal is a scalable business, not an elaborate demo with no customers.

## 8. Prioritization rubric and work intake

For every proposed task, rank: **(A) critical correctness/security/privacy, (B) enables paid pilot, (C) improves shared infrastructure or measured consumer usefulness, (D) speculative polish, (E) scope-expanding distraction.** Prefer A then B, and selectively C. Estimate user impact, implementation and ongoing support effort, dependency risk, reversibility and measurable acceptance criteria. If the feature adds complexity without a clear customer or testable hypothesis, put it in backlog and explain why.

**Do now:** four bug fixes; secure report endpoint; production-data honesty; hotel demo; staging; client catalog templates; guest mobile usability; actionable CTA; basic usage reporting; first-pilot setup flow.  
**Defer until demand:** advanced multi-tenant billing, generalized integrations, consumer ad platform, additional quiz domains, complex AI agents, recommendation model trained on unvalidated data, personalized location tracking, full CRM, marketing automation, native apps, broad marketplace, new frontend framework migration, arbitrary feed scrapers.

## 9. Required engineering and QA standards

- **Branch discipline:** smallest cohesive PR possible; branch off fresh `main` once pending local changes are reconciled. Never delete uncommitted founder/Codex work. Document old/new behavior and linked requirements. Only merge with founder approval.
- **Test discipline:** `npm test` and `npm run build` for every relevant PR; run `ml_lab` tests when editing ML code. Add focused regression test for every defect. Validate real behavior, not only source substring markers. Use mock/unit tests for speed, but add staged browser tests for pages/links and authenticated integration tests for backend. Do not claim production readiness based solely on green unit tests.
- **UX discipline:** reasonable mobile viewport, real touch interactions, readable hierarchy, natural trustworthy design (not exaggerated AI marketing aesthetics), fast flow, accessibility semantics, keyboard/focus/reduced motion, empty/loading/error states, usable back/retry and link/navigation behavior.
- **Reliability discipline:** watch asynchronous initialization, failed remote requests, query routing, Vite `/tasteprint/` base paths, import/bundle behavior, localStorage exceptions, event observer feedback loops, duplicate listeners, late content injection, blank-page failures and stale drafts. Add route smoke tests. Production links must not hang silently.
- **Data discipline:** schema migration + RLS policy + RPC permissions + backend auth + frontend call must agree in naming, args and type shape. Test actor permissions (anonymous/nonmember/editor/analyst/admin/owner), synthetic cross-tenant access attempts and failure cases.
- **Security discipline:** no script injection, untrusted HTML, `javascript:` links, open redirects, PII in events, leaked API secrets or cross-tenant data access; client validation is not authorization. Review dependencies and supply-chain changes.
- **Documentation discipline:** maintain accurate README, architecture, roadmap, runbook and public feature claims. A feature is only “live” after deployment and end-to-end verification.
- **Resource discipline:** no spend, API procurement, service subscriptions, irreversible infrastructure changes or real-user outreach without explicit approval. Favor free/low-cost infrastructure where reliable, and call out usage/cost tradeoffs beforehand.

## 10. Founder communication and learning requirements

The founder is learning software engineering and wants to **understand** the projects, not accumulate code that cannot be explained. Do most heavy technical implementation, but leave a clear trail: explain each major file/module's job, data flow, why the change exists, how to reproduce/test it, and one or two key concepts in plain English. Provide optional small exercises or short questions instead of huge technical lectures. Documentation should make Tasteprint credible as an independently understood software/data/AI portfolio project as well as a real business candidate. Never pretend the founder wrote or understood code they have not reviewed.

Use concise progress reporting despite the length of this bible. For each PR/iteration return:
1. **What was wrong / what users or customers gain** (plain language).
2. **Exactly what changed** (files/features) and what was deliberately deferred.
3. **Proof**: tests run, outputs, browser/staging checks, failures and what remains unverified.
4. **Security, privacy, deployment and cost implications.**
5. **Review link and the one specific approval/decision needed next.**

Never claim an action, test, merge, launch, customer result or revenue that did not occur. If blocked by credentials or tooling, prepare reproducible steps and state the blocker rather than inventing success. You may ask focused questions when a product or privacy decision cannot reasonably be made from the context, but avoid repeatedly stopping for minor implementation choices.

## 11. Questions to resolve with actual users, not invented facts

- Which hospitality buyer has the problem, budget and authority to buy?
- Are they trying to improve guest satisfaction, reduce concierge workload, drive ancillary spend, promote local partners, or improve pre-arrival discovery? Which one is the sharpest pain?
- Where would guests encounter the experience, and why would they complete it rather than ignore another QR code?
- Which offers are real, permitted, consistently available, and profitable to promote?
- How frequently will hotel staff update the catalog? Is CSV/concierge onboarding enough?
- What specific outcome justifies payment? What can we actually measure without a booking integration?
- Do consumers find Passport/useful next actions compelling after the novelty of one quiz wears off?
- Does the shared preference architecture actually transfer well between domains, or are some use cases better served by domain-native scoring?
- When, if ever, does an ML model measurably outperform the transparent rules?

Store validated discoveries as dated evidence with source, sample size and caveats. Do not confuse founder intuition, simulated data and customer observations.

## 12. FIRST RESPONSE AND FIRST IMPLEMENTATION REQUEST

Before changing code, do the following:

**A. Reconcile reality.** Fetch GitHub `main`, local working tree, every uncommitted change relevant to current work, branch `fix/campaign-reporting-and-preview`, PR #7, test scripts and SQL/RPC definitions. Show the exact SHA/branch and any discrepancies between this bible and current code. Identify which of the four earlier bug fixes are implemented, correctly tested, or still broken. Check `tasteprint_workspace_campaign_stats` end-to-end and identify any security/fallback bugs in the current patch.

**B. Produce a compact status report.** Give a table with feature, actual readiness (LIVE/LOCAL/SCaffold/UNVERIFIED/PLANNED), major risk, priority and next validation step. Then give a dependency-ordered top-10 backlog, with rough effort and what requires the founder's input or credentials.

**C. Proceed with safe Phase-0 implementation.** On the existing fix branch (preserving all unrelated local changes), finish/correct the four fixes, add focused tests, verify `npm test` and `npm run build`, run any available backend/security validation, and open/update a pull request. Do not merge or deploy. If the workspace branch cannot safely be reused, explain and make a new branch without discarding work.

**D. Present the next vertical slice**: a concrete design and acceptance checklist for the fictional Charlotte boutique-hotel pilot experience, specifying which existing components to reuse and the minimum code changes. Wait for founder approval before scope-expanding into that pilot, production database activation, paid infrastructure, outreach or launch.

**Project success is not measured by lines of code. Success means customers find the experience useful, a business can operate it reliably, metrics are honest, privacy holds, and eventually people willingly pay for it.**
