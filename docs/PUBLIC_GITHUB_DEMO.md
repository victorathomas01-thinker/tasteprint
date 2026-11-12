# Public GitHub demo

The founder explicitly requested a public GitHub demo. This authorizes this separate static sample-data preview, without merging/deploying Tasteprint production, activating Supabase or collecting real social data.

Target repository: `victorathomas01-thinker/tastesocial-demo`, separate from the production repository. Entry: `https://victorathomas01-thinker.github.io/tastesocial-demo/demo.html`. The generated assets repository has no account credentials, database, deployment workflow or production connection. GitHub Pages serves the static files from its own branch. This is a manual publication, not approval for automatic future deployments.

## Build and review

`npm run build:public-demo` clears every inherited VITE variable, supplies blank allowed flags/keys, and builds with `/tastesocial-demo/` as the base. Vite refuses this mode if any backend flag/key is populated. The ordinary application build and existing production Pages workflow remain unchanged.

Generated output is ignored at `dist-public-demo/`; only those reviewed generated assets are published to the separate repository. `.nojekyll` preserves static paths. `demo-build.json` identifies the exact committed source and disabled backend. Never publish the source checkout's ignored files, credentials, local drafts or environment files.

## Browser data separation

GitHub Pages repositories under the same owner share a browser origin. Public-demo builds rewrite application local/session storage references to a demo-only adapter. That adapter only reads, writes, enumerates and clears keys under `tasteprint.public-demo.v1:`. It never falls back to production keys. Native Storage objects are not replaced or modified. This is separation of trusted application data, not a separate security origin or protection from malicious same-origin JavaScript.

The application gets a visible public-demo notice, with no real accounts or bookings. Its Content Security Policy disallows network connections. The guide remains script-free, uses ordinary navigation and never writes storage. Sample friend decisions and in-page plans retain their existing explicit simulation labels. Optional source links open external sites only when the visitor chooses them.

## Verification

Run `npm test`, `npm run lint`, `npm run build` and `npm run build:public-demo`. Serve the generated output at its configured base with Vite preview, then run both `scripts/check-demo-browser.js` and `scripts/check-public-demo-browser.js` against `TASTEPRINT_TEST_URL`. The first completes the actual demo at mobile/desktop sizes; the second seeds unrelated production-style data and proves the rendered app neither reads nor overwrites it. Unit tests cover namespaced reads/writes/removal/clear, independent session data and blocked storage errors.

After publication, verify the exact manifest, entry page, asset paths and full browser walkthrough over the actual HTTPS URL. Do not claim availability before that check. No public stranger discovery, real-account interaction, real Charlotte inventory or business ownership verification is implied.

## GitHub permission blocker

The connected GitHub integration returned HTTP 403 “Resource not accessible by integration” when asked to create `tastesocial-demo`. No repository or public site was created by that request. The founder subsequently created the empty public repository, and the connection verified admin/push access. This resolved the repository-creation blocker. Existing Tasteprint Pages settings and production workflow remain unchanged. Publication and HTTPS verification are separate from this source commit.

## Published and verified

The founder enabled Pages through GitHub's UI after the connection also returned HTTP 403 for Pages creation. The separate site now reports **built**, serving generated repository commit `4b88f2777c1c2ecd7020b73623390d4142941ba3` from source `6f8e7547e653a30e57186a19271d1dae54fadae6`. Open https://victorathomas01-thinker.github.io/tastesocial-demo/demo.html .

The live HTTPS manifest matched that source with backend disabled. Both complete 375px/1280px demo journeys and the independent production-style storage preservation test passed against the actual public URL, with zero remote API requests or page errors. The environment requires an HTTP proxy; Chromium was given explicit public-key trust for the environment's installed CA certificates after ordinary browser trust rejected its proxy certificate. This is recorded separately from local artifact checks; no blanket ignore-HTTPS setting was used.

No source PR was merged. The production repository main remained `acca63e45dbde456aeb194088af6abde99ddf7dd`; its Pages source/workflow was unchanged, and all 16 original uncommitted-file hashes matched. The demo is public and demonstrable, not certified for real accounts, personal data or launch. Future public-demo updates require review/authorization rather than automatic deployment.
