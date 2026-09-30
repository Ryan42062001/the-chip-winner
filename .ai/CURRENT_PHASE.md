# Current Phase

State: BUILDING

## Identity

- Phase: TCW-P02 — Release 1.0 Field Validation Closure
- Product owner: Ryan
- Phase branch: `phase/tcw-p02-release-1-0-field-validation`
- Activation baseline: `044f8f0e01cf53c8a89665d4cf2db4aa61c70e43`
- Risk: LOW
- Production deployment: NOT AUTHORIZED
- ESPN write access: NOT AUTHORIZED

## Objective

Close the one remaining Release 1.0 field-validation item, `FV-SEASON-01 — Real playoff and bye intelligence states`, using privacy-safe evidence from Ryan's real read-only ESPN league. If the real-world check exposes a deterministic product defect, stop the validation-only path and explicitly expand/reclassify remediation rather than marking the item passed.

## Scope

- Validate ESPN playoff-week boundaries or the clearly labeled local fallback against the real connected league.
- Validate real fantasy playoff-opponent behavior where ESPN state is available; missing future opponents must remain visibly unavailable rather than inferred.
- Validate bye-week intelligence against real roster/player state.
- Validate partial versus complete future-projection behavior and confirm incomplete windows remain withheld.
- Preserve FantasyPros SOS as an independent imported overlay rather than an ESPN fact.
- Record only concise privacy-safe evidence in `config/field-validation.json`.
- Run the Release 1.0 field registry checks and normal V2.1 validation after evidence is accepted.

## Non-goals

- Manufacturing ESPN states or transactions to satisfy the checklist.
- ESPN lineup, waiver, add/drop, or trade writes.
- New provider integrations or package-value sources.
- Trade Winner value-meter work.
- Changing season/playoff algorithms merely to make the field check pass.
- Broadening or repopulating retired historical field-check items not present in the active registry.
- Production deployment or Release 1.0 labeling before the exact release candidate separately satisfies the release/deployment gates.

## Ordered implementation objectives

1. Preserve the current one-pending-item field registry as the source of truth.
2. Prepare a minimal owner verification script for `FV-SEASON-01`.
3. Ryan exercises the Season Plan / relevant real-league surfaces read-only and reports the observed states.
4. Compare the observations with the expected fail-closed behavior and current ESPN/local-fallback boundaries.
5. If the result is acceptable, update only `FV-SEASON-01` to `passed` with privacy-safe evidence.
6. Run `npm run field:status` and `npm run field:status -- --require-complete` plus normal FAST validation.
7. Complete whole-phase preview, Phase Sync, exact-head FULL validation, and LOW-risk audit-skip review if the diff remains evidence-only.
8. Merge only after Ryan explicitly authorizes the exact approved candidate.
9. Complete Closure Sync and closure FAST; production deployment remains separate.

## Acceptance criteria

- `FV-SEASON-01` is not marked passed until real read-only league evidence supports the required playoff/bye/future-projection claims.
- ESPN playoff boundaries are either verified from ESPN state or a local fallback is visibly labeled as such.
- Missing fantasy playoff opponents remain missing/withheld rather than inferred.
- Bye intelligence matches the real roster/player state that is actually available.
- Partial future-projection coverage is visibly partial/withheld; complete supported coverage may produce the corresponding aggregates.
- FantasyPros SOS remains independently attributed and does not masquerade as ESPN playoff evidence.
- No private league snapshot, cookie, token, member name, private sync URL, or credential is committed.
- The active field registry reaches 11/11 passed only if the real evidence is acceptable.
- No ESPN mutation path or production-deployment behavior is changed.

## Required automated validation

- FAST CI: Speed Workflow V2.1 contract validation and normal repository FAST checks.
- Field registry: `npm run field:status`.
- Release 1.0 evidence gate: `npm run field:status -- --require-complete` after and only after the item is legitimately passed.
- FULL PHASE CI: deliberate exact-head validation before freeze/merge.
- If any product implementation is required, re-evaluate risk and add focused regression coverage before continuing.

## Human preview requirements

- Ryan reviews the Season Plan and any directly relevant league/setup surface against the real ESPN league.
- The UI must make authoritative ESPN state, labeled local fallback, imported projection evidence, and unavailable/partial states understandable without hidden inference.
- Any unexpected or misleading result blocks passage of `FV-SEASON-01`.

## Owner-only verification

Ryan performs the `FV-SEASON-01` check in his real read-only ESPN environment. Do not share or commit ESPN credentials, cookies, private league snapshots, member names, or private mobile-sync links. Capture only privacy-safe observations needed to establish playoff-week/fallback behavior, playoff-opponent availability, bye coverage, and partial/full future-projection behavior.

## Exit criteria

- Owner-only `FV-SEASON-01` verification is accepted.
- Active field registry reaches 11/11 passed.
- `npm run field:status -- --require-complete` passes.
- Whole-phase preview approved.
- Phase Sync complete.
- Exact candidate FULL PHASE CI passes.
- LOW-risk audit skip is recorded only if the final diff remains evidence/docs-only with no product/security/data-integrity behavior change; otherwise use the audit appropriate to the revised risk.
- Ryan explicitly authorizes merge of the exact approved target.
- Post-merge FAST, Closure Sync, and closure FAST pass.
- Production remains undeployed unless Ryan separately authorizes the manual Release 1.0 deployment gate.

## Stop conditions

- Any real-world observation that contradicts current season/playoff logic or source labeling.
- Any need to infer or manufacture missing ESPN state to make the checklist pass.
- Any code change beyond evidence/docs bookkeeping without explicit risk re-evaluation.
- Any ESPN write-path implication, credential/cookie exposure, destructive action, or production-deploy implication without separate authorization.
