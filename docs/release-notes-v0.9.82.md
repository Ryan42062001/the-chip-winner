# v0.9.82 — ESPN IR roster visibility

## Why this release exists

Release 1.0 field validation against a real authenticated standard ESPN league found that the Overview roster card showed every starter and bench player but omitted the occupied ESPN IR slot. ESPN itself showed Isiah Pacheco in IR.

The ESPN normalization path already preserves lineup slot `21` as `IR`, and the team selector already exposes IR entries separately as `reserve`. The defect was limited to the Overview presentation path, which rendered starters and bench entries but not the reserve group.

## Changes

- Render ESPN-reported IR occupants as a dedicated **IR** section below the bench on the Overview roster card.
- Preserve the same player-detail interaction and source-backed injury/projection fields used by the rest of the roster UI.
- Apply the IR roster display to both the authenticated desktop view and the encrypted read-only mobile view.
- Add regression coverage for an occupied IR slot, including the exact field-validation shape that exposed the issue.

## Safety boundaries

- No ESPN write capability is added.
- No IR eligibility rule is changed.
- No player identity is inferred by display name.
- No roster-size or waiver-legality behavior is changed.
- `FV-ESPN-01` remains pending until the deployed release is retested against the real league.
