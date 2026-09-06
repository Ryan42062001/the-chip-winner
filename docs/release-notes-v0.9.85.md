# v0.9.85 — refresh weekly player identities independently

Field validation exposed a case where Week 1 projections were current but one roster player (Isiah Pacheco) remained unmapped in the locally cached projection identity registry.

## What changed

- The weekly projection updater now tracks the DynastyProcess `db_playerids.csv` publication separately from the weekly projection publication.
- A newer player-ID crosswalk can trigger `Refresh Week N player IDs` even when the point projections themselves are already current.
- Browsers with pre-v0.9.85 weekly-update receipts that do not record player-ID publication freshness receive a one-time identity refresh opportunity.
- Re-staging an identity refresh keeps the existing projection merge safeguards: older point rows are ignored, equal rows are retained, and conflicting equal-capture values still fail closed.
- The weekly-update receipt now records both projection and player-ID publication timestamps.

## Why

The previous updater decided freshness only from `fp_latest_weekly.csv`. If DynastyProcess corrected or added an ESPN identity in `db_playerids.csv` without a newer weekly projection publication, The Chip Winner could remain stuck with incomplete projection coverage even though a stable upstream mapping was available.

## Safety boundary

This release does not introduce display-name matching. Projection identities still come from stable provider IDs, explicit reviewed bridges, or the existing fail-closed identity rules. ESPN remains authoritative for league state, roster membership, availability, locks, IR legality, and acquisition rules.
