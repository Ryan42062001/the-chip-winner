# The Chip Winner — Canonical Roadmap

Last reconciled: 2026-09-12
Current milestone: Release 1.0 field validation

## Current milestone

### M1 — Release 1.0 trustworthy read-only companion

Status: ACTIVE — FIELD VALIDATION / RECOVERY RETEST

Remaining milestone work is evidence-backed real-world validation, independent retest of deployed remediation, narrow remediation of reproduced field defects, and final release gating. Broad feature expansion remains out of scope.

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

FV-RECOVERY-01 has a real TCW-005 `FAIL — REPRODUCED DEFECT` verdict. TCW-009 is remediated, merged, deployed, and production-verified, but the field item remains unpassed until the same real deployed failure/reconnect sequence is independently retested.

## Recovery remediation dependency chain

Completed:
1. TCW-005 real deployed field run reproduced:
   - HIGH blocking stale/live source-label defect;
   - MEDIUM misleading authentication-focused network/fetch guidance.
2. TCW-009 implemented the bounded recovery-state remediation with deterministic regression coverage.
3. Manager reviewed and merged TCW-009 through PR #67 at `267b44e7ccea02b903938ead2ee4658d60c2d20b` after exact-head validation.
4. Post-merge master workflow #444 passed test, deploy, and production smoke.

Pending:
5. User performs the same real deployed authenticated failure/reconnect sequence and supplies privacy-safe observations.
6. Independent Auditor resumes TCW-005 and returns the field verdict.
7. Only a successful independent retest may support a separate Manager field-evidence/status integration for FV-RECOVERY-01.

## Coordination sequence

Completed:
- TCW-001 canonical workflow bootstrap.
- TCW-PW-001 Auditor/R&D evidence wave.
- TCW-002 baseline audit.
- TCW-003 ESPN field-feasibility research.
- TCW-004 evidence-wave integration.
- TCW-005 initial real field verdict: FAIL — REPRODUCED DEFECT.
- TCW-006 blocked recovery-field reconciliation.
- TCW-007 Workflow V3 operating upgrade.
- TCW-008 post-1.0 roadmap candidate sequencing.
- TCW-010 Workflow V3.1 coordination hardening.

Current operational tasks:
- TCW-005 — `WAITING_EXTERNAL_EVIDENCE` — Auditor resumes after the user-operated deployed recovery retest.
- TCW-009 — `AUDIT_READY` — implementation merged/deployed; TCW-005 independent retest is the next gate.

Workflow V3.1 is canonical. `.ai/shared/ACTIVE_TASKS.json` is the machine-authoritative operational registry.

## Immediate dependency order

1. Obtain the privacy-safe user-operated TCW-005 recovery/reconnect observation package against the deployed TCW-009 remediation.
2. Re-activate Auditor under TCW-005 for the independent field verdict.
3. If PASS CANDIDATE, integrate privacy-safe field evidence/status through a separate protected Manager task.
4. If FAIL — REPRODUCED DEFECT, use the Workflow V3.1 defect fast lane for only the newly reproduced behavior.
5. Continue the other pending field checks only when their genuine real-world prerequisites exist.
6. Complete final Release 1.0 PR/master gates after all field checks pass.
7. Perform formal Roadmap Discovery before authorizing a successor milestone.

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
