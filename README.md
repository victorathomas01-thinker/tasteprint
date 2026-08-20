# Tasteprint

**Interactive recommendation platform + applied ML portfolio project**

[Live demo](https://victorathomas01-thinker.github.io/tasteprint/) · [ML lab](ml_lab/README.md) · [Platform architecture](PLATFORM.md) · [Privacy model](PRIVACY_MODEL.md) · [Roadmap](ROADMAP.md)

Tasteprint turns quick forced-choice decisions into explainable preference profiles and recommendations across six consumer domains: travel, style, entertainment, fitness preferences, food, and living environments.

The project is designed as more than a quiz. It includes a shared preference model, cross-device comparison flows, privacy-aware analytics, optional account sync, campaign tooling, regression testing, and a separate Python/scikit-learn ML lab that explores whether the shared preference space contains recoverable structure.

## Portfolio highlights

- Built and deployed a multi-module JavaScript recommendation product with a shared 10-dimensional preference representation.
- Added a Python ML lab using **pandas, NumPy, scikit-learn, KMeans, PCA, silhouette score, and Adjusted Rand Index**.
- Designed an optional **Supabase/Postgres** backend for anonymous analytics, passwordless auth, account sync, workspace roles, short links, referral attribution, and campaign reporting.
- Added privacy boundaries that keep anonymous analytics, account data, workspace administration, and explicit-consent lead data separated by purpose.
- Added automated regression checks for product behavior, privacy boundaries, accessibility, campaign logic, account flows, and module distributions.
- Exhaustively evaluates all **65,536 possible response paths** for several modules as engineering calibration checks.
- Built shareable 1080×1920 result cards, friend comparison flows, referral telemetry, and a local-first decision-memory layer.

## Tech stack

**Frontend**
- JavaScript
- HTML / CSS
- Canvas API
- Web Share API
- GitHub Pages

**Backend / data architecture**
- Supabase
- PostgreSQL
- Row Level Security
- Supabase Auth
- Edge Functions
- SQL RPCs

**Applied ML lab**
- Python
- pandas
- NumPy
- scikit-learn
- KMeans clustering
- PCA
- silhouette score
- Adjusted Rand Index
- unittest

**Engineering practices**
- Git / GitHub
- GitHub Actions
- automated regression checks
- privacy-by-design boundaries
- reproducible ML experiments
- progressive enhancement

## Live demo

Main deployment:

```text
https://victorathomas01-thinker.github.io/tasteprint/
```

Useful routes:

```text
?                         Escape / travel module
?module=wear              Wear / style module
?module=watch             Watch / entertainment module
?module=move              Move / training-preference module
?module=eat               Eat / food-preference module
?module=live              Live / living-environment module
?profile=1                Tasteprint Passport
?modules=1                module hub
?next=1                   Next Moves
?campaign=aster           fictional campaign demo
?workspace=1              Campaign Workspace demo
?stats=1                  privacy-safe aggregate dashboard
?growth=1                 referral-loop dashboard
?privacy=1                privacy and data controls
```

The public deployment is intentionally useful without a backend. Supabase-backed features remain optional until a production project is connected.

## The product problem

Taste-heavy decisions can create more browsing without more confidence. Tasteprint tries to reduce that overload with a two-part product loop:

1. **Make discovery enjoyable enough to finish.** Users make quick tradeoffs and receive identity-style results, badges, visual continuums, and shareable output.
2. **Turn the result into a decision.** Explainable recommendation lanes and a lightweight Next Moves layer help the user pick something to actually try.

The product avoids fake scientific certainty. Population percentiles, learned weights, and confidence claims are gated until enough real evidence exists.

## Consumer product

The six live modules are:

- **Escape** — travel, pace, atmosphere, comfort, and destination fit
- **Wear** — personal style, silhouettes, polish, experimentation, and ease
- **Watch** — story mechanics, pacing, tone, worlds, and emotional investment
- **Move** — training structure, intensity, recovery, craft, and repeatability
- **Eat** — flavor, discovery, ritual, comfort, sharing, and spontaneity
- **Live** — home/neighborhood rhythm, community, quiet, access, rootedness, and discovery

Each module has its own questions, score dimensions, archetypes, modes, badges, recommendation logic, and shareable results.

Several modules run exhaustive response-space tests across all 65,536 possible answer combinations. These are engineering calibration checks, not claims about a real population.

## Tasteprint Passport

A shared Passport maps completed module results into ten master dimensions:

- novelty
- structure
- social energy
- aesthetic sensitivity
- comfort
- energy
- serenity
- sentiment
- curiosity
- spontaneity

Only the latest completed result from each domain contributes to the master profile, so repeatedly taking one module cannot overpower the others.

Passport supports:

- 6/6 module coverage
- local history
- change-over-time summaries
- cross-module patterns and badges
- JSON export
- local reset
- optional passwordless cross-device sync

See [PLATFORM.md](PLATFORM.md) and [ACCOUNT_SYNC.md](ACCOUNT_SYNC.md).

## Recommendation intelligence

Tasteprint includes an explainable recommendation layer with:

- qualitative fit confidence
- deliberately different recommendation lanes
- cold-start vs. returning-user behavior
- structured satisfaction feedback
- optional higher/lower preference-dimension feedback
- recommendation-lane interest tracking

Automatic weight updates are disabled. Real scoring changes are intended to require real-user evidence, human review, versioning, and simulation before release.

See [INTELLIGENCE.md](INTELLIGENCE.md).

## Applied ML lab

The `ml_lab/` directory is a separate portfolio/research sandbox built around the shared Tasteprint preference space.

It demonstrates:

- synthetic dataset generation
- reproducible experiments with fixed random seeds
- feature standardization
- KMeans clustering
- PCA visualization coordinates
- silhouette-score evaluation
- Adjusted Rand Index evaluation against hidden synthetic source profiles
- unit tests

The lab intentionally uses synthetic data so the project does not pretend to have learned patterns from real users before that evidence exists.

Quick start:

```bash
cd ml_lab
python -m venv .venv
pip install -r requirements.txt
python generate_demo_data.py --rows 1200
python cluster_preferences.py demo_preferences.csv
python -m unittest test_ml_lab.py
```

See [ml_lab/README.md](ml_lab/README.md).

## Cross-device sharing and referral loop

Tasteprint supports stateless cross-device challenge links without requiring accounts. Shared links encode a compact versioned preference vector and checksum while excluding names, emails, account IDs, and raw answer history.

The optional referral layer can measure challenge creation, receipt, completion, comparison unlocks, and same-session resharing without exposing a sender/recipient social graph.

See [REFERRALS.md](REFERRALS.md).

## Campaign and workspace architecture

Tasteprint can also operate as a configurable branded recommendation campaign system.

The campaign layer includes:

- configurable question/scoring manifests
- CSV/JSON catalog ingestion
- recommendation matching
- CTA/conversion analytics
- explicit-consent post-result lead capture
- privacy-safe reports
- multi-role workspace scaffolding

Workspace roles include Owner, Admin, Editor, Analyst, and Viewer. Hosted rows are designed around tenant-scoped Row Level Security, and publishing is re-authorized server-side.

See [CAMPAIGNS.md](CAMPAIGNS.md), [WORKSPACES.md](WORKSPACES.md), and [PRIVACY_MODEL.md](PRIVACY_MODEL.md).

## Privacy model

Tasteprint separates four data zones instead of silently joining them under one identity:

1. anonymous consumer product data
2. optional account-backed Passport sync
3. authenticated Campaign Workspace administration
4. explicit-consent campaign lead contacts

The codebase also includes checks intended to fail CI if browser clients contain backend secret-key markers or if important workspace/privacy invariants disappear.

See [PRIVACY_MODEL.md](PRIVACY_MODEL.md) and [DATA_MVP.md](DATA_MVP.md).

## Run locally

Requires Node.js.

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

All automated checks:

```bash
npm test
```

Individual suites include accessibility, privacy, analytics/data contracts, campaigns, workspaces, accounts, recommendation intelligence, referrals, and module-distribution checks.

## Optional Supabase activation

The public app works without Supabase. To activate the optional backend, configure the public project URL/client key and apply the SQL/Edge Function layers documented in the repository.

Frontend environment variables:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

`VITE_SUPABASE_ANON_KEY` is a historical variable name and may hold the current public/publishable client key. Secret/service-role keys must remain server-side.

## Architecture map

Key modules include:

- `platform-core.js` / `platform.js` — shared Passport model
- `account-core.js` / `account-sync.js` — optional account sync
- `intelligence-core.js` / `intelligence.js` — recommendation intelligence
- `next-moves-core.js` / `next-moves.js` — decision memory
- `referral-core.js` / `referral.js` — referral loop
- `workspace-core.js` / `workspace.js` — workspace behavior
- `analytics.js` / `analytics-contract.js` — anonymous analytics layer
- `privacy.js` / `privacy-extensions.js` — privacy controls
- `supabase/` — SQL schemas, RPCs, and Edge Functions
- `ml_lab/` — Python ML portfolio lab

## Product principles

- useful output over novelty alone
- value before signup or data requests
- privacy by architecture
- no fake precision
- no fake learning claims
- no sensitive-feature optimization
- user agency over dark patterns
- reproducible tests before claims

## Current next steps

The remaining work is mostly production activation and real-world validation:

- connect and QA a production Supabase project
- run physical iPhone/Android and assistive-technology QA
- collect enough opt-in user feedback for honest calibration work
- validate campaign/workspace flows against the production backend
- add real case-study metrics once enough usage exists

See [ROADMAP.md](ROADMAP.md) for detailed status.