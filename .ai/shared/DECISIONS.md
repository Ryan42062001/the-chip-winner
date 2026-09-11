# The Chip Winner — Durable Decisions

Last reconciled: 2026-09-11

These entries codify durable decisions established by repository evidence. They do not create unapproved product scope.

## TCW-D001 — ESPN remains authoritative for league state
Status: ACTIVE

ESPN owns league state, rosters, lineup slots, availability, locks, acquisition state, and explicit league rules when supplied. External data cannot silently override those facts.

## TCW-D002 — Release 1.0 remains read-only
Status: ACTIVE

The current product boundary excludes ESPN lineup changes, add/drop submissions, waiver claims, trades, and other write actions.

## TCW-D003 — Missing data remains missing
Status: ACTIVE

`null`, absent fields, unresolved identities, unknown rules, and incomplete projection windows may not become zero, guessed facts, or artificial recommendation advantages.

## TCW-D004 — Stable identity evidence is required
Status: ACTIVE

Projection-provider joins use provider-owned IDs and explicit mappings. Display-name diagnostics are not identity evidence. Unresolved/conflicting mappings fail visibly.

## TCW-D005 — Recommendations are derived and source-separated
Status: ACTIVE

Derived lineup, waiver, season, and model outputs do not mutate source snapshots. ESPN facts, external projections/rankings, and derived conclusions remain attributable and inspectable.

## TCW-D006 — Waiver Engine v2 reviewed deterministic scope is closed
Status: ACTIVE

The v0.9.69 reviewed scope reopens only for a reproduced defect or separately approved work. Future-only IR-assisted stash discovery is not implicitly part of v2.

## TCW-D007 — Season/Playoff Intelligence reviewed deterministic scope is closed
Status: ACTIVE

The v0.9.70 reviewed scope reopens only for reproduced defects or separately approved work. ESPN facts, labeled fallbacks, bye coverage, projection aggregates, and imported FantasyPros SOS remain separate lenses.

## TCW-D008 — Release 1.0 is evidence-gated
Status: ACTIVE

Every item in `config/field-validation.json` must be `passed` with privacy-safe evidence before Release 1.0 can close. Synthetic tests do not substitute for required real-world evidence.

## TCW-D009 — Protected branch workflow is mandatory
Status: ACTIVE

Feature, documentation, dependency, workflow, and maintenance work uses task branches and pull requests. Required CI must pass before merge, and post-merge production verification must succeed before full completion is reported.

## TCW-D010 — Canonical `.ai` state supersedes stale handoffs after reconciliation
Status: ACTIVE

`.ai/shared/*` is the canonical coordination layer. Older point-in-time handoffs remain evidence but do not override newer verified state.

## TCW-D011 — Strategy authority is in-season, not draft
Status: ACTIVE

The Chip Winner Strategy role is **In-Season Strategy & Decision Intelligence**. It owns recommendation-policy reasoning for waivers/add-drops, lineup/start-sit decisions, roster construction/depth, replacement value/scarcity, IR/injury implications, bye/playoff planning, and in-season horizon tradeoffs. Draft-specific strategy belongs to The War Room and must not leak into The Chip Winner merely because the projects are both fantasy-football tools.
