# v0.9.88 — Waiver position board

## Summary

v0.9.88 adds an informational available-player board to Waivers so a manager can still see the strongest current-week options by position when no transaction clears the strict full-lineup action threshold.

The new board is deliberately separate from the existing waiver recommendation engine. It improves browsing without weakening ESPN legality checks or turning a simple projection comparison into a transaction recommendation.

## Available player board

- Shows the top 3 ESPN-available players by current-week ESPN projection at QB, RB, WR, TE, K, and D/ST.
- Reports how many ESPN-available players at each position have a usable current-week projection; players without a projection are counted as available but are not silently ranked as zero.
- Compares each displayed player with the lowest projected **non-IR** rostered player at the same listed position.
- Uses an explicit 0.5-point comparison band:
  - `+ Better` — at least 0.5 projected points above the same-position roster baseline.
  - `≈ Similar` — within 0.5 projected points of the baseline.
  - `− Below` — at least 0.5 projected points below the baseline.
  - `? No baseline` — no trustworthy projected same-position non-IR roster baseline is available.
- Adds an `Act now` badge only when the existing strict current-week waiver engine independently recommends that add.
- Keeps every board row linked to the existing player-detail surface.

## Safety boundary

The `+ / ≈ / −` signal is browsing context only. It does not claim that a move is legal, optimal, or likely to clear waivers.

The existing full-lineup waiver engine remains authoritative for actual recommendations and continues to enforce ESPN availability, roster size, position limits, acquisition capacity, IR state, locks, and the 0.5-point current-week lineup-gain threshold. The board does not alter those rules, does not fabricate missing projections, and does not use an IR occupant as the active roster comparison baseline.

## Source boundary

The position board ranks and compares **ESPN current-week projections only**. External FantasyPros/DynastyProcess values remain independently labeled elsewhere and are not blended into this board.
