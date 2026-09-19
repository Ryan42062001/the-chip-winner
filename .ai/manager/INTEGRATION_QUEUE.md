# Integration Queue

Manager-owned queue. Repository/PR state remains authoritative.

## READY / PENDING

### TCW-025 — Trade Analyzer Audit Remediation
- Builder PR: #113
- Builder exact head: 368a601046df1d4de2f477936f4ac5598e5de753
- Integrated production master: 7bb690429ad5b829e36e5d464ae9d7e74cc77ce0
- Master workflow #571: full test/deploy/production verification PASS
- Advancement through 7c95cdaa9c3e172a7f7d1e09f996b731c78862d7: CONTROL_PLANE_ONLY
- Current gate: fresh independent TCW-024-F01 through F04 retest.

### TCW-026 — Workflow V3.2 Parity Upgrade
- Source PR: #114
- Final exact head: 4a511c99f3726bd9c39be0ec9080320072e64661
- Integrated workflow target: 4e737f5f0b4cc5f3825f5c12ec4e5dccaf65c4f4
- TCW-027 audit PR #116: evidence integrated at 7c95cdaa9c3e172a7f7d1e09f996b731c78862d7
- TCW-027 Manager finding disposition: F01/F02/F03 ACCEPTED
- Current gate: TCW-028 remediation and fresh independent re-audit
- TCW-026 remains BLOCKED.

### TCW-028 — Workflow V3.2 Audit Remediation
- Assigned Builder branch: builder/tcw-028-workflow-v32-audit-remediation
- Scope: accepted TCW-027-F01/F02/F03 only
- Required before integration: focused deterministic tests, full diff inspection, exact-head FULL CI
- Required after integration: master FULL CI and fresh bounded Independent Auditor re-audit.

## Verification note
Audit evidence integration master run #582 failed the workflow-state gate because TCW-025 became four commits stale relative to its assignment checkpoint. The failure is not waived; this Manager reconciliation explicitly classifies advancement from deployed TCW-025 target 7bb69042... through 7c95cdaa9c3e172a7f7d1e09f996b731c78862d7 as CONTROL_PLANE_ONLY after confirming no src/** or config/** product change.

## Ordering
TCW-025 product audit and TCW-028 workflow remediation are separate lanes. Do not let control-plane work erase the TCW-025 retest. The fresh Workflow V3.2 re-audit starts only after TCW-028 is integrated and frozen.
