# The Chip Winner — Canonical Roadmap

Last reconciled: 2026-09-12
Current milestone: Release 1.0 field validation

## Current milestone

### M1 — Release 1.0 trustworthy read-only companion

Status: ACTIVE — FIELD VALIDATION / RECOVERY REMEDIATION

Remaining milestone work is evidence-backed real-world validation, narrow remediation of reproduced field defects, and final release gating. Broad feature expansion remains out of scope.

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

FV-RECOVERY-01 now has a real TCW-005 `FAIL — REPRODUCED DEFECT` verdict. It remains unpassed until TCW-009 is remediated, merged, deployed, production-verified, and independently retested.

## Recovery remediation dependency chain

1. TCW-005 real deployed field run reproduced:
   - HIGH blocking stale/live source-label defect;
   - MEDIUM misleading authentication-focused network/fetch guidance.
2. TCW-009 — Builder implements the bounded recovery-state remediation with deterministic regression coverage.
3. Manager reviews/merges only an accepted TCW-009 implementation with exact-head CI green.
4. Post-merge `master` test/deploy/production verification must pass.
5. Independent Auditor resumes TCW-005 and repeats the same real deployed failure/reconnect sequence.
6. Only a successful independent retest may support a separate Manager field-evidence/status integration for FV-RECOVERY-01.

## Coordination sequence

Completed:
- TCW-001 canonical workflow bootstrap.
- TCW-PW-001 Auditor/R&D evidence wave.
- TCW-002 baseline audit.
- TCW-003 ESPN field-feasibility research.
- TCW-004 evidence-wave integration.
- TCW-005 initial blocked attempt and later definitive real field verdict: FAIL — REPRODUCED DEFECT.
- TCW-006 blocked recovery-field reconciliation.
- TCW-007 Workflow V3 operating upgrade.
- TCW-008 post-1.0 roadmap candidate sequencing.

Active:
- TCW-009 — Recovery State Honesty Remediation — Builder.

## Immediate dependency order

1. Builder executes TCW-009 only within the accepted recovery-state scope.
2. Manager reviews Builder evidence/PR and merges only after exact-head validation passes.
3. Verify post-merge `master` test, deploy, and production smoke.
4. Re-activate Auditor under TCW-005 for the independent deployed recovery retest.
5. If the retest passes, integrate privacy-safe field evidence/status through a separate protected Manager task.
6. Continue the other pending field checks only when their genuine real-world prerequisites exist.
7. Complete final Release 1.0 PR/master gates after all field checks pass.
8. Perform formal Roadmap Discovery before authorizing a successor milestone.

## Release 1.0 exit gate

Release 1.0 may close only when:
- every field-validation item is passed with privacy-safe evidence;
- no unresolved high-severity accessibility, privacy, security, ESPN-normalization, waiver-legality, recovery/freshness, or season-planning defect remains;
- exact final release PR validation is green;
- post-merge `master` test/deploy/production verification is green;
- product remains read-only.

## Post-1.0 Roadmap Discovery

No successor milestone is automatically authorized. A valid conclusion remains:

`NO SUCCESSOR MILESTONE CURRENTLY JUSTIFIED.`

The following sequence is **Roadmap Discovery input**, not an authorized implementation schedule. Revalidate it against real Release 1.0 usage, field evidence, source feasibility, and user value before opening a successor milestone.

### Proposed candidate order

1. **GM Action Plan / recommendation synthesis** — one prioritized weekly action surface using existing approved facts/recommendations.
2. **Trade Analyzer** — lineup/depth/replacement/bye/playoff impacts without an opaque single winner grade.
3. **Recommendation confidence + league-market intelligence** — inspectable source agreement/freshness/coverage and approved connected-league market context.
4. **Decision-impacting injury/news intelligence and notifications** — only after a trustworthy source is approved; surface news when it changes a decision.
5. **Playoff probability / championship-path modeling** — separate calibrated qualification/championship/opponent-win modeling with documented assumptions and uncertainty.
6. **ESPN write actions remain later gated** — no lineup/add-drop/waiver/trade mutations without a separately authorized milestone; no background automatic transactions.

Detailed discovery notes: `docs/post-1.0-roadmap-candidates.md`.

Other gated candidate areas remain future-only IR-assisted stash discovery, server-side models, additional projection/news sources, and optional confirmed ESPN actions.
