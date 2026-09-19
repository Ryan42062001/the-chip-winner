# Active Assignments

Last updated: 2026-09-19
Machine authority: `.ai/shared/ACTIVE_TASKS.json`
Workflow overlay: `.ai/shared/WORKFLOW_V3_2.md`

## Active lanes

### TCW-025 — Trade Analyzer Audit Remediation
- Owner: Implementation Engineer / Builder
- State: BLOCKED
- Blocker: AUDIT
- Integrated/deployed remediation: `7bb690429ad5b829e36e5d464ae9d7e74cc77ce0`
- Master workflow #571: full CI + Pages + production smoke PASS
- Advancement through routing base `b7a87447ae14cf80cf3b6c4b30c60c1afdcc8f0f`: CONTROL_PLANE_ONLY; no `src/**` or `config/**` product change
- Blocked on: TCW-030 fresh independent F01-F04 remediation re-audit.

### TCW-030 — Trade Analyzer Remediation Independent Re-Audit
- Owner: Independent Auditor / QA
- State: ASSIGNED
- Execution: STANDARD_CHAT_HIGH
- Refresh: FAST_REFRESH
- Frozen target: `7bb690429ad5b829e36e5d464ae9d7e74cc77ce0`
- Target PR: #113
- Target Builder head: `368a601046df1d4de2f477936f4ac5598e5de753`
- Expected branch: `auditor/tcw-030-trade-analyzer-remediation-retest`
- Scope: accepted TCW-024-F01 through F04 remediation only, plus direct protected-invariant regression checks.
- Next gate: evidence-only Auditor PR, exact-head CI, and independent verdict.

## Closed workflow/control-plane lanes
- TCW-026, TCW-027, TCW-028, and TCW-029 remain closed.
- TCW-029-F01 remains accepted LOW/non-blocking workflow debt and does not affect this product audit.

## Release 1.0 field state
Field registry remains **10 passed / 1 pending**.
Pending: `FV-SEASON-01 — Real playoff and bye intelligence states`.
It remains genuine-season-event gated and must not be simulated or manufactured.

## Role state
- Manager / Architect — WAIT for TCW-030 verdict after routing integration.
- Builder — WAIT.
- Strategy — IDLE.
- R&D — IDLE.
- Independent Auditor — ACTIVATE NOW on TCW-030 after routing master verification.
- Troubleshooting — IDLE / on-demand.
