# Active Assignments

Last updated: 2026-09-19
Machine authority: `.ai/shared/ACTIVE_TASKS.json`

## TCW-034 — AUDIT_READY / THIRD REPAIRED TARGET FROZEN

Owner: Implementation Engineer / Builder. Existing Builder PR #147 is DRAFT / UNMERGED.
Immutable third repaired FULL target: `035c5f5112b7393f9d4f17685792548afa67dd2e`.
Prior failed target/authorized repair baseline: `24be4be45f7fde351c0a6e209353dd2beed8d854`.
Actual task readiness at exact head: blockers [], readyForManagerFreeze true; packet `750892a305cab589a6c3e904f39488189382542a4a9070ab25fa1a148043c1df`.
FULL workflow #692 / run `35477501875`, test `105989175098`: PASS.
Next gate: TCW-046 independent exact-target re-audit. Do not change Builder HEAD or merge PR #147. TCW-035 inactive.

## TCW-046 — ASSIGNED / FRESH INDEPENDENT RE-AUDIT

Owner: Independent Auditor / QA.
Execution: `STANDARD_CHAT_HIGH`; refresh: `FAST_REFRESH`.
Branch: `auditor/tcw-046-trade-winner-third-reaudit`.
Task: `.ai/manager/tasks/TCW-046.md`.
Frozen packet: `.ai/audit/TCW-046_TRADE_WINNER_REAUDIT_PACKET_035c5f51.md`.
Exact immutable target: `035c5f5112b7393f9d4f17685792548afa67dd2e`.
Allowed output ONLY `.ai/audit/TCW-046_TRADE_WINNER_ENGINE_REAUDIT.md` and `.ai/auditor/TCW-046_HANDOFF.md`. One evidence PR, exact-head CI, no merge.

## TCW-047 — ASSIGNED / INDEPENDENT AUTOMATED READINESS GATE

Owner: Implementation Engineer / Builder — distinct Workflow Automation lane.
Execution: `STANDARD_CHAT_HIGH`; refresh: `FAST_REFRESH`.
Branch: `builder/tcw-047-automated-audit-readiness`.
Task: `.ai/manager/tasks/TCW-047.md`.
Allowed output: new GitHub Actions task-readiness workflow, standalone automation runner and test, task-specific Builder handoff only. It must not touch TCW-034 production branch/PR or TCW-046 evidence, and must not auto-freeze, merge or bypass existing readiness/static workflow checks. One separate scoped PR, exact-head CI, independent workflow/security audit before adoption.

**Automation is NOT installed merely because this task is assigned.** The current TCW-034 readiness gate already passed manually; audit target stays immutable. Use the existing verified manual process until TCW-047 is independently accepted and integrated.
