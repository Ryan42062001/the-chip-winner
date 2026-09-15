# In-Season Strategy Handoff

HANDOFF

Task ID: TCW-022  
Role: In-Season Strategy & Decision Intelligence Analyst  
Status: STRATEGY CONTRACT COMPLETE / PR VALIDATION PENDING

## Verified starting state

- Repository: `Ryan42062001/the-chip-winner`
- Canonical branch: `master`
- Fast Refresh canonical master: `3a4df7cf812ecdf409f6c59149aa79db169daadb`
- Assigned branch: `strategy/tcw-022-trade-analyzer-policy`
- Branch was verified at the exact canonical master before Strategy writes.
- Workflow: canonical V3.1 overlay active.
- `ACTIVE_TASKS.json` is machine-authoritative and lists TCW-022 as `ASSIGNED`, owner `Strategy`, dependency `INDEPENDENT`, execution mode `STANDARD_CHAT`, merge authority `Manager`.
- Strategy's prior handoff contained an older assignment checkpoint; current `master` plus `ACTIVE_TASKS.json` were used as the authoritative refreshed state.

## Work completed

Created:

- `.ai/strategy/TCW-022_TRADE_ANALYZER_POLICY.md`

The contract defines Trade Analyzer v1 as a roster-consequence analyzer rather than a hidden package-value score. It specifies:

- deterministic proposal/identity validation;
- direct versus resolved post-trade roster state;
- explicit unequal-count roster-space handling;
- no silent follow-up drop or free-agent add;
- pre/post best legal lineup comparison by projection source;
- current-week lock/actionability treatment;
- starter-versus-bench consequence;
- listed-position depth plus legal contingency coverage;
- ESPN free-agent replacement context where supported;
- narrow `COVERED` / `THIN` / `SCARCE_THIN` / `DANGEROUS` fragility semantics;
- deterministic bye-gap comparison;
- compatible complete future-window and playoff-window gates;
- source disagreement without averaging;
- inspectable evidence states instead of a numeric confidence score;
- explicit team-objective framing that cannot change source facts;
- primary conclusion taxonomy;
- missing-data policy;
- Builder-facing output/acceptance requirements;
- synthetic acceptance scenarios covering every Manager-required case;
- explicit non-blocking future R&D questions and v1 exclusions.

## Key Strategy decisions

1. **Team consequence, not package arithmetic.** The immediate metric is the change in the user's optimized legal lineup, not summed player projections or rankings.
2. **Unequal-count trades expose the second transaction.** A 2-for-1 reports the open roster spot and optional replacement separately; a 1-for-2 on a full roster returns `ROSTER_ACTION_REQUIRED` until an explicit follow-up drop resolves the final roster.
3. **No fake legal lineup.** An over-capacity provisional roster may not be labeled the final legal post-trade roster.
4. **Complete coverage before numeric trade conclusions.** Source-specific pre/post numeric deltas require complete active pre/post union-roster projection coverage. Future/playoff aggregates require every selected week complete.
5. **Sources remain separate.** Material ESPN/external disagreement becomes `SOURCE_DISAGREEMENT`; values are never averaged into a winner score.
6. **Depth is not one score.** Raw listed-position depth and legal contingency coverage are exposed separately.
7. **Dangerous fragility is narrow.** Ordinary depth loss is not automatically fatal; `DANGEROUS` requires a supported-horizon lineup gap plus no verified replacement path (or a known constraint blocking it).
8. **Objective framing is explicit.** `BALANCED`, `CURRENT_WEEK_STABILITY`, and `FUTURE_UPSIDE` may change narrative preference only, never the underlying facts or formulas.

## Evidence used

- `.ai/shared/WORKFLOW.md`
- `.ai/shared/WORKFLOW_V3_1.md`
- `.ai/shared/ACTIVE_TASKS.json`
- `.ai/manager/tasks/TCW-022.md`
- `.ai/roles/STRATEGY.md`
- `docs/post-1.0-roadmap-candidates.md`
- `src/domain/lineup-optimizer.js`
- `src/domain/recommendations.js`
- `src/domain/roster-planning.js`
- `src/domain/waiver-engine.js`
- `src/domain/scenario-planner.js`
- `src/domain/season-intelligence.js`
- `src/providers/espn/espn-normalizer.js`
- `src/providers/projections/future-projection-provider.js`
- `docs/season-playoff-intelligence.md`
- `docs/projection-source-research.md`
- `.ai/manager/evidence/TCW-020_START_SIT_LOCK_REMEDIATION_INTEGRATION.md`
- `.ai/manager/evidence/TCW-021_CUSTOM_FLEX_SCOPE_INTEGRATION.md`

## R&D dependencies

Blocking R&D dependency: **NONE** for the approved v1 Strategy contract.

Non-blocking future questions are recorded in the policy artifact for ESPN trade-processing rules, trade-market/acceptance modeling, calibrated playoff probability, and new injury/news sources. They are explicitly out of v1 scope.

## Files updated

- `.ai/strategy/TCW-022_TRADE_ANALYZER_POLICY.md`
- `.ai/strategy/HANDOFF.md`

No production code, UI, Manager-owned task scope, or `.ai/shared/*` coordination file was modified.

## Open findings

- Exact ESPN trade-processing legality (trade deadlines, veto/review behavior, locked-player transaction handling, undroppable rules) is intentionally not claimed by v1 and would require separate R&D before product assertions.
- Release 1.0 `FV-SEASON-01` remains independent/event-gated and does not block TCW-022 Strategy design.

## Blocking issues

None for Strategy contract completion.

## Recommended next role

Manager / Architect after the Strategy PR has passed exact-head CI.

## Exact next action

Open the Strategy PR against `master`, verify CI on the exact PR head, then stop for Manager review. Strategy must not merge its own PR.

## Checkpoint / SHA

- Canonical starting master: `3a4df7cf812ecdf409f6c59149aa79db169daadb`
- Policy artifact commit: `b03e77fcecd0f37913c85a3f89366f307f0501bb`
- Final Strategy PR head: verify from PR metadata after this handoff commit.
