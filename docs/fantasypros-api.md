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

Generated files are written under ignored `local-data/`:

- `fantasypros-2026-week-1-ppr.csv` is compatible with the app's weekly projection importer.
- `fantasypros-2026-identity-reference.csv` contains FantasyPros IDs and human-readable reference fields. Fill its `espn_player_id` column only from explicit ESPN IDs, then import it as the ID map. Names are for review and are never used as automatic joins.

The downloader requests QB, RB, WR, TE, K, and DST separately. PPR imports require FantasyPros `points_ppr`; missing values are excluded rather than replaced with another scoring format. The HTTP response date is stored as the source-response capture time. It proves when the API response was retrieved, not when FantasyPros last recalculated an individual projection.

Run the command again for each available week. The application withholds multiweek deltas unless both baseline and simulated rosters have complete explicit identity and player-week projection coverage.
