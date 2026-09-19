# Active Assignments

Last updated: 2026-09-19
Machine authority: `.ai/shared/ACTIVE_TASKS.json`
Workflow overlay: `.ai/shared/WORKFLOW_V3_2.md`

## Active lanes

### TCW-031 — Trade Analyzer Functional Reset + UAT Contract
- Owner: Implementation Engineer / Builder
- State: ASSIGNED
- Execution: STANDARD_CHAT_HIGH
- Refresh: FAST_REFRESH
- Assignment master: `3eee60a38e464dd3406f7a67f287c3d63a5f6a74`
- Expected branch: `builder/tcw-031-trade-analyzer-functional-reset`
- Priority: highest current product lane
- Known baseline defect: incoming trade choices are not bound to one explicit opposing roster; free-agent/unrostered and mixed-opponent pseudo-trades are not structurally excluded.
- Next gate: Builder final candidate PR/head + exact-head CI.
- Product closeout additionally requires Manager integration/master verification, fresh independent audit, and real deployed product-owner UAT.

## Planned follow-on lanes
- TCW-032 — Trade Value + Team Needs Strategy Contract
- TCW-033 — Trade Intelligence Data + ESPN Offer Research
- TCW-034 through TCW-040 per canonical roadmap

Do not activate them merely to keep roles busy.

## Release 1.0 field state
Field registry remains **10 passed / 1 pending**.
Pending: `FV-SEASON-01 — Real playoff and bye intelligence states`.
It remains genuine-season-event gated and must not be simulated or manufactured.

## Role state
- Manager / Architect — WAIT for TCW-031 Builder result.
- Builder — ACTIVATE NOW on TCW-031.
- Strategy — WAIT.
- R&D — WAIT.
- Independent Auditor — WAIT.
- Troubleshooting — IDLE / on-demand.
