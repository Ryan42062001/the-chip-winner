# Active Assignments

Last updated: 2026-09-18
Machine authority: .ai/shared/ACTIVE_TASKS.json
Workflow overlay: .ai/shared/WORKFLOW_V3_2.md

## Active lanes

### TCW-025 — Trade Analyzer Audit Remediation
- Owner: Implementation Engineer / Builder
- State: AUDIT_READY
- Integrated/deployed master: 7bb690429ad5b829e36e5d464ae9d7e74cc77ce0
- Master workflow #571: full CI + Pages + production smoke PASS
- Advancement through 7c95cdaa9c3e172a7f7d1e09f996b731c78862d7: CONTROL_PLANE_ONLY; no src/** or config/** product change
- Next gate: fresh independent TCW-024-F01 through F04 remediation retest.

### TCW-026 — Workflow V3.2 Cross-Project Parity Upgrade
- Owner: Manager / Architect
- State: BLOCKED
- Blocker: AUDIT
- Integrated workflow target: 4e737f5f0b4cc5f3825f5c12ec4e5dccaf65c4f4
- TCW-027 verdict: FAIL — REMEDIATION REQUIRED
- Manager disposition: F01 ACCEPTED HIGH, F02 ACCEPTED MEDIUM, F03 ACCEPTED LOW
- Next gate: TCW-028 bounded remediation, Manager integration/master verification, then fresh independent bounded re-audit.

### TCW-027 — Workflow V3.2 Independent Control-Plane Audit
- Owner: Independent Auditor / QA
- State: VERIFYING_MASTER
- Auditor PR #116 exact head: 49f65e05aaf65d463d3b562c1c4d223866b72da4
- Exact-head workflow #581 / 35419296373: PASS
- Integrated evidence master: 7c95cdaa9c3e172a7f7d1e09f996b731c78862d7
- Master workflow #582: FAIL solely because TCW-025 crossed the four-commit assignment-staleness threshold
- Current action: Manager reconciliation records TCW-025 CONTROL_PLANE_ONLY advancement and routes TCW-028.

### TCW-028 — Workflow V3.2 Audit Remediation
- Owner: Implementation Engineer / Builder
- State: ASSIGNED
- Execution: STANDARD_CHAT_HIGH
- Refresh: BOUNDED_REMEDIATION_REFRESH
- Branch: builder/tcw-028-workflow-v32-audit-remediation
- Scope: accepted TCW-027-F01/F02/F03 only
- Required gate: focused adversarial tests + exact-head FULL CI -> Manager review/integration -> master FULL CI -> fresh bounded independent re-audit.

## Release 1.0 field state
Field registry remains 10 passed / 1 pending.
Pending: FV-SEASON-01 — Real playoff and bye intelligence states.
It remains genuine-season-event gated and must not be simulated or manufactured.

## Role state
- Manager / Architect — ACTIVE on canonical reconciliation/routing; then review TCW-028.
- Builder — ACTIVATE NOW on TCW-028 after routing master is verified.
- Strategy — IDLE.
- R&D — IDLE.
- Independent Auditor — WAIT for a frozen repaired Workflow V3.2 target; TCW-025 product re-audit remains separately pending.
- Troubleshooting — IDLE / on-demand.
