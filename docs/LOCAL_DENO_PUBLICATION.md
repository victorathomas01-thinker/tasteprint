# Genuine local Deno publication verification — 2026-10-28

The preceding full server/browser check adapted only Deno.serve/env/TypeScript loading to Node. This follow-up adds a genuine Deno 2.6.0 process, the exact publisher TypeScript source and its actual remote Supabase SDK 2.118.0. It retains the existing Node adapter as independent compatibility coverage rather than replacing it.

The new runner downloads public module dependencies before any synthetic credential is supplied, using a committed frozen Deno lock. At runtime imports are cached-only and frozen; network access is restricted to loopback. Deno binds a randomly assigned 127.0.0.1 port. The existing local gateway forwards only the publication function path into that process; the function's SDK calls the owned Auth/API services through the same loopback gateway. No database/container port becomes public. The child inherits a minimal environment with only generated synthetic credentials and the required runtime paths. No external project, credential, hosted function or service activation is involved.

The same owner browser publishes, edits again and unpublishes. Existing direct-client impersonation, role denial, exact revision/creation stamps, creator attribution, private-social flows and cleanup checks remain in the full genuine-service harness. Both root and Pages modes are available. A committed hash lock covers the publisher's actual runtime remote SDK graph; unrelated Edge functions are outside this lock's scope. Type checking alone is distinguished from actually running the server.

CI obtains the exact Deno 2.6.0 test tool through npm exec without adding an application dependency or changing the Pages deployment workflow. Its module cache contains downloaded code, never credentials. Local reproduction with an installed Deno 2.6.0:

```sh
npm run test:publisher:types
DENO_DIR=/tmp/tasteprint-deno-cache npm run test:social:deno
DENO_DIR=/tmp/tasteprint-deno-cache npm run test:social:deno:pages
```

If Deno is outside PATH, set TASTEPRINT_DENO_EXECUTABLE to its executable. In this cloud environment DENO_TLS_CA_STORE=system,mozilla uses the existing trusted system CA alongside Mozilla roots; certificate verification is not disabled. Docker, Chromium and the already documented owned-service requirements still apply. Runtime module loading fails on a changed/unreviewed graph rather than silently changing the lock.

The first genuine Deno attempt exposed a local proxy transport defect: fetch decoded the compressed function response, but the proxy retained the original content-encoding/length headers, causing a second decompression in the browser. The proxy now requests identity encoding and strips transport encodings/length after decoding. Both initial root/Pages attempts failed and are not counted as passing evidence. The corrected full genuine Deno runs passed at root and Pages. A separate real-gzip HTTP regression now verifies automatic decoding, preserved status/privacy headers and correct downstream framing. One intervening attempt timed out on an owned Docker command before API checks; its cause was not established and it is not counted as application verification. Full unit tests, syntax (194 JavaScript files), production build and frozen Deno type checking also passed. The standard 20-suite default browser matrix was green on the unchanged application build in the parent publication review. Even genuine local Deno does not verify Supabase's hosted gateway, deployed runtime version/quotas/secrets, SMTP, physical phones or real-user outcomes. The dedicated isolated staging project and expanded approval for newer SQL/functions remain external requirements. No hosted migration, deployment, paid infrastructure or real personal data.

## CI process cleanup correction — 2026-10-29

The first GitHub Deno service step completed every functional assertion in under a minute but then hit its eight-minute limit during cleanup. Unlike the local direct-binary invocation, CI resolved npm's wrapper command; terminating that wrapper did not own its serving grandchild. The helper now asks the reviewed runtime for Deno.execPath() and spawns that actual binary. Shutdown has explicit TERM/KILL deadlines. A focused lifecycle regression runs through npm exec, confirms a genuine response, closes the runtime and verifies its listening endpoint is gone. That regression passed locally. Full wrapper-path service and CI results are tracked separately; the original timed-out CI is not a success.
