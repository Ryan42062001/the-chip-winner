# The Chip Winner — Canonical Project State

Last reconciled: 2026-09-08
Manager task: TCW-004 — evidence-wave integration

## Repository

- Repository: `Ryan42062001/the-chip-winner`
- Protected default branch: `master`
- Package version: `0.9.88`
- Canonical `.ai` workflow was bootstrapped by TCW-001.
- TCW-001 bootstrap merge checkpoint: `40b2ae7fbf024976753250b969c18f03373aa83b`.
- TCW-001 closeout checkpoint: `110f198145ad117902e79768239151f8ddb769eb`.
- TCW-002 Auditor handoff merged through PR #54 at `b63f162f1ae0c3267c543819622d21d2c780ce70`; post-merge workflow #417 passed test, deploy, and production verification.
- TCW-003 authoritative R&D handoff merged through PR #56 at `f714cab4b8a50c876510c332faea42102428d638` after exact-head CI passed. Duplicate PR #55 was closed unmerged as superseded.
- TCW-002 and TCW-003 changed only their role handoff files under `.ai/`; neither changed production behavior or field status.

## Product boundary

The Chip Winner is an ESPN-only, read-only, in-season fantasy-football decision companion. ESPN is authoritative for league state, roster rules, availability, locks, acquisition state, and other connected-league facts. External rankings/projections are independent overlays. Derived recommendations never mutate source snapshots. ESPN write actions remain outside Release 1.0.

## Architecture

Four primary layers remain established:

1. Provider layer — ESPN acquisition/normalization/caching and external projection/ranking overlays.
2. Domain layer — normalized model, selectors, optimizers, scenarios, legality, and recommendations.
3. Application layer — single state owner and explicit browser/application transitions.
4. Interface layer — rendering and interaction without source normalization or a second state store.

Key areas remain:

- `src/providers/espn/`
- `src/providers/projections/`
- `src/providers/rankings/`
- `src/domain/`
- `src/application/`
- `src/ui/`
- `src/models/`
- `src/sync/` and `worker/`
- `schema/`
- `test/`

## Completed major work

Verified from repository documentation, current history, and independent audit:

- Read-only authenticated ESPN companion path is implemented.
- Waiver Engine v2 reviewed deterministic scope is complete as of v0.9.69.
- Season/Playoff Intelligence reviewed deterministic scope is complete as of v0.9.70.
- Automatable production-readiness engineering is complete as of v0.9.71.
- Evidence-backed Release 1.0 field-validation registry exists as of v0.9.72.
- Subsequent field-driven fixes and validation advanced through v0.9.88.
- Authenticated standard ESPN workflow validation is passed in the registry.
- TCW-001 canonical workflow bootstrap is merged and production-verified.
- TCW-002 independently audited the v0.9.88 Release 1.0 baseline and returned `PASS WITH NON-BLOCKING FINDINGS`.
- TCW-003 completed current ESPN field-validation feasibility research; its research does not itself pass or fail any field check.

## Current milestone

### Release 1.0 — trustworthy read-only companion

Status: ACTIVE — FIELD VALIDATION

The reviewed deterministic implementation baseline remains substantially complete. The active milestone is evidence-backed field validation and final release gating, not broad product expansion.

## Release 1.0 field gate

Machine-readable status source: `config/field-validation.json`.

Verified status during TCW-004 reconciliation: **6 passed / 7 pending**.

Passed:
- FV-A11Y-01
- FV-A11Y-03
- FV-MOBILE-01
- FV-ESPN-01
- FV-ESPN-03
- FV-SYNC-01

Pending:
- FV-A11Y-02
- FV-ESPN-02
- FV-ESPN-04
- FV-ESPN-05
- FV-SEASON-01
- FV-RECOVERY-01
- FV-WAIVER-01

No TCW-002/TCW-003 research or audit result changes those field statuses. Release 1.0 remains blocked until every registry item is passed with privacy-safe evidence and the final release PR/master production gates are green.

## Evidence-wave results

`TCW-PW-001` is complete once TCW-004 reconciliation merges.

### TCW-002 — Auditor

Verdict: `PASS WITH NON-BLOCKING FINDINGS`.

Accepted findings:

- `TCW-002-F01` — MEDIUM, non-blocking: `AGENTS.md` still named older `docs/roadmap.md` as the active backlog/completion authority despite the merged canonical `.ai/shared/*` hierarchy. TCW-004 reconciles this guidance without rewriting roadmap history.
- `TCW-002-F02` — LOW, non-blocking: legacy documentation/metadata drift remains in `docs/next-codex-task.md`, historical wording in `docs/roadmap.md`, and `config/field-validation.json` `baselineVersion: 0.9.81` versus package v0.9.88. These remain explicit discrepancies rather than silently edited history.

### TCW-003 — R&D

