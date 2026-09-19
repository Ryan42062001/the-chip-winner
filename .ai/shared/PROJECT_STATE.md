# The Chip Winner — Canonical Project State

Last reconciled: 2026-09-19
Operating state: Workflow V3.2 closed + Trade Analyzer remediation deployed / independent retest pending + Release 1.0 season gate waiting

## Repository / workflow
- Repository: `Ryan42062001/the-chip-winner`
- Default branch: `master`
- Final effective repaired Workflow V3.2 implementation target: `216b9e9030c3dc84d9e2af2b3120d1c8dbb3bee9`
- Active machine state: `.ai/shared/ACTIVE_TASKS.json`
- Field authority: `config/field-validation.json`

The Workflow V3.2 chain is closed. TCW-026/027/028/029 are no longer active.

## Workflow V3.2 closeout evidence
- TCW-026 source PR #114; original integrated target `4e737f5f0b4cc5f3825f5c12ec4e5dccaf65c4f4`; original master #577 PASS full CI + Pages + production smoke.
- TCW-027 independent audit found F01/F02/F03; Manager accepted all three and routed TCW-028.
- TCW-028 repaired target `216b9e9030c3dc84d9e2af2b3120d1c8dbb3bee9`; exact-head #585 PASS; master #586 PASS full CI + Pages + production smoke.
- TCW-029 PR #120 exact Auditor head `4ffcab91922e2e4d371458936adcfac782cd7cdc`; exact-head #589 PASS; verdict PASS WITH NON-BLOCKING FINDINGS.
- Manager independently accepted TCW-029-F01 as LOW/non-blocking. It is a human-facing Markdown-status lint bypass only; machine state and Manager merge/closeout authority remain protected.
- Audit evidence integrated at `4251cae86116522855246a3f6517070ab62de7de`; master #590 PASS FULL.
- VERIFYING_MASTER closeout evidence checkpoint `2556d56b3ec9ee62b72dc5e7201d5f7a3826baa4`; master #592 PASS FULL.
- TCW-026, TCW-028, and TCW-029 were then eligible for active-only removal.

V3.2 includes credit-efficient execution/refresh routing, active-only state determinism, blocker/user-action metadata, collision safety, Manager integration/audit tooling, transition/user-action helpers, integration/CI-debt queues, six-role routing visibility, and fail-closed docs-only CI with durable evidence.

## Product boundary
The Chip Winner remains an ESPN-only, read-only, in-season fantasy-football decision companion. ESPN owns connected-league state. External rankings/projections remain separate overlays. Derived recommendations do not mutate source snapshots. ESPN write actions remain out of scope.

## Trade Analyzer v1
TCW-025 remediation is integrated/deployed at `7bb690429ad5b829e36e5d464ae9d7e74cc77ce0`; master #571 passed full CI/Pages/production. It remains `AUDIT_READY` for a separate fresh F01-F04 retest. The Workflow V3.2 closeout does not satisfy or modify that gate.

## Release 1.0
Field registry remains **10 passed / 1 pending**.

Sole pending item:
- `FV-SEASON-01 — Real playoff and bye intelligence states`

It requires genuine qualifying season state and must not be manufactured.

Removed from Release 1.0 rather than falsely passed:
- FV-A11Y-02 under TCW-D012
- custom FLEX/OP/Superflex field certification under TCW-D013
