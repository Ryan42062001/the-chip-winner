# R&D HANDOFF — TCW-003

Task ID: TCW-003
Role: Research & Development
Status: COMPLETE — research complete; Manager review/integration required

## Verified starting state

- Repository: `Ryan42062001/the-chip-winner`
- Verified `master` checkpoint at task start: `110f198145ad117902e79768239151f8ddb769eb`
- Package version: `0.9.88`
- Current milestone: Release 1.0 trustworthy read-only companion — FIELD VALIDATION.
- `config/field-validation.json` still lists the six ESPN-heavy checks in this assignment as pending:
  - FV-ESPN-02
  - FV-ESPN-04
  - FV-ESPN-05
  - FV-SEASON-01
  - FV-RECOVERY-01
  - FV-WAIVER-01
- No prior `.ai/rnd/HANDOFF.md` existed on `master`.
- No open pull requests were present at task start.
- Task branch: `rnd/tcw-003-espn-field-feasibility`

## Work completed

- Refreshed the canonical project state, roadmap, decisions, workflow, TCW-003 task specification, field-validation policy/registry, ESPN IR policy, season/playoff policy, and relevant ESPN normalization/domain/UI code.
- Reviewed current official ESPN Fantasy Football support documentation for roster slots, OP/FLEX behavior, IR eligibility and invalid-roster behavior, lineup locks, waivers, and league/playoff settings.
- Reviewed the official 2026 NFL schedule for near-term kickoff and bye-week observation windows.
- Classified every ESPN-heavy pending Release 1.0 field check by practical feasibility without changing production behavior or manufacturing league/player state.
- Identified one observability limitation for FV-WAIVER-01: the domain already returns every required counter, but the current priority-panel UI does not directly expose all four counters.

## Field-check feasibility matrix

| Field check | Classification | Real-world preconditions | Safest practical observation path | Privacy-safe evidence |
| --- | --- | --- | --- | --- |
| **FV-ESPN-02 — custom FLEX/OP** | **REQUIRES-DIFFERENT-LEAGUE/STATE** | An authenticated ESPN Fantasy Football league whose actual roster configuration includes OP or another materially custom flexible-slot configuration. Prefer individual QB rather than Team QB. | Use an existing real League Manager league that already has OP/superflex-style configuration. Do **not** alter the primary league solely to force the state. If no such league exists, Manager may separately decide whether a dedicated real LM validation league configured before its draft is acceptable field evidence. | Date, browser, sanitized league-type/slot summary (for example `QB 1, OP 1, FLEX 1` without league/member names), app rendering result, and whether QB/RB/WR/TE eligibility matches ESPN. |
| **FV-ESPN-04 — IR edge states** | **SEASONAL / OPPORTUNITY-DEPENDENT** | A naturally occurring ESPN IR state: eligible OUT/IR bench player with capacity; filled IR capacity; an existing IR occupant changing OUT/IR -> Q/D; an existing IR occupant becoming healthy; or a genuinely unsupported ESPN designation. | Refresh around a real status transition. Prefer observing an existing IR occupant over performing roster transactions. If a current refresh already shows the league's IR slot filled, that capacity state can be documented immediately, but this session did not live-verify the user's current roster. Do not move a player merely to manufacture an edge case. | Sanitized designation/capacity transition, timestamps before/after refresh, resulting app IR classification and whether waiver advice proceeds/withholds/obsoletes. Player names are unnecessary. Never store the authenticated payload. |
| **FV-ESPN-05 — lock/availability transition** | **EXERCISE-NOW / SCHEDULED**, conditional on a relevant current recommendation | A current app recommendation involving a player/add whose real NFL game has not yet kicked off, or a recommendation involving a player whose ESPN availability naturally changes. | Preferred: capture the recommendation shortly before a real kickoff, refresh shortly after scheduled kickoff, and confirm lock-aware revalidation. This is entirely read-only. ESPN's default behavior locks players individually at scheduled kickoff, although LM leagues can use a first-game lock setting, so confirm the connected league setting rather than assuming it. If no recommendation touches the upcoming player, leave pending and use the next qualifying recommendation rather than forcing one. | Timestamps, sanitized recommendation type/player position, pre-kickoff state, post-kickoff lock/revalidation result, browser version. No league/member identity needed. |
| **FV-SEASON-01 — playoff/bye intelligence** | **SEASONAL / OPPORTUNITY-DEPENDENT**, with some subchecks exerciseable now | ESPN playoff settings/schedule; a rostered player whose NFL team is actually on bye for bye coverage; sufficient real weekly projection accumulation for any complete multiweek window. | Check playoff boundary/fallback and any already-reported fantasy playoff opponents now. For bye coverage, wait until a real current-week bye affects the selected roster. The current normalizer derives `byeWeek` from the **current-week** NFL scoreboard, so future bye coverage should not be inferred ahead of the actual scoring week. Validate partial projection withholding now; validate complete-window behavior only when real projection coverage exists. | Sanitized ESPN playoff-week setting or labeled fallback, opponent week/result without manager names, official NFL bye-week reference, coverage/completeness labels, and observed withheld/complete aggregates. |
| **FV-RECOVERY-01 — live failure/reconnect** | **EXERCISE-NOW** | A valid cached/live ESPN snapshot already loaded in the deployed app. | Safest controlled path: while the loaded page remains open, physically/OS-level disable network access, invoke **Refresh ESPN**, confirm the refresh fails while the last valid snapshot remains usable and is not labeled live, restore network, then refresh successfully. This satisfies the field check via an actual network failure without touching league state or credentials. | Date, OS/browser, pre-failure freshness state, failure message/state, confirmation that last valid data remained visible, reconnect success. No screenshot unless private league/member data is absent or redacted. |
| **FV-WAIVER-01 — candidate volume/timing** | **EXERCISE-NOW IF MULTIWEEK INPUTS ARE READY; otherwise COVERAGE-DEPENDENT** | Real authenticated availability/roster state, compatible selected-week projection set, explicit identity map, and enough current active-roster coverage for future discovery to run. | Record real Waivers navigation responsiveness and capture `consideredAdds`, `completeAdds`, `scenarioCount`, and `qualifiedAdds` from the current domain result. The domain already computes all four counters. If ordinary deployed UI evidence is required, Manager must decide whether to authorize a small observability task; otherwise a transient local read-only diagnostic/DevTools capture can record only the four integers and timing without persisting the private snapshot. Do not add a hidden candidate cap. | Four integer counters, selected projection weeks, browser/device, user-visible timing in ms or concise observed responsiveness, and whether exhaustive evaluation completed. Do not copy candidate names or raw league data. |

