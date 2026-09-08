# Active Assignments

Last updated: 2026-09-08
Canonical after TCW-004 protected merge.

## Completed coordination work

### TCW-001 — Bootstrap canonical `.ai` workflow

Role: Manager / Architect
Status: COMPLETE

### TCW-PW-001 — Release 1.0 Evidence Wave

Status: COMPLETE after TCW-004 reconciliation
Dependency classification: INDEPENDENT specialist assignments

#### TCW-002 — Independent Release 1.0 Baseline Audit

Role: Auditor / QA
Status: COMPLETE — PASS WITH NON-BLOCKING FINDINGS
PR: #54
Merged checkpoint: `b63f162f1ae0c3267c543819622d21d2c780ce70`

Accepted findings:
- MEDIUM non-blocking source-of-truth wording ambiguity in `AGENTS.md`; reconciled by TCW-004.
- LOW non-blocking legacy documentation/metadata drift; retained explicitly rather than silently rewritten.

#### TCW-003 — ESPN Field-Validation Feasibility Research

Role: Research & Development
Status: COMPLETE
Authoritative PR: #56
Merged checkpoint: `f714cab4b8a50c876510c332faea42102428d638`
Duplicate PR #55: CLOSED UNMERGED AS SUPERSEDED

Accepted findings:
- FV-RECOVERY-01 can be exercised immediately with a real temporary network failure/reconnect.
- FV-ESPN-05 is time-windowed around a naturally relevant lock/availability transition.
- FV-ESPN-02 requires a materially different authenticated custom OP/FLEX league.
- FV-ESPN-04 and deeper FV-SEASON-01 evidence are naturally occurring/seasonal.
- FV-WAIVER-01 remains coverage/observability-dependent; domain counters exist, but the normal UI does not clearly surface the complete required tuple.
- Current recovery code retains the prior valid live snapshot after a failed refresh while its normal source label remains `Live ESPN snapshot`; field confirmation is required before declaring a defect.
- The companion currently requests ESPN availability with `limit: 100`; live completeness impact is not yet proven.

## TCW-004 — Integrate Release 1.0 Evidence Wave and Reconcile Canonical Authority

Role: Manager / Architect
Status: COMPLETE when this reconciliation PR passes exact-head CI, merges, and post-merge master production verification succeeds.

Objective:
Integrate TCW-002/TCW-003, resolve the duplicate R&D submission, reconcile `AGENTS.md` with the canonical `.ai/shared/*` authority hierarchy, update canonical project state, and route the strongest legitimate next field-validation task without changing production behavior or field status.

## Active work after TCW-004

### Manager / Architect

Status: ACTIVE — Release 1.0 field-gate orchestration

Responsibilities:
- integrate TCW-005 evidence;
- route implementation only for reproduced/accepted deterministic defects;
- schedule other real field checks only when their actual prerequisites exist;
- keep canonical shared state reconciled.

### TCW-005 — FV-RECOVERY-01 Live Failure/Reconnect Validation

Role: Auditor / QA
Status: ACTIVE after TCW-004 merges
Task specification: `.ai/manager/tasks/TCW-005.md`
Dependency: merged and production-verified TCW-004 canonical reconciliation

Objective:
Run one real deployed authenticated ESPN network-failure/reconnect cycle, verify last-valid-snapshot retention and honest source/freshness labeling, then verify successful recovery with privacy-safe field evidence.

Authorized writes:
- `.ai/auditor/`

Field-registry mutation is not authorized by TCW-005 itself. Manager will integrate the Auditor verdict through a separate protected change if evidence supports a status update.

## IDLE roles after TCW-004

Builder: IDLE

Reason: no live field run has yet reproduced a deterministic implementation defect. The recovery-label code finding is a strong risk, not a completed field failure. Route Builder only if TCW-005 or another accepted observation establishes an implementation-ready defect/requirement.

R&D: IDLE

Reason: TCW-003 is complete. Its research questions have been routed into concrete field actions; no new research assignment is currently necessary.

Strategy: IDLE

Reason: the active milestone blockers remain field evidence and operational validation, not recommendation-policy or draft-strategy uncertainty.

## Manager routing after TCW-005

1. Refresh the Auditor handoff and repository checkpoint.
2. If FV-RECOVERY-01 passes, authorize the protected field-registry evidence update and continue to the next legitimate real field check.
3. If it fails due to a reproduced deterministic defect, specify a narrow Builder remediation task with regression requirements; after merge, require independent field retest.
4. If it is blocked/inconclusive, preserve the incomplete status and state exactly what evidence is missing.
5. Do not automatically activate R&D, Builder, or Strategy merely because they are idle.

## Queued evidence opportunities — not active assignments

- FV-ESPN-05 — next naturally relevant lock/availability transition.
- FV-ESPN-02 — existing authenticated custom OP/superflex league access.
- FV-ESPN-04 — naturally occurring IR edge state.
- FV-SEASON-01 — season/playoff/bye/projection evidence as real state permits.
- FV-WAIVER-01 — aggregate scale/timing evidence when projection coverage/observation access permits.
- FV-A11Y-02 — real screen-reader critical workflow when a suitable AT environment is available.
