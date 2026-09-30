# Current Phase

State: BUILDING

## Identity

- Phase: TCW-P03 — Trade Value Source & Advantage Visualization
- Product owner: Ryan
- Phase branch: `phase/tcw-p03-trade-value-advantage`
- Activation baseline: `26afb5011a4289678a8c614382309bebb522179a`
- Risk: MEDIUM
- Release 1.0 designation: DEFERRED BY OWNER
- Production deployment: NOT AUTHORIZED
- ESPN write access: NOT AUTHORIZED

## Objective

Add a trustworthy package-value source path and an evidence-aware Trade Winner advantage visualization without weakening the current fail-closed Trade Winner contract. The visualization may show which side has more package asset value only when a Manager-approved, fresh, compatible, additive source covers every asset in the proposal.

## Source authority gate

The production approved provider set is currently empty.

Historical TCW-033 research found useful candidates but did not approve any automated provider for production authority. Before implementation may enable live numeric package value, this phase must re-validate current source options and obtain an explicit Manager source decision covering:

- provider/source identity;
- acquisition mode and operational contract;
- production-use / licensing boundary;
- redraft semantics;
- package additivity;
- scoring-format compatibility;
- team-count / league-format compatibility where applicable;
- stable player identity or deterministic ESPN mapping;
- source version / week / as-of timestamp;
- freshness policy;
- missing / ambiguous / zero / invalid-value behavior;
- provenance and any derivative-source relationship.

If no source can be truthfully approved, the phase must stop at the source gate rather than substitute projections, rankings, ADP, ROS rank, VORP, waiver value, or arbitrary user-entered numbers.

## Scope

1. Re-evaluate current viable redraft package-value sources against the existing Trade Winner value-source contract.
2. Record one explicit Manager source disposition: approved bounded source, approved manual/local source path, or no source approved.
3. If a source is approved, implement the smallest source adapter/import path needed to produce stable ESPN-ID-keyed package values with source/version/as-of/unit metadata.
4. Keep `PRODUCTION_TRADE_VALUE_SOURCES` empty until the source decision and implementation evidence authorize a specific production path.
5. Add a Trade Advantage visualization adjacent to package-value evidence:
   - left/right or user/opponent orientation must be unambiguous;
   - center/near-even state for the accepted fairness band;
   - shift only from complete approved package-value evidence;
   - neutral disabled state labeled `Value unavailable` whenever evidence is withheld;
   - source/version/as-of/unit and limitations remain inspectable.
6. Preserve package asset value as distinct from actual roster impact, lineup consequences, depth, legality, and recommendation.
7. Preserve the existing inclusive 45–55 fairness policy unless a separately approved source-specific calibration replaces it.
8. Add focused source, boundary, UI, browser, mobile, accessibility, and fail-closed regression coverage.

## Non-goals

- Calling the current product Release 1.0 or production-ready.
- Production deployment.
- ESPN trade submission, acceptance, rejection, veto, lineup, waiver, add/drop, or any other mutation.
- Acceptance probability or prediction language.
- Buy-low / sell-high labels without a separately approved market-vs-utility contract.
- Automatic pending-offer ingestion.
- Trade finder / counter-offer generation.
- Using projections, rankings, ADP, ROS rank, VORP, waiver value, or ordinal context as package asset value.
- Scraping or redistributing a named provider without an approved rights/access path.
- Averaging conflicting independent value sources into a fabricated consensus winner.
- Treating missing asset value as zero.

## Advantage visualization contract

When package value is READY:
- compute each side from the same compatible additive source/vintage;
- preserve exact unrounded fairness evaluation before display rounding;
- inclusive 45–55 remains FAIR;
- values outside the fair band may visually favor the higher-value side;
- the meter represents **package asset value share**, not probability, confidence, or expected fantasy points;
- display text must not imply that the side with more package value automatically has the better roster outcome.

