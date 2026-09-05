# ESPN IR eligibility

The Chip Winner treats ESPN as authoritative for league roster state and player injury designations. IR eligibility is a deterministic policy layer over those ESPN facts; the app does not infer health eligibility from player names, projections, external injury feeds, or ESPN's generic positional `eligibleSlots` array.

## Reviewed ESPN policy

Policy reviewed: September 5, 2026.

Primary ESPN Fan Support sources:

- [Players on Injured Reserve (IR)](https://support.espn.com/hc/en-us/articles/115003849911-Players-on-Injured-Reserve-IR), updated August 18, 2026.
- [Moving Players on and off the Injured Reserve (IR) and Injury List (IL)](https://support.espn.com/hc/en-us/articles/115003860512-Moving-Players-on-and-off-the-Injured-Reserve-IR-and-Injury-List-IL), updated August 18, 2026.
- [How does the Injured Reserve / Injury List impact Waivers?](https://support.espn.com/hc/en-us/articles/360035123032-How-does-the-Injured-Reserve-Injury-List-impact-Waivers), updated March 10, 2026.

For ESPN Fantasy Football:

1. A player with ESPN **OUT** or **INJURED_RESERVE** fantasy status may be newly placed in an IR slot when the league has an IR slot available.
2. **QUESTIONABLE** and **DOUBTFUL** are not eligible for a new IR placement. If a player was already in IR and ESPN changes the designation from OUT/IR to QUESTIONABLE or DOUBTFUL, ESPN allows that player to remain in IR without invalidating the roster.
3. A **SUSPENDED** player is not IR-eligible.
4. If an IR occupant becomes healthy / loses the qualifying injury designation, ESPN considers the roster invalid. ESPN documents that a healthy player in IR can prevent new waiver/free-agent acquisitions until the roster is corrected.
5. IR capacity comes from the connected league's configured ESPN IR lineup-slot count. The Chip Winner never assumes a default IR-slot count.

## PUP nuance

NFL reserve/PUP and ESPN Fantasy IR eligibility are related but not identical concepts. ESPN's current Fantasy Football support documentation proves new fantasy-IR placement from the **ESPN fantasy designation** (`OUT` or `IR`), not directly from every NFL reserve-list label.

That means a real NFL player on PUP can absolutely be stashable in an ESPN fantasy IR slot when ESPN surfaces that player with an `OUT` or `IR` fantasy designation. This is the practical behavior fantasy managers often see with PUP players.

If the ESPN data instead exposes only the raw normalized status `PHYSICALLY_UNABLE_TO_PERFORM` without a qualifying OUT/IR fantasy designation, The Chip Winner does not guess in either direction. It reports IR eligibility as **unverified** until ESPN supplies the qualifying fantasy tag or current ESPN documentation explicitly proves raw PUP as independently eligible.

This is intentionally safer than saying either “PUP is never eligible” or “every raw PUP value is automatically eligible.”

## Why `eligibleSlots` is not used

Community-maintained ESPN API clients expose a player's `eligibleSlots` separately from `injuryStatus`, and examples can include the IR lineup slot among a healthy player's generic eligible slot IDs. That makes `eligibleSlots` useful for roster-position mechanics but unsafe as evidence that a player is currently health-eligible for IR.

The Chip Winner therefore uses only:

- the normalized ESPN injury designation;
- whether the player is already assigned to ESPN's IR lineup slot;
- the connected league's ESPN-reported IR slot count.

No display-name matching or external injury inference participates in this decision.

## Supported states

| ESPN normalized status | New IR placement | Already in IR |
| --- | --- | --- |
| `OUT` | Eligible | Eligible |
| `INJURED_RESERVE` | Eligible | Eligible |
| `QUESTIONABLE` | Not eligible | May remain (grandfathered) |
| `DOUBTFUL` | Not eligible | May remain (grandfathered) |
| `SUSPENSION` | Not eligible | Invalid for supported policy |
| `ACTIVE` / no designation | Not eligible | Invalid |
| `PHYSICALLY_UNABLE_TO_PERFORM` | Unverified unless ESPN also supplies a qualifying OUT/IR fantasy designation | Unverified |
| `UNKNOWN` / future unsupported ESPN value | Unverified | Unverified; acquisition legality withheld |

## IR-assisted waiver scenarios

When ESPN proves all required inputs, the current-week waiver engine can model a two-step no-drop path:

1. move an eligible, unlocked bench player from `BE` to an open ESPN `IR` slot;
2. add an ESPN-available, unlocked player into the newly freed active-roster space.

The recommendation is represented explicitly as `ir-assisted-add`; it is never disguised as an ordinary add/drop move. The engine verifies:

- an ESPN-reported open IR slot exists;
- the bench player's current ESPN fantasy designation proves new IR placement;
- the bench player and add candidate are not locked;
- ESPN still reports the add candidate available;
- ESPN acquisition limits are not exhausted;
- the simulated roster respects ESPN-reported roster-size and position limits;
- the resulting strongest known legal lineup improves by at least the current action threshold.

If the same add could be made either by dropping a rostered player or by a supported bench-to-IR transition with the same projected lineup gain, The Chip Winner prefers the no-drop IR-assisted path.

Prior IR-assisted recommendations are revalidated after ESPN refreshes. They become obsolete when, for example, the add is no longer available, the IR slot fills, the injured player's designation no longer qualifies, a lock occurs, or the projected gain falls below threshold. Unsupported designation states remain **unverified** rather than being declared obsolete from a guess.

The **What Changed** timeline preserves both steps and never invents a drop for a prior IR-assisted recommendation.

## Application behavior

`src/domain/ir-eligibility.js` evaluates the selected roster and reports configured capacity, current occupants, open slots, eligible bench transitions, grandfathered Q/D occupants, known-invalid occupants, and unsupported/unverified states.

The waiver engine uses that state before claiming a move is legal:

- a known-invalid current IR roster blocks new waiver recommendations and makes prior waiver advice obsolete;
- an unsupported current IR designation withholds legality as unverified rather than guessing;
- a valid IR roster proceeds through the existing availability, acquisition-limit, roster-limit, lock, and projection gates;
- an open IR slot plus an OUT/IR bench player can produce an explicit IR-assisted add-without-drop recommendation;
- The Chip Winner remains read-only and does not move the player or submit the add on ESPN.

The weekly checklist surfaces both actionable IR-space opportunities and IR-invalid blockers.

## Multiweek boundary

The current Season Plan multiweek scenario engine still models explicit add/drop rosters. IR-assisted no-drop recommendations are deliberately excluded from that older planner until it can carry the retained player in IR across every future week and enforce complete player-week coverage for both the active and IR-retained rosters.

This prevents a current-week IR convenience from silently becoming an unsupported multiweek roster assumption.

## Limitations

- The app does not submit IR moves, waiver claims, adds, drops, or lineup changes to ESPN.
- It does not predict whether a pending waiver claim will process after future status changes. ESPN notes that claim processing can depend on the roster state at both claim creation and processing time.
- It does not treat an external injury report as ESPN IR eligibility.
- Unknown or newly introduced ESPN designations fail closed until the policy is re-reviewed.
- Raw NFL reserve-list terminology is not used as a substitute for ESPN's current fantasy eligibility signal.
