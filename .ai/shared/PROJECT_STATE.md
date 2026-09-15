# The Chip Winner — Canonical Project State

Last reconciled: 2026-09-15
Current operating state: Release 1.0 field validation event-gated + Trade Analyzer v1 audit remediation

## Repository

- Repository: `Ryan42062001/the-chip-winner`.
- Default branch: `master`.
- Workflow V3.1 is canonical through `.ai/shared/WORKFLOW_V3_1.md` over `.ai/shared/WORKFLOW.md`.
- `.ai/shared/ACTIVE_TASKS.json` is machine-authoritative for current task routing.
- `config/field-validation.json` is separately authoritative for Release 1.0 field status.

## Product boundary

The Chip Winner remains an ESPN-only, read-only, in-season fantasy-football decision companion. ESPN owns connected-league state. External rankings/projections remain independent overlays. Derived recommendations do not mutate source snapshots. ESPN write actions remain outside the current product boundary.

## Release 1.0 field gate

Status remains **10 passed / 1 pending**.

Sole pending item:
- `FV-SEASON-01 — Real playoff and bye intelligence states`.

That field condition is naturally event-gated and must not be manufactured.

Removed from Release 1.0 scope rather than falsely marked passed:
- FV-A11Y-02 — manual screen-reader certification under TCW-D012;
- FV-ESPN-02 — custom FLEX/OP/Superflex field certification under TCW-D013.

Ordinary FLEX support and existing automated safeguards remain intact.

## Trade Analyzer v1

Product owner explicitly authorized Trade Analyzer ahead of the previously proposed GM Action Plan sequencing.

### Strategy

TCW-022 produced and Manager accepted `.ai/strategy/TCW-022_TRADE_ANALYZER_POLICY.md`. The policy remains frozen for the current remediation lane.

### Production implementation

TCW-023 is CLOSED after accepted production integration.

Verified implementation baseline:
- Builder PR #109 exact head `5c492f22ce7ab107771d946ee318c2ac5665ce16`;
- exact-head workflow #556 PASS;
- deployed production master `e112156deedf453fb3e0081412c07e2e15c0256d`;
- master workflow #557 test/deploy/production verification PASS.

Durable integration evidence:
- `.ai/manager/evidence/TCW-023_TRADE_ANALYZER_INTEGRATION.md`

### Independent audit

TCW-024 returned **FAIL**. Manager independently reviewed and accepted all four findings.

Accepted findings:
- `TCW-024-F01 — HIGH` — replacement-path eligibility/full-pool defect can falsely produce DANGEROUS.
- `TCW-024-F02 — HIGH` — explicit current lock state leaks into future/playoff optimization.
- `TCW-024-F03 — MEDIUM` — unverified contingency is asserted as THIN instead of remaining unknown.
- `TCW-024-F04 — LOW` — dedicated accessibility/mobile section loops omit Trade Analyzer.

Auditor PR #111 exact head `d6c506b2cd504e12133a335979c2b399da7f0f2b` passed workflow #561. Auditor evidence merged as control-plane master `1407da4043fbdf9ced1ef19b81dbc564d798ada6`; master workflow #562 passed the full test gate with deployment/production correctly skipped because only `.ai/**` changed.

Durable acceptance evidence:
- `.ai/manager/evidence/TCW-024_TRADE_ANALYZER_AUDIT_ACCEPTANCE.md`

Private authenticated Trade Analyzer behavior remains **UNVERIFIED AT LEVEL 4**. No private field state is manufactured or inferred.

### Active remediation

TCW-025 is the active Manager-approved Builder task.

Scope is limited to direct remediation of TCW-024-F01 through F04. No Strategy change, field-registry change, new data source, ESPN write behavior, hidden trade score, or unrelated feature expansion is authorized.

After Builder remediation, Manager must verify exact-head PR scope/CI, merge only if accepted, verify master deployment/production behavior, and then route an Independent Auditor retest under the Workflow V3.1 defect fast lane.

## Workflow V3.1 operating state

Permanent team:
- Manager / Architect
- Implementation Engineer / Builder
- In-Season Strategy & Decision Intelligence Analyst
- R&D
- Independent Auditor / QA

Troubleshooting & Root Cause remains temporary/on-demand.

## Active coordination state

See `.ai/shared/ACTIVE_TASKS.json`.

Current active lane: TCW-025 Builder remediation of accepted Trade Analyzer audit findings.

Strategy, R&D, and Troubleshooting are idle. Auditor waits for the deployed remediation retest target.

## Known gated work

`FV-SEASON-01` remains the sole Release 1.0 field item and requires genuine playoff/bye-season state.

Custom OP/Superflex field certification is not a Release 1.0 gate under TCW-D013.

The older post-1.0 roadmap candidate list remains discovery input; explicit product-owner Trade Analyzer authorization controls current sequencing.
