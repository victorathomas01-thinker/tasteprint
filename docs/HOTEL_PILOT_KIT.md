# Hotel pilot intake and onboarding kit

This package supports concierge onboarding; it is not self-service SaaS, a signed proposal, a launch approval or an approved price list. The founder owns outreach, buyer discovery, commercial terms and release authorization. Do not contact prospects automatically.

## What the first pilot tests

Hypothesis: a concise preference experience helps a guest choose a useful hotel offering or nearby experience with less browsing. Initial interview target: 5–10 independently operated/boutique-hospitality prospects around Charlotte. Validate who owns the problem and budget before optimizing for a presumed buyer.

Ask: What do guests repeatedly ask? Which offerings are under-discovered? What does the concierge/guest-experience team do manually? Where could the experience be encountered? What would make it worth paying for? Who updates offers? Which existing booking/details pages can we use? What evidence would change the manager's mind after 30 days?

Record each discovery with date, source, sample size, observation, caveat and next test. Distinguish an interview observation from founder intuition or demo behavior. No fabricated case studies or revenue lift.

## Information the hotel supplies

| Area | Required input | Approval / owner |
| --- | --- | --- |
| Brand | Approved business name, colors, asset/logo usage rights and reviewed introduction | Hotel's authorized contact |
| Catalog | About 6–12 real offers, descriptions, fit tags and tradeoffs | Named hotel catalog owner |
| Destinations | Approved HTTPS details/booking/contact links, checked for the intended device | Hotel verifies links and fulfillment |
| Accuracy | Availability/restrictions, accessibility/dietary notes where relevant, last verified date and update cadence | Hotel is responsible for accurate real-world details |
| Distribution | One primary placement: website, permissioned pre-arrival message, lobby/in-room QR | Hotel authorizes placement/content |
| Success question | One primary outcome and a baseline/comparison plan | Founder and buyer agree |
| Support | Named escalation contact, review cadence, revision scope and pause/rollback criteria | Agree before launch |
| Privacy | Lead capture off by default; separate approval for any contact follow-up | Consent/privacy review before collection |

Do not paste real guest/contact records or credentials into a catalog, issue, chat or analytics event. Names/emails used for explicit follow-up belong only in the separately approved restricted lead path.

## Catalog preparation

`templates/hotel-demo-catalog.csv` is an editable fictional example, not real hotel inventory. Headers:

`id,name,description,tag,modes,archetypes,ctaLabel,href,tradeoff`

Use stable lowercase IDs; plain-language descriptions; `|` between matching modes/archetypes. Blank destinations stay unbookable. Production destinations must be valid HTTPS without embedded credentials. The current campaign engine uses Escape travel preferences: these are internal matching tags, not a claim of a general hotel inventory integration or a new learned model.

In Studio, import CSV/JSON, validate the catalog, or edit offer names/descriptions/labels/tradeoffs/destinations through the labeled fields. Save draft & preview, then download a manifest/catalog for review. Custom questions, scoring, hospitality presentation and fictional-demo safeguards survive edit/export. Invalid catalogs must be corrected before save/preview.

Before substituting real offers, verify rights and factual accuracy, review copy, remove demo-only claims only with approval, and check every external destination. Do not convert the fictional demonstration into a real client campaign just by renaming it.

## A 30-day pilot outline

1. **Before launch:** approve scope, actual offers/branding/links, privacy choices, terms and the measurement question. Complete staging/security checks. Founder separately approves merge/deployment and real-user collection.
2. **Week 1:** confirm placement is reachable, mobile flow works, data sources are correct and reporting is tenant-scoped. Fix broken links or high-friction questions; do not interpret tiny counts as lift.
3. **Weeks 2–3:** review guest/manager feedback and the agreed funnel. Make bounded, recorded catalog/copy revisions rather than changing scoring to manufacture engagement.
4. **Week 4:** review usefulness, support/update effort, willingness to continue/pay and whether distribution was adequate. Decide continue, revise the offer, or stop. A failed commercial hypothesis is evidence, not a reason to fabricate positive results.

## Measurement agreement

- Views, quiz starts, completions, recommendation/result views and outbound actions are **events** unless a documented distinct-session measure is explicitly shown.
- The local demo reports only that browser's rolling recent buffer. Retakes count again. It starts at zero; it contains no simulated clients and does not represent cross-device usage.
- Local hotel completion rate = `quiz_complete / quiz_start`; CTA rate = `campaign_cta / campaign_view`. Repeated clicks and missing/offline events can distort event ratios, including values above 100%.
- Production reporting currently supports the deployed schema's campaign views, result matches, actions and optional consent funnel. Do not assume local hotel start/completion additions are already a deployed production report. Agree and test any additional aggregate contract in approved staging.
- Outbound action is not a booking. Lead submission is not a purchase. Do not report bookings/revenue without an authorized, reliable reconciliation method.
- Event ingestion is not certified bot-proof or guaranteed delivery. Review abuse controls and missing-event behavior before a real pilot. Do not quietly join anonymous activity to Passport, Workspace identity or consent leads.

## Release checklist

- [ ] Approved problem, buyer, terms, distribution and actual catalog.
- [ ] Security PRs reviewed; direct anonymous/nonmember/cross-tenant/role denial tests pass in staging.
- [ ] Published routes never show drafts, and reporting failures never show local statistics.
- [ ] Real-device, keyboard, reduced-motion and every outbound link checked.
- [ ] Data source, denominators, privacy/consent/deletion and retention responsibilities reviewed.
- [ ] Pause/rollback/support owner agreed; no raw PII in logs or general dashboards.
- [ ] Explicit founder release approval before public URL/QR distribution or any guest data collection.
