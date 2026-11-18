# Incremental TypeScript adoption

The Passport merge and remote-row boundary is implemented in `account-core.ts`. It exports typed snapshots, account-scoped rows, and sync summaries. Untrusted history and remote-row inputs remain `unknown` until runtime sanitation; TypeScript does not replace those checks. Malformed non-record remote rows are ignored before conversion.

Run `npm run typecheck` to check the migrated module in strict mode and the positive/negative contract fixtures in `tests/types`. `npm test` retains the existing runtime checks, including stable identity, merge/round-trip behavior, and privacy exclusions. `npm run build` checks the Vite browser bundle. Both pull-request CI and deployment builds run the compiler gate.

The UI and other legacy modules remain JavaScript. `allowJs` keeps those dependencies usable while migration is incremental; `checkJs` is off, so the gate does not claim whole-application type coverage. Further modules can be migrated as they change. Node.js 22.6+ is needed for the account test's explicit `--experimental-strip-types` flag; CI uses the current Node 22 release. Vite strips TypeScript from production output.

## Existing tooling advisory

On November 18, 2026, npm audit reports four high-severity entries from a single `picomatch` advisory through Vite's development-tool dependency graph. [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) lists no patched version. A compatible `npm update picomatch` does not resolve it. This change does not force npm's suggested Vite major-version downgrade. The deployed application is a static browser bundle; this advisory concerns processing attacker-supplied glob patterns in the Node tooling. Recheck the upstream patch before accepting untrusted glob input in development/build tooling.
