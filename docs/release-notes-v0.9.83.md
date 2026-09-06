# v0.9.83 — ESPN scoring-family compatibility

Release 1.0 field validation of Lineup Lab exposed a false compatibility block in the weekly projection layer.

## Field finding

A real authenticated ESPN PPR league reports its matchup system as `H2H_POINTS`. The app was comparing that value directly with the imported weekly projection format `PPR`, so otherwise compatible projections were incorrectly blocked.

## Fix

- Preserve ESPN's matchup scoring type separately from reception scoring.
- Derive reception scoring from ESPN `mSettings` scoring items.
- Normalize supported reception families as PPR, half-PPR, standard, or custom.
- Validate external weekly projections against the normalized reception-scoring family rather than `H2H_POINTS`.
- Keep compatibility fail-closed when ESPN reception scoring is unavailable or custom.
- Preserve the existing season and projection-capture freshness checks.

## Regression coverage

New tests cover:

- PPR, half-PPR, standard, and custom ESPN reception scoring.
- A live-style `H2H_POINTS` league with PPR reception scoring.
- PPR weekly projections correctly accepted for that league.
- Real PPR/half-PPR mismatches still blocked.
- `H2H_POINTS` alone never being treated as a reception-scoring family.

`FV-ESPN-01` remains pending until the deployed build is retested against the real authenticated league.