## Evidence and source separation

### Official ESPN-documented facts

1. **FLEX and OP eligibility.** ESPN's current `Roster Slots (Offense)` support article states that FLEX accepts RB/WR/TE, while Offensive Player Utility (OP) accepts any offensive roster slot. It specifically notes that individual QBs may be used in OP while Team QB cannot.
   - https://support.espn.com/hc/en-us/articles/115003939432-Roster-Slots-Offense
   - Article observed as updated April 2, 2026.

2. **League Manager roster customization.** ESPN documents that LM leagues can customize roster positions and starter/max counts. ESPN separately documents that after the draft only Bench and IR/IL slot counts can be changed; other position slots cannot be added/removed post-draft. This is why a current non-OP league should not be repurposed after the fact to satisfy FV-ESPN-02.
   - https://support.espn.com/hc/en-us/articles/115003902651-Roster-Settings
   - https://support.espn.com/hc/en-us/articles/360052215812-Adding-and-Removing-Bench-and-IR-IL-Slots-LM-Only

3. **IR eligibility and grandfathering.** ESPN's `Players on Injured Reserve (IR)` article, updated August 18, 2026, documents:
   - OUT and IR are eligible for IR;
   - a player already in IR who changes from OUT/IR to QUESTIONABLE or DOUBTFUL may remain without invalidating the roster;
   - a player who loses the injury designation while still in IR makes the roster invalid;
   - suspended players are not IR-eligible.
   - https://support.espn.com/hc/en-us/articles/115003849911-Players-on-Injured-Reserve-IR

4. **IR and acquisitions.** ESPN documents that a healthy player remaining in IR prevents new acquisitions, while a waiver claim already submitted before the player becomes healthy can still process. This supports The Chip Winner's fail-closed handling of a currently invalid IR roster without pretending to predict claim outcomes.
   - https://support.espn.com/hc/en-us/articles/360035123032-How-does-the-Injured-Reserve-Injury-List-impact-Waivers

