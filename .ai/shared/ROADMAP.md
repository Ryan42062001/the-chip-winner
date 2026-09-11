# The Chip Winner — Canonical Roadmap

Last reconciled: 2026-09-11
Manager task: TCW-007 — Workflow V3 operating upgrade

## Current milestone

### M1 — Release 1.0 trustworthy read-only companion

Status: ACTIVE — FIELD VALIDATION

Remaining milestone work is evidence-backed real-world validation and final release gating. Broad feature expansion remains out of scope.

## Release 1.0 blockers

Pending checks in `config/field-validation.json`:
1. FV-A11Y-02 — screen-reader critical workflow.
2. FV-ESPN-02 — authenticated custom FLEX/OP league.
3. FV-ESPN-04 — authenticated IR edge states.
4. FV-ESPN-05 — authenticated lock/availability transitions.
5. FV-SEASON-01 — real playoff/bye intelligence states.
6. FV-RECOVERY-01 — live ESPN/session/network failure and reconnect.
7. FV-WAIVER-01 — real waiver candidate volume and timing.

Field gate remains **6 passed / 7 pending**.

## Coordination sequence

Completed:
- TCW-001 canonical workflow bootstrap.
- TCW-PW-001 Auditor/R&D evidence wave.
- TCW-002 baseline audit.
- TCW-003 ESPN field-feasibility research.
- TCW-004 evidence-wave integration.
- TCW-005 Auditor execution attempt (field task remains blocked).
- TCW-006 blocked recovery-field reconciliation; PR #59 merged at `a7d9d1a3f36241bd11a0cae1c9bbb66f0c0cea63`; workflow #425 passed.

Active control-plane work:
- TCW-007 — Workflow V3 operating upgrade. No production behavior or field-registry changes.

## Immediate dependency order

1. Complete TCW-007 protected workflow upgrade and post-merge verification.
2. Return Manager to event-driven orchestration; keep specialists idle unless a real prerequisite or defect exists.
3. Obtain privacy-safe user-operated TCW-005 recovery/reconnect observations.
4. Re-activate Auditor under TCW-005 for an independent field verdict.
5. If the verdict reproduces a deterministic defect, route a narrow Builder remediation and require independent real field retest.
6. If recovery passes, integrate privacy-safe field evidence/status through a separate protected task.
7. Execute the other pending field checks only when their genuine real-world prerequisites exist.
8. Complete final Release 1.0 PR/master gates after all field checks pass.
9. Perform Roadmap Discovery before authorizing a successor milestone.

## Release 1.0 exit gate

Release 1.0 may close only when:
- every field-validation item is passed with privacy-safe evidence;
- no unresolved high-severity accessibility, privacy, security, ESPN-normalization, waiver-legality, or season-planning defect remains;
- exact final release PR validation is green;
- post-merge `master` test/deploy/production verification is green;
- product remains read-only.

## Post-1.0 Roadmap Discovery

No successor milestone is automatically authorized. A valid conclusion remains:

`NO SUCCESSOR MILESTONE CURRENTLY JUSTIFIED.`

Gated candidate areas remain trade analysis, external injury/news notifications, future-only IR-assisted stash discovery, playoff probability modeling, server-side models, and ESPN write actions.
