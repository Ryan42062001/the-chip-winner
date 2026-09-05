# v0.9.73 — Live ESPN roster-limit compatibility

Release 1.0 field validation exposed a real authenticated ESPN league state that v0.9.72 could not normalize: `rosterSettings.positionLimits` contained an unsupported position ID with a non-finite/unlimited roster cap.

## Fix

- Unsupported ESPN roster position IDs are ignored only when ESPN explicitly reports the limit as disabled (`0`) or unlimited (`-1`).
- Unsupported position IDs with a finite limit still fail closed. The app will not silently discard a real roster cap that could make waiver advice illegal.
- Invalid numeric position-limit values still fail visibly.
- The field-validation registry records the live finding while keeping FV-ESPN-03 pending until the deployed fix is retested against the authenticated league.

## Verification

- Adds permanent ESPN normalizer coverage for the unlimited unsupported-position case.
- Retains the permanent finite-unknown-position rejection test.
- Expected permanent test baseline: 323 tests plus 21 model-safety fixtures, subject to protected CI verification.

The Chrome companion remains v0.2.2; this patch changes website normalization only.
