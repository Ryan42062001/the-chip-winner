# Architecture

## Direction

The application is split into four layers:

1. **Provider layer** — acquires, validates, normalizes, and caches ESPN snapshots or optional projection/ranking overlays.
2. **Domain layer** — holds the normalized model, selectors, optimizers, scenarios, and pure recommendation functions.
3. **Application layer** — owns explicit state transitions for loading, team selection, navigation, and browser-level coordination.
4. **Interface layer** — renders state and labels missing data without filling gaps.

The dependency direction is interface → application/domain ← providers. Recommendation code never reads ESPN API responses directly, and UI code does not own source normalization or a second copy of application state.

## Source and derived data

`EspnSnapshotProvider` owns validated snapshot data. The live Chrome companion and ESPN normalizer feed the same versioned snapshot contract used by imported fixtures and cached data.

Functions in `src/domain/recommendations.js` return derived suggestions. They do not write into the snapshot, allowing the interface to identify their provenance and preventing recommendations from masquerading as source facts.

`src/domain/lineup-optimizer.js` searches complete assignments across the supported ESPN starting slots instead of composing independent swaps. It prevents duplicate player assignments, respects explicit or already-started locks, and downgrades its result from “optimal” to “best known” when required roster projections are absent. Unsupported slot configurations fail visibly rather than being approximated.

`src/domain/waiver-engine.js` evaluates ESPN-available candidates through legal roster and lineup simulation. ESPN-reported acquisition, roster-size, and position-limit constraints are enforced when supplied; absent rules remain unverified. Replacement-pool value is descriptive context and remains separate from legal-lineup gain.

`src/domain/scenario-planner.js` evaluates isolated future-week hold/add/drop scenarios without mutating the ESPN snapshot. Multiweek totals and deltas require complete mapped projection coverage for both baseline and simulated rosters across every selected week.

`src/domain/selectors.js` is the read boundary for team context, totals, freshness, data coverage, standings, and ESPN-reported fantasy schedules. It preserves completeness metadata so partial totals or schedules cannot be presented as complete comparisons. Renderers under `src/ui` turn those provider-neutral results into escaped interface markup.

## Application state and interface composition

`src/application/store.js` provides the framework-independent store and reducer. Named transitions keep loading and navigation behavior testable without a browser and leave room for a future framework migration.

`src/app.js` is the browser entry point and top-level coordinator. Section rendering, shell event binding, and projection-import transactions are extracted into focused modules with explicit dependencies. The application store remains the single snapshot/UI-state owner.

Large interface modules should continue to split along view boundaries as the product grows. In particular, avoid moving hidden snapshot copies, provider normalization, or a second state store into `src/ui` simply to reduce file size.

## Projection and ranking overlays

ESPN remains the authority for league settings, membership, rosters, matchups, lineup slots, availability, locks, and acquisition state. External rankings and projections are independent forecast inputs and must never silently replace ESPN league facts.

`src/providers/projections/projection-provider.js` defines the weekly projection contract. `src/providers/projections/projection-catalog.js` preserves provider data independently by source, season, week, and scoring format. `src/providers/projections/future-projection-provider.js` validates future-week sets and compatibility. Imports require source/capture metadata before a projection can enter recommendation or scenario logic.

`src/providers/projections/projection-identity-map.js` owns explicit provider-to-ESPN mappings. Projection joins use provider-owned IDs; display-name matching is excluded from this boundary. The FantasyPros manual-import workflow stages user-supplied weekly exports for explicit identity approval, and multiweek merges preserve per-record capture provenance while rejecting ambiguous or equal-time conflicts.

FantasyPros ROS CSV rankings are a constrained exception because the consumer export supplies no player IDs. `src/providers/rankings/ranking-provider.js` reconciles an exact normalized name only when NFL team and position also agree. Suffix and defense-name normalization cannot bypass those additional keys; duplicate composite identities become conflicts. `src/domain/ros-analysis.js` consumes only reconciled records and expresses differences as ranks, never as projected points.

Source selection and evaluation policy is documented in `docs/projection-source-research.md`. Missing forecast fields remain unavailable rather than being synthesized.

## Model boundary

Model recommendations and explanations remain downstream of deterministic legality and evaluation. `schema/recommendation.schema.json` and `schema/model-explanation.schema.json` define the approved shapes. Runtime evaluation returns human-readable errors plus stable issue codes, while `schema/model-evaluation-report.schema.json` defines an aggregate, privacy-safe observability record that contains counts rather than private recommendation content.

`src/domain/identity.js` owns canonical provider identities and external-record reconciliation. It accepts only provider-owned IDs for projection-provider joins, reports unresolved/conflicting mappings, and intentionally contains no display-name fallback.

## Contract enforcement

Runtime validation lives in `src/domain/model.js`. The matching portable contract is `schema/espn-snapshot.schema.json`. Cross-reference rules—such as a roster referencing a known player—remain runtime checks because JSON Schema alone cannot express them cleanly. Both are versioned at `schemaVersion: 1`.

## ESPN integration

The live read path remains behind the provider boundary:

```text
Authenticated ESPN session in Chrome
        ↓
ESPN Companion service worker
        ↓
companion client → ESPN normalizer → normalized snapshot v1
        ↓
domain recommendations/scenarios + existing UI
```

Important constraints:

- ESPN cookies stay inside Chrome's credentialed ESPN request context and are never returned to the website;
- normalize ESPN lineup slot, position, injury, acquisition, and roster-rule codes explicitly;
- never infer an identity from only a display name;
- attach capture timestamps and source metadata;
- distinguish “not returned” from zero, healthy, eligible, or unavailable;
- preserve the last valid snapshot when a refresh fails;
- keep the companion read-only and least-privilege.

`src/providers/espn/espn-normalizer.js` implements explicit ESPN mappings and conversion from captured ESPN responses into snapshot v1. Network retrieval remains separate from normalization.

The Chrome companion service worker owns the credentialed ESPN request, restricts inputs to numeric league/season IDs and fixed read views, and returns response JSON without exposing browser cookies. A narrow content-script bridge is limited to the deployed site and localhost. Website code normalizes and validates the response before caching it.

League ID, season, and team ID are explicit browser-local onboarding inputs. A pasted ESPN team URL is parsed locally, restricted to ESPN's HTTPS team page, and reduced to numeric IDs before storage. Multiple saved profiles remain isolated in local storage and may be selected or removed in League Setup.

## Current architectural increments

The authoritative implementation order lives in the **Current execution plan** in `docs/roadmap.md`. Architecture work should support that plan rather than create parallel priorities.

At the current stage the main increments are:

1. Complete explicit provider-to-ESPN identities and selected-horizon player-week projection coverage using real approved inputs.
2. Finish refresh-aware waiver recommendation state and IR behavior only where ESPN provides authoritative eligibility inputs; add multiweek waiver impact after projection coverage gates pass.
3. Add position-specific schedule difficulty only after a documented source and methodology are approved.
4. Complete manual accessibility/security/live-league validation for the read-only v1.0 gate.
5. Keep UI modules cohesive as Season Plan and waiver surfaces evolve, splitting large renderers by view without creating new state owners.
