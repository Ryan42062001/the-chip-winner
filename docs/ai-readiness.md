# Advanced-model readiness

The Chip Winner is designed so an advanced model can explain and rank decisions without becoming the source of truth. ESPN remains the league-state provider; projection and ranking providers remain replaceable; recommendations are derived and validated locally.

## Guardrails

- Models receive normalized, privacy-scoped context and derived recommendation envelopes, never ESPN cookies or raw private-session credentials.
- Every recommendation must name its inputs, capture time, confidence, and limitations.
- `null` means unavailable. A model must not fill missing rankings, projections, injuries, player identities, availability, or league rules.
- Model output is advisory and read-only. No lineup, waiver, trade, or league mutation is authorized by the interface.
- Deterministic legality and recommendation evaluation remain authoritative even if a future network model produces an explanation.

## Context packet contract

The app can export a versioned model context packet for the selected team. It includes the approved normalized team/week context, source coverage, and recommendation envelopes relevant to the decision while excluding browser credentials, unrelated teams' rosters, raw private-session state, and recommendations that fail offline evaluation.

A provider-neutral model adapter defines the explanation boundary. Its deterministic fallback can produce traceable summaries without network access, while unconfigured network providers fail explicitly. Any future external provider must stay downstream of the same deterministic gate and requires explicit approval for provider choice, privacy, cost, secret storage, and data handling.

## Implemented evaluation baseline

The repository already has the deterministic model-safety foundation that earlier plans treated as future work:

- recommendation envelopes are validated against the runtime contract corresponding to `schema/recommendation.schema.json`;
- fixtures cover missing data, locks, lineup/waiver legality, identity and availability failures, acquisition limits, and scenario boundaries;
- recommendation evaluation rejects invented player IDs, unavailable waiver/scenario adds, illegal selected-team drops, opponent-roster drops, stale capture timestamps, and output without named inputs;
- explanation regression fixtures require the correct recommendation ID, provider attribution, named source inputs, every stated limitation, strict metadata, bounded text, and valid response shape;
- per-recommendation failures are isolated rather than aborting unrelated explanations;
- stable machine-readable issue codes feed a versioned aggregate evaluation report with recommendation/explanation counts and runtime consistency checks;
- aggregate observability contains counts and issue codes, not recommendation IDs, player IDs, prompts, explanation text, or league details.

`npm run eval:model` exercises the current versioned recommendation and adversarial explanation fixtures, and the GitHub Pages release workflow requires the model-safety gate to pass.

`schema/model-explanation.schema.json` strictly limits provider explanation fields and output length. Runtime evaluation rejects unexpected fields, malformed provider metadata, invalid timestamps, and text beyond the approved boundary before an explanation can be accepted.

`schema/model-evaluation-report.schema.json` defines the privacy-safe aggregate run report. Runtime validation enforces count consistency and rejects unexpected telemetry fields.

## Current model priorities

Model work is not the primary product bottleneck. Before adding a network-backed model, continue to strengthen deterministic safety only when product changes create new recommendation shapes or failure modes.

Current model-related work should therefore be limited to:

1. Add or update safety fixtures when lineup, waiver, scenario, schedule, or trade-domain behavior changes.
2. Keep explanation evaluation synchronized with recommendation contracts and new limitation fields.
3. Preserve privacy-safe observability and avoid logging raw model context or private league data.
4. Delay server-side or external model integration until the provider, privacy, cost, secret-storage, and evaluator gates in the roadmap are explicitly approved.

A model must never replace provider normalization, identity reconciliation, projection-coverage gates, or roster legality checks.

## Future projection input

`schema/future-projection-set.schema.json` defines the provider-neutral weekly projection format. Imports require provider-owned player IDs and explicit week-level values; display-name matching is intentionally excluded from this boundary.

The scenario engine can calculate an optimized weekly baseline when both a validated projection set and an explicit provider-to-ESPN identity map are supplied. Partial identity or player-week coverage produces missing projections rather than automatic matches or invented values.

Read-only add/drop scenarios are evaluated against isolated roster copies and rerun legal lineup assignment; the ESPN snapshot remains unchanged. Selected-horizon totals and deltas are withheld unless both baseline and simulated rosters have complete mapped coverage for every included week.

Weekly projections can be imported from strict provider data containing explicit provider, scoring, season, week, provider player ID, points, and capture metadata. Source metadata must be compatible and explicit; the app never substitutes import time for provider capture time.

The local FantasyPros API downloader reads its key only from `FANTASYPROS_API_KEY`, requests supported lineup positions, and emits app-ready projection data plus a separate identity reference under ignored `local-data/`. Missing provider IDs or scoring-specific point values are excluded, conflicting values fail the download, and display names never become an automatic projection identity join.

For users without live projection API access, the manual FantasyPros workflow combines user-supplied QB, FLX, K, and DST exports only after season, week, and scoring metadata are supplied. It preserves source values while requiring explicit provider-to-ESPN identity approval before records can influence scenarios. Blank fantasy-point values remain missing and never become zero.
