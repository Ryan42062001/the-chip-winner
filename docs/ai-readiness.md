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

The first offline batch evaluator now rejects malformed recommendation envelopes, invented player IDs, and waiver/scenario adds that ESPN does not explicitly report as available.

The app can export a versioned, privacy-safe model context packet for the selected team. The packet excludes browser credentials, unrelated teams' rosters, raw availability pools, and any recommendation that fails offline evaluation.

A provider-neutral model adapter now defines the explanation boundary. Its deterministic fallback produces traceable summaries without network access, while unconfigured model providers fail explicitly.

## Open model capabilities

Future work may summarize decisions, compare scenarios, and answer natural-language roster questions. It must remain downstream of the deterministic engine and must not replace provider normalization or legality checks.

## Future projection input

`schema/future-projection-set.schema.json` defines the provider-neutral weekly projection format. Imports require provider-owned player IDs and explicit week-level values; display-name matching is intentionally excluded from this boundary.

The scenario engine can now calculate an optimized weekly baseline when both a validated projection set and an explicit provider-to-ESPN identity map are supplied. Partial identity coverage produces missing projections rather than automatic name matches.

Read-only add/drop scenarios can be evaluated against that baseline across selected weeks. Every scenario uses an isolated roster copy and reruns legal lineup assignment; the ESPN snapshot remains unchanged.

Weekly projections can be imported from a strict CSV with `provider_player_id`, `week`, and `points` columns plus explicit source metadata. Validated imports may be cached locally; duplicate player-week rows are rejected.
