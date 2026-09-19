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
- Advancement through verified Workflow V3.2 closeout checkpoint `2556d56b3ec9ee62b72dc5e7201d5f7a3826baa4`: CONTROL_PLANE_ONLY; no `src/**` or `config/**` product change
- Next gate: fresh independent TCW-024-F01 through F04 remediation retest.

## Closed workflow/control-plane lanes
- TCW-026 — Workflow V3.2 Cross-Project Parity Upgrade: CLOSED after remediation/audit chain cleared.
- TCW-027 — original independent Workflow V3.2 audit: CLOSED after findings were consumed.
- TCW-028 — Workflow V3.2 Audit Remediation: CLOSED after TCW-029 PASS WITH NON-BLOCKING FINDINGS.
- TCW-029 — fresh remediation re-audit: CLOSED after Manager accepted the verdict and verified closeout state.
- TCW-029-F01 remains accepted LOW/non-blocking workflow debt: Markdown formatting can bypass the human-facing worker `ACTIVATE NOW` lint, but it cannot mutate machine state or grant merge authority.

## Release 1.0 field state
Field registry remains **10 passed / 1 pending**.
Pending: `FV-SEASON-01 — Real playoff and bye intelligence states`.
It remains genuine-season-event gated and must not be simulated or manufactured.

## Role state
- Manager / Architect — next product-quality action is routing the TCW-025 fresh independent retest.
- Builder — WAIT; no active implementation remediation.
- Strategy — IDLE.
- R&D — IDLE.
- Independent Auditor — WAIT for a fresh Manager-routed TCW-025 audit assignment.
- Troubleshooting — IDLE / on-demand.
