# TCW-017 — FV-ESPN-04 Manager Integration Record

## Accepted upstream evidence

- TCW-016 Manager intake recorded a real deployed authenticated ESPN IR opportunity without committing the recording.
- Independent Auditor PR #84 returned `PASS CANDIDATE` with no findings.
- Auditor review verified the current implementation preserves the observed IR roster placement/status, preserves numeric zero projection, excludes the IR occupant from active-lineup optimization, and keeps waiver legality aware of IR state.
- Auditor explicitly limited the verdict to the naturally observed supported eligible/filled IR state and did not infer unobserved grandfathered, invalid, over-capacity, unsupported, or unverified IR states.

## Privacy-safe field facts accepted for registry integration

- A real ESPN roster already had one player occupying the configured IR slot with ESPN `IR` designation.
- Authenticated Refresh ESPN succeeded.
- The Chip Winner preserved the occupant in its IR section with normalized `INJURED_RESERVE` status.
- The observed ESPN `0.0` projection remained `0.0`; no replacement value was invented.
- Lineup Lab did not promote the IR occupant into the active lineup recommendation path.
- Waivers remained usable and legality-aware with the valid IR occupant present.
- League Setup showed one configured `IR × 1` slot.
- No roster transaction was performed to manufacture the state.

## Manager disposition

Accept TCW-016 `PASS CANDIDATE` for the current `FV-ESPN-04` contract because that contract intentionally allows supported eligible, grandfathered, filled, invalid, and/or unverified states as genuine opportunities arise rather than requiring manufactured coverage of every state.

The registry pass is bounded to the observed supported eligible/filled state. Unobserved IR edge states remain unclaimed.
