# The Chip Winner — Canonical Roadmap

Last reconciled: 2026-09-14
Current work: Release 1.0 event-gated field validation + Trade Analyzer v1 independent audit

## Current milestone state

### M1 — Release 1.0 trustworthy read-only companion

Status: ACTIVE — FIELD VALIDATION EVENT-GATED

Authoritative live field status is `config/field-validation.json`.

Sole remaining blocker:
1. FV-SEASON-01 — real playoff/bye intelligence states.

Registry field gate remains **10 passed / 1 pending**.

The remaining field check requires a genuine season condition and must not be manufactured merely to create work.

### Trade Analyzer v1

Status: IMPLEMENTED / DEPLOYED — INDEPENDENT AUDIT ACTIVE

The product owner explicitly selected Trade Analyzer ahead of the prior GM Action Plan candidate order.

Completed:
1. TCW-022 Strategy contract — accepted after deterministic future materiality and conclusion-precedence rework.
2. TCW-023 production implementation — Manager reviewed, merged, deployed, and production-verified.

Verified TCW-023 integration:
- PR #109 exact head `5c492f22ce7ab107771d946ee318c2ac5665ce16`;
- PR workflow #556 full gate PASS;
- merged production master `e112156deedf453fb3e0081412c07e2e15c0256d`;
- master workflow #557 full test gate PASS;
- GitHub Pages deploy PASS;
- production release smoke PASS.

Active:
3. TCW-024 Independent Auditor / QA review of the exact deployed Trade Analyzer v1 implementation.

The audit remains independent from Builder/Manager acceptance and does not require fabricated private/authenticated ESPN evidence. Any such unobserved behavior must remain explicitly unverified at the corresponding evidence level.

## Trade Analyzer v1 product boundary

Implemented product direction remains:
- roster consequence rather than a single opaque package score;
- connected user's team;
- 1-for-1 and multi-player / unequal-count hypothetical packages;
- explicit roster-space/follow-up-drop consequences;
- pre/post best legal lineup impact;
- depth/replaceability/fragility;
- supported bye/future/playoff horizons;
- source disagreement and missing-data honesty;
- short-term versus long-term conclusion precedence;
- completely read-only with no ESPN trade write actions.

## Immediate dependency order

1. Independent Auditor completes TCW-024 against deployed master `e112156deedf453fb3e0081412c07e2e15c0256d`.
2. Manager reviews the Auditor verdict.
3. If PASS CANDIDATE is accepted, close the Trade Analyzer v1 lane and return to event-gated Release 1.0 / explicitly authorized next work.
4. If FAIL is accepted, use the V3.1 defect fast lane for the smallest bounded Builder remediation.
5. Complete `FV-SEASON-01` only when genuine qualifying season evidence exists.

## Release 1.0 exit gate

Release 1.0 may close only when every scoped item remaining in `config/field-validation.json` is passed with privacy-safe evidence, no unresolved blocking defect remains, final CI/deployment verification is green, and the product remains read-only.

Trade Analyzer work does not waive or alter that exit gate.

## Product roadmap after explicit Trade Analyzer authorization

1. **Trade Analyzer v1 — IMPLEMENTED / AUDIT ACTIVE**.
2. **GM Action Plan / recommendation synthesis — DISCOVERY CANDIDATE**.
3. **Recommendation confidence + league-market intelligence — DISCOVERY CANDIDATE**.
4. **Decision-impacting injury/news intelligence and notifications — DISCOVERY CANDIDATE**, only after trustworthy-source feasibility.
5. **Playoff probability / championship-path modeling — DISCOVERY CANDIDATE**, only after calibrated-model prerequisites.
6. **ESPN write actions — LATER GATED**, requiring a separately authorized milestone and explicit confirmation safeguards.

Detailed older discovery input remains in `docs/post-1.0-roadmap-candidates.md`; where it conflicts with explicit product-owner authorization, this roadmap and ACTIVE_TASKS control current routing.
