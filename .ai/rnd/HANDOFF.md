# R&D Handoff — TCW-003 ESPN Field-Validation Feasibility Research

Task ID: TCW-003
Role: Research & Development
Status: COMPLETE — research handoff prepared for Manager review; no field check was passed or failed by this research

## Verified starting state

- Repository: `Ryan42062001/the-chip-winner`.
- Verified `master` checkpoint before branch creation: `110f198145ad117902e79768239151f8ddb769eb`.
- Package version: `0.9.88`.
- Canonical Manager assignment marks TCW-003 ACTIVE as part of independent wave TCW-PW-001.
- `config/field-validation.json` still reports the following TCW-003 ESPN-heavy checks as pending: FV-ESPN-02, FV-ESPN-04, FV-ESPN-05, FV-SEASON-01, FV-RECOVERY-01, FV-WAIVER-01.
- Release 1.0 remains read-only and evidence-gated. Research does not substitute for required authenticated/live field evidence.

## Work completed

- Reviewed canonical `.ai/shared` state, TCW-003 task specification, field-validation policy/registry, IR policy, ESPN normalizer/provider/companion paths, lock logic, recovery/cache path, season-planning behavior, and waiver-priority enumeration/visibility.
- Re-checked current ESPN Fan Support documentation for roster slots/FLEX/OP, lineup locks, IR eligibility, waiver interactions, custom schedules/playoffs, and network failure behavior.
- Identified the safest privacy-preserving real-world observation path for every applicable pending ESPN-heavy field check.
- Separated officially documented ESPN product behavior from the project's undocumented ESPN read integration and from project inferences.
- Identified two implementation-relevant risks and one provider-observability limitation for Manager review without authorizing production work.

## Research classification key

General confidence labels used below:

- **VERIFIED FACT** — directly supported by repository contents or current authoritative source documentation.
- **STRONG EVIDENCE** — multiple concrete signals support the conclusion, but required live field evidence is not yet present.
- **INFERENCE** — reasoned conclusion from verified facts; not independently observed in the target field state.
- **UNKNOWN** — evidence is insufficient.

Undocumented-system labels:

- **OFFICIALLY SUPPORTED** — current ESPN documentation explicitly describes the product behavior.
- **OBSERVED AND REPRODUCIBLE** — already exercised repeatedly in project field evidence.
- **OBSERVED BUT FRAGILE** — works in observed conditions but depends on an undocumented/internal interface or shape.
- **INFERRED** — expected from code/data shape but not directly observed.
- **UNKNOWN** — no reliable evidence.

## Field-check feasibility matrix

