# One-time sign-in return — local review

A genuine generated one-time link signed in correctly and the SDK removed its token fragment. Signing out persisted across reload. Opening the same consumed link again reproduced a usability defect: the account was signed out but the page gave no clear link-failure explanation. The original failing local regression is `/tmp/tasteprint-signin-repro.log` in the execution workspace; it contains no credentials or link URLs.

`auth-return-core.js` now recognizes error-bearing returns only on the existing `auth=return` Passport or Workspace routes. Before the optional Auth SDK reads the address, it removes known credential/error parameters and uses a fixed accessible notice. Provider text is never rendered, logged or trusted. Successful implicit and PKCE callbacks remain untouched for the SDK. Normal routes and unrelated fragments/anchors stay unchanged; root and `/tasteprint/` path prefixes are preserved.

A failed Workspace return removes its invitation query capability from the current address, so a still-valid existing account cannot automatically claim it. The notice tells the person to sign in and reopen the original invitation. Successful returns retain the invitation until the existing authorized claim flow consumes and removes it. Account sessions, device Passport and local drafts are not erased by this handling. No invitation is revoked server-side merely because a login failed.

The shared singleton exposes the failed-return flag to the existing account and Workspace cards. These cards display the same fixed notice, including when a current valid session is preserved. No new framework, service, schema, data collection or hosted Auth setting is introduced.

## Genuine local checks

The owned synthetic Auth/PostgREST/PostgreSQL harness now starts its loopback gateway before Auth, configures its exact local return origin and gateway mailer verification paths, and uses Auth's admin-generated links for manually confirmed `@synthetic.invalid` fixtures. It never sends email. Generated capabilities and session credentials remain in memory/temporary private service state and are not printed. Test failures during link navigation use generic messages instead of capability-bearing URLs.

`node scripts/check-local-social-stack.js` exercises the root build; `--pages` exercises a separately built `/tasteprint/` app with its own owned services. Both retain real service requests, actual browser SDK callback handling and separate contexts. No API response is intercepted. Reused links exercise actual one-use rejection. Expired links are tested by aging only the synthetic fixture's `recovery_sent_at` before navigating the generated link, so GoTrue makes the expiry decision without a long sleep.

Checks cover successful sign-in, SDK credential-fragment removal, reload persistence, durable local sign-out, reused/expired fixed notices, preservation of an already valid account, failed team return without silent invitation acceptance, and fresh successful team invitation return. The complete existing social, catalog, preferences, reflection, Workspace/Studio and deletion flow remains part of each run. CI has an independent eight-minute step for the Pages variant.

## Limits

This verifies local Auth/gateway/browser return mechanics, not email delivery, mailbox rendering, link scanners, hosted redirect allowlists, hosted session recovery, actual phones or production. The dedicated isolated staging project is still missing, and only the exact PR #24 hosted scope was approved. Do not copy the test-only loopback wildcard into production settings; hosted return URLs and infrastructure require separate review. Legacy Workspace invitation links still use query capabilities and their privacy/return design remains a separate improvement. No merge or deployment is authorized by these tests.
