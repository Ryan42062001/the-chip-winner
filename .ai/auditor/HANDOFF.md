# Auditor Handoff — TCW-018

Independent disposition: **FAIL — REPRODUCED DEFECT**

## Audit scope

TCW-018 independently evaluates the real deployed authenticated evidence for `FV-ESPN-05 — Authenticated lock and availability transitions`. No product code or field-registry state is modified by this Auditor task.

## Verified starting state

- Fast Refresh verified `master` at `f903370f519b11cc46d06bf478300485937a6d54`.
- Workflow V3.1 is active and `.ai/shared/ACTIVE_TASKS.json` assigns TCW-018 to Auditor on `auditor/tcw-018-lock-field-retest` with Manager merge authority.
- `config/field-validation.json` still records `FV-ESPN-05` as `pending` before this verdict.
- The field contract requires one real lock/availability transition across deployed refreshes and requires prior advice to be revalidated, withdrawn, marked unavailable, or otherwise made non-actionable when required.
- Current master workflow #501 / run `34771407366` completed successfully at the exact master SHA. The test gate passed; deploy and production verification were skipped because the Manager checkpoint refresh was control-plane-only.

## Privacy-safe real field evidence reviewed

Manager intake records one genuine pre-kickoff -> post-kickoff ESPN transition:

- Before kickoff, ESPN showed one starting player with `MOVE` available and a 1:00 PM game.
- The deployed app refreshed successfully before the lock.
- Pre-lock Lineup Lab showed that player at 15.9 versus a later-game roster player at 17.9 and rendered a projection lean toward the later-game player; the complete-lineup optimizer did not identify an action clearing its threshold.
- After kickoff, ESPN showed the 1:00 PM player in an active first-quarter game state and the `MOVE` control was gone.
- No roster transaction or simulated lock state was used.
- One post-lock deployed refresh entered the retained-snapshot failure state; a follow-up refresh succeeded and restored `Live ESPN snapshot`.
- Post-lock Lineup Lab explicitly reported `7 roster locks respected because ESPN reported a lock or kickoff passed.`
- The complete-lineup optimizer returned a 0.0-point edge and `no change is recommended`.
- The separate START / SIT comparison remained selectable after the player locked and continued to render the same 15.9 vs 17.9 `PROJECTION LEAN` toward the later-game player.
- The separate FantasyPros weekly-source disagreement remained visible.
- Waivers remained usable and showed no priority move in the observed state.

No private ESPN credentials, cookies, league/member identifiers, raw private snapshot, private URL, or sync secret is preserved here.

## Independent implementation review

The complete-lineup optimizer is correctly lock-aware:

- `getLineupLockReason` recognizes both explicit ESPN lock flags and passed kickoff timestamps.
- locked starters are pinned to their existing supported starting slot;
- locked bench players cannot be promoted after kickoff;
- deterministic optimizer tests cover explicit locks and passed-kickoff locks.

The generic START / SIT comparison is a separate code path and is not lock-aware:

- `renderLineup()` labels the surface `START / SIT` and `Compare roster players`.
- it passes the selected players to `compareRosterPlayers(...)` without any separate lock qualification.
- `compareRosterPlayers(...)` validates only roster membership, player identity, projections, and comparison completeness/freshness. It does not inspect roster-entry locks, player locks, or kickoff passage.
- when the projection difference is at least the 1-point threshold, it returns `status: "preference"`, a preferred player, and reason `Higher available projection` even when one selected player is already locked.
- `renderStartSitComparison(...)` presents that result as `PROJECTION LEAN` and visually marks the preferred player. It does not state that a locked player can no longer be started/sat or that the comparison is informational only.
- existing start/sit tests verify preference/tie/missing-data/source behavior but contain no locked-player or post-kickoff comparison case.

The surviving comparison therefore is not merely raw reference data. Its placement and language are explicitly start/sit decision guidance, and the successful post-lock refresh did not make that guidance non-actionable.

## Finding

### TCW-018-F01 — MEDIUM — BLOCKING

**REQUIREMENT**  
FV-ESPN-05 requires a real lock/availability transition and requires prior advice to be revalidated, withdrawn, marked unavailable, or otherwise made non-actionable when the real ESPN state makes the prior action unavailable.

**EVIDENCE**  
The real post-kickoff refresh correctly caused the complete-lineup optimizer to respect seven locks and recommend no change, but the separate START / SIT comparison continued to show the locked player versus the later-game player with the same `PROJECTION LEAN`. Static review confirms `compareRosterPlayers(...)` has no lock or kickoff check, while the UI labels the surface START / SIT and renders a preferred player.

