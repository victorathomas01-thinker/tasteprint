# Tasteprint release handoff

## Candidate walkthrough

Install the candidate with `npm ci`, then run `npm run dev`. Follow [DEMO.md](DEMO.md) for the consumer and advanced routes. Configure the ignored local environment file only when demonstrating staging sync.

## Completed evidence

- Consumer regression checks, desktop/mobile browser checks, and database policy checks passed during development.
- The owner reported magic-link sign-in in Edge, saved Escape, and recovery in a fresh InPrivate session on November 17, 2026.
- The local application loaded hosted staging aggregates.
- Advanced-route loading reduced requested entry-route JavaScript from 594 kB to 564 kB in local mobile Chromium.
- Distribution simulations now report a repeatable seed and sample multi-select answers without replacement.

## Production delivery

1. Review the candidate PR and record the current deployed revision.
2. Configure a production Supabase project using [SUPABASE_SETUP.md](SUPABASE_SETUP.md). Use the target project's public URL and publishable key as repository variables.
3. Add the deployed site and its authentication callback URLs to the production Auth allowlist.
4. Merge the reviewed change, then inspect the Pages deployment and open the public quiz and Passport.
5. Rehearse the workflow's local-only deployment option and record the run URL and result before enabling the normal backend build again.

The staging project has only the consumer analytics, referral, and Passport setup applied through the prepared SQL bundle. Campaign Workspaces and Edge Functions need their documented setup before they are demonstrated as hosted services.

## Release record

| Item | Record |
| --- | --- |
| Merged revision | Pending |
| Production project configured | Pending |
| Pages deployment | Pending |
| Public quiz and account sync | Pending |
| Local-only rollback run and recovery | Pending |

Use the existing two-minute walkthrough as the presentation after the production checks are recorded.
