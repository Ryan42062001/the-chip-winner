# ESPN IR eligibility

The Chip Winner treats ESPN as authoritative for league roster state and player injury designations. IR eligibility is a deterministic policy layer over those ESPN facts; the app does not infer health eligibility from player names, projections, external injury feeds, or ESPN's generic positional `eligibleSlots` array.

## Reviewed ESPN policy

Policy reviewed: September 5, 2026.

Primary ESPN Fan Support sources:

- [Players on Injured Reserve (IR)](https://support.espn.com/hc/en-us/articles/115003849911-Players-on-Injured-Reserve-IR), updated August 18, 2026.
- [Moving Players on and off the Injured Reserve (IR) and Injury List (IL)](https://support.espn.com/hc/en-us/articles/115003860512-Moving-Players-on-and-off-the-Injured-Reserve-IR-and-Injury-List-IL), updated August 18, 2026.
- [How does the Injured Reserve / Injury List impact Waivers?](https://support.espn.com/hc/en-us/articles/360035123032-How-does-the-Injured-Reserve-Injury-List-impact-Waivers), updated March 10, 2026.

For ESPN Fantasy Football:

1. A player with ESPN **OUT** or **INJURED_RESERVE** status may be newly placed in an IR slot when the league has an IR slot available.
2. **QUESTIONABLE** and **DOUBTFUL** are not eligible for a new IR placement. If a player was already in IR and ESPN changes the designation from OUT/IR to QUESTIONABLE or DOUBTFUL, ESPN allows that player to remain in IR without invalidating the roster.
3. A **SUSPENDED** player is not IR-eligible.
4. If an IR occupant becomes healthy / loses the qualifying injury designation, ESPN considers the roster invalid. ESPN documents that a healthy player in IR can prevent new waiver/free-agent acquisitions until the roster is corrected.
5. IR capacity comes from the connected league's configured ESPN IR lineup-slot count. The Chip Winner never assumes a default IR-slot count.

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
| `PHYSICALLY_UNABLE_TO_PERFORM` | Not inferred eligible | Invalid for supported policy |
| `UNKNOWN` / future unsupported ESPN value | Unverified | Unverified; acquisition legality withheld |

PUP is deliberately not promoted to IR eligibility merely because the real NFL has a reserve/PUP designation. The current ESPN Fantasy Football support rule names only OUT and IR as qualifying Fantasy Football statuses for a new IR placement. If ESPN later documents another qualifying fantasy designation, the policy and tests must be reviewed before expanding the set.

## Application behavior

`src/domain/ir-eligibility.js` evaluates the selected roster and reports configured capacity, current occupants, open slots, eligible bench transitions, grandfathered Q/D occupants, known-invalid occupants, and unsupported/unverified states.

The waiver engine uses that state before claiming a move is legal:

- a known-invalid current IR roster blocks new waiver recommendations and makes prior waiver advice obsolete;
- an unsupported current IR designation withholds legality as unverified rather than guessing;
- a valid IR roster proceeds through the existing availability, acquisition-limit, roster-limit, lock, and projection gates;
- an open IR slot plus an OUT/IR bench player is surfaced as an opportunity to free active-roster space, but The Chip Winner remains read-only and does not move the player on ESPN.

The weekly checklist surfaces both actionable IR-space opportunities and IR-invalid blockers.

## Limitations

- The app does not submit IR moves, waiver claims, adds, drops, or lineup changes to ESPN.
- It does not predict whether a pending waiver claim will process after future status changes. ESPN notes that claim processing can depend on the roster state at both claim creation and processing time.
- It does not treat an external injury report as ESPN IR eligibility.
- Unknown or newly introduced ESPN designations fail closed until the policy is re-reviewed.
