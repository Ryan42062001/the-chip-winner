# ESPN Snapshot Contract v1

The browser importer accepts normalized JSON. The required top-level fields are:

| Field | Type | Meaning |
| --- | --- | --- |
| `schemaVersion` | `1` | Contract version |
| `provider` | `"espn"` | League-state provider |
| `league` | object | ESPN league identity and settings |
| `currentWeek` | integer | Active scoring period |
| `teams` | array | League teams and records |
| `players` | array | Referenced player identities and optional facts |
| `rosters` | array | Team entries with player IDs and lineup slots |
| `matchups` | array | Weekly home/away team pairings |

Optional `availablePlayers` is an array of player IDs known to be available in this league. If omitted, the waiver UI reports availability as missing.

Optional ESPN acquisition facts remain separated by owner: `league.waiver` contains league limits, processing days, and the starting budget; each `team.acquisition` contains that team's reported waiver rank, season/week acquisition counts, and budget spent. Missing values remain `null`. Recommendations are suppressed only when complete ESPN fields prove a season or current-week acquisition limit is exhausted.

Player fields `projection`, `seasonAverage`, `opponent`, `gameTime`, `byeWeek`, and `injury` are nullable/optional facts. `null` is rendered as unavailable; zero remains a real numeric value. Recommendation logic skips comparisons requiring a missing projection.

Supported lineup slots in the MVP are `QB`, `RB`, `WR`, `TE`, `FLEX`, `K`, `D/ST`, `BE`, and `IR`. A live ESPN normalizer is responsible for translating ESPN numeric slot IDs into these explicit values.

The complete working example is `src/data/sample-espn-snapshot.json`.

A machine-readable version is available at `schema/espn-snapshot.schema.json`. Runtime validation additionally enforces unique team/player IDs, known cross-references, supported positions and slots, non-negative projections, and valid matchup teams.
