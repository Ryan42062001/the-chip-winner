# The Chip Winner — Canonical Roadmap

Last reconciled: 2026-09-13
Current milestone: Release 1.0 field validation

## Current milestone

### M1 — Release 1.0 trustworthy read-only companion

Status: ACTIVE — FIELD VALIDATION

Remaining milestone work is evidence-backed real-world validation, narrow remediation of any newly reproduced field defects, and final release gating. Broad feature expansion remains out of scope.

## Release 1.0 blockers

Pending checks in `config/field-validation.json`:
1. FV-A11Y-02 — screen-reader critical workflow.
2. FV-ESPN-02 — authenticated custom FLEX/OP league.
3. FV-ESPN-04 — authenticated IR edge states.
4. FV-ESPN-05 — authenticated lock/availability transitions.
5. FV-SEASON-01 — real playoff/bye intelligence states.
6. FV-WAIVER-01 — real waiver candidate volume and timing.

Registry field gate is **7 passed / 6 pending**.

FV-RECOVERY-01 is now passed. TCW-005 first reproduced stale/live labeling and misleading failure guidance; TCW-009 remediated both findings; the independent post-remediation TCW-005 field retest returned PASS CANDIDATE; TCW-011 integrated the privacy-safe evidence and status after PR #71 and master workflow #456 passed.

## Recovery remediation dependency chain

Completed:
1. TCW-005 real deployed field run reproduced TCW-005-F01 HIGH and TCW-005-F02 MEDIUM.
2. TCW-009 implemented bounded recovery-state remediation with deterministic regression coverage.
3. Builder PR #67 merged at `267b44e7ccea02b903938ead2ee4658d60c2d20b`; workflow #444 passed test, deploy, and production smoke.
4. Independent TCW-005 post-remediation field retest verified durable `Last valid ESPN snapshot · refresh failed` labeling, truthful recovery guidance, navigation persistence, no sample fallback, and successful reconnect.
5. Auditor PR #70 merged at `89820c1c5c7f13b91cd4dda304db5faadbae6603`; workflow #454 passed.
6. TCW-011 integrated FV-RECOVERY-01 as passed through PR #71 at `eb45e87b426c67dca4f36d8fba97cc5bef47e1d4`; workflow #456 passed test, deploy, and production verification.

The recovery loop is closed unless a new independent field defect is reproduced later.

## Coordination sequence

Completed:
- TCW-001 canonical workflow bootstrap.
- TCW-PW-001 Auditor/R&D evidence wave.
- TCW-002 baseline audit.
- TCW-003 ESPN field-feasibility research.
- TCW-004 evidence-wave integration.
- TCW-005 recovery field validation — post-remediation PASS CANDIDATE accepted.
- TCW-006 blocked recovery-field reconciliation.
- TCW-007 Workflow V3 operating upgrade.
- TCW-008 post-1.0 roadmap candidate sequencing.
- TCW-009 recovery-state honesty remediation.
- TCW-010 Workflow V3.1 coordination hardening.
- TCW-011 FV-RECOVERY-01 evidence integration and recovery-loop closeout.

Current operational tasks: none. Workflow V3.1 is canonical and `.ai/shared/ACTIVE_TASKS.json` is the machine-authoritative operational registry.

## Immediate dependency order

1. Continue the six remaining Release 1.0 field checks only when their genuine real-world prerequisites exist.
2. Use the Workflow V3.1 defect fast lane for any newly reproduced deterministic field defect.
3. Complete final Release 1.0 PR/master gates after all field checks pass.
4. Perform formal Roadmap Discovery before authorizing a successor milestone.

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
