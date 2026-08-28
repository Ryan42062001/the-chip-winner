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

Choose **Import ROS rankings** to load a FantasyPros rest-of-season CSV. The current importer records the file as 2026 PPR rankings with the top-10 expert filter, reconciles players using name plus NFL team plus position, and reports unresolved or conflicting identities. Rankings stay in browser-local storage and never overwrite ESPN weekly projections.

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
- Complete supported-slot lineup search with explicit ESPN and reported-kickoff lock handling
- Honest “best known” labeling whenever any roster projection is missing
- Interactive start/sit comparisons with near-tie and missing-data handling
- Roster-aware waiver add/drop simulations based on explicit ESPN availability and full legal-lineup impact
- Live free-agent versus waiver status and non-conflicting drop suggestions
- Injury and current-week bye flags
- Validated JSON import and browser-local snapshot cache
- One-click return from an imported snapshot to bundled sample data
- Snapshot freshness and field-coverage indicators
- Honest missing states when projections, opponents, availability, or other fields are absent
- Reducer-based application state and reusable domain selectors
- Independent projection-provider contract for future non-ESPN projections
- Connected ESPN scoring, lineup-slot, and waiver settings
- Local FantasyPros ROS PPR CSV import and caching
- Strict ESPN/FantasyPros player reconciliation with visible coverage
- Separate weekly-projection and rest-of-season waiver comparisons
- FantasyPros overall/positional rank and playoff schedule strength in player details
- End-to-end encrypted mobile sync through a deployed Cloudflare Worker and KV storage
- Local snapshot differencing and a team-specific What Changed timeline

This version reads the configured private ESPN league through the local Chrome companion but does **not** mutate an ESPN lineup. All bundled player data is fictionalized development context using recognizable names; projections and statuses are explicitly marked as sample data and must not be treated as current facts.

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
  providers/rankings/            FantasyPros CSV parsing, cache, reconciliation
extensions/espn-companion/       Read-only Chrome bridge for private ESPN leagues
schema/                           Machine-readable snapshot contract
scripts/dev-server.js            Dependency-free local server
test/                            Node unit tests
docs/                            Architecture and data-contract notes
```

See [`docs/architecture.md`](docs/architecture.md) for boundaries and extension guidance.

See the [`product roadmap`](docs/roadmap.md) for planned releases, acceptance criteria, and the immediate next sprint.

See the [`advanced features roadmap`](docs/advanced-roadmap.md) for the post-foundation release sequence from player intelligence through optional confirmed ESPN actions.

See [`AI readiness`](docs/ai-readiness.md) for model context boundaries, recommendation guardrails, and the evaluation roadmap.

See [`privacy and data handling`](docs/privacy.md) for the Chrome companion's read scope, local caching behavior, and deletion path.

See [`secure mobile synchronization`](docs/mobile-sync.md) for the encrypted cross-device design and required backend contract.

## Data safety and provenance

- ESPN imports and cached snapshots remain in browser `localStorage`. Mobile sync is optional and uploads only an AES-256-GCM encrypted envelope with a 30-day expiry.
- The app never writes to ESPN and contains no ESPN credentials.
- A projection value of `0` is distinct from a missing value of `null`.
- Derived suggestions are calculated at runtime and never written back into source snapshots.
- Imported files are rejected when identities, lineup slots, references, or numeric values violate the v1 contract.

## Foundation roadmap

The read-only ESPN connection, full known-projection lineup assignment, FantasyPros ROS rankings, encrypted mobile sync, snapshot-change timeline, roster-aware waivers, and Season Plan depth/bye analysis are in place. Next priorities are multiweek scenario planning and deeper schedule intelligence. See the advanced roadmap for the dependency order and acceptance criteria.
