# Active Assignments

Last updated: 2026-09-19
Machine authority: `.ai/shared/ACTIVE_TASKS.json`
Workflow overlay: `.ai/shared/WORKFLOW_V3_2.md`

## Active lanes

### TCW-025 — Trade Analyzer Audit Remediation
- Owner: Implementation Engineer / Builder
- State: AUDIT_READY
- Integrated/deployed master: `7bb690429ad5b829e36e5d464ae9d7e74cc77ce0`
- Master workflow #571: full CI + Pages + production smoke PASS
- Advancement through `216b9e9030c3dc84d9e2af2b3120d1c8dbb3bee9`: CONTROL_PLANE_ONLY; no `src/**` or `config/**` product change
- Next gate: fresh independent TCW-024-F01 through F04 remediation retest.

### TCW-026 — Workflow V3.2 Cross-Project Parity Upgrade
- Owner: Manager / Architect
- State: BLOCKED
- Blocker: AUDIT
- Original integrated workflow target: `4e737f5f0b4cc5f3825f5c12ec4e5dccaf65c4f4`
- TCW-027 findings F01/F02/F03 were accepted and remediated by TCW-028.
- Current gate: TCW-029 fresh independent bounded re-audit of the repaired integrated target.

### TCW-028 — Workflow V3.2 Audit Remediation
- Owner: Implementation Engineer / Builder
- State: BLOCKED on AUDIT
- PR #118 final head: `863531f8b6093e9df05c8b3b5f7dc11bd5bf15fe`
- Exact-head FULL run #585 / `35420670933`: PASS
- Integrated master: `216b9e9030c3dc84d9e2af2b3120d1c8dbb3bee9`
- Master FULL run #586 / `35421054690`: PASS including Pages deployment + production smoke
- Current gate: TCW-029 fresh independent bounded re-audit.

### TCW-029 — Workflow V3.2 Remediation Independent Re-Audit
- Owner: Independent Auditor / QA
- State: ASSIGNED
- Execution: STANDARD_CHAT_HIGH
- Refresh: FAST_REFRESH
- Frozen target: `216b9e9030c3dc84d9e2af2b3120d1c8dbb3bee9`
- Target PR: #118
- Branch: `auditor/tcw-029-workflow-v32-remediation-reaudit`
- Scope: accepted TCW-027-F01/F02/F03 remediation only.

## Closed during this routing
- TCW-027 — original independent Workflow V3.2 control-plane audit. Its FAIL verdict was consumed, findings were accepted/routed, and post-evidence canonical reconciliation passed in master run #584.

## Release 1.0 field state
Field registry remains **10 passed / 1 pending**.
Pending: `FV-SEASON-01 — Real playoff and bye intelligence states`.
It remains genuine-season-event gated and must not be simulated or manufactured.

## Role state
- Manager / Architect — WAIT for TCW-029 verdict after routing master verification.
- Builder — WAIT; TCW-028 remediation integrated.
- Strategy — IDLE.
- R&D — IDLE.
- Independent Auditor — ACTIVATE NOW on TCW-029 after routing master verification.
- Troubleshooting — IDLE / on-demand.
