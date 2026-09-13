# The Chip Winner — Canonical Roadmap

Last reconciled: 2026-09-12
Current milestone: Release 1.0 field validation

## Current milestone

### M1 — Release 1.0 trustworthy read-only companion

Status: ACTIVE — FIELD VALIDATION / RECOVERY RETEST

Remaining milestone work is evidence-backed real-world validation, independent retest of deployed remediation, narrow remediation only for reproduced defects, and final release gating. Broad feature expansion remains out of scope.

## Release 1.0 blockers

Pending checks in `config/field-validation.json`:
1. FV-A11Y-02 — screen-reader critical workflow.
2. FV-ESPN-02 — authenticated custom FLEX/OP league.
3. FV-ESPN-04 — authenticated IR edge states.
4. FV-ESPN-05 — authenticated lock/availability transitions.
5. FV-SEASON-01 — real playoff/bye intelligence states.
6. FV-RECOVERY-01 — live ESPN/session/network failure and reconnect.
7. FV-WAIVER-01 — real waiver candidate volume and timing.

Registry field gate remains **6 passed / 7 pending**.

## Recovery dependency chain

Completed:
1. TCW-005 reproduced the stale/live labeling defect and misleading network guidance in a real deployed failure/reconnect cycle.
2. TCW-009 implemented bounded recovery-state honesty remediation with deterministic regression coverage.
3. PR #67 merged at `267b44e7ccea02b903938ead2ee4658d60c2d20b`.
4. Master workflow #444 passed test, Pages deploy, and production verification.

Pending:
5. User repeats the deployed authenticated failure/reconnect sequence and supplies privacy-safe observations.
6. Auditor resumes TCW-005 and returns the independent field verdict.
7. Only a successful retest may support separate Manager field-evidence/status integration for FV-RECOVERY-01.

## Coordination sequence

Completed: TCW-001, TCW-PW-001, TCW-002, TCW-003, TCW-004, TCW-006, TCW-007, TCW-008, and TCW-010.

Current operational tasks:
- TCW-005 — `WAITING_EXTERNAL_EVIDENCE` — Auditor resumes after the user-operated field retest.
- TCW-009 — `AUDIT_READY` — implementation merged/deployed; independent TCW-005 retest is the next gate.

Workflow V3.1 is canonical. Its active registry is `.ai/shared/ACTIVE_TASKS.json`.

## Immediate dependency order

1. Obtain the real deployed TCW-005 disconnect/reconnect retest observations.
2. Re-activate Independent Auditor under TCW-005 for the verdict.
3. If PASS CANDIDATE, Manager integrates privacy-safe recovery evidence/status through a protected task.
4. If FAIL — REPRODUCED DEFECT, use the V3.1 defect fast lane for only the reproduced behavior.
5. Continue other pending field checks when their genuine prerequisites exist.
6. Complete final Release 1.0 PR/master gates after all field checks pass.
7. Perform formal Roadmap Discovery before authorizing a successor milestone.

## Release 1.0 exit gate

Release 1.0 may close only when every field-validation item is passed with privacy-safe evidence, no unresolved high-severity product defect remains, the exact final release PR is green, post-merge master test/deploy/production verification is green, and the product remains read-only.

## Post-1.0 Roadmap Discovery

No successor milestone is automatically authorized. The current discovery candidate order remains:
1. GM Action Plan / recommendation synthesis.
2. Trade Analyzer.
3. Recommendation confidence + league-market intelligence.
4. Decision-impacting injury/news intelligence and notifications.
5. Playoff probability / championship-path modeling.
6. ESPN write actions remain later and separately gated.

Detailed discovery notes: `docs/post-1.0-roadmap-candidates.md`.