5. **Game-time locking.** ESPN documents that, under the individual-lock option used by default in most LM leagues, a player's lineup slot locks at scheduled game time; another LM option locks the full roster at the first game of the scoring period. ESPN also states that players whose games have started are locked.
   - https://support.espn.com/hc/en-us/articles/115003938712-Lineup-Lock-Times
   - https://support.espn.com/hc/en-us/articles/360000097092-Moving-Players-After-Rosters-Have-Locked

6. **Waiver availability lifecycle.** ESPN documents that unsigned/dropped players can move through waivers and later become free agents after the waiver period/processing, with league-configured waiver rules controlling the timing.
   - https://support.espn.com/hc/en-us/articles/360000041152-Waivers-Overview

7. **Fantasy playoff schedule.** ESPN's 2026 football support states that Public/Standard leagues use a 14-week regular season with playoffs beginning Week 15 and ending Week 18, while League Manager leagues may use a customized regular-season/playoff schedule. The Chip Winner must still use ESPN-reported league facts when supplied and cannot infer API fields merely from this generic policy.
   - https://support.espn.com/hc/en-us/articles/360000065991-Length-of-Fantasy-Football-Season
   - https://support.espn.com/hc/en-us/articles/360000094451-Editing-Your-League-s-Playoff-Schedule

### Official NFL timing facts useful for field windows

- The 2026 regular season begins with New England at Seattle on **Wednesday, September 9, 2026 at 8:20 PM ET**, followed by San Francisco vs. Los Angeles Rams on Thursday, September 10 at 8:35 PM ET. These are immediate read-only windows for FV-ESPN-05 if a live recommendation involves a player in one of those games.
  - https://www.nfl.com/schedules/2026/by-week/week-1
- NFL's 2026 bye schedule runs from **Week 5 through Week 14**, with no Week 12 byes. Week 5 begins the bye schedule with Carolina and Kansas City. That makes Week 5 the earliest deterministic season window for FV-SEASON-01's real bye-coverage component, subject to the selected fantasy roster actually containing an affected player.
  - https://www.nfl.com/news/2026-nfl-schedule-release-every-team-bye-week

## Repository-context findings

### Custom slot support exists in the reviewed deterministic code

`src/providers/espn/espn-normalizer.js` maps ESPN lineup-slot id `7` to `OP` and id `23` to `FLEX`. `src/domain/recommendations.js` allows:

- FLEX: RB / WR / TE
- OP: QB / RB / WR / TE

Therefore TCW-003 found no implementation gap from repository inspection alone. FV-ESPN-02 remains a **real authenticated shape/behavior validation gap**, not an implementation task.

### Current bye metadata is intentionally current-week only

`src/providers/espn/espn-normalizer.js` indexes the supplied current NFL scoreboard and sets `byeWeek` to `currentWeek` only when the player's pro team has no event in that scoreboard. It does not import a full future bye calendar. Therefore a real field validation of bye behavior should wait for an actual current scoring week in which a selected-roster player's NFL team is on bye. Using the known 2026 schedule to pre-fill future byes would be a new product requirement and is **not authorized by TCW-003**.

### FV-WAIVER-01 counters already exist, but not all are directly rendered

`src/domain/waiver-priority-engine.js` returns a `futureDiscovery` object containing:

- `consideredAdds`
- `completeAdds`
- `scenarioCount`
- `qualifiedAdds`

The current `src/ui/section-renderer-priority.js` directly presents the qualified future-only candidate count in its priority panel but does not directly render all four field-registry counters. This is an **observability limitation**, not evidence that the exhaustive engine is missing. The field registry itself says the item remains pending until those counts are captured.

Manager options:

1. use a transient read-only local diagnostic capture and record only aggregate counts/timing; or
2. if UI-only evidence is required, authorize a narrowly scoped Builder task to expose the counters visibly.

R&D does **not** recommend changing waiver selection logic, candidate limits, or recommendation policy for this purpose.

## Recommended execution order

