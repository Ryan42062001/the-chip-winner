# Integration Queue

Manager-owned queue. Repository/PR state remains authoritative.

## READY / PENDING

### TCW-025 — Trade Analyzer Audit Remediation
- Integrated production master: `7bb690429ad5b829e36e5d464ae9d7e74cc77ce0`
- Master workflow #571: full test/deploy/production verification PASS
- Advancement through routing base `b7a87447ae14cf80cf3b6c4b30c60c1afdcc8f0f`: CONTROL_PLANE_ONLY
- Current gate: TCW-030 fresh independent TCW-024-F01 through F04 retest.
- TCW-025 remains BLOCKED on audit and is not CLOSED before Manager consumes that verdict.

### TCW-030 — Trade Analyzer Remediation Independent Re-Audit
- Frozen target: `7bb690429ad5b829e36e5d464ae9d7e74cc77ce0`
- Target task: TCW-025
- Target PR: #113
- Exact Builder head: `368a601046df1d4de2f477936f4ac5598e5de753`
- Expected branch: `auditor/tcw-030-trade-analyzer-remediation-retest`
- Required output: fresh independent PASS / PASS WITH NON-BLOCKING FINDINGS / FAIL — REMEDIATION REQUIRED
- Manager will not close TCW-025 before consuming the verdict.

## CLOSED / CONSUMED

### Workflow V3.2 chain
TCW-026/027/028/029 remain closed. Their control-plane changes do not satisfy or alter the separate TCW-025 product audit.

## Ordering
TCW-030 is the immediate product-quality gate. `FV-SEASON-01` remains a separate real-season field gate and must not be manufactured.
