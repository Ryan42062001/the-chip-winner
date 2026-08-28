# Advanced-model readiness

The Chip Winner is designed so an advanced model can explain and rank decisions without becoming the source of truth. ESPN remains the league-state provider; projection and ranking providers remain replaceable; recommendations are derived locally.

## Guardrails

- Models receive normalized snapshots and derived recommendation envelopes, never ESPN cookies or raw private-session credentials.
- Every recommendation must name its inputs, capture time, confidence, and limitations.
- `null` means unavailable. A model must not fill missing rankings, projections, injuries, player identities, or availability.
- Model output is advisory and read-only. No lineup, waiver, trade, or league mutation is authorized by the interface.
- Recommendations are evaluated against legal lineup rules before display.

## Context packet contract

An eventual model adapter should receive: the selected team and week, normalized league settings, roster entries, opponent, source coverage, imported ranking metadata, and the recommendation envelopes relevant to the current view. It should not receive unrelated browser storage or credentials.

## Evaluation roadmap

1. Add deterministic fixtures for missing data, locked players, bye conflicts, ambiguous identities, and incomplete lineups.
2. Validate recommendation envelopes against `schema/recommendation.schema.json`.
3. Measure constraint adherence (no invented facts, legal slots, locked-player protection) before measuring helpfulness.
4. Add explanation regression tests that require source fields and explicit uncertainty.
5. Introduce a model adapter only after offline evaluation passes; keep the deterministic engine as the final gate.

The offline batch evaluator rejects malformed recommendation envelopes, invented player IDs, waiver/scenario adds that ESPN does not explicitly report as available, selected-team starter/IR/locked drops, opponent-roster drops, stale capture timestamps, and review output without named inputs.

The app can export a versioned, privacy-safe model context packet for the selected team. The packet excludes browser credentials, unrelated teams' rosters, raw availability pools, and any recommendation that fails offline evaluation.

A provider-neutral model adapter now defines the explanation boundary. Its deterministic fallback produces traceable summaries without network access, while unconfigured model providers fail explicitly.

`npm run eval:model` executes fourteen versioned recommendation fixtures and seven adversarial explanation fixtures, and the deployment workflow requires all of them to pass. Runtime recommendation validation mirrors the JSON Schema boundary, including timestamp, payload, and additional-field checks. A drop proposal is blocked when selected-team context is absent because bench and lock legality cannot be verified. Waiver and scenario adds are blocked when ESPN proves the selected team's weekly or season acquisition limit is exhausted. Explanation output is separately evaluated for the correct recommendation ID, provider attribution, named source inputs, every stated limitation, strict metadata, unexpected fields, and invalid response shapes. Per-recommendation failures are returned without exposing credentials or aborting unrelated explanations.

The evaluator also emits stable machine-readable issue codes and a versioned aggregate run report defined by `schema/model-evaluation-report.schema.json`. Report version 2 separates recommendation-gate issues from explanation/adapter issues while retaining combined totals. Runtime validation enforces count consistency and rejects unexpected telemetry fields. The report contains only accepted/rejected totals and issue-code counts—never recommendation IDs, player IDs, explanation text, prompts, or league details. This provides an observability boundary without turning private model inputs into logs.

`schema/model-explanation.schema.json` defines the provider-neutral explanation response. Runtime evaluation rejects unexpected fields, malformed provider metadata, invalid timestamps, and text beyond the 4,000-character boundary before an explanation can be accepted. This prevents raw prompts, hidden metadata, or unbounded provider output from passing through the approved explanation shape.

## Open model capabilities

Future work may summarize decisions, compare scenarios, and answer natural-language roster questions. It must remain downstream of the deterministic engine and must not replace provider normalization or legality checks.

## Future projection input

`schema/future-projection-set.schema.json` defines the provider-neutral weekly projection format. Imports require provider-owned player IDs and explicit week-level values; display-name matching is intentionally excluded from this boundary.

The scenario engine can now calculate an optimized weekly baseline when both a validated projection set and an explicit provider-to-ESPN identity map are supplied. Partial identity coverage produces missing projections rather than automatic name matches.

Read-only add/drop scenarios can be evaluated against that baseline across selected weeks. Every scenario uses an isolated roster copy and reruns legal lineup assignment; the ESPN snapshot remains unchanged.

Weekly projections can be imported from a strict CSV with `provider`, `scoring_format`, `season`, `captured_at`, `provider_player_id`, `week`, and `points` columns. Source metadata must be explicit and identical on every row; the app never substitutes import time for source capture time. Validated imports may be cached locally, while duplicate player-week rows and inconsistent metadata are rejected.
