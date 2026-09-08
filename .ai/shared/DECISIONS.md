# The Chip Winner — Durable Decisions

Last reconciled: 2026-09-08

These entries codify durable decisions already established by repository evidence. They do not create new product scope.

## TCW-D001 — ESPN remains authoritative for league state

Status: ACTIVE

ESPN owns league state, rosters, lineup slots, availability, locks, acquisition state, and explicit league rules when supplied. External data cannot silently override those facts.

## TCW-D002 — Release 1.0 remains read-only

Status: ACTIVE

The current product boundary excludes ESPN lineup changes, add/drop submissions, waiver claims, trades, and other write actions. Read reliability must be proven before any future write milestone is considered.

## TCW-D003 — Missing data remains missing

Status: ACTIVE

`null`, absent fields, unresolved identities, unknown rules, and incomplete projection windows may not be converted into zero, guessed facts, or artificial recommendation advantages.

## TCW-D004 — Stable identity evidence is required

Status: ACTIVE

Projection-provider joins use provider-owned IDs and explicit mappings. Display-name diagnostics are not identity evidence. Unresolved or conflicting mappings fail visibly.

## TCW-D005 — Recommendations are derived and source-separated

Status: ACTIVE

Derived lineup, waiver, season, and model outputs do not mutate source snapshots. ESPN facts, external projections/rankings, and derived conclusions remain attributable and inspectable.

## TCW-D006 — Waiver Engine v2 reviewed deterministic scope is closed

Status: ACTIVE

The v0.9.69 reviewed scope is complete. It should reopen only for a reproduced defect or separately approved policy/feature work. Future-only IR-assisted stash discovery is not implicitly part of v2.

## TCW-D007 — Season/Playoff Intelligence reviewed deterministic scope is closed

Status: ACTIVE

The v0.9.70 reviewed scope is complete. ESPN playoff facts, labeled local fallback, bye fillability, complete-coverage projection aggregates, and imported FantasyPros SOS remain separate lenses rather than a hidden composite score.

## TCW-D008 — Release 1.0 is evidence-gated

Status: ACTIVE

Every item in `config/field-validation.json` must be `passed` with privacy-safe evidence before Release 1.0 can close. Synthetic tests do not substitute for a field check that explicitly requires real-world evidence.

## TCW-D009 — Protected branch workflow is mandatory

Status: ACTIVE

Feature, documentation, dependency, and maintenance work uses task branches and pull requests. Required CI must pass before merge, and post-merge production verification must succeed before work is reported fully complete.

## TCW-D010 — Canonical `.ai` state supersedes stale handoffs after reconciliation

Status: ACTIVE

Once the `.ai` workflow is merged, `.ai/shared/PROJECT_STATE.md`, `.ai/shared/ROADMAP.md`, `.ai/shared/DECISIONS.md`, and `.ai/shared/WORKFLOW.md` become the canonical coordination layer. Older point-in-time handoffs remain evidence but do not override newer verified repository state.
