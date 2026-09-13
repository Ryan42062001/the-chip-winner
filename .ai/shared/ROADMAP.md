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

Registry field gate is **8 passed / 5 pending**.

FV-RECOVERY-01 is passed after the TCW-005 -> TCW-009 -> TCW-011 recovery validation/remediation chain.

FV-WAIVER-01 is passed after TCW-012 exposed existing exhaustive-run diagnostics, the real deployed TCW-014 retest captured 89 considered adds / 88 complete adds / 352 evaluated scenarios / 0 qualified adds with acceptable responsiveness, the Independent Auditor returned PASS CANDIDATE through PR #78, and TCW-015 integrated the evidence through PR #79 with master workflow #473 passing.

## Completed field-remediation chains

### Recovery
1. TCW-005 reproduced stale/live labeling and misleading failure guidance.
2. TCW-009 implemented bounded recovery-state remediation with deterministic regression coverage.
3. Independent post-remediation field retest passed.
4. TCW-011 integrated FV-RECOVERY-01 as passed.

### Waivers
1. Real FV-WAIVER-01 evidence confirmed responsiveness but lacked visible exhaustive-run counts.
2. TCW-012 exposed existing `futureDiscovery` diagnostics without changing waiver enumeration or recommendation logic.
3. TCW-014 real deployed retest captured the required diagnostics and responsiveness evidence.
4. Independent Auditor PR #78 returned PASS CANDIDATE with no findings.
5. TCW-015 integrated FV-WAIVER-01 as passed; PR #79 merged at `ae932395f87f77aad2c067ca16dc1042d4f79786` and workflow #473 passed test, deploy, and production verification.

## Coordination sequence

Completed:
- TCW-001 canonical workflow bootstrap.
- TCW-PW-001 Auditor/R&D evidence wave.
- TCW-002 baseline audit.
- TCW-003 ESPN field-feasibility research.
- TCW-004 evidence-wave integration.
- TCW-005 recovery field validation.
- TCW-006 blocked recovery-field reconciliation.
- TCW-007 Workflow V3 operating upgrade.
- TCW-008 post-1.0 roadmap candidate sequencing.
- TCW-009 recovery-state honesty remediation.
- TCW-010 Workflow V3.1 coordination hardening.
- TCW-011 FV-RECOVERY-01 evidence integration and recovery-loop closeout.
- TCW-012 waiver field diagnostics visibility.
- TCW-014 FV-WAIVER-01 deployed field retest.
- TCW-015 FV-WAIVER-01 evidence integration and closeout.

Operational task inventory is owned by `.ai/shared/ACTIVE_TASKS.json`; durable roadmap text must not override that registry.

## Immediate dependency order

1. Continue the five remaining Release 1.0 field checks only when their genuine real-world prerequisites exist.
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