| Field check | Feasibility classification | Real-world preconditions | Safest observation window / trigger | Privacy-safe evidence that can satisfy repository policy | Confidence |
| --- | --- | --- | --- | --- | --- |
| **FV-ESPN-02 — authenticated custom FLEX or OP league** | **REQUIRES-DIFFERENT-LEAGUE/STATE** | Access to an already-existing authenticated ESPN League Manager league whose actual roster configuration contains OP/superflex or another materially custom FLEX arrangement. Do not mutate the current league merely to manufacture the state. | Any time the custom league is available. Refresh through the read-only companion, compare ESPN League Settings to The Chip Winner League Setup/lineup rendering, then exercise Lineup Lab with a player whose eligibility distinguishes OP from ordinary FLEX (most usefully a QB). | Date; browser + companion/app versions; sanitized slot names/counts only; whether ESPN settings and app rendering agreed; whether a QB was correctly eligible for OP but not RB/WR/TE FLEX; no league/team/member names or IDs and no raw payload. | **HIGH** for product semantics; **MEDIUM** for live API shape until a custom league is observed. |
| **FV-ESPN-04 — authenticated IR edge states** | **SEASONAL/OPPORTUNITY-DEPENDENT** | A naturally occurring ESPN fantasy injury designation and IR roster condition. Useful states include OUT/IR on bench with open IR capacity; Q/D already occupying IR after a natural designation change; a filled IR; a naturally healthy/no-designation occupant; or a newly surfaced unsupported designation. | Refresh when ESPN changes a real rostered player's fantasy designation or when a pre-existing roster state naturally exposes an edge. For grandfathering, capture before/after a natural OUT/IR -> Q/D status change while the player was already in IR. Avoid moving players solely for validation. | Date; sanitized ESPN fantasy designation; current lineup slot category (BE/IR); configured IR count/open/full; resulting app legality classification/warning; no player name/ID required. If a new provider shape appears, create a sanitized fixture only after Manager/Builder routing. | **HIGH** for documented policy; field completion remains opportunity-dependent. |
| **FV-ESPN-05 — authenticated lock and availability transitions** | **EXERCISE-NOW (TIME-WINDOWED)** | A real selected-roster player or meaningful waiver candidate in a game about to begin, plus a valid authenticated refresh before and after kickoff. Prefer a state that currently produces actionable or inspectable advice so obsolescence/revalidation is visible. | First 2026 Week 1 opportunity is **Wednesday, September 9, 2026 at 8:20 PM ET** (Patriots at Seahawks). Refresh 5–15 minutes before kickoff and again after kickoff/cooldown. If the connected roster has no relevant player, use Thursday September 10 at 8:35 PM ET or the broad Sunday slate to increase coverage. | Date/time to minute; app/browser/companion versions; sanitized role such as `starter WR` or `available RB`; before/after lock/availability/advice status; no player or league identity needed. | **HIGH** for standard individual-lock observation path. Custom whole-week lock policy requires separate live configuration evidence. |
| **FV-SEASON-01 — real playoff and bye intelligence states** | **SEASONAL/OPPORTUNITY-DEPENDENT** | Authenticated league schedule/settings plus real future-week projection publications. Full acceptance requires real playoff-week boundaries or clearly labeled fallback, actual fantasy playoff opponents/bye states when they exist, bye coverage, and both partial and complete future projection behavior. | Playoff configuration/fallback can be inspected now. Actual playoff opponents and deeper future projection windows require season progression and source publication. Record incremental evidence but do not pass the aggregate field check early. | Date; sanitized configured playoff weeks/source (`ESPN` vs labeled local fallback); opponent present/missing flag; bye/fillability result without names; projection-window completeness counts and withheld/available aggregate result. | **HIGH** that the check is inherently staged/seasonal. |
| **FV-RECOVERY-01 — live ESPN session/network refresh failure and reconnect** | **EXERCISE-NOW** | Start from one valid authenticated live snapshot. Then create a real client connectivity failure without changing ESPN league state — safest is temporarily disable the workstation's network connection, then invoke Refresh ESPN after the cooldown. Restore connectivity and refresh successfully. Companion unload/reload is a secondary path; signing out of ESPN is more intrusive and unnecessary for the first observation. | Any time. Sequence: successful refresh -> record capture time -> disconnect network -> attempted refresh -> verify retained snapshot and failure messaging/source state -> reconnect -> successful refresh. | Date/time; failure class (`network unavailable`, `companion unavailable`, etc.); whether last valid snapshot remained usable; exact sanitized status/source labels; reconnect result. No cookies, error payloads containing private data, league IDs, or raw snapshots. | **HIGH** that a safe observation can be run now. See recovery labeling risk below. |
| **FV-WAIVER-01 — real waiver candidate volume and timing** | **CURRENTLY UNVERIFIED** | A current authenticated snapshot plus enough selected future-week projection coverage for future-only discovery to run, and a way to capture the required numeric fields `consideredAdds`, `completeAdds`, `scenarioCount`, `qualifiedAdds` alongside user-visible timing. | Re-run when the browser's real projection cache has complete selected-week baseline coverage. If current coverage already meets the engine gate, the calculation itself can run now; otherwise wait for weekly source publications. | Only numeric counts, selected week numbers, elapsed/render timing, app/browser version, and qualitative responsiveness. Do not record player names/IDs or raw snapshot data. An **EXPERIMENTAL / NON-PRODUCTION** local observer may print those numeric fields if Manager authorizes an observation aid; do not turn the observer into production behavior automatically. | **HIGH** that engine metrics exist; **UNKNOWN** whether the user's current browser cache has enough coverage at this moment. |

## Per-check evidence and analysis

### FV-ESPN-02 — custom FLEX / OP

