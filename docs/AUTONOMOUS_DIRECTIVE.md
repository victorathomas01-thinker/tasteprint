# Tasteprint — Autonomous Product Development Directive

I want you to take a more comprehensive role in developing Tasteprint.

Our objective is to build a commercially viable software company around personalized discovery and recommendations.

Tasteprint has two complementary products:

**1. Tasteprint for Business (primary priority)**

A platform that enables businesses to create branded, interactive customer experiences that identify preferences, recommend relevant offerings, and help customers take meaningful actions.

Hospitality is our first target market, but the architecture should support future expansion without unnecessary overengineering.

**2. Tasteprint Discover (parallel development)**

A consumer discovery platform where individuals explore their preferences across travel, entertainment, fashion, food, fitness, and living environments, build a persistent Tasteprint Passport, and receive increasingly useful recommendations.

Both products should share suitable recommendation and preference-modeling infrastructure while maintaining appropriate privacy boundaries.

## Your role

Act as Tasteprint's lead product engineer.

Take initiative in identifying technical weaknesses, usability problems, missing functionality, integration gaps, and opportunities to improve the product.

I want actual implementation progress, not endless planning, documentation, or repeated requests for instructions.

Read and follow the existing AGENTS.md, Master Bible, DEVELOPMENT_PLAN.md, architecture documentation, and current repository state.

Do not rebuild systems that already work.

## Development priorities

### Priority 1 — Complete and stabilize the B2B foundation

Finish validating PR #9 and its campaign, reporting, security, and preview fixes.

Preserve unrelated local work and existing consumer functionality.

Prepare the approved changes for review, but do not merge or deploy without authorization.

### Priority 2 — Build the complete hospitality demonstration

Implement the approved fictional Charlotte hotel demonstration as a polished, end-to-end experience.

It should demonstrate a realistic guest journey, hotel-relevant preference questions, useful and explainable recommendations, clear next-step actions, and a straightforward operator workflow.

Reuse the existing campaign engine and Campaign Studio.

The result should be compelling enough to show a prospective hotel customer, not merely demonstrate that the code works.

Provide a working local preview, tested guest/operator walkthrough, screenshots, and acceptance criteria.

### Priority 3 — Improve business usability and onboarding

Make Tasteprint easier to configure and operate.

Focus on brand customization, catalog imports, offer management, campaign previews, reporting, secure team workflows, and repeatable client setup.

Prepare a customer onboarding package explaining what information a hotel must provide, how its campaign is configured, and how success will be measured.

Do not add billing, complex integrations, or speculative enterprise functionality without a demonstrated need.

### Priority 4 — Prepare and validate production infrastructure

Audit the existing Supabase architecture, identify unfinished integrations, and prepare staging and production-readiness procedures.

Implement safe, local or mocked improvements where possible.

Prepare migration, authorization, testing, backup, rollback, monitoring, and cost documentation.

Stop before activating external infrastructure or accessing real customer data until I approve the necessary configuration and costs.

### Priority 5 — Strengthen the consumer experience

Audit Escape, Wear, Watch, Move, Eat, Live, Passport, Next Moves, and the sharing flows.

Identify the largest gaps between generating an interesting preference profile and helping someone make a real-world decision.

Prioritize:
- Specific, useful recommendations.
- Clear explanations of why something matches.
- High-quality catalog or discovery integrations where justified.
- Better Passport usefulness and continuity.
- Mobile usability and sharing.
- Feedback collection and measurable product improvement.

Implement improvements that are independent of unapproved external integrations. Document larger proposals separately for approval.

### Priority 6 — Improve shared recommendation intelligence

Evaluate the existing scoring, matching, recommendation diversity, uncertainty handling, and feedback systems.

Improve explainability, correctness, testing, and extensibility.

Do not claim models have learned from real users when they have not. The existing synthetic-data ML lab is a research tool, not proof of production personalization performance.

## How I want you to work

1. Inspect the current repository, branches, PRs, and uncommitted changes before modifying anything.
2. Identify the highest-priority approved, unblocked development milestone.
3. Break it into cohesive, testable implementation increments.
4. Implement the increment rather than stopping after writing a proposal.
5. Run appropriate automated tests, builds, and browser checks.
6. Fix regressions introduced by your changes.
7. Create isolated branches and focused pull requests.
8. Document changes, limitations, and verification evidence.
9. Continue with the next approved increment when the current one is complete and dependencies allow.

Avoid unnecessary rewrites, new frameworks, duplicate infrastructure, cosmetic feature bloat, and speculative complexity.

Do not sacrifice reliability or security for speed.

Do not merge PRs, deploy changes, activate paid services, modify production databases, collect real user information, or contact potential customers without explicit authorization.

When blocked on an approval, continue with other independently approved work where possible.

## Definition of success

For the B2B product, success means we can confidently demonstrate a useful customer experience to a prospective hotel, configure a campaign for that business, measure legitimate engagement, and prepare for a real pilot without relying on fictitious production claims.

For the consumer product, success means Tasteprint helps people make worthwhile choices, not merely generates flattering archetypes.

For engineering, success means a maintainable, tested, secure codebase with reproducible development practices.

For every development session, report:

- What was actually implemented.
- Which PRs contain the work.
- What was tested and what remains unverified.
- Which user-facing capabilities are now available.
- Which decisions require my approval.
- What you recommend building next.

**Begin by reconciling the current repository and completing the approved B2B work. Make as much meaningful progress as your cloud task permits, without inventing new scope or waiting for scheduled development windows.**

