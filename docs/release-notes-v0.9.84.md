# v0.9.84 — authenticated ESPN scoring-settings read

Release 1.0 Lineup Lab field validation on v0.9.83 showed that the website correctly stopped treating `H2H_POINTS` as a reception-scoring format, but the live companion refresh still did not provide ESPN's detailed `scoringItems`. The external PPR projection source therefore remained blocked with reception scoring reported as unavailable.

## Field finding

After a deployed v0.9.83 hard refresh and authenticated ESPN refresh, Lineup Lab showed:

> Blocked: ESPN reception scoring format is unavailable. Refresh ESPN before using external weekly projections so scoring compatibility can be verified.

The live ESPN snapshot still contained the matchup scoring label and normal roster/matchup data, proving the issue was the scoring-settings acquisition boundary rather than the comparison UI.

## Fix

- Companion 0.2.4 now performs a dedicated authenticated `mSettings` request during every league refresh.
- The companion requires ESPN to return an explicit `scoringItems` array and fails the refresh closed if that contract is absent.
- Only the dedicated response's `scoringSettings` block is merged into the normal combined league response; unrelated league settings are not overwritten.
- The website now requires companion 0.2.4 or newer before allowing authenticated refreshes.
- Existing no-cookie-exposure, no-persistence, read-only ESPN boundaries remain unchanged.

## Regression coverage

- A service-worker integration test verifies the dedicated authenticated `mSettings` request, explicit scoring-item merge, and preservation of the main response's unrelated settings.
- A second integration case verifies that missing scoring items fail closed rather than silently accepting an incomplete refresh.
- The extension threat audit now requires the dedicated scoring read and explicit scoring-item contract.

`FV-ESPN-01` remains pending until the deployed v0.9.84 build and companion 0.2.4 are retested against the real authenticated league.