**VERIFIED FACT / OFFICIALLY SUPPORTED:** ESPN documents ordinary FLEX as RB/WR/TE and Offensive Player Utility (OP) as accepting any offensive roster slot. ESPN also documents League Manager customization of roster slots and starter counts.

**VERIFIED FACT (repository):** `src/providers/espn/espn-normalizer.js` maps ESPN lineup slot id `23` to `FLEX` and id `7` to `OP`. `src/domain/recommendations.js` models FLEX as RB/WR/TE and OP as QB/RB/WR/TE. The existing authenticated standard-league evidence already includes an ordinary FLEX slot, but FV-ESPN-02 remains pending because no materially custom/OP state has been field-validated.

**OBSERVED BUT FRAGILE:** The numeric ESPN lineup-slot IDs and the internal league read shape are not established by ESPN's public support documentation. They are internal integration assumptions that have worked for the tested standard league. OP id/shape must therefore be treated as requiring live observation, not as officially supported API contract.

**RECOMMENDATION TO MANAGER:** Seek an existing invite/access path to a custom League Manager league rather than modifying the user's production league. If a live OP league normalizes cleanly, no implementation work is implied. If ESPN emits an unrecognized slot id/shape, route a sanitized fixture and narrowly scoped Builder task only after the shape is reproduced.

### FV-ESPN-04 — IR edge states

**VERIFIED FACT / OFFICIALLY SUPPORTED:** Current ESPN Fantasy Football support states that OUT and IR-designated players may be placed in IR; suspended players are not eligible; a player already in IR who naturally changes from OUT/IR to QUESTIONABLE or DOUBTFUL may remain without invalidating the roster; a player who loses the injury designation while still in IR makes the roster invalid. ESPN also documents that a healthy IR occupant prevents new acquisitions.

**VERIFIED FACT (repository):** `docs/ir-eligibility.md` and current domain rules intentionally match those documented states and fail closed on unsupported/raw PUP-only conditions.

**INFERENCE:** No safe read-only procedure can guarantee a grandfathered, healthy-invalid, or unsupported IR state on demand. Manufacturing those states by moving players or manipulating league settings would violate TCW-003's purpose. The correct path is to watch natural designation transitions.

**RECOMMENDATION TO MANAGER:** Keep this check opportunity-dependent. A small sanitized observation record per naturally encountered edge is preferable to one broad private snapshot.

### FV-ESPN-05 — lock and availability transitions

**VERIFIED FACT / OFFICIALLY SUPPORTED:** ESPN documents individual scheduled-game-time lineup locks as the default/majority League Manager setting. ESPN also documents a League Manager alternative that locks the whole roster at the first game of the scoring period. The current NFL schedule makes the nearest real Week 1 transition Patriots at Seahawks on Wednesday, September 9, 2026 at 8:20 PM ET.

**VERIFIED FACT (repository):** Live player `gameTime` is derived from the public ESPN NFL scoreboard supplement. `getLineupLockReason()` locks a player when an explicit `entry.locked`/`player.locked` value is true or when the reported kickoff is at/past the evaluation time.

**VERIFIED FACT (repository limitation):** The current live ESPN normalizer does not preserve a league-level lineup lock mode in the normalized snapshot, and its roster-entry normalization does not carry an explicit ESPN `locked` field from the league response. The standard live path therefore materially relies on scheduled kickoff time.

**STRONG EVIDENCE:** This matches ESPN's default individual lock policy, but it may not model the documented League Manager **Lock at First Game of Week** configuration correctly. That is a policy/configuration risk, not a verified production defect in the user's currently tested standard league.

**RECOMMENDATION TO MANAGER:** Run the standard Week 1 before/after kickoff field check immediately. Separately, if an accessible custom league uses whole-week locking, include that setting in the custom-league evidence pass. If the app exposes actionable advice after ESPN says the entire roster is locked, route a reproduced defect to Builder with a sanitized fixture/config representation.

### FV-SEASON-01 — playoff and bye intelligence

**VERIFIED FACT / OFFICIALLY SUPPORTED:** ESPN documents standard/public playoff structures and explicitly allows League Managers to alter regular-season length, playoff brackets, matchup duration, and head-to-head schedules. ESPN also allows League Managers to assign fantasy-team bye weeks.

