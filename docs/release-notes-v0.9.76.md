# The Chip Winner v0.9.76 — Performance Pass

## Purpose

v0.9.76 is a runtime-efficiency release prompted by Release 1.0 field validation. A real authenticated browser session exposed noticeable synchronous navigation delay when opening Waivers and Season Plan. This release optimizes the expensive deterministic paths without changing the ESPN-only, read-only product boundary or weakening legality, identity, missing-data, or field-validation rules.

## Runtime changes

- Replaced repeated lineup search work with a memoized dynamic-programming optimizer while preserving deterministic tie behavior, explicit locks, supported ESPN slot eligibility, missing-projection semantics, and the existing action threshold.
- Added reusable lineup optimizer contexts so waiver and future-scenario simulations do not rebuild the same player index for every add/drop pair.
- Added a waiver-analysis cache keyed by the source snapshot and a fingerprint of every relevant current fact, including roster entries, availability, projections, positions, injury state, roster/waiver rules, acquisition usage, explicit locks, and kickoff-derived lock state.
- Kept the exhaustive waiver result behind the cache and apply display limits only after the full legal analysis, so a small UI limit can never become a hidden candidate cap.
- Built same-position replacement benchmarks once per waiver analysis instead of sorting the available pool separately for every candidate.
- Reused the already-computed current waiver analysis inside the priority/scenario path rather than recomputing it.
- Reused future-week player maps and lineup optimizers across every scenario in a selected week.
- Added a playoff-only Scenario Plan fast path that can skip current-week waiver derivation when current waiver scenarios are not requested.
- Cached indexes for immutable future projection sets.
- Reduced repeated selector scans by indexing schedule/matchup data for reuse.
- Changed ESPN normalization to index the NFL scoreboard once per normalization pass instead of repeatedly rescanning it for individual players.
- Chrome companion v0.2.3 starts independent ESPN read requests concurrently. The website still supports companion v0.2.2; updating the extension is an optional refresh-latency improvement rather than a compatibility requirement.

## Performance gates

`npm run audit:performance` now includes deterministic runtime budgets in addition to static asset budgets. The release candidate exercises the established scale fixture of 24 ESPN-available adds x 4 unlocked bench drops, preserving all 96 future add/drop scenarios with no silent truncation.

Reference GitHub Actions measurements from the v0.9.76 candidate:

- cold current-waiver analysis: **15.9 ms**
- full waiver-priority board after current waiver analysis: **52.2 ms**
- playoff-only future baseline: **0.6 ms**
- repeat priority navigation: **37.0 ms**

These CI timings are deterministic regression signals, not substitutes for the required real-browser field validation.

## Regression coverage

v0.9.76 adds permanent regression coverage for the new fast paths:

- a cached full waiver analysis remains exhaustive when different callers request different display limits;
- same-object projection and availability changes invalidate the waiver cache rather than returning stale recommendations;
- one lineup optimizer context can safely evaluate repeated isolated roster simulations without mutating source entries;
- immutable future projection sets reuse normalized/indexed structures safely.

Expected permanent test total after these additions is **328**, plus the existing **21 model safety fixtures**. The exact final PR head must pass the protected workflow before merge.

## Safety and product boundaries preserved

- ESPN remains authoritative for league state, roster rules, availability, locks, acquisition state, current week, injury designation, lineup slots, and fantasy matchups.
- External projections remain overlays.
- Missing data stays missing; `null` is never converted to an invented zero.
- Provider-owned IDs and explicit identity maps remain mandatory for projection identity.
- Current ESPN acquisition/IR/roster legality is still revalidated before recommendations.
- Future-only add/drop enumeration remains exhaustive and visible; no hidden shortlist or candidate cap was introduced.
- Future-only IR-assisted stash discovery remains separately gated.
- No ESPN write action is introduced.

## Release 1.0 field validation

The field registry baseline advances to v0.9.76. `FV-WAIVER-01` remains **pending** until the deployed build is retested in the real authenticated browser session; the CI runtime measurements are recorded as supporting deterministic evidence only. `FV-A11Y-03` also remains pending until the real 200% Chrome zoom workflow is retested on the deployed build.
