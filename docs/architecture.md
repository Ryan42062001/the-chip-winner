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

`src/domain/lineup-optimizer.js` searches complete assignments across the supported ESPN starting slots instead of composing independent swaps. It prevents duplicate player assignments, respects explicit or already-started locks, and downgrades its result from “optimal” to “best known” when any roster projection is absent. Unsupported slot configurations fail visibly rather than being approximated.

`src/domain/selectors.js` is the read boundary for team context, totals, freshness, data coverage, and ESPN-reported fantasy schedules. It preserves completeness metadata so partial totals or schedules cannot be presented as complete comparisons. Small renderers under `src/ui` turn those provider-neutral results into escaped interface markup.

## Application state

`src/application/store.js` provides a small framework-independent store and reducer. Named transitions keep loading and navigation behavior testable without a browser and leave room for a future framework migration.

## Adding projections later

ESPN remains the authority for league settings, membership, rosters, matchups, lineup slots, and availability. A future projection provider (for example, FantasyPros) should extend `src/providers/projections/projection-provider.js`, keyed by stable player identity. `applyProjectionSet` joins values immutably, retains source metadata, and reports unresolved identities. It must not be added to the ESPN provider.

`src/providers/projections/projection-catalog.js` is the source-neutral forecast store. It preserves providers independently by source, season, week, and scoring format, and requires capture metadata before a projection can enter the recommendation layer. Source selection and evaluation are documented in `docs/projection-source-research.md`.

Model recommendations and explanations pass through deterministic evaluation before use. `schema/model-explanation.schema.json` strictly limits provider explanation fields and output length. Individual results retain human-readable errors plus stable issue codes, while version 2 of `schema/model-evaluation-report.schema.json` defines an aggregate, privacy-safe observability record with separate recommendation and explanation issue counts, combined counts, and runtime consistency validation.

`src/domain/identity.js` owns canonical provider identities and external-record reconciliation. It accepts only provider-owned IDs, reports unresolved and conflicting mappings, and intentionally contains no display-name fallback.

FantasyPros CSV rankings are a constrained exception because the export supplies no player IDs. `src/providers/rankings/ranking-provider.js` reconciles an exact normalized name only when NFL team and position also agree. Suffix and defense-name normalization cannot bypass those additional keys; duplicate composite identities become conflicts. `src/domain/ros-analysis.js` consumes only reconciled records and expresses differences as ranks, never as projected points.

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

League ID, season, and team ID are explicit browser-local onboarding inputs. A pasted ESPN team URL is parsed locally, restricted to ESPN's HTTPS team page, and reduced to those numeric IDs before storage. No user league is embedded in source defaults; existing saved profiles remain isolated in local storage and may be selected or removed in League Setup.

## Next increments

1. Run and validate the local FantasyPros API downloader, then complete its explicit FantasyPros-to-ESPN identity map.
2. Complete provider-to-ESPN identity maps and selected-horizon player-week coverage.
3. Expand playoff and schedule explanations only from documented inputs and methods.
4. Improve model-safety fixtures, explanation evaluation, and privacy-safe observability.
