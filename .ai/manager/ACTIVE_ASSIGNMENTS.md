# Active Assignments

Last updated: 2026-09-08

## TCW-001 — Bootstrap canonical `.ai` workflow

Role: Manager / Architect
Status: COMPLETE
Verified bootstrap merge checkpoint: `40b2ae7fbf024976753250b969c18f03373aa83b`
PR: #52

Completion evidence:

- Canonical `.ai/shared` coordination files exist on `master`.
- Manager handoff and active-assignment files exist.
- Builder, R&D, Strategy, and Auditor role directories exist.
- Recorded stale repository status/handoff discrepancies were not silently reconciled.
- PR #52 changed only `.ai` coordination files and did not alter production behavior.
- PR exact-head CI passed before merge.
- Post-merge master workflow run #411 passed test, deploy, and verify-production including production smoke.

## TCW-PW-001 — Release 1.0 Evidence Wave

Manager: ACTIVE — orchestration and integration
Status: ACTIVE when this closeout state is merged
Dependency classification: INDEPENDENT specialist assignments

### TCW-002 — Independent Release 1.0 Baseline Audit

Role: Auditor / QA
Status: ACTIVE
Task specification: `.ai/manager/tasks/TCW-002.md`
Dependency: none beyond merged TCW-001 closeout state

Objective:
Independently verify the current Release 1.0 baseline, canonical state, field-registry counts, bootstrap changed-file scope, and protected CI/release evidence. Produce PASS / PASS WITH NON-BLOCKING FINDINGS / FAIL.

Authorized writes:
- `.ai/auditor/`

### TCW-003 — ESPN Field-Validation Feasibility Research

Role: R&D
Status: ACTIVE
Task specification: `.ai/manager/tasks/TCW-003.md`
Dependency: none beyond merged TCW-001 closeout state

Objective:
Research current authoritative ESPN behavior and privacy-safe practical paths for exercising the remaining ESPN-heavy Release 1.0 field checks without manufacturing states or changing production behavior.

Authorized writes:
- `.ai/rnd/`

## IDLE roles

Builder: IDLE

Reason: no reproduced deterministic defect or approved implementation-ready requirement currently exists. Do not create work merely to keep Builder busy.

Strategy: IDLE

Reason: the active milestone blockers are field evidence and ESPN-validation feasibility, not unresolved recommendation-policy or draft-strategy requirements.

## Manager integration gate for TCW-PW-001

Manager should not authorize production work from specialist findings automatically. After both handoffs:

1. verify each specialist's evidence and repository checkpoint;
2. identify exact agreements/disagreements;
3. decide which findings are field actions, blockers, defects, or future opportunities;
4. route Builder only for an approved implementation-ready defect/requirement;
5. route Strategy only for genuine recommendation-policy uncertainty;
6. reconcile canonical shared state only after evidence supports the change.
