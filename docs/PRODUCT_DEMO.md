# TasteSocial product demo

The current priority is a usable, demonstrable development build. Public-launch certification is not a prerequisite for showing this walkthrough. Production, external activation, real social data and merge restrictions still apply.

## Open the demo

1. In this development checkout, run `npm ci` and `npm run demo`.
2. Open the terminal's **DEMO GUIDE** address, normally `http://127.0.0.1:4193/tasteprint/demo.html`, in a new private browser window.
3. Follow the four steps: Passport interests → Discover/Saved → sample friend → simulated plan agreement. Return with **More → Demo guide**.

The preview binds only to this computer's loopback interface. The URL is not a public website or an iPhone-accessible hosted link. A separately accessible preview would need its own hosting/access arrangement; this change does not deploy one. Stop with Ctrl+C. The runner clears backend build configuration, uses temporary output and removes that output on exit.

## What an observer can try

- Select Animation and Fantasy without a quiz and save those interests.
- Discover the specific short film Spring, inspect its source/explanation and save it.
- See shared interests with an explicitly invented sample friend and propose a film.
- Express both simulated interests, enter invented date/place details and simulate both approvals.
- Edit material details and observe approvals reset.
- Explore the original six modules, fictional company/hotel, sample Workspace and Studio through the guide's additional links.

The guide uses ordinary application links and no scripts, analytics or storage operations. It never initializes synthetic preferences over an existing Passport. Actual app saves still change that browser's interests, so use a private window for repeatable demonstrations. Keep real account data and personal details out of the walkthrough. Source links are optional external navigation; the tested walkthrough does not open them.

## Honest scope

This default demo does not require a Supabase project or credentials. Films are real reference titles with editorial tags, not a maintained live catalog. Charlotte venues remain separate source-review work. Company ownership is unverified and the company/hotel examples are fictional. Friend actions are visibly simulated. The plan lives in page memory and disappears on reload; a scheduled simulation is not another person's consent, a booking or attendance. Genuine separate-account persistence has separate local-service tests and requires connected configuration; it is not claimed by this demo.

## Validation

`scripts/check-demo-browser.js`, included in the default production-preview matrix, follows the guide using real UI controls at 375px and 1280px. It checks saved-item persistence, common ground, scheduled simulation, reapproval after edits, the navigation return and fictional company link. It also asserts that the guide preserves existing storage, no page errors occur and the walkthrough makes no external requests. Both `/` and `/tasteprint/` output paths are required.

Full unit, syntax, production-build and browser-matrix results are recorded with the PR. These checks establish a demonstrable local build, not launch readiness or evidence of real-user value. Manual screen-reader and physical-device checks remain outside the automated browser evidence.
