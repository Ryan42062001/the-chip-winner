# FantasyPros weekly projection acquisition

The local downloader retrieves weekly projections from the official FantasyPros API without exposing its API key to the website, repository, generated CSV files, logs, or model context.

## Private local setup

Open PowerShell in the repository and enter:

```powershell
$env:FANTASYPROS_API_KEY = Read-Host "FantasyPros API key" -MaskInput
npm run projections:fantasypros -- --season 2026 --week 1 --scoring PPR
```

The environment variable exists only in that PowerShell process. Do not place a real key in `.env.example`, source code, browser storage, a GitHub secret for this public site, or a support message.

Free keys that cannot access live projections may still be tested against the canonical player-directory endpoint:

```powershell
npm.cmd run players:fantasypros
```

This writes `local-data/fantasypros-player-directory.csv`. It preserves FantasyPros IDs and reference labels but creates no ESPN mapping or display-name join.

## Free manual projection CSV staging

The simplest path is available in **League Setup → Import FantasyPros exports**. Select the free QB, FLX, K, and DST CSVs together. For each player you want to activate, paste the player's canonical FantasyPros profile URL and explicitly choose the matching ESPN player. Roster players are listed first. The browser imports only approved pairs and keeps the projection source separate from the ESPN snapshot.

The command-line review workflow below remains useful for bulk spreadsheet review.

FantasyPros QB, FLX, K, and DST exports can be staged into one review file after the season, week, and scoring format are explicitly supplied:

```powershell
npm.cmd run projections:fantasypros-csv -- --season 2026 --week 1 --scoring PPR --qb "C:\path\QB.csv" --flx "C:\path\FLX.csv" --k "C:\path\K.csv" --dst "C:\path\DST.csv"
```

The staging parser handles FantasyPros' duplicate stat headers and formatting-only rows, but reads only `Player`, `Team`, optional `POS`, and `FPTS`. Blank fantasy points are rejected rather than converted to zero. The generated review CSV keeps `fantasypros_player_id` and `espn_player_id` blank until they are explicitly verified. It is not accepted by the app as a projection set while either identity is missing.

Open `local-data/fantasypros-2026-week-1-ppr-identity-review.csv` in a spreadsheet and fill both ID columns only for players you explicitly verify. The review-only name, team, and position columns help a person check the row; the finalizer never uses them to join players. Leave both ID cells blank to exclude a row. A canonical FantasyPros player identifier must come from FantasyPros, and the ESPN player ID must come from the ESPN snapshot or player URL.

After saving the completed review CSV, create the two strict app imports:

```powershell
npm.cmd run projections:fantasypros-finalize -- --input "local-data\fantasypros-2026-week-1-ppr-identity-review.csv"
```

The command fails when only one ID is filled, an ID maps ambiguously, source metadata differs, or a points value is missing. It produces:

- `local-data/fantasypros-2026-week-1-projections.csv`, imported with **Import weekly CSV**.
- `local-data/fantasypros-2026-week-1-identity-map.csv`, imported with **Import ID map**.

Unmapped rows remain excluded and are reported in the command output. This lets the app use a partially mapped file honestly while continuing to block any scenario week without complete roster coverage.

## Paid API output

Paid-downloader files are written under ignored `local-data/`:

- `fantasypros-2026-week-1-ppr.csv` is compatible with the app's weekly projection importer.
- `fantasypros-2026-identity-reference.csv` contains FantasyPros IDs and human-readable reference fields. Fill its `espn_player_id` column only from explicit ESPN IDs, then import it as the ID map. Names are for review and are never used as automatic joins.

The downloader requests QB, RB, WR, TE, K, and DST separately. PPR imports require FantasyPros `points_ppr`; missing values are excluded rather than replaced with another scoring format. The HTTP response date is stored as the source-response capture time. It proves when the API response was retrieved, not when FantasyPros last recalculated an individual projection.

Run the command again for each available week. The application withholds multiweek deltas unless both baseline and simulated rosters have complete explicit identity and player-week projection coverage.