When package value is WITHHELD or SOURCE_DISAGREEMENT:
- meter remains neutral;
- no directional winner fill;
- display `Value unavailable` or equivalent;
- expose the specific missing/stale/incompatible/disagreement reason;
- independently supported roster impact may still render separately.

## Ordered implementation objectives

1. Fresh source research / re-validation.
2. Manager source-authority decision.
3. Adapter/import implementation only after source approval.
4. Package-value integration with exact fail-closed metadata contract.
5. Advantage visualization.
6. Focused synthetic and adversarial source/value tests.
7. Desktop/mobile/accessibility/reflow preview.
8. Owner real-league read-only preview.
9. Phase Sync, deliberate exact-head FULL, freeze, and fresh independent MEDIUM-risk audit.
10. Exact-SHA owner merge authorization.
11. Post-merge FAST and Closure Sync.

## Acceptance criteria

- No live numeric package-value winner appears without an explicitly approved source.
- Every displayed package winner uses complete values for every proposed asset.
- Missing/unmapped/stale/malformed/incompatible values withhold the package winner and neutralize the meter.
- Unequal packages sum all covered asset values from one compatible source/vintage.
- Exact 45/55 and 55/45 are FAIR; 55.01/44.99 and symmetric opposite cross the band.
- Display rounding never changes the underlying fairness classification.
- Source disagreement is retained and withholds the generic winner rather than being averaged away.
- Stable ESPN IDs remain authoritative at the Trade Winner boundary.
- Package asset value remains visually and semantically separate from `userDecision` / roster impact.
- No probability wording appears.
- No ESPN mutation path is introduced.
- Mobile, keyboard, WCAG, and 200%-equivalent reflow remain clean.
- Existing Trade Winner fail-closed behavior and all active product tests remain green.

## Required automated validation

- focused value-source / trade-value-engine / Trade Analyzer tests;
- recommendation and explanation safety fixtures;
- normal FAST CI;
- deliberate FULL PHASE CI;
- browser Trade Analyzer smoke;
- accessibility / reflow / mobile audits;
- security and dependency audits.

## Human preview requirements

Ryan reviews the Trade Analyzer using the real read-only ESPN league and verifies:
- the meter orientation is immediately understandable;
- fair / side-favored / unavailable states are visually clear;
- unavailable evidence never looks like a tied or neutral trade recommendation;
- package value and roster impact remain obviously separate;
- source/provenance/limitations remain inspectable;
- mobile presentation is compact and readable.

## Audit

MEDIUM risk requires one fresh independent phase audit after exact-head FULL passes.

Audit emphasis:
- source authority and provenance;
- rights/access assumptions encoded in product behavior;
- stable identity mapping;
- freshness / compatibility / completeness;
- fairness boundaries and rounding;
- missing/ambiguous/conflicting source behavior;
- separation of asset value from roster recommendation;
- no ESPN mutation or hidden probability semantics.

## Exit criteria

- Manager-approved source decision is recorded.
- Approved source path, if any, satisfies the source contract.
- Advantage visualization obeys the READY / WITHHELD / disagreement contract.
- Owner preview is approved.
- FAST and FULL pass at the exact freeze target.
- Fresh independent MEDIUM-risk audit passes.
- Ryan explicitly authorizes merge of the exact audited target.
- Post-merge FAST, Closure Sync, and closure FAST pass.
- Release 1.0 and production deployment remain deferred unless Ryan separately authorizes them.

## Stop conditions

- No source can be truthfully approved under the required semantics/access/rights contract.
- Source values cannot be stably mapped to ESPN identities.
- Proposed implementation needs scraping, bundled restricted data, or an undocumented fragile endpoint without explicit approval.
- A source is not demonstrably additive/comparable for uneven packages.
- Any missing-data path would require treating unknown as zero.
- Any implementation conflates package value with win probability or actual roster improvement.
- Any ESPN write-path implication or production-deploy implication appears without separate authorization.
