# v0.9.74 — ESPN settings parity

Release 1.0 field validation compared The Chip Winner directly with a real authenticated ESPN league and exposed three settings-parity defects after the v0.9.73 roster-limit compatibility fix.

## Live findings

The reviewed ESPN League Settings screen reported:

- roster size 15;
- 9 starters;
- 6 bench/reserve spots with 1 IR slot;
- position maximums QB 4, RB 8, WR 8, TE 3, K 3, D/ST 3;
- traditional Waivers as the player-acquisition system;
- no season acquisition limit;
- a 1-day waiver period;
- weekly waiver-order reset to inverse standings;
- no FAAB/acquisition budget.

The v0.9.73 League Setup screen instead showed roster size 16, an unavailable waiver period, and a phantom budget remaining of 100.

## Corrections

- ESPN roster size now excludes the IR reserve slot from the active roster-size total shown and enforced by the normalizer.
- Waiver and multiweek roster legality count active non-IR entries against ESPN's roster-size cap, so a valid bench-to-IR move can free an active roster spot without treating the retained IR player as an extra active player.
- `waiverHours` is normalized to a day count when ESPN provides an exact whole-day value; legacy numeric `waiverProcessDays` remains a fallback.
- `acquisitionType`, `isUsingAcquisitionBudget`, and `waiverOrderReset` are retained as explicit ESPN source facts.
- An acquisition budget is retained and displayed only when ESPN explicitly reports that the league uses one. Traditional-waiver leagues show `Not used` instead of converting ESPN's dormant/default budget field into FAAB.
- League Setup labels the player-acquisition system and the source-backed waiver period.

## Safety boundaries

- Unknown finite ESPN position limits still fail closed.
- Unsupported position IDs are ignored only when explicitly disabled or unlimited.
- Missing budget-use semantics stay unavailable rather than being inferred.
- IR remains a reserve slot; the player is retained in the roster and all existing ESPN IR eligibility/revalidation checks still apply.
- The product remains ESPN-read-only.

## Verification target

Expected permanent suite after this release: **325 tests**, plus **21 model-safety fixtures**.

`FV-ESPN-03` remains pending until the deployed v0.9.74 site is refreshed against the same real league and the corrected settings/waiver behavior are visually revalidated.
