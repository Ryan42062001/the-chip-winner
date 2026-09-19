# Integration Queue

Manager-owned queue. Repository/PR state remains authoritative.

## READY / PENDING

### TCW-041 — independent audit evidence
- Target: TCW-031 exact deployed SHA `79b41042b9f556aa4f1368603bcda81df796a6fa`
- Source PR: #129
- State: Auditor assignment ready; no audit evidence PR yet
- Merge authority: Manager only
- Gate: independent verdict + exact-head audit CI

### TCW-031 — closeout blocked on non-integration gates
- Integration: COMPLETE at `79b41042b9f556aa4f1368603bcda81df796a6fa`
- Master #611: test/deploy/production verification PASS
- Pending: TCW-041 accepted independent audit verdict
- Pending: genuine deployed product-owner UAT ACCEPT
- Do not close from CI/deployment alone.

## CLOSED / CONSUMED

### TCW-031 Builder implementation integration
- Source PR #129 final head `350eea0d45fb7eb54df6082c169a0440366210f4`
- FULL PR #609 PASS
- final exact-head #610 PASS
- integration `79b41042b9f556aa4f1368603bcda81df796a6fa`
- master #611 PASS including deploy + production smoke

### Historical Trade Analyzer remediation / re-audit chain
TCW-025/030 remain closed for their bounded F01-F04 scope.

### Workflow V3.2 chain
TCW-026/027/028/029 remain closed.

## Ordering
Audit evidence and real deployed UAT may proceed in parallel against the same frozen product target.
TCW-032/033 remain held until Manager resolves baseline acceptance.
