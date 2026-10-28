# Optional account startup — development review

A controlled browser regression blocked the optional Supabase SDK asset in a configured production build. Discovery failed to render because the shared Auth module awaited that download during module evaluation. This proves a startup dependency defect; it does not claim to trace every earlier intermittent Pages timeout.

The shared module now exposes a small lazy adapter for the SDK operations already used by the app: account subscription/session lookup, email-link sign-in, local sign-out and Workspace RPCs. It creates exactly one real Supabase client. The SDK still validates credentials, owns persistent sessions and emits all Auth events; the adapter never creates a synthetic session or sign-out event.

The optional import has a ten-second deadline. Failed loads return a fixed SDK-shaped account error. A late import cannot construct a client or start refreshing sessions after timeout. Unsubscribing before or after loading prevents late callbacks. A page reload retries a failed load. The app can render while loading; the existing account recovery/request deadlines and actor guards remain in force.

The configured browser fault test proves Discover and Saved remain usable when the account library fails, while configured Passport and Workspace show errors without substituting a local team or claiming sign-in. The test aborts one local script asset and blocks all synthetic backend requests; it contacts no external project. It runs at root and Pages paths as part of `test:plans:configured`.

The genuine local Auth/PostgREST/PostgreSQL harness also blocks that asset in a separate anonymous consumer context, while reading actual reviewed catalog records, saving them and observing withdrawals. Other contexts still exercise real password/one-time/fragment-only sign-in, private account/social flows and Workspace authorization. The public catalog does not fall back to bundled/private content on failure.

This uses no new application dependency, service, migration, production credential or deployment. SDK failure still makes account features unavailable; it does not create an offline account system. Hosted email, actual phones and the dedicated staging project remain separate requirements. Reproduce with `npm test`, `npm run lint`, `npm run build`, `npm run test:plans:configured`, `npm run test:social:local` and `npm run test:social:local:pages`.
