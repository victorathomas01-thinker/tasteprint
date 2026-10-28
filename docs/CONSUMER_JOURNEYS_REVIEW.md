# Six consumer journeys and campaign precedence — 2026-10-28

The production browser audit completes Escape, Wear, Watch, Move, Eat and Live using their actual controls. Start and single choices use the keyboard; Escape multi-choice uses its real selection/continue flow. Each next question must show the expected progress before another answer is sent. Every result fits mobile and desktop widths and records its own module in the same browser's Passport. The final Passport retains all six module results.

The audit reproduced a campaign defect: Wear/Watch/Move/Eat/Live activated whenever their module parameter existed, even when a missing or published-only-unavailable campaign owned the link. Their later render replaced the explicit campaign error with an unrelated quiz home. The five activation conditions now defer to campaign identity. Browser regressions cover each module combined with missing IDs, published-only unavailable IDs and a valid Aster guest entry. Existing campaign selection/draft/report regressions remain in the full unit suite.

The new `consumer-journeys` suite runs in default root and Pages browser checks. Synthetic choices only; no account, server session or real preference collection. Focused root/Pages journeys, full unit tests, JavaScript syntax (190 files) and production build passed. This is Chromium/keyboard/viewport evidence, not physical iOS/Android, assistive-technology certification or real-user usefulness evidence.

Only conflicting legacy module activation is addressed here. Other arbitrary combinations of historical route parameters still need broader canonical-route audit. Published backend activation and actual Edge publication remain separate requirements.