**VERIFIED FACT (repository):** The normalizer reads `settings.scheduleSettings.playoffWeeks` when present. Season Plan uses ESPN playoff weeks when available and otherwise uses a browser-local per-league fallback that must remain labeled. Existing real field evidence already proves missing future opponents/bye metadata/projection windows are withheld rather than invented.

**OBSERVED BUT FRAGILE:** ESPN's public support documentation describes the user-visible schedule settings, not the internal `scheduleSettings.playoffWeeks` API property. The current tested league has already exercised fallback behavior; the exact internal playoff-week shape remains an undocumented interface assumption until observed in a league that supplies it.

**RECOMMENDATION TO MANAGER:** Collect incremental real evidence as the season advances rather than trying to force a complete playoff state now. If an authenticated league's official settings visibly show playoff weeks but the API omits or shapes them differently, preserve the labeled fallback and route the observed shape for sanitized fixture review.

### FV-RECOVERY-01 — session/network failure and reconnect

**VERIFIED FACT / OFFICIALLY SUPPORTED:** ESPN publishes network troubleshooting and an ESPN Fantasy API connectivity test, and explicitly acknowledges that connection problems/outages can occur.

**VERIFIED FACT (repository):** The refresh flow fetches and normalizes the new ESPN response before saving it. On a thrown refresh error, it shows an error notice and does not replace the current valid snapshot. `EspnSnapshotProvider.saveSnapshot()` also preserves the previous valid snapshot only after validation.

**VERIFIED FACT (repository behavior):** `hydrateControls()` labels any snapshot whose `meta.kind` remains `live-companion` as **"Live ESPN snapshot"**. The failed-refresh catch path does not transition the application into an offline/stale/error source state. Therefore a previously successful ESPN snapshot remains visibly labeled **"Live ESPN snapshot"** after a failed refresh.

**INFERENCE / POTENTIAL FIELD BLOCKER:** FV-RECOVERY-01 explicitly requires the last valid snapshot to survive **without being mislabeled as live**. The code path strongly suggests the retention half will pass but the live/stale labeling requirement may fail. This research did not run a live network-failure field test, so TCW-003 does not mark the check failed.

**RECOMMENDATION TO MANAGER:** Prioritize this field exercise because it can be run safely now and can convert the code-level risk into a definitive field result. If the stale/live ambiguity is observed, route a narrowly scoped Builder remediation task; do not change production behavior from this R&D branch.

### FV-WAIVER-01 — real candidate scale and timing

**VERIFIED FACT (repository):** `buildWaiverPriorityBoard()` returns `futureDiscovery` with all four required field metrics: `consideredAdds`, `completeAdds`, `scenarioCount`, and `qualifiedAdds`. The engine iterates every eligible candidate present in the current normalized `snapshot.availablePlayers` and every legal unlocked bench drop that clears its prerequisites; there is no hidden engine candidate cap in this enumeration path.

**VERIFIED FACT (repository observability gap):** The normal priority-board UI visibly summarizes `qualifiedAdds` and includes some discovery context, but it does not expose the complete four-field numeric tuple required by FV-WAIVER-01 in an obvious field-recordable surface. Existing field evidence already says these counts were not captured.

**VERIFIED FACT (provider acquisition boundary):** `extensions/espn-companion/service-worker.js` currently requests ESPN `kona_player_info` with an `X-Fantasy-Filter` `limit: 100`. This is a provider-read limit upstream of the exhaustive domain enumeration. It is not a hidden waiver-engine shortlist, but it may bound the captured ESPN availability universe.

**OBSERVED BUT FRAGILE:** The ESPN `lm-api-reads.fantasy.espn.com` endpoint, `kona_player_info` view, filter schema, and `limit` semantics are undocumented/internal from the perspective of public ESPN support documentation. The current read path is repeatedly observed working for the authenticated standard league, but full-pool completeness beyond the requested 100 is not proven by current field evidence.

