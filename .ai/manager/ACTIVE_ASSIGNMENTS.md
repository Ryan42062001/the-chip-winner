# Active Assignments

Last updated: 2026-09-19
Machine authority: `.ai/shared/ACTIVE_TASKS.json`

## TCW-031
BLOCKED on TCW-042. Previous deployed target functioned substantially in product-owner use, but UAT acceptance is withheld and TCW-041 found blocking F01.

## TCW-041
VERIFYING_MASTER. Verdict accepted: **FAIL — REMEDIATION REQUIRED**.
F01: ambiguous outgoing ownership must fail closed.
Evidence PR #131 / #615 PASS; integration `efdb129e789e0d3d08080bf865578cfe6de909bd`; master #616 PASS.

## TCW-042
- Owner: Builder
- State: ASSIGNED
- Mode: STANDARD_CHAT_HIGH
- Refresh: BOUNDED_REMEDIATION_REFRESH
- Branch: `builder/tcw-042-trade-ui-audit-remediation`
- Scope: outgoing ownership exclusivity + compact balanced Send/Receive player-input UI.
- Next gate: validated Builder PR/head.

Strategy/R&D remain waiting. Auditor waits for fresh repaired target. Troubleshooting idle.
