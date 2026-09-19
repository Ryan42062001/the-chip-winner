# Active Assignments

Last updated: 2026-09-18
Machine authority: `.ai/shared/ACTIVE_TASKS.json`
Newest workflow overlay: `.ai/shared/WORKFLOW_V3_2.md`

## Active lanes

### TCW-025 — Trade Analyzer Audit Remediation
- Owner: Implementation Engineer / Builder
- State: AUDIT_READY
- Builder PR: #113
- Final Builder head: `368a601046df1d4de2f477936f4ac5598e5de753`
- Integrated/deployed master: `7bb690429ad5b829e36e5d464ae9d7e74cc77ce0`
- Master workflow #571: full CI + Pages deployment + production smoke PASS
- Next gate: fresh Independent Auditor retest of TCW-024-F01 through F04.
- Level-4 private ESPN behavior remains unmanufactured/unclaimed.

### TCW-026 — Workflow V3.2 Cross-Project Parity Upgrade
- Owner: Manager / Architect
- State: IN_PROGRESS
- Branch: `manager/tcw-026-workflow-v32-parity-upgrade`
- Base: `7bb690429ad5b829e36e5d464ae9d7e74cc77ce0`
- Execution: STANDARD_CHAT_HIGH
- Refresh: FULL_REFRESH — explicit cross-project workflow reconciliation requested by product owner
- Next gate: exact-head full CI -> Manager merge/master verification -> fresh independent workflow/control-plane audit.

## Release 1.0 field state

Field registry remains **10 passed / 1 pending**.

Pending:
- `FV-SEASON-01 — Real playoff and bye intelligence states`

This remains genuine-season-event gated and is not a user-action queue item merely because it is waiting for nature/season state.

## Role state
- Manager / Architect — ACTIVE on TCW-026 and owns TCW-025 retest routing.
- Builder — WAIT; TCW-025 implementation is integrated.
- Strategy — IDLE.
- R&D — IDLE.
- Independent Auditor — WAIT for Manager-created exact-target retest/audit assignments.
- Troubleshooting — IDLE / on-demand.