**RECOMMENDATION TO MANAGER:** Do not reopen Waiver Engine v2 merely to gather metrics. First decide whether a disposable **EXPERIMENTAL / NON-PRODUCTION** local observer or a dedicated field-only diagnostic is acceptable for capturing the four numeric values and elapsed time from the user's real browser state. Separately, record `snapshot.availablePlayers.length` during the field run. If real evidence shows the 100-request boundary omits relevant ESPN-available candidates, treat that as a reproduced provider-acquisition limitation and scope it separately.

## ESPN integration support classification

### User-visible ESPN Fantasy rules

- FLEX/OP semantics: **OFFICIALLY SUPPORTED** by current ESPN Fan Support.
- IR eligibility/grandfathering/healthy-IR acquisition impact: **OFFICIALLY SUPPORTED**.
- Individual and first-game-of-period lineup lock policies: **OFFICIALLY SUPPORTED**.
- League Manager schedule/playoff customization and fantasy bye assignments: **OFFICIALLY SUPPORTED**.
- Network failure/connectivity troubleshooting: **OFFICIALLY SUPPORTED**.
- Waiver systems/process timing: **OFFICIALLY SUPPORTED**.

### Internal ESPN read integration used by The Chip Winner

- Current authenticated `lm-api-reads.fantasy.espn.com` league reads with `mTeam`, `mRoster`, `mMatchup`, `mSettings`: **OBSERVED AND REPRODUCIBLE** in the project's existing standard-league field evidence.
- API contract/support status for those endpoints/views: **OBSERVED BUT FRAGILE**. Current ESPN public support documentation describes product behavior, not a stable public JSON contract for these internal Fantasy read endpoints.
- `kona_player_info` filter schema and `limit: 100` full-pool semantics: **OBSERVED BUT FRAGILE / CURRENTLY UNVERIFIED for completeness beyond the requested limit**.
- OP numeric slot id `7` in a real 2026 authenticated custom league: **INFERRED from the existing integration mapping; live field verification still required**.
- `settings.scheduleSettings.playoffWeeks` exact internal shape in a league that actually supplies ESPN playoff weeks: **INFERRED/UNKNOWN until observed**.

## Authoritative/current external sources reviewed

Current ESPN Fan Support sources (accessed 2026-09-08):

- Roster Slots (Offense): https://support.espn.com/hc/en-us/articles/115003939432-Roster-Slots-Offense
- Roster Settings: https://support.espn.com/hc/en-us/articles/115003902651-Roster-Settings
- Lineup and Roster Lock Times: https://support.espn.com/hc/en-us/articles/360055424451-Lineup-and-Roster-Lock-Times
- Setting Your Lineup: https://support.espn.com/hc/en-us/articles/360000093672-Setting-Your-Lineup
- Moving Players After Rosters Have Locked: https://support.espn.com/hc/en-us/articles/360000097092-Moving-Players-After-Rosters-Have-Locked
- Players on Injured Reserve (IR): https://support.espn.com/hc/en-us/articles/115003849911-Players-on-Injured-Reserve-IR
- Moving Players on and off the Injured Reserve (IR) and Injury List (IL): https://support.espn.com/hc/en-us/articles/115003860512-Moving-Players-on-and-off-the-Injured-Reserve-IR-and-Injury-List-IL
- How does the Injured Reserve / Injury List impact Waivers?: https://support.espn.com/hc/en-us/articles/360035123032-How-does-the-Injured-Reserve-Injury-List-impact-Waivers
- Waivers Overview: https://support.espn.com/hc/en-us/articles/360000041152-Waivers-Overview
- Claim a Player Off Waivers: https://support.espn.com/hc/en-us/articles/360000036711-Claim-a-Player-Off-Waivers
- Change League Schedule and/or Head-to-Head Matchups (LM Leagues): https://support.espn.com/hc/en-us/articles/115003914792-Change-League-Schedule-and-or-Head-to-Head-Matchups-LM-Leagues
- Playoff Schedule: https://support.espn.com/hc/en-us/articles/115003883552-Playoff-Schedule
- Editing Your League's Playoff Schedule: https://support.espn.com/hc/en-us/articles/360000094451-Editing-Your-League-s-Playoff-Schedule
- Network Connection Issues: ESPN Fantasy App: https://support.espn.com/hc/en-us/articles/360000960672-Network-Connection-Issues-ESPN-Fantasy-App

