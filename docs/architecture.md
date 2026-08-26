# Architecture

## Direction

The application is split into four layers:

1. **Provider layer** — acquires, validates, normalizes, and caches ESPN snapshots or optional projection overlays.
2. **Domain layer** — holds the normalized model, selectors, and pure recommendation functions.
3. **Application layer** — owns explicit state transitions for loading, team selection, and navigation.
4. **Interface layer** — renders state and labels missing data without filling gaps.

The dependency direction is interface → application/domain ← providers. Recommendation code never reads ESPN API responses directly, and UI code does not own source normalization.

## Source and derived data

`EspnSnapshotProvider` owns imported source data. It may later be joined by an authenticated ESPN adapter, browser extension bridge, or server-side fetcher; each should output the same versioned snapshot contract.

Functions in `src/domain/recommendations.js` return derived suggestions. They do not write into the snapshot, allowing the interface to identify their provenance and preventing recommendations from masquerading as source facts.

`src/domain/selectors.js` is the read boundary for team context, totals, freshness, and data coverage. It preserves completeness metadata so partial totals cannot be presented as complete comparisons.

## Application state

`src/application/store.js` provides a small framework-independent store and reducer. Named transitions keep loading and navigation behavior testable without a browser and leave room for a future framework migration.

## Adding projections later

ESPN remains the authority for league settings, membership, rosters, matchups, lineup slots, and availability. A future projection provider (for example, FantasyPros) should extend `src/providers/projections/projection-provider.js`, keyed by stable player identity. `applyProjectionSet` joins values immutably, retains source metadata, and reports unresolved identities. It must not be added to the ESPN provider.

`src/providers/projections/projection-catalog.js` is the source-neutral forecast store. It preserves providers independently by source, season, week, and scoring format, and requires capture metadata before a projection can enter the recommendation layer. Source selection and evaluation are documented in `docs/projection-source-research.md`.

`src/domain/identity.js` owns canonical provider identities and external-record reconciliation. It accepts only provider-owned IDs, reports unresolved and conflicting mappings, and intentionally contains no display-name fallback.

## Contract enforcement

Runtime validation lives in `src/domain/model.js`. The matching portable contract is `schema/espn-snapshot.schema.json`. Cross-reference rules—such as a roster referencing a known player—remain runtime checks because JSON Schema alone cannot express them cleanly. Both are versioned at `schemaVersion: 1`.

## ESPN integration seam

Live integration should be introduced behind the provider boundary:

```text
ESPN API / authenticated bridge
        ↓
EspnLiveProvider → normalized snapshot v1
        ↓
domain recommendations + existing UI
```

Important constraints for the live adapter:

- retain the raw capture separately for debugging;
- normalize ESPN lineup slot and injury codes explicitly;
- never infer an identity from only a display name;
- attach capture timestamps and source metadata;
- distinguish “not returned” from zero, healthy, or unavailable;
- use a server-side or user-authorized bridge for private leagues rather than embedding credentials.

`src/providers/espn/espn-normalizer.js` implements explicit ESPN lineup/position mappings and conversion from captured ESPN responses into snapshot v1. Network retrieval remains a separate transport concern.

The Chrome companion completes the read transport for a private league. Its service worker owns the credentialed ESPN request, restricts inputs to numeric league/season IDs and fixed views, and returns response JSON without exposing browser cookies. A narrow content-script bridge is limited to the deployed site and localhost. Website code normalizes and validates the response before caching it.

## Next increments

1. Build a read-only authenticated ESPN adapter or companion extension with captured fixtures.
2. Add stable external player-ID mappings and identity reconciliation.
3. Add matchup scoring progress and NFL game-state refreshes.
4. Add recommendation confidence, explanations, and user-configurable risk—only when trustworthy data exists.
