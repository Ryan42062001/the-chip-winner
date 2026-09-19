# Active Assignments

Last updated: 2026-09-19
Machine authority: `.ai/shared/ACTIVE_TASKS.json`
Workflow overlay: `.ai/shared/WORKFLOW_V3_2.md`

## Active lanes

### TCW-031 — Trade Analyzer Functional Reset + UAT Contract
- Product target: `79b41042b9f556aa4f1368603bcda81df796a6fa`
- Source PR: #129
- State: WAITING_EXTERNAL_EVIDENCE
- User action required: true
- Master #611: test/deploy/production verification PASS
- Current gate: genuine deployed connected-ESPN product-owner UAT with explicit ACCEPT/REJECT
- Independent audit remains separately required under TCW-041

### TCW-041 — Trade Analyzer Functional Reset Independent Audit
- Owner: Independent Auditor / QA
- State: ASSIGNED
- Execution: STANDARD_CHAT_HIGH
- Refresh: FAST_REFRESH
- Exact frozen target: `79b41042b9f556aa4f1368603bcda81df796a6fa`
- Source PR: #129
- Expected branch: `auditor/tcw-041-trade-analyzer-functional-reset-audit`
- Current gate: fresh independent verdict on evidence-only PR

## Planned follow-on lanes
TCW-032/033 and later V2 work remain waiting until Manager resolves the TCW-031 baseline acceptance gates.

## Release 1.0 field state
Field registry remains **10 passed / 1 pending**.
Pending: `FV-SEASON-01 — Real playoff and bye intelligence states`.
Do not manufacture it.

## Role state
- Manager — USER ACTION coordination / audit review.
- Builder — WAIT.
- Strategy — WAIT.
- R&D — WAIT.
- Auditor — ACTIVATE NOW on TCW-041.
- Troubleshooting — IDLE/on-demand.
