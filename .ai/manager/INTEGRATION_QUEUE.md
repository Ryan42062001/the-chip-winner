# Integration Queue

Manager-owned queue. Repository/PR state remains authoritative.

## READY / PENDING

### TCW-031 — Trade Analyzer Functional Reset + UAT Contract
- State: ASSIGNED / implementation not yet ready
- Owner: Builder
- Expected branch: `builder/tcw-031-trade-analyzer-functional-reset`
- Integration candidate: NONE yet
- Current gate: Builder reproduction, implementation, focused/full validation, final PR/head, exact-head CI, and handoff.
- Merge authority: Manager only.
- Post-merge full verification required because product behavior changes.
- Fresh independent audit required after integration.
- Real deployed product-owner UAT required before task/product closure.

## CLOSED / CONSUMED

### Historical Trade Analyzer remediation / re-audit chain
TCW-025 and TCW-030 remain closed for their bounded F01-F04 scope. They do not establish TCW-031 product acceptance.

### Workflow V3.2 chain
TCW-026/027/028/029 remain closed.

## Ordering
TCW-031 is the immediate product-quality lane.
TCW-032/033 are not active yet.
`FV-SEASON-01` remains a separate real-season field gate and must not be manufactured.
