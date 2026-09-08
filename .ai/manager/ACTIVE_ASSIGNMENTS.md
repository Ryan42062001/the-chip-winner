# Active Assignments

Last updated: 2026-09-08
Canonical reconciliation task: TCW-006.

## Completed coordination work

### TCW-001 — Bootstrap canonical `.ai` workflow

Role: Manager / Architect
Status: COMPLETE

### TCW-PW-001 — Release 1.0 Evidence Wave

Status: COMPLETE

- TCW-002 — Independent Release 1.0 Baseline Audit — Auditor / QA — COMPLETE, `PASS WITH NON-BLOCKING FINDINGS`, merged PR #54 at `b63f162f1ae0c3267c543819622d21d2c780ce70`.
- TCW-003 — ESPN Field-Validation Feasibility Research — R&D — COMPLETE, authoritative PR #56 merged at `f714cab4b8a50c876510c332faea42102428d638`; duplicate PR #55 closed unmerged as superseded.
- TCW-004 — Manager evidence-wave integration and canonical authority reconciliation — COMPLETE, merged at `2ef036eb02efd6600049d91f2f076c0f3a633a1b`; post-merge workflow #421 passed test, deploy, and production verification.

## TCW-005 — FV-RECOVERY-01 Live Failure/Reconnect Validation

Role: Independent Auditor / QA
Field-check status: BLOCKED — awaiting user-operated local field evidence
Auditor execution attempt: COMPLETE — `INCONCLUSIVE / BLOCKED`
PR: #58
Merged handoff checkpoint: `748aed086de038cdd627d3cefb433c7bc1458761`

Auditor verified the task authorization and production baseline but could not truthfully execute the required real field cycle because its environment does not expose the user's authenticated Chrome/ESPN session, Chrome companion runtime, or OS/device network controls.

The Auditor did **not** declare PASS or FAIL and did **not** modify `config/field-validation.json`.

FV-RECOVERY-01 therefore remains pending. The pre-existing code observation that a retained prior `live-companion` snapshot may still show `Live ESPN snapshot` remains a strong risk, not a reproduced field defect.

### External prerequisite to resume TCW-005

A user-operated deployed authenticated session must capture only privacy-safe observations:

- OS and browser/version;
- deployed/package checkpoint when known;
- successful pre-failure Refresh ESPN result and sanitized source/capture/freshness labels;
- temporary OS/device network disconnect while the loaded page remains open;
- sanitized failure class/message from Refresh ESPN while offline after normal cooldown;
- whether the previous valid snapshot remains usable;
- exact sanitized source/freshness/error labels after failure;
- whether normal navigation remains on retained ESPN state without sample fallback;
- restored network and successful reconnect/refresh with updated capture/freshness state.

Do not capture player, league, team, member, cookie, credential, raw payload, or private URL data.

When that evidence exists, re-activate Auditor under TCW-005 for an independent `PASS CANDIDATE`, `FAIL — REPRODUCED DEFECT`, or `INCONCLUSIVE/BLOCKED` verdict.

## TCW-006 — Reconcile Blocked Recovery Field Attempt

Role: Manager / Architect
Status: ACTIVE until protected reconciliation PR and post-merge production verification complete
Task specification: `.ai/manager/tasks/TCW-006.md`

Objective:
Integrate the TCW-005 blocked handoff into canonical state, preserve the unchanged field gate, document the external evidence prerequisite, and avoid assigning work that the available specialist environments cannot execute.

## Role state after TCW-006

### Manager / Architect

ACTIVE — Release 1.0 field-gate orchestration.

Responsibilities:
- integrate user-operated TCW-005 evidence when supplied;
- re-activate Auditor only when that evidence exists;
- route Builder only for reproduced implementation defects or separately approved implementation-ready requirements;
- activate other field tasks only when their real prerequisites exist;
- keep canonical shared state reconciled.

### Builder

IDLE.

Reason: no real recovery field cycle has reproduced a deterministic defect. Do not implement a speculative recovery-label fix merely from code risk.

### R&D

IDLE.

Reason: TCW-003 is complete and no additional research is currently required to resolve the blocked local-environment prerequisite.

### Strategy

IDLE.

Reason: current blockers concern field evidence/operational validation, not recommendation-policy uncertainty.

### Auditor

IDLE — TCW-005 is blocked awaiting external user-operated evidence.

Reason: repeating TCW-005 in the same non-local execution environment cannot produce the required authenticated network-failure observation.

## Other queued evidence opportunities — not active assignments

- FV-ESPN-05 — real game-lock or availability transition across authenticated refreshes.
- FV-ESPN-02 — access to an existing authenticated custom OP/superflex-style league.
- FV-ESPN-04 — naturally occurring IR edge state.
- FV-SEASON-01 — real playoff/bye/future-projection states as the season permits.
- FV-WAIVER-01 — privacy-safe aggregate enumeration counts and real timing when coverage/observation permits.
- FV-A11Y-02 — critical workflow with a real screen reader and browser/AT versions.

No new parallel specialist wave is justified while these prerequisites are unavailable.