**FAILURE**  
A post-lock comparison involving a player who can no longer be moved remains presented as current start/sit preference guidance without a lock-specific unavailable/non-actionable qualification.

**IMPACT**  
The user can receive contradictory lineup-decision signals after a genuine lock: the authoritative optimizer says locks are respected and no change is recommended, while the adjacent start/sit tool still presents a preferred player as though the comparison remains actionable. The app is read-only and ESPN prevents the impossible transaction, so the defect is bounded to recommendation trust rather than transaction integrity.

**REQUIRED REMEDIATION**  
Make the START / SIT comparison lock-aware. When either selected player's current roster state is locked by ESPN or by passed kickoff, the comparison must not render an unqualified actionable preference that implies a now-impossible lineup change. The smallest acceptable behavior may be to withhold the preference, mark the comparison locked/non-actionable, or clearly qualify it as informational while stating the affected player cannot be moved. Preserve source separation and normal unlocked comparison behavior.

**VALIDATION NEEDED**  
Add deterministic coverage for at least explicit-lock and passed-kickoff comparison cases, including UI rendering that cannot present an unqualified actionable preference for the locked scenario. Preserve existing unlocked preference/tossup/missing/source-separation behavior. After remediation merges/deploys, perform a real authenticated post-lock retest before Manager marks FV-ESPN-05 passed.

**CONFIDENCE**  
HIGH

## Contract assessment

The real transition itself is valid Level-4 field evidence, and the optimizer portion behaved correctly. FV-ESPN-05 nevertheless does **not** pass because another live start/sit recommendation surface remained stale/actionable after the successful post-lock refresh.

The retained-snapshot failure followed by a successful recovery does not change this verdict: the defect is visible after `Live ESPN snapshot` was restored.

## Verification matrix

| Dimension | Result | Evidence |
| --- | --- | --- |
| Static/code review | FAIL | generic START / SIT comparison path ignores lock/kickoff state while rendering a preferred player |
| Deterministic automated tests | FAIL | optimizer lock tests exist, but start/sit comparison tests do not cover locked or post-kickoff players |
| Exact current-master CI | PASS | workflow #501 / run `34771407366` test gate passed at `f903370...`; passing suite does not cover this defect |
| Exact-head Auditor PR CI | PENDING — ROLE OWNED | verify after Auditor handoff PR is opened |
| Post-merge master verification | PENDING — MANAGER OWNED | Auditor does not merge its own PR |
| Production/deployed verification | FAIL | after successful post-lock live refresh, stale START / SIT projection preference remained visible for the locked player |
| Real field validation | FAIL | genuine unlocked -> locked transition reproduced stale actionable comparison guidance |

## Disposition

**FAIL — REPRODUCED DEFECT**

FV-ESPN-05 must remain pending. Manager should accept/triage TCW-018-F01 and use the Workflow V3.1 reproduced-defect fast lane if accepted.

## Field registry

`config/field-validation.json` was **not modified** by this task.

## HANDOFF

**Task ID:** TCW-018  
**Role:** Independent Auditor / QA  
**Status:** COMPLETE — FAIL — REPRODUCED DEFECT  
**Verified starting state:** `master` `f903370f519b11cc46d06bf478300485937a6d54`; TCW-018 assigned to Auditor; FV-ESPN-05 pending.  
**Work completed:** Independently reviewed the real pre/post game-lock evidence, field contract, complete-lineup optimizer lock behavior, generic START / SIT comparison behavior, existing deterministic coverage, and exact-current-master CI state.  
**Evidence produced:** TCW-018-F01 (MEDIUM, blocking): generic START / SIT comparison remains unqualified/actionable after a selected roster player locks even though the complete-lineup optimizer correctly respects the lock.  
**Files updated:** `.ai/auditor/HANDOFF.md` only.  
**Open findings:** TCW-018-F01 — MEDIUM — BLOCKING.  
**Blocking issues:** FV-ESPN-05 cannot pass until the stale post-lock START / SIT comparison behavior is remediated and independently field-retested.  
**Recommended next role:** Manager / Architect, then Builder if the finding is accepted.  
**Exact next action:** Manager reviews TCW-018-F01; if accepted, scope the smallest lock-aware START / SIT remediation and route the Workflow V3.1 defect fast lane to Builder, followed by deployed Auditor retest.  
**Checkpoint / SHA:** Audited `master` `f903370f519b11cc46d06bf478300485937a6d54`; Auditor branch starts from that exact checkpoint.
