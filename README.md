# The Chip Winner

A read-only, in-season fantasy football decision companion built around a normalized ESPN league snapshot. It connects roster, matchup, lineup, waiver, acquisition, schedule, and availability data with deterministic recommendations while keeping ESPN source facts separate from external rankings/projections and locally derived analysis.

## Live website

**[Open The Chip Winner](https://ryan42062001.github.io/the-chip-winner/)**

## Run locally

Requirements: Node.js 20 or newer and Chrome or Chromium for the browser checks.

```bash
npm install
npm run dev
```

Open `http://localhost:4173`. The app initially uses realistic sample data. Choose **Import ESPN snapshot** to load a compatible JSON file; validated imports are cached only in the current browser.

Choose **Import ROS rankings** to load a FantasyPros rest-of-season CSV. The import dialog requires you to record the export's season, scoring format, and expert filter; the app does not infer them from the filename. Players are reconciled using name plus NFL team plus position because the consumer ROS export does not supply provider IDs; unresolved or conflicting identities are reported. Rankings stay in browser-local storage and never overwrite ESPN weekly projections.

Weekly FantasyPros projection imports use a stricter provider-ID boundary. See [FantasyPros weekly projection acquisition](docs/fantasypros-api.md).

### One-click zero-cost weekly PPR updates

For a connected real ESPN league, The Chip Winner now handles the normal in-season projection workflow in the browser. ESPN supplies the authoritative season and current scoring week. The site checks DynastyProcess's public FantasyPros-derived weekly publication on load, after a successful ESPN refresh, and when the page later regains focus. When a fresh publication is available, the header control changes to **Update Week X projections** or **Refresh Week X projections**.

The update still requires one explicit click because DynastyProcess's `fp_latest_weekly.csv` does not contain an NFL week column. On the first import, that click is the user's explicit approval to label the latest fresh same-season publication as ESPN's current week. Once a prior week is stored, the next ESPN week will not become updateable until the source publication is newer than the stored previous-week publication. A source publication more than eight days old is also blocked. This prevents a stale Week N-1 file from being silently relabeled as Week N.

After approval, the browser downloads the current weekly file and DynastyProcess player-ID database, keeps the source-published PPR `r2p_pts` signal, runs the existing stable-ID, D/ST, reviewed bridge, provider-supersession, and unresolved-row rules, then commits projection and identity caches through the existing atomic import transaction. Previous weeks remain stored, the selected planning horizon expands to the imported weeks, and failures leave the prior valid caches intact. The browser stores only a small local update receipt/provenance summary; the third-party weekly dataset is never committed to or rehosted by this public repository.

The browser requests only public source data from `raw.githubusercontent.com` and `api.github.com`; it sends no ESPN cookies, credentials, or league payload to those hosts. Generic source `PPR` is treated as the same scoring family as ESPN labels such as `Head to Head PPR`, without relabeling the source as a custom ESPN-scoring projection. Known incompatible scoring families remain blocked.

The command-line stager remains available for development, recovery, and source auditing:

```bash
npm run projections:dynastyprocess-weekly -- --season 2026 --week 1
```

It writes ignored `local-data/` projection, identity-map, and metadata files. The command also requires the week explicitly and never infers it from a date. Missing or conflicting athlete IDs remain excluded rather than repaired by display name.

## Connect an ESPN league

League ID, season, and team ID are entered during first-run setup or in **League Setup** and stored only in that browser. Multiple league/season/team profiles can be saved locally. You may paste the full ESPN team URL into the first field; the app extracts and stores only its numeric connection IDs. The repository contains no configured user league. Private leagues require Chrome to make the read request through the local ESPN Companion extension while signed in to ESPN.

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose the repository folder `extensions/espn-companion`.
5. Sign in to ESPN in the same Chrome profile.
6. Reload the live website, enter the IDs from your ESPN team URL, save the connection, and choose **Connect ESPN**.

The extension does not expose ESPN cookies to the website and does not contain write operations. See [`extensions/espn-companion/README.md`](extensions/espn-companion/README.md) for its security boundary.

Run the checks:

```bash
npm test
npm run check
npm run audit:a11y
npm run audit:performance
```

Production releases and safe rollback are documented in [`docs/deployment.md`](docs/deployment.md).

## Current capabilities

- Responsive weekly roster dashboard with starters, bench, matchup, projections, freshness, and coverage
- Multiple browser-local ESPN league/season/team connection profiles with companion health and refresh cooldowns
- Complete supported-slot lineup optimization with duplicate prevention, ESPN/reported-kickoff locks, and explicit missing-data limitations
- Interactive start/sit comparisons with source-separated external weekly projection detail when explicitly mapped
- Roster-aware waiver add/drop simulations based on ESPN availability and full legal-lineup impact
- ESPN-reported acquisition limits, roster size, and provider-position limits enforced without inferring absent rules
- Current-week ESPN-pool replacement benchmark kept separate from legal-lineup gain
- FantasyPros ROS PPR CSV import with visible reconciliation coverage and separate ROS waiver comparisons
- Strict provider-ID weekly projection imports, explicit FantasyPros-to-ESPN identity approvals, atomic multiweek merges, capture provenance, and coverage repair reports
- One-click browser DynastyProcess weekly PPR updates keyed to ESPN's current week, with guarded publication rollover, retained prior weeks, local receipts, and no scheduled blind week inference
- Zero-cost local DynastyProcess CLI staging with stable FantasyPros-to-ESPN ID crosswalks, explicit week assignment, publication provenance, and fail-closed unresolved mappings for auditing/recovery
- Season Plan depth, bye-collision, fantasy-opponent schedule coverage, explicit playoff-week configuration, optimized future lineups, and isolated hold/add/drop scenarios
- Multiweek scenario totals withheld unless every included week has complete mapped coverage for both baseline and simulated rosters
- Snapshot differencing, a team-specific **What Changed** timeline, recommendation-change explanations, and persistent prioritized alerts
- Validated JSON import, versioned browser-cache migrations, complete local-data deletion, and recovery-safe last-valid-snapshot behavior
- End-to-end encrypted mobile sync through a deployed Cloudflare Worker and KV storage
- Provider-neutral recommendation/model contracts with deterministic offline evaluation and privacy-safe aggregate issue reporting
- Automated GitHub Pages release gates covering tests, model safety, dependency audit, secret scanning, companion least privilege, browser smoke, accessibility, performance, and production verification

This version reads a locally configured private ESPN league through the Chrome companion but does **not** mutate an ESPN lineup or submit transactions. Bundled development data is sample context and must not be treated as current fantasy-football facts.

## Import format

See [`docs/snapshot-schema.md`](docs/snapshot-schema.md) and [`src/data/sample-espn-snapshot.json`](src/data/sample-espn-snapshot.json). An imported document must declare `schemaVersion: 1`, an ESPN league, the current week, teams, players, rosters, and matchups. Optional projection and availability fields remain optional—missing values are not fabricated.

## Project structure

```text
src/
  app.js                         Browser composition and top-level coordination
  application/                   State transitions and the single application store
  styles.css                     Responsive visual system
  data/                          Local development snapshots
  domain/                        Platform-neutral model, optimization, scenarios, and recommendations
  providers/espn/                ESPN acquisition, connection state, normalization, and caching
  providers/projections/         Weekly/multiweek projection contracts, imports, catalogs, and identity maps
  providers/rankings/            FantasyPros ROS CSV parsing, cache, and reconciliation
  ui/                            View rendering and focused interface helpers
extensions/espn-companion/       Read-only Chrome bridge for private ESPN leagues
worker/                          Encrypted mobile-sync transport
schema/                          Machine-readable external contracts
scripts/                         Development, acquisition, evaluation, audit, and smoke tooling
test/                            Node regression, browser-boundary, and domain tests
docs/                            Architecture, security, data-source, deployment, and roadmap notes
```

See [`docs/architecture.md`](docs/architecture.md) for boundaries and extension guidance.

See the [`product roadmap`](docs/roadmap.md) for the authoritative current execution plan, completion status, and immediate dependency order.

See the [`advanced features roadmap`](docs/advanced-roadmap.md) for the longer release sequence from player intelligence through optional confirmed ESPN actions.

See [`AI readiness`](docs/ai-readiness.md) for model context boundaries, recommendation guardrails, and deterministic evaluation.

See [`Security model`](docs/security.md) for browser trust boundaries, Content Security Policy, mobile-sync behavior, and local-data deletion.

See [`privacy and data handling`](docs/privacy.md) for the Chrome companion's read scope, local caching behavior, and deletion path.

See [`secure mobile synchronization`](docs/mobile-sync.md) for the encrypted cross-device design and required backend contract.

## Data safety and provenance

- ESPN imports and cached snapshots remain in browser `localStorage`. Mobile sync is optional and uploads only an AES-256-GCM encrypted envelope with a bounded expiry.
- The app never writes to ESPN and contains no ESPN credentials.
- A projection value of `0` is distinct from a missing value of `null`.
- Derived suggestions are calculated at runtime and never written back into source snapshots.
- Imported files are rejected when identities, lineup slots, references, source metadata, or numeric values violate their contracts.
- Projection-driven multiweek claims are withheld when explicit identity or player-week coverage is incomplete.
- Free weekly updates never fall back to player-name joins and never claim the source-published PPR estimate is a custom ESPN scoring projection.
- Source availability checks never send ESPN league state or credentials to DynastyProcess/GitHub; only the public source URLs are requested.

## Current focus

The read-only foundation is substantially implemented. The active work is to finish it rather than start a new product layer:

1. Accumulate real weekly PPR player-week coverage through the browser update workflow as each source publication becomes available; keep exact gaps visible and never infer an upstream week or identity that the evidence cannot support.
2. Finish the remaining Waiver Engine v2 gaps: authoritative IR handling only when ESPN supplies the required rules/eligibility inputs, then projection-gated multiweek waiver impact after coverage is complete.
3. Add position-specific schedule difficulty only after approving and documenting a trustworthy source and methodology.
4. Complete manual accessibility, companion security, recovery/deletion, and materially different live-league validation for the v1.0 read-only release gate.

Trade analysis, notifications, server-side model integrations, and ESPN write actions remain later gated work. See [`docs/roadmap.md`](docs/roadmap.md) for the authoritative execution status.