Current NFL schedule source used only for the nearest observation window:

- NFL 2026 Week 1 schedule: https://www.nfl.com/schedules/2026/by-week/week-1

## Open findings

1. **Lock-policy coverage risk — STRONG EVIDENCE.** ESPN officially supports whole-period first-game lock configuration, while the current normalized live model does not preserve league lock mode and materially derives locks from per-player kickoff. No defect is claimed until a relevant custom league is observed.
2. **Recovery live/stale labeling risk — VERIFIED CODE BEHAVIOR + INFERRED FIELD FAILURE.** A failed refresh retains the last valid snapshot but leaves its source label as `Live ESPN snapshot`. FV-RECOVERY-01's wording makes this a high-priority field observation.
3. **Waiver field-observability gap — VERIFIED FACT.** The domain result has all required counts, but the visible field surface does not clearly expose the complete tuple.
4. **ESPN availability request boundary — VERIFIED FACT / OBSERVED BUT FRAGILE.** The companion requests at most 100 `kona_player_info` entries. Whether this materially truncates the relevant live candidate universe is not yet proven.
5. **Custom OP and playoff API shapes — UNKNOWN/INFERRED until observed.** Public ESPN product documentation does not establish the internal JSON numeric IDs/shape.

## Blocking issues

- No R&D research blocker remains for TCW-003.
- TCW-003 cannot itself close any field check because authenticated/live observations remain required.
- FV-ESPN-02 requires access to a materially different custom league.
- FV-ESPN-04 and full FV-SEASON-01 depend on naturally occurring/seasonal states.
- FV-WAIVER-01 cannot be conclusively captured from current repository evidence alone because browser-local future projection coverage is not available to this session and the deployed UI does not surface every required count.

## Manager recommendations

1. **Run FV-RECOVERY-01 first** using a real temporary network disconnect. It is safe, immediately available, and likely to resolve the strongest code-level uncertainty.
2. **Schedule FV-ESPN-05 around the first relevant Week 1 kickoff**, beginning Wednesday September 9, 2026 at 8:20 PM ET if the connected roster/candidate pool contains a relevant Patriot or Seahawk; otherwise choose a later broad slate.
3. **Source an existing custom LM league for FV-ESPN-02** instead of reconfiguring the current league. Include lock-mode evidence if that league uses a non-default policy.
4. **Leave FV-ESPN-04 and the deeper portions of FV-SEASON-01 opportunity-dependent** and collect incremental sanitized evidence as natural states appear.
5. **For FV-WAIVER-01, authorize observation tooling only if needed.** Prefer an experimental local numeric observer over a production feature solely for field evidence. If the 100-player provider request limit proves materially incomplete, create a separate reviewed provider-acquisition task rather than silently broadening TCW-003.
6. Do not route Builder merely because these risks exist. Route implementation only after Manager accepts a deterministic code finding as a requirement or a field run reproduces a defect.

## Evidence produced

- This feasibility matrix and research classification.
- Current ESPN official support references listed above.
- Repository-path analysis of live normalization, lock derivation, cache/recovery behavior, waiver enumeration, and field observability.
- Concrete privacy-safe field procedures and observation windows.

## Files updated

- `.ai/rnd/HANDOFF.md` only.

No production code, field registry, canonical shared state, tests, configuration, extension behavior, or product behavior was changed.

## Recommended next role

Manager / Architect after the independent TCW-002 Auditor handoff is also available, with user/field operator actions in parallel where appropriate.

## Exact next action

Manager should review TCW-003 alongside TCW-002, then route immediate field actions for FV-RECOVERY-01 and FV-ESPN-05, decide whether custom-league access exists for FV-ESPN-02, and decide whether temporary numeric observability is needed for FV-WAIVER-01. Production work should be authorized only for a reproduced/accepted defect or explicit requirement.

## Checkpoint / SHA

- Verified task base `master`: `110f198145ad117902e79768239151f8ddb769eb`.
- TCW-003 task branch: `rnd/tcw-003-espn-field-validation-research`.
- Branch commit SHA: populated by GitHub after this handoff commit; verify before Manager integration.
