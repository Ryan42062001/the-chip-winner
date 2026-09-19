# Builder Handoff

STATUS: TCW-031 ASSIGNED — READY TO START
TASK: TCW-031 — Trade Analyzer Functional Reset + UAT Contract
ROLE: Implementation Engineer / Builder
EXECUTION: STANDARD_CHAT_HIGH
REFRESH: FAST_REFRESH
ASSIGNMENT MASTER: `3eee60a38e464dd3406f7a67f287c3d63a5f6a74`
EXPECTED BRANCH: `builder/tcw-031-trade-analyzer-functional-reset`

## Manager-accepted baseline defect

Current Trade Analyzer UI does not model a real counterparty:
- incoming choices are every snapshot player not on the user's roster;
- no opposing team is selected;
- domain validation accepts any snapshot player not on the user's roster;
- free-agent/unrostered and mixed-opponent pseudo-trades can therefore pass proposal shape validation.

Treat this as an accepted TCW-031 baseline defect, not as a request to redesign V2 valuation policy.

## First actions

1. Fast Refresh current master and machine state.
2. Read `.ai/manager/tasks/TCW-031.md`.
3. Reproduce the existing Trade Analyzer workflow before changing it.
4. Confirm the counterparty/ownership defect and look for any other directly blocking baseline flow defect.
5. Implement only the TCW-031 functional-reset scope.
6. Add deterministic UI/domain/browser regressions.
7. Run focused and full validation.
8. Open one Builder PR, verify exact final head CI, update this handoff, and stop without merging.

## Preserve

- ESPN read-only boundary;
- TCW-025/030 repaired behaviors;
- source separation and missing-data honesty;
- lock semantics;
- roster legality/follow-up-drop behavior;
- FLEX/OP support;
- field registry and `FV-SEASON-01`.

## Do not implement yet

No winner score, team-needs model, suggested trades, target explorer, shop-my-players, incoming-offer ingestion, counteroffers, negotiation engine, new external data source, or ESPN write action.

## Completion boundary

Builder may declare implementation ready for Manager review, but may **not** declare TCW-031 product-complete.

Real deployed connected-league UAT is mandatory later and must be recorded by Manager/product owner.

## Next Activation

| Order | Employee / Role | Status | Current Task / Gate | Copy/paste activation prompt / next action |
| ---: | --- | --- | --- | --- |
| 1 | Manager / Architect | WAIT | Await TCW-031 Builder candidate | Review exact Builder PR/head/CI before integration. |
| 2 | Implementation Engineer / Builder | ACTIVATE NOW | TCW-031 | Execute the assigned functional reset on the prepared branch and return a validated candidate without merging. |
| 3 | In-Season Strategy & Decision Intelligence Analyst | WAIT | TCW-032 not routed | No action. |
| 4 | Research & Development (R&D) | WAIT | TCW-033 not routed | No action. |
| 5 | Independent Auditor / QA | WAIT | No frozen TCW-031 target yet | No action until Manager routes a fresh audit. |
| 6 | Troubleshooting & Root Cause Engineer — on-demand | IDLE | No convergence failure | Activate only on Manager routing after a genuine cross-layer stall. |
