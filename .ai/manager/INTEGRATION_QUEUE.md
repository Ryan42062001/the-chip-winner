# Integration Queue

Manager-owned queue. Repository/PR state remains authoritative.

## READY / PENDING

### TCW-025 — Trade Analyzer Audit Remediation
- Builder PR: #113
- Builder exact head: `368a601046df1d4de2f477936f4ac5598e5de753`
- Integrated production master: `7bb690429ad5b829e36e5d464ae9d7e74cc77ce0`
- Master workflow: #571 — full test/deploy/production verification PASS
- Current gate: independent F01-F04 retest still required before the remediation lane is finally closed.

### TCW-026 — Workflow V3.2 Parity Upgrade
- Owner: Manager / Architect
- Branch: `manager/tcw-026-workflow-v32-parity-upgrade`
- Base: `7bb690429ad5b829e36e5d464ae9d7e74cc77ce0`
- Current gate: exact-head CI -> Manager integration -> master verification -> fresh independent workflow/control-plane audit.

## Ordering
TCW-025 production remediation was integrated first to avoid making the already-green production PR stale. TCW-026 is intentionally control-plane/CI tooling only and does not alter Trade Analyzer product semantics.
