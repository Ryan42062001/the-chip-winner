# TCW-027 — Frozen Workflow V3.2 Control-Plane Audit Packet

Task under audit: `TCW-026`
Audit task: `TCW-027`
Audit type: workflow-control-plane
Manager freeze date: 2026-09-18

## Exact frozen target

- Target task: `TCW-026 — Workflow V3.2 Cross-Project Parity Upgrade`
- Source PR: `#114`
- Source branch: `manager/tcw-026-workflow-v32-parity-upgrade`
- Source final head: `4a511c99f3726bd9c39be0ec9080320072e64661`
- Integrated branch: `master`
- Exact integrated SHA: `4e737f5f0b4cc5f3825f5c12ec4e5dccaf65c4f4`
- Exact-head PR validation: run #576 / `35418225147`
- Post-merge master validation: run #577 / `35418315839`

The Auditor must not silently switch target SHA.

## Exact target changed files

- `.ai/audit/AUDIT_PACKET_TEMPLATE.md`
- `.ai/manager/ACTIVE_ASSIGNMENTS.md`
- `.ai/manager/HANDOFF.md`
- `.ai/manager/INTEGRATION_QUEUE.md`
- `.ai/manager/KNOWN_CI_DEBT.md`
- `.ai/manager/TASK_TEMPLATE.md`
- `.ai/manager/evidence/TCW-025_TRADE_ANALYZER_REMEDIATION_INTEGRATION.md`
- `.ai/manager/tasks/TCW-025.md`
- `.ai/manager/tasks/TCW-026.md`
- `.ai/roles/AUDITOR.md`
- `.ai/roles/BUILDER.md`
- `.ai/roles/MANAGER.md`
- `.ai/roles/README.md`
- `.ai/roles/RND.md`
- `.ai/roles/STRATEGY.md`
- `.ai/roles/TROUBLESHOOTING.md`
- `.ai/shared/ACTIVE_TASKS.json`
- `.ai/shared/DECISIONS.md`
- `.ai/shared/PROJECT_STATE.md`
- `.ai/shared/ROADMAP.md`
- `.ai/shared/WORKFLOW.md`
- `.ai/shared/WORKFLOW_V3_1.md`
- `.ai/shared/WORKFLOW_V3_2.md`
- `.github/workflows/deploy-pages.yml`
- `package.json`
- `scripts/audit-workflow.js`
- `scripts/ci-change-mode.js`
- `scripts/workflow-audit-readiness.js`
- `scripts/workflow-manager-transition.js`
- `scripts/workflow-user-actions.js`
- `test/ci-change-mode.test.js`
- `test/workflow-audit.test.js`

## Accepted authority

- `.ai/shared/WORKFLOW.md`
- `.ai/shared/WORKFLOW_V3_1.md`
- TCW-026 task spec
- TCW-D014 in `.ai/shared/DECISIONS.md`
- project identity and read-only/field boundaries already established by repository state

Sibling projects are comparative provenance only; they are not proof that this implementation is correct for The Chip Winner.

## Required invariants

1. `STANDARD_CHAT_HIGH` is default; `WORK_MODE` requires substantial autonomous execution leverage.
2. `FAST_REFRESH` is default; `FULL_REFRESH` requires a reason; bounded remediation refresh is limited to accepted same-task findings.
3. Active registry is active-only and rejects contradictory/unsafe task state.
4. Blocker/user-action semantics cannot mark ordinary worker inactivity as user action.
5. Same-role concurrency is allowed only with collision-safe task isolation.
6. Manager-only merge authority and separation of worker readiness / Manager acceptance / merge / master verification / audit remain intact.
7. Audit readiness/frozen target helpers cannot self-certify an audit.
8. Transition helper defaults to dry-run and rolls back invalid applied registry changes.
9. User-action queue is derived from machine state rather than separately maintained.
10. Known CI debt cannot excuse new/different failures.
11. Docs-only fast path is narrowly allowlisted and fails closed to FULL for ambiguity/non-doc/mixed/master/manual cases.
12. A docs-only synchronize shortcut requires same-PR predecessor validation continuity.
13. The test job/check remains present even for docs-only fast-path runs.
14. CI emits durable evidence for classification and validation stages.
15. Material workflow/control-plane changes require fresh independent audit before closure.
16. The upgrade does not alter in-season strategy, ESPN source authority/read-only behavior, Trade Analyzer product semantics, or Release 1.0 field state.
17. Non-applicable War Room protected-scoring/custody and Family Finance Hub financial/Supabase controls are not imported.

## Validation evidence

PR #114 final exact head `4a511c99f3726bd9c39be0ec9080320072e64661`:
- run #576 / `35418225147`
- classifier selected FULL
- workflow V3.2 state audit PASS
- dependency audit PASS
- full unit/contract suite PASS
- model evaluation PASS
- static/browser smoke PASS
- accessibility/readiness/mobile/extension/performance/security PASS
- CI evidence upload and guardrails PASS

Integrated master `4e737f5f0b4cc5f3825f5c12ec4e5dccaf65c4f4`:
- run #577 / `35418315839`
- full test gate PASS
- GitHub Pages deployment PASS
- production smoke PASS

Development failures that must be considered:
- #572 exposed a collision-test fixture defect.
- #573 exposed legacy V3.1 workflow-audit fixtures that had not been migrated.
- #575 exposed malformed literal-\n JSON serialization in the merge-readiness state update.
- all were corrected; the final exact-head and master runs above are green.

Known inherited CI debt: NONE.

## Validation-level boundary

This is a workflow/control-plane audit. Production smoke demonstrates that deployment still functions, not that all future workflow states are correct. Static/unit/adversarial reasoning over scripts, registry semantics, workflow YAML, and evidence routing is required.

Do not manufacture private ESPN/field evidence. `FV-SEASON-01` remains separate and pending.

## Independence

The Auditor must use a fresh independent audit chat and did not implement TCW-026.

## Allowed verdict

- PASS
- PASS WITH NON-BLOCKING FINDINGS
- FAIL — REMEDIATION REQUIRED
