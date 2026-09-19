# Integration Queue

Manager-owned queue. Repository/PR state remains authoritative.

## READY / PENDING

### TCW-025 — Trade Analyzer Audit Remediation
- Integrated production master: `7bb690429ad5b829e36e5d464ae9d7e74cc77ce0`
- Master workflow #571: full test/deploy/production verification PASS
- Advancement through `216b9e9030c3dc84d9e2af2b3120d1c8dbb3bee9`: CONTROL_PLANE_ONLY
- Current gate: fresh independent TCW-024-F01 through F04 retest.

### TCW-026 — Workflow V3.2 Parity Upgrade
- Original integrated target: `4e737f5f0b4cc5f3825f5c12ec4e5dccaf65c4f4`
- Original audit TCW-027: FAIL — F01/F02/F03 accepted
- TCW-028 remediation integrated and master-verified
- Current gate: TCW-029 fresh independent bounded re-audit
- TCW-026 remains BLOCKED.

### TCW-028 — Workflow V3.2 Audit Remediation
- Builder PR #118
- Final Builder head: `863531f8b6093e9df05c8b3b5f7dc11bd5bf15fe`
- Exact-head FULL workflow #585 / `35420670933`: PASS
- Integrated master: `216b9e9030c3dc84d9e2af2b3120d1c8dbb3bee9`
- Master FULL workflow #586 / `35421054690`: PASS
- Pages deployment: PASS
- Production smoke: PASS
- Manager implementation verdict: ACCEPTED
- Current gate: TCW-029 independent re-audit.

### TCW-029 — Workflow V3.2 Remediation Independent Re-Audit
- Frozen target: `216b9e9030c3dc84d9e2af2b3120d1c8dbb3bee9`
- Target PR: #118
- Assigned branch: `auditor/tcw-029-workflow-v32-remediation-reaudit`
- Required output: fresh independent PASS / PASS WITH NON-BLOCKING FINDINGS / FAIL — REMEDIATION REQUIRED
- Manager will not close TCW-028 or TCW-026 before consuming this verdict.

## Ordering
TCW-025 product audit remains separate from the TCW-029 workflow re-audit. TCW-029 must not modify product/field state or silently satisfy TCW-025.
