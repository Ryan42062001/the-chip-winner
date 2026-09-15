# The Chip Winner — Canonical Roadmap

Last reconciled: 2026-09-15
Current work: Release 1.0 event-gated field validation + Trade Analyzer v1 audit remediation

## Current milestone state

### M1 — Release 1.0 trustworthy read-only companion

Status: ACTIVE — FIELD VALIDATION EVENT-GATED

Authoritative live field status is `config/field-validation.json`.

Sole remaining blocker:
1. FV-SEASON-01 — real playoff/bye intelligence states.

Registry field gate remains **10 passed / 1 pending**.

The remaining field check requires a genuine season condition and must not be manufactured merely to create work.

### Trade Analyzer v1

Status: DEPLOYED — AUDIT REMEDIATION ACTIVE

Completed:
1. TCW-022 Strategy contract — accepted.
2. TCW-023 production implementation — Manager reviewed, merged, deployed, and production-verified.
3. TCW-024 independent audit — FAIL accepted by Manager.

Accepted TCW-024 findings:
- F01 HIGH — replacement-path eligibility/full-pool defect can falsely produce DANGEROUS;
- F02 HIGH — explicit current locks leak into future/playoff optimization;
- F03 MEDIUM — unverified contingency becomes THIN instead of unknown;
- F04 LOW — dedicated accessibility/mobile loops omit Trade Analyzer.

Auditor PR #111 exact head `d6c506b2cd504e12133a335979c2b399da7f0f2b` passed workflow #561. Audit evidence merged as control-plane master `1407da4043fbdf9ced1ef19b81dbc564d798ada6`; master workflow #562 passed and correctly skipped deploy/production because only `.ai/**` changed.

Active:
4. TCW-025 Builder remediation of F01-F04 under the Workflow V3.1 reproduced-defect fast lane.

No Strategy/R&D/Troubleshooting detour is required because the defects are deterministic and the accepted policy is clear.

## Trade Analyzer v1 protected boundary

Remediation must preserve:
- roster consequence rather than a hidden package score;
- connected user's team;
- 1-for-1 and multi-player / unequal-count hypothetical packages;
- explicit roster-space/follow-up-drop consequences;
- pre/post best legal lineup impact;
- source separation and missing-data honesty;
- complete-only future/playoff math using mean-weekly materiality;
- read-only behavior with no ESPN trade write action;
- accepted TCW-022 conclusion precedence except where a defect currently fabricates a conclusion.

## Immediate dependency order

1. Builder completes TCW-025 and opens one exact-head green production PR.
2. Manager reviews scope and accepted-finding coverage.
3. If accepted, Manager merges and verifies master CI, GitHub Pages deployment, and production behavior.
4. Manager routes an Independent Auditor retest of TCW-024-F01 through F04 against the exact deployed remediation target.
5. If retest PASS CANDIDATE is accepted, close the Trade Analyzer v1 remediation loop.
6. Complete `FV-SEASON-01` only when genuine qualifying season evidence exists.

## Release 1.0 exit gate

Release 1.0 may close only when every scoped item remaining in `config/field-validation.json` is passed with privacy-safe evidence, no unresolved blocking defect remains, final CI/deployment verification is green, and the product remains read-only.

Trade Analyzer work does not waive or alter that exit gate.

## Product roadmap after explicit Trade Analyzer authorization

1. **Trade Analyzer v1 — AUDIT REMEDIATION ACTIVE**.
2. **GM Action Plan / recommendation synthesis — DISCOVERY CANDIDATE**.
3. **Recommendation confidence + league-market intelligence — DISCOVERY CANDIDATE**.
4. **Decision-impacting injury/news intelligence and notifications — DISCOVERY CANDIDATE**, only after trustworthy-source feasibility.
5. **Playoff probability / championship-path modeling — DISCOVERY CANDIDATE**, only after calibrated-model prerequisites.
6. **ESPN write actions — LATER GATED**, requiring separately authorized scope and confirmation safeguards.

Detailed older discovery input remains in `docs/post-1.0-roadmap-candidates.md`; where it conflicts with explicit product-owner authorization, this roadmap and ACTIVE_TASKS control current routing.
