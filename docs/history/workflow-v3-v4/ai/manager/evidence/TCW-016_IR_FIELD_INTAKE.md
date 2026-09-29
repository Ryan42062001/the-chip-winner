# TCW-016 — FV-ESPN-04 Field Evidence Intake

Evidence source: user-supplied real deployed screen recording. The recording itself is not committed.

## Privacy-safe observed facts

- ESPN Fantasy My Team visibly showed one real player occupying the league IR slot with ESPN `IR` designation.
- The same public NFL player was Isiah Pacheco; ESPN displayed a 0.0 projection in the observed row.
- The Chip Winner successfully completed a live ESPN refresh during the recording.
- The deployed Overview preserved an `IR` section with `1 PLAYER` and the same player.
- The deployed Overview normalized the player status as `INJURED_RESERVE` and displayed the same observed 0.0 projection rather than inventing a replacement value.
- The Overview surfaced an injury attention alert for the IR occupant.
- Snapshot coverage remained explicit: roster projections 100%, injury statuses 94%, NFL opponents 100%.
- Lineup Lab remained usable after refresh and showed an optimal known lineup without pulling the IR occupant into the active lineup recommendation path.
- Waivers remained usable and legality-aware; the visible current-week explanation referred to the strongest known legal lineup and allowed only an unlocked bench drop or supported bench-to-IR move.
- The Waivers diagnostics visible in the same deployed session were: considered adds 89, complete adds 88, scenarios evaluated 352, qualified adds 0.
- League Setup showed one configured `IR × 1` lineup slot and ESPN roster size 15.
- No roster transaction was performed to manufacture an edge state.

## Manager intake classification

Observed real state: supported eligible/filled IR slot opportunity.

Manager has not marked `FV-ESPN-04` passed. Independent Auditor verdict is required before any field-registry mutation.