1. **FV-RECOVERY-01 first** — can be exercised immediately and safely with a real network disconnect/reconnect.
2. **FV-ESPN-05 next** — use the first naturally qualifying recommendation around an actual kickoff. The 2026 season provides an immediate window beginning September 9, 2026 at 8:20 PM ET; do not manufacture a recommendation if none is relevant.
3. **Refresh IR state opportunistically** — if the real league currently has a filled slot or a natural designation transition, collect FV-ESPN-04 evidence; otherwise keep it pending and monitor real status changes.
4. **Locate an existing OP/superflex-style ESPN LM league** for FV-ESPN-02. If none exists, Manager should decide whether a separate dedicated authenticated LM validation league is acceptable; do not alter the primary league.
5. **FV-WAIVER-01** — if current projection inputs admit future discovery, capture aggregate counts via a privacy-safe read-only diagnostic. If Manager requires visible UI counters, route a separate observability task rather than weakening the engine.
6. **FV-SEASON-01 is the likely long-pole field item.** Playoff-boundary/fallback and schedule pieces may be checked now, but real bye coverage cannot occur before the 2026 NFL bye period and complete projection-window evidence depends on real source accumulation. Do not substitute synthetic fixtures for this field gate.

## Open findings

1. **Release timing risk:** FV-SEASON-01 may remain legitimately pending into the season because the current product intentionally does not pre-load a future NFL bye calendar and because complete projection windows depend on real source coverage.
2. **Access dependency:** FV-ESPN-02 needs access to a materially different real league configuration. The current known standard league is not sufficient evidence for OP/superflex behavior.
3. **Opportunity dependency:** FV-ESPN-04 needs a real ESPN injury-status/IR-capacity state; documented policy is clear, but live evidence cannot be fabricated.
4. **Conditional kickoff dependency:** FV-ESPN-05 is easy to schedule, but the field acceptance wording is strongest when a prior recommendation actually touches the player whose lock/availability changes. If no such recommendation exists, leave the item pending.
5. **Waiver observability:** all four required counters exist in the domain result, but not all are directly shown in the current priority panel. Manager must choose between transient aggregate-only diagnostics and a separately approved UI observability change.
6. **No newly discovered provider-shape defect:** repository/source research did not reveal a deterministic ESPN normalization defect that justifies Builder activation now.

## Blocking issues

- None for completion of TCW-003 research.
- Release 1.0 remains blocked by the pending field checks themselves.
- This research did not perform live authenticated ESPN validation and must not be treated as field-check evidence.

## Manager recommendations

- Preserve all existing fail-closed IR, lock, missing-data, identity, and read-only boundaries.
- Treat FV-RECOVERY-01 and the next qualifying FV-ESPN-05 lock transition as the highest-value near-term field actions.
- Do not activate Builder for ESPN slot/IR/lock logic based on this research alone.
- Consider Builder only if live validation reproduces a deterministic defect, or if Manager explicitly decides that visible waiver enumeration counters are required for field observability.
- Keep Strategy idle; TCW-003 found no recommendation-policy disagreement requiring Strategy review.
- Plan FV-SEASON-01 as seasonal evidence work rather than trying to accelerate it with inferred future bye facts or synthetic real-world substitutes.

## Evidence produced

- Current authoritative ESPN support research, separated from repository assumptions.
- Current official NFL schedule timing for immediate lock observations and 2026 bye windows.
- Repository evidence for OP/FLEX mappings, current-week bye semantics, and waiver enumeration counters.
- Field-check feasibility classifications, preconditions, observation paths, privacy-safe evidence requirements, and Manager recommendations.

## Files updated

- `.ai/rnd/HANDOFF.md` only.

No production code, configuration, tests, shared canonical state, field registry, or product behavior was changed.

## Recommended next role

Manager / Architect after the independent Auditor TCW-002 handoff is also available.

## Exact next action

Manager should review TCW-002 and TCW-003 together, reconcile any disagreements, then schedule the immediate field actions (recovery and a qualifying real kickoff transition) and decide how FV-WAIVER-01 aggregate counters should be captured. Do not mark any field check passed from this research alone.

## Checkpoint / SHA

- Verified starting `master`: `110f198145ad117902e79768239151f8ddb769eb`
- R&D branch checkpoint: verify after commit/PR creation; do not infer from this document text.
