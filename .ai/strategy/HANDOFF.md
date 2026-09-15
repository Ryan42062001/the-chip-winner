# In-Season Strategy Handoff

HANDOFF

Task ID: TCW-022
Role: In-Season Strategy & Decision Intelligence Analyst
Status: ASSIGNED

## Assignment

Define the production-ready **Trade Analyzer v1 strategy contract** before any Builder implementation.

Canonical assignment target:
- Manager-approved task: `.ai/manager/tasks/TCW-022.md`
- Assignment master: `3eedb76e4bfd33802c23972720f79a4135e2adf5`
- Expected branch: `strategy/tcw-022-trade-analyzer-policy`
- Execution mode: `STANDARD_CHAT`
- Merge authority: Manager / Architect

## Product direction

The product owner explicitly chose Trade Analyzer as the next feature to pursue, ahead of the previously proposed GM Action Plan sequencing.

The v1 analyzer must evaluate roster consequences rather than output a single opaque trade score. It should cover immediate lineup effect, depth/replaceability, unequal-count package effects, supported future/bye/playoff horizons, source disagreement, uncertainty, known roster constraints, and team-objective framing.

Release 1.0 remains **10 passed / 1 pending** with `FV-SEASON-01` event-gated. Do not fabricate that field evidence and do not let the pending season condition block this independent strategy-design task.

## Exact next action

1. Fast Refresh from canonical `master`.
2. Read Workflow V3.1, ACTIVE_TASKS, `.ai/roles/STRATEGY.md`, `.ai/manager/tasks/TCW-022.md`, this handoff, and only relevant current recommendation/lineup/waiver/season evidence.
3. Produce `.ai/strategy/TCW-022_TRADE_ANALYZER_POLICY.md` with the required decision contract and concrete scenarios.
4. Update this handoff with the result.
5. Open a Strategy PR for Manager review.
6. Stop. Do not implement production code and do not merge the PR.

If a required input cannot be made defensible from approved current sources, return the exact unresolved question as an R&D dependency rather than inventing certainty.