Authoritative handoff: PR #56. Duplicate PR #55 was closed as superseded.

Accepted feasibility findings:

- FV-RECOVERY-01 is safe to exercise now with a real temporary network failure/reconnect.
- FV-ESPN-05 is time-windowed and should use a naturally relevant pre/post-kickoff or availability transition.
- FV-ESPN-02 requires a materially different authenticated custom FLEX/OP league state.
- FV-ESPN-04 is naturally occurring/opportunity-dependent.
- FV-SEASON-01 is staged/seasonal; some playoff/fallback evidence can be observed earlier, while bye and complete future-window evidence depend on real season/source state.
- FV-WAIVER-01 remains coverage/observability-dependent; the domain exposes `consideredAdds`, `completeAdds`, `scenarioCount`, and `qualifiedAdds`, while the normal UI does not clearly expose the complete tuple.

Manager independently confirmed two R&D code observations:

1. A failed ESPN refresh leaves the previous valid `live-companion` snapshot in place; current `hydrateControls()` still labels such a snapshot `Live ESPN snapshot`. This is a verified code observation and a potential field failure, not yet a passed/failed field result.
2. The Chrome companion's ESPN availability query currently requests `kona_player_info` with `limit: 100`. Whether that materially truncates the relevant live availability universe remains unverified.

R&D also identified a whole-period lock-policy coverage risk: ESPN supports a first-game-of-period lock mode, while the current normalized live model does not preserve a league-level lock mode. No production defect is declared without a relevant live configuration/observation.

## Active coordination work after TCW-004

- `TCW-005` — FV-RECOVERY-01 Live Failure/Reconnect Validation — Auditor / QA — ACTIVE after TCW-004 merges.
- Manager remains active for Release 1.0 field-gate orchestration and evidence integration.
- Builder remains IDLE until a field run reproduces an implementation defect or Manager approves an implementation-ready requirement.
- R&D returns IDLE after TCW-003.
- Strategy remains IDLE because no recommendation-policy uncertainty was identified.

## Test and release infrastructure

`package.json` provides `npm test`, `npm run eval:model`, `npm run check`, field-status, smoke, accessibility, mobile, extension, performance, readiness, security, and production-smoke commands.

`.github/workflows/deploy-pages.yml` runs a `test` job for pull requests and master pushes, then `deploy` and `verify-production` on master pushes. Documentation/coordination changes remain subject to the same protected branch/PR workflow.

## Current focus

1. Execute TCW-005 against the deployed app using a real temporary network disconnect/reconnect and capture privacy-safe evidence.
2. If TCW-005 reproduces stale/live mislabeling or another deterministic failure, route an implementation-ready Builder remediation and require field retest after merge.
3. Use the next naturally relevant Week 1 kickoff/availability transition for FV-ESPN-05; do not manufacture a recommendation solely for validation.
4. Seek access to an existing materially different ESPN LM custom FLEX/OP league for FV-ESPN-02 without reconfiguring the primary league just to manufacture evidence.
5. Observe FV-ESPN-04 IR edge states naturally and accumulate FV-SEASON-01 evidence as the season/source state permits.
6. For FV-WAIVER-01, prefer privacy-safe aggregate-only observation tooling if needed; do not reopen waiver selection policy or add hidden candidate caps merely to collect evidence.
7. Preserve Release 1.0 read-only scope and the existing fail-closed identity/missing-data/IR/lock boundaries.

## Known limitations / gated work

- Screen-reader field validation remains incomplete.
- Authenticated custom FLEX/OP field validation remains incomplete.
- Real ESPN IR-edge and lock/availability transition validation remains incomplete.
- Real playoff/bye intelligence field validation remains incomplete.
- Live recovery/reconnect validation remains incomplete and is the next active field task.
- Real waiver enumeration/timing evidence remains incomplete.
- Internal ESPN JSON endpoints/views remain observed integrations rather than a documented public ESPN API contract.
- Trade analysis, external notifications, future-only IR-assisted stash discovery, playoff probability modeling, server-side models, and ESPN write actions remain gated future work.

## Reconciliation findings

The following repository artifacts remain intentionally recorded as stale or historical relative to newer verified state:

- `docs/next-codex-task.md` still describes an expected v0.9.76 checkpoint.
- `docs/roadmap.md` contains historical status language from earlier Release 1.0 execution even though work advanced through v0.9.88.
- `config/field-validation.json` has `baselineVersion: 0.9.81` while package version is v0.9.88; current item statuses/evidence remain the authoritative field-check state.

TCW-004 resolves the source-of-truth ambiguity in `AGENTS.md` by making `.ai/shared/*` the canonical coordination layer while retaining `docs/roadmap.md` and `docs/advanced-roadmap.md` as product/history/detail sources. It does not cosmetically rewrite historical evidence or alter field status.