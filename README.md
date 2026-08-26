# The Chip Winner

An ESPN-only, in-season fantasy football companion. This MVP presents roster, matchup, lineup, waiver, injury, and bye-week information from a normalized ESPN snapshot. It deliberately distinguishes imported/source data from locally derived suggestions.

## Live website

**[Open The Chip Winner](https://ryan42062001.github.io/the-chip-winner/)**

## Run locally

Requirements: Node.js 18 or newer. There are no runtime dependencies to install.

```bash
npm run dev
```

Open `http://localhost:4173`. The app initially uses realistic sample data. Choose **Import ESPN snapshot** to load a compatible JSON file; validated imports are cached only in the current browser.

## Connect the private ESPN league

The configured development league is ESPN league `118749183`, season `2026`, team `2`. Because it is private, Chrome must make the read request through the local ESPN Companion extension while signed in to ESPN.

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose the repository folder `extensions/espn-companion`.
5. Sign in to ESPN in the same Chrome profile.
6. Reload the live website and choose **Connect ESPN**.

The extension does not expose ESPN cookies to the website and does not contain write operations. See [`extensions/espn-companion/README.md`](extensions/espn-companion/README.md) for its security boundary.

Run the checks:

```bash
npm test
npm run check
```

## Current capabilities

- Responsive weekly roster dashboard with starters, bench, matchup, and projections
- Team switching for snapshots with multiple teams
- Projection-based, position-eligible lineup comparisons
- Interactive start/sit comparisons with near-tie and missing-data handling
- Conservative waiver add/drop comparisons based on explicit availability
- Live free-agent versus waiver status and non-conflicting drop suggestions
- Injury and current-week bye flags
- Validated JSON import and browser-local snapshot cache
- One-click return from an imported snapshot to bundled sample data
- Snapshot freshness and field-coverage indicators
- Honest missing states when projections, opponents, availability, or other fields are absent
- Reducer-based application state and reusable domain selectors
- Independent projection-provider contract for future non-ESPN projections
- Connected ESPN scoring, lineup-slot, and waiver settings

This version does **not** authenticate with ESPN or mutate an ESPN lineup. All bundled player data is fictionalized development context using recognizable names; projections and statuses are explicitly marked as sample data and must not be treated as current facts.

## Import format

See [`docs/snapshot-schema.md`](docs/snapshot-schema.md) and [`src/data/sample-espn-snapshot.json`](src/data/sample-espn-snapshot.json). An imported document must declare `schemaVersion: 1`, an ESPN league, the current week, teams, players, rosters, and matchups. Optional projection and availability fields remain optional—missing values are not fabricated.

## Project structure

```text
src/
  app.js                         UI composition and browser state
  application/                   State transitions and store
  styles.css                     Responsive visual system
  data/                          Local development snapshots
  domain/                        Platform-neutral model and recommendations
  providers/espn/                ESPN snapshot ingestion and caching
  providers/projections/         Projection source contract and overlay
extensions/espn-companion/       Read-only Chrome bridge for private ESPN leagues
schema/                           Machine-readable snapshot contract
scripts/dev-server.js            Dependency-free local server
test/                            Node unit tests
docs/                            Architecture and data-contract notes
```

See [`docs/architecture.md`](docs/architecture.md) for boundaries and extension guidance.

See the [`product roadmap`](docs/roadmap.md) for planned releases, acceptance criteria, and the immediate next sprint.

See [`privacy and data handling`](docs/privacy.md) for the Chrome companion's read scope, local caching behavior, and deletion path.

## Data safety and provenance

- Imports remain in browser `localStorage`; the MVP sends no league data over the network.
- The app never writes to ESPN and contains no ESPN credentials.
- A projection value of `0` is distinct from a missing value of `null`.
- Derived suggestions are calculated at runtime and never written back into source snapshots.
- Imported files are rejected when identities, lineup slots, references, or numeric values violate the v1 contract.

## Foundation roadmap

The next meaningful integration is a read-only ESPN normalization adapter behind the existing provider seam. After that, an external projection provider can be joined by stable player IDs through the projection overlay without changing ESPN league-state code.
