# The Chip Winner — Canonical Project State

Last reconciled: 2026-09-14
Current operating state: Release 1.0 field validation event-gated + Trade Analyzer v1 independent audit

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

TCW-022 produced and Manager accepted `.ai/strategy/TCW-022_TRADE_ANALYZER_POLICY.md` after bounded rework defined deterministic mean-weekly future materiality and cross-horizon conclusion precedence.

### Production implementation

TCW-023 is CLOSED after accepted production integration.

Builder PR #109 implemented the bounded v1 contract without changing Strategy policy or the field-validation registry.

Verified production integration:
- Builder PR exact head `5c492f22ce7ab107771d946ee318c2ac5665ce16`;
- exact-head workflow #556 full gate PASS;
- merged production master `e112156deedf453fb3e0081412c07e2e15c0256d`;
- master workflow #557 full test gate PASS;
- GitHub Pages deploy PASS;
- production release smoke PASS.

Trade Analyzer v1 now includes read-only multi-player proposal analysis, roster legality/space handling, pre/post best legal lineup consequence, depth/fragility, supported replacement/bye/future/playoff context, source separation, inspectable conclusion precedence, and a first-class production UI. It intentionally has no ESPN trade mutation path and no hidden trade/winner/confidence score.

Durable integration evidence:
- `.ai/manager/evidence/TCW-023_TRADE_ANALYZER_INTEGRATION.md`

### Independent audit

TCW-024 is the active Manager-approved task. Independent Auditor / QA must audit the exact deployed target `e112156deedf453fb3e0081412c07e2e15c0256d` without relying on Builder's conclusions.

The audit must not fabricate Level-4 authenticated/private ESPN evidence. Where such evidence is genuinely required but unavailable, the correct result is an explicit validation-level limitation rather than an invented field verdict.

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

Current active lane: TCW-024 Independent Auditor / QA review of Trade Analyzer v1.

Builder, Strategy, R&D, and Troubleshooting are idle unless a concrete audit finding or genuine dependency requires them.

## Known gated work

`FV-SEASON-01` remains the sole Release 1.0 field item and requires genuine playoff/bye-season state.

Custom OP/Superflex field certification is not a Release 1.0 gate under TCW-D013.

The older post-1.0 roadmap candidate list remains discovery input; explicit product-owner Trade Analyzer authorization controls current sequencing.
