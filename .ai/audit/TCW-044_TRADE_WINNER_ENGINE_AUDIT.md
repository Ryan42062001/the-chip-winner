# TCW-044 — Trade Winner Engine Independent Audit

Source task: `TCW-034 — Trade Winner Engine`  
Builder PR: `#147`  
Builder branch: `builder/tcw-034-trade-winner-engine`  
Authorized diff baseline: `872aa79969743dafb3bf062a76b213c687397a6f`  
FULL implementation checkpoint: `c78a9edba202ae822abd21dabc845e40a35f9b45`  
Immutable audit target: `a40c8db8f7e6defcecdf58dc2d3ddd81ea88249a`  
Verified green freeze master / Auditor branch base: `a93cd7a22d85f4554922157d290e7b98ef0668b8`  
Current live master at audit start: `3a0a8355569aae52034768b6b492fbc65d14d5c9`  
Role: Independent Auditor / QA  
Verdict: **FAIL — REMEDIATION REQUIRED**

## Independence and frozen-target discipline

This was a fresh Independent Auditor lane.

Builder claims, Manager routing, green CI, synthetic Builder tests, and earlier Trade Analyzer conclusions were treated as evidence rather than proof.

The audit remained pinned to exact SHA:

`a40c8db8f7e6defcecdf58dc2d3ddd81ea88249a`

The assigned audit branch was independently verified to begin exactly at green freeze master:

`a93cd7a22d85f4554922157d290e7b98ef0668b8`

Live master `3a0a8355569aae52034768b6b492fbc65d14d5c9` is exactly one commit beyond the freeze master and changes only Manager/shared `.ai/**` activation/routing state. It contains no product/source/config change and was not substituted into the frozen audit target.

Current-master workflow #658 / run `35456959271` failed only at dependency audit because the npm registry returned `400 Bad Request / Invalid package tree`. Workflow V3.2 state audit passed. That later control-plane-run dependency failure is not evidence about the frozen Builder target and was not used to excuse or condemn the audited implementation.

## Exact Builder scope

The exact diff from `872aa79969743dafb3bf062a76b213c687397a6f` to `a40c8db8f7e6defcecdf58dc2d3ddd81ea88249a` contains exactly:

1. `.ai/builder/HANDOFF.md`
2. `scripts/smoke-trade-analyzer.js`
3. `src/domain/trade-analyzer.js`
4. `src/domain/trade-value-engine.js`
5. `src/domain/trade-value-source.js`
6. `src/ui/trade-analyzer.js`
7. `test/trade-analyzer-ui.test.js`
8. `test/trade-winner-engine.test.js`
9. `test/trade-winner-integration.test.js`

No provider implementation, ESPN write surface, package/dependency manifest, field-validation file, Strategy/R&D artifact, Manager/shared state, or TCW-035+ implementation is in the Builder diff.

## Source-authority audit

**PASS**

Production package-value authority remains fail-closed.

Exact frozen source contains:

```js
export const PRODUCTION_TRADE_VALUE_SOURCES = Object.freeze([]);
```

The normal Trade Analyzer UI invokes `analyzeTrade(...)` without supplying `tradeValueSources`, so it resolves to the empty production set.

No FantasyPros, FantasyCalc, RedraftCalc, RotoTrade, named provider adapter, scrape, bundled package-value dataset, or arbitrary package-value numeric-entry UI was found in the authorized diff.

The value-source inspector independently gates:
- source identity;
- source version;
- additive unit;
- as-of timestamp;
- explicit Manager/trusted-configuration flags;
- REDRAFT mode;
- season compatibility;
- scoring compatibility;
- optional team-count compatibility;
- freshness;
- full asset mapping;
- ambiguous/error states;
- finite nonnegative values;
- per-asset source/version/as-of/unit consistency.

Missing/unapproved/stale/incompatible/ambiguous/error/nonfinite/negative/mixed-metadata values therefore fail closed.

No projection/ranking/SOS/ADP/waiver/VORP/scarcity fallback is used by `evaluatePackageValue()`.

With the production set empty:
- status = `WITHHELD`;
- winner = `WITHHELD`;
- incoming/outgoing share = null;
- displayed split = null;
- reason = `NO_APPROVED_COMPARABLE_VALUE_SOURCE`.

Supported roster consequence is computed independently.

The browser smoke explicitly rejects a live `YOU WIN`, `FAIR TRADE`, `THEY WIN`, or `NN/NN` split while the production provider set is empty, and that smoke passed in the exact FULL checkpoint.

## Synthetic package-value engine audit

**PASS**

Independent static/math review confirms:

`incomingShare = 100 * incomingTotal / (incomingTotal + outgoingTotal)`

Classification uses the unrounded share:
- exactly 45.0 => `FAIR_TRADE`;
- exactly 55.0 => `FAIR_TRADE`;
- 55.01 => `YOU_WIN`, even when display rounds to 55/45;
- below 45.0 => `THEY_WIN`.

Display rounding occurs only after classification.

Explicit zero is preserved:
- one zero side with positive total is a valid 0/100 or 100/0 result;
- zero/zero is WITHHELD.

Unequal package totals sum all mapped assets.

Missing/unmapped/ambiguous/error/NaN/infinite/negative/mixed-vintage input is not coerced to zero.

Multiple READY approved sources are never averaged. Material classification disagreement yields `SOURCE_DISAGREEMENT` with generic winner/share withheld while per-source results remain inspectable.

Relative package shares are explicitly marked as asset value, not win probability, future-performance probability, or acceptance probability.

## Findings

### TCW-044-F01 — HIGH — raw listed-position count changes are promoted into material roster-decision costs/benefits

**Severity:** HIGH

**Violated requirement**

The accepted TCW-032 contract says:
- user-roster consequence is derived from supported optimized-lineup, legal contingency, bye, and horizon evidence;
- a mere listed-position count change is descriptive until legal slot coverage or supported source-specific quality changes;
- UNKNOWN evidence must not be converted into a supported negative/positive decision.

TCW-034's central value proposition is that the independently derived `doNothing.userDecision` remains trustworthy even when package value is WITHHELD.

**Exact evidence**

The exact target computes:

```js
const depthCost =
  listedChanges.some((item) => item.delta < 0) ||
  (preContingency.status === "READY" &&
   postContingency.status === "READY" &&
   postContingency.maxUncoveredAfterLoss > preContingency.maxUncoveredAfterLoss);

const depthGain =
  listedChanges.some((item) => item.delta > 0) ||
  (preContingency.status === "READY" &&
   postContingency.status === "READY" &&
   postContingency.maxUncoveredAfterLoss < preContingency.maxUncoveredAfterLoss);
```

`deriveDoNothing()` then converts those booleans directly into material evidence:

```js
if (depth?.depthGain) benefits.push("DEPTH_OR_CONTINGENCY_GAIN");
if (depth?.depthCost) costs.push("DEPTH_OR_CONTINGENCY_COST");
```

and maps any simultaneous benefit/cost to `MIXED`, any cost-only case to `WORSENS`.

#### Independent adversarial scenario A — neutral bench reshuffle falsely becomes MIXED

Controlled legal roster:
- configured active lineup: one RB starter slot;
- pre roster includes starter RB A plus bench RB B and bench RB C;
- trade sends bench RB C and receives bench WR X;
- A remains the optimized starter;
- B still provides complete legal RB contingency after losing A;
- current optimized total is unchanged;
- pre/post max uncovered contingency remains 0;
- known bye coverage is unchanged;
- no future/ROS/playoff material result is invoked.

Expected under TCW-032:
- RB -1 and WR +1 are descriptive listed-position changes;
- no supported starter, contingency, bye, or horizon material change exists;
- user decision should be `NO_MATERIAL_CHANGE`.

Exact TCW-034 path:
- listed RB delta -1 => `depthCost = true`;
- listed WR delta +1 => `depthGain = true`;
- `deriveDoNothing()` creates both a material benefit and material cost;
- result becomes `MIXED` / `REVIEW_TRADEOFF`.

#### Independent adversarial scenario B — incomplete contingency can become WORSENS

When lineup/contingency evidence is UNKNOWN but a package reduces a listed-position count:
- `depthCost` can still become true solely from `listedChanges`;
- `deriveDoNothing()` can therefore return `WORSENS` even though the legal contingency effect is not established.

This violates the explicit UNKNOWN and descriptive-count boundary.

The focused TCW-034 tests do not contain a neutral listed-position-count adversary; the 2-for-1 fixture that returns MIXED also has a genuine contingency loss and therefore does not expose this path.

**Impact**

This is a core user-facing decision defect. The new engine can advise `REVIEW_TRADEOFF` or `DO_NOT_PROCEED` based on roster-position counts alone even when legal starter/contingency/bye evidence is unchanged or unavailable.

Because package-value authority is intentionally absent in live production, the roster/do-nothing consequence is the primary new useful decision surface. False material depth costs/benefits therefore materially undermine TCW-034's central purpose.

**Remediation direction**

Keep listed-position deltas descriptive.

Derive material depth benefit/cost only from contract-supported evidence such as:
- verified legal contingency change;
- known supported bye-gap change;
- separately supported slot-aware replacement/quality consequence where authorized.

Do not convert position-count change alone into `materialBenefits` or `materialCosts`.

If contingency evidence is UNKNOWN and no independently supported material horizon/bye effect resolves the decision, preserve UNKNOWN/WITHHELD rather than asserting WORSENS/IMPROVES/MIXED from counts.

**Required validation**

Add deterministic regressions proving:
1. bench RB -> bench WR with unchanged optimized lineup, contingency, and bye coverage => `NO_MATERIAL_CHANGE`;
2. raw RB -1 / WR +1 count changes remain descriptive when slot coverage is unchanged;
3. missing/UNKNOWN contingency plus a raw count loss does not become `WORSENS`;
4. genuine contingency loss still creates a material cost;
5. genuine contingency gain still creates a material benefit;
6. existing 2-for-1 / 1-for-2 / dangerous-gap scenarios remain correct.

Run FULL exact-head CI and fresh independent re-audit.

**Confidence:** HIGH

### TCW-044-F02 — MEDIUM — replacementScarcity numeric projection is not tied to legal slot demand or feasible acquisition

**Severity:** MEDIUM

**Violated requirement**

TCW-032/TCW-034 require:
- structural/full pool distinct from display shortlist;
- slot-aware replacement logic including FLEX/OP;
- conditional replacement kept separate;
- known feasible roster/acquisition path for a supported replacement claim;
- unsupported numeric replacement/scarcity claims WITHHELD.

**Exact evidence**

The repaired legacy `replacementPathState()` is slot-aware and uses the full structural pool for fragility decisions.

However, the new TCW-034 output mapper `replacementScarcityContract()` separately computes:

```js
const structural = ready ? (replacement.structuralCandidates || []) : [];
const projections = structural
  .map((item) => item.projection)
  .filter(Number.isFinite);

return {
  ...
  eligibleSlots: [],
  candidateIds: structural.map((item) => item.playerId),
  positionalAndFLEXOPDemand: [],
  replacementProjectionOrNull:
    ready && projections.length ? Math.max(...projections) : null,
  marginalVorpOrNull: null,
  ...
};
```

The reported numeric replacement projection is therefore the maximum projection from the entire ESPN structural availability pool.

It does **not**:
- identify the affected slot;
- check `canFillSlot` for that slot;
- account for FLEX/OP demand;
- check the candidate's known legal acquisition path;
- prove that the player is a feasible replacement for the actual roster consequence.

#### Independent adversarial scenario

Suppose the trade creates an RB replacement need and the latest available pool contains:
- QB Q projected 25;
- RB R projected 6.

The new contract reports `replacementProjectionOrNull = 25`, although Q cannot fill an RB slot.

If the pool contains only Q, it still reports 25 even though no legal RB replacement exists.

The existing TCW-034 test has only one relevant RB candidate, so it does not challenge this distinction.

**Impact**

The newly exposed stable output contract can publish a numeric "replacement" figure that is unrelated to the affected slot and inconsistent with the separately correct slot-aware fragility path.

The current UI still presents the older candidate-context surface rather than this new numeric field, which limits immediate visual impact, but downstream TCW-035+ consumers could treat this field as supported replacement quality.

**Remediation direction**

Compute a numeric replacement metric only for an explicitly identified supported demand:
- determine relevant configured slot(s);
- apply legal FLEX/OP matching;
- require same-horizon/source projection;
- require known feasible acquisition/roster path;
- expose per-demand values if multiple overlapping slots matter.

If no such full feasible basis exists, leave `replacementProjectionOrNull` null and retain only structural candidate facts.

Populate or truthfully WITHHOLD `eligibleSlots` and `positionalAndFLEXOPDemand`; do not emit an unqualified all-pool maximum.

**Required validation**

Add adversarial fixtures for:
- high-projection ineligible QB vs lower eligible RB;
- no slot-eligible candidate;
- FLEX demand satisfied by RB/WR/TE;
- OP demand satisfied by QB/RB/WR/TE;
- slot-eligible candidate blocked by known roster/acquisition constraints;
- missing projection/acquisition evidence => numeric metric null.

Run FULL exact-head CI and fresh independent re-audit.

**Confidence:** HIGH

### TCW-044-F03 — MEDIUM — caller-provided horizon flags can relabel a partial ROS/playoff window as complete

**Severity:** MEDIUM

**Violated requirement**

TCW-032/TCW-034 require:
- current week, named future window, ROS, and playoffs remain distinct;
- ROS only when the full explicitly defined remaining season is covered;
- playoffs only on the full explicit supported configured playoff window;
- partial evidence is not relabeled complete ROS/playoffs;
- missing weeks never become zero or silently disappear.

**Exact evidence**

The exact target accepts caller-provided playoff weeks in preference to the snapshot's configured playoff weeks:

```js
const playoffWeeks = Array.isArray(options.playoffWeeks)
  ? options.playoffWeeks
  : snapshot.league?.playoffWeeks;
```

`evaluateHorizon()` only checks completeness across the weeks it is given.

Therefore a snapshot configured for playoff weeks `[15, 16]` can be evaluated with `options.playoffWeeks = [15]`. If Week 15 is complete, the engine returns a READY numeric playoff horizon while configured Week 16 was omitted.

ROS similarly trusts a caller declaration:

```js
const requestedRosWeeks = ...options.restOfSeasonWeeks;
const restOfSeason =
  options.restOfSeasonComplete === true && requestedRosWeeks.length
    ? evaluateHorizon(...requestedRosWeeks, "Rest of season: Weeks ...")
    : UNKNOWN;
```

There is no independent check that `requestedRosWeeks` actually represents every remaining week in the accepted ROS definition.

A caller can therefore set:
- current week 5;
- `restOfSeasonWeeks = [6]`;
- `restOfSeasonComplete = true`;

and obtain a READY result labeled `Rest of season: Weeks 6` if Week 6 coverage is complete.

The normal current UI does not supply `restOfSeasonComplete`, and when snapshot playoff weeks are present the UI normally passes those configured weeks. Thus the present production route is conservative, but the TCW-034 engine/output contract itself is not fail-closed against a partial-window caller.

**Impact**

A future internal caller can manufacture supported ROS/playoff directions and cross-horizon user-decision effects by omitting unsupported weeks and asserting completeness.

Those directions feed `longTermDirection`, `doNothing.materialBenefits/materialCosts`, cross-horizon conflict, and recommendation framing, so the defect can alter the user decision rather than merely metadata.

**Remediation direction**

Do not trust a bare caller completeness boolean for named canonical horizons.

For playoffs:
- derive the authoritative configured playoff-week set from accepted league/config evidence;
- require exact coverage of that set;
- if a caller supplies a subset, treat it as a named future window or UNKNOWN, not PLAYOFFS READY.

For ROS:
- derive/validate the complete expected remaining-season week set from an accepted authoritative definition;
- if that definition is unavailable, keep ROS UNKNOWN;
- caller-selected subsets remain named future windows.

**Required validation**

Add deterministic tests proving:
1. configured playoffs `[15,16]` plus supplied `[15]` cannot become PLAYOFFS READY;
2. missing any configured playoff week keeps aggregate/mean/direction null/UNKNOWN;
3. arbitrary `restOfSeasonComplete: true` plus a one-week subset cannot become ROS READY;
4. a genuinely complete validated ROS window can become READY;
5. named partial future windows remain supported without being relabeled ROS/playoffs.

Run FULL exact-head CI and fresh independent re-audit.

**Confidence:** HIGH

### TCW-044-F04 — LOW — package confidence treats source count as independence

**Severity:** LOW

**Violated requirement**

TCW-032 says a single accepted value source supports at most MODERATE package-value confidence; HIGH requires genuinely independent agreeing sources. Confidence is separate from the winner/share.

**Exact evidence**

The target computes:

```js
const sourceCount = packageValue.sourceResults?.length || 1;
return {
  claimConfidence: sourceCount >= 2 ? "HIGH" : "MODERATE",
  ...
};
```

No source-independence field or validation is consulted.

`evaluatePackageValue()` also does not require distinct source identity before returning an agreeing READY result, provided exactly one of the rows is designated primary.

A deterministic pair of duplicated/derivative source rows can therefore agree and produce `HIGH` despite not being genuinely independent.

**Impact**

Production currently has zero approved package-value sources, so live package confidence is WITHHELD and this does not create an immediate live winner.

However, the source-agnostic engine is intended to be future-ready. A later approved-source configuration could overstate package evidence confidence while the share/winner math itself remains correct.

**Remediation direction**

Make evidence independence explicit in the Manager-approved source contract.

At minimum:
- do not count duplicate source identity/version as independent evidence;
- optionally record an approved independence/provenance group;
- only return HIGH when at least two Manager-authorized sources are explicitly established as independent and agree;
- otherwise cap at MODERATE.

**Required validation**

Add deterministic tests for:
- one approved source => MODERATE;
- duplicated same source => MODERATE;
- two non-independent/derivative source rows => MODERATE;
- two explicitly independent agreeing approved sources => HIGH;
- disagreement remains generic WITHHELD regardless confidence.

**Confidence:** HIGH

## Other required behavior that held

### Package value versus user roster consequence

The engine structurally keeps `packageValue` and `doNothing` separate.

Verified supported scenarios:
- FAIR package can WORSEN the roster;
- synthetic YOU_WIN package can still WORSEN / DO_NOT_PROCEED when a supported dangerous gap exists;
- lower abstract incoming value can still IMPROVE the actual roster;
- bench-only incoming value does not fabricate starter improvement;
- source disagreement can WITHHOLD package winner while roster improvement remains separately supportable.

TCW-044-F01 concerns what is allowed to count as a material roster-depth fact, not package-value leakage into the user decision.

### Lineup / legality

The exact target preserves:
- configured starter slots;
- simultaneous FLEX/OP legal matching;
- complete active pre/post union-roster projection coverage;
- started incoming / benched incoming / displaced / promoted assignment visibility;
- +/-1.0 projected-point direction heuristic;
- current-week locks as informational/counterfactual;
- future/playoff optimizer lock neutrality;
- explicit follow-up drop gate;
- no silent player drop;
- no automatic free-agent add.

The 1-for-2 unresolved path withholds the user decision until an explicit legal drop resolves the known roster violation.

### Depth / fragility / consolidation

The existing legal contingency engine remains slot-based.

The narrow `DANGEROUS` path still requires a known bye gap and no verified legal replacement path / a known blocking roster-acquisition constraint.

UNKNOWN contingency remains represented by `fragility.state = UNKNOWN`.

TCW-044-F01 identifies the separate new do-nothing decision path that can bypass that nuance via listed-position counts.

### Replacement / VORP / scarcity

The legacy replacement context continues to preserve:
- full structural pool versus top-12 display shortlist;
- full-pool use in replacement-path decisions;
- slot-aware `canFillSlot`;
- known acquisition/roster feasibility for DANGEROUS replacement-path claims;
- conditional replacement rather than automatic acquisition.

No VORP or scarcity value is added to package market value.

`marginalVorpOrNull` remains null.

TCW-044-F02 concerns the newly exposed `replacementScarcity.replacementProjectionOrNull` field.

### Horizons

Complete selected future rows require complete mapped pre/post union-roster coverage and missing values are never zero-filled.

Future and playoffs use lock-neutral optimization rather than carrying today's lock state forward.

Incomplete configured playoff evidence in the Builder's tested normal path remains UNKNOWN with null aggregate/mean/direction.

TCW-044-F03 concerns the generic engine caller's ability to shrink the canonical horizon before that completeness check.

### UI truthfulness

Normal live UI source configuration is empty.

The UI clearly presents:
- `PACKAGE VALUE · INDEPENDENT`;
- `Package value unavailable`;
- truthful no-approved-source explanation;
- `YOUR ROSTER IMPACT · VS DO NOTHING`;
- separate current/source rows;
- depth/contingency;
- replacement context;
- bye effects;
- future / ROS / playoff limitations;
- reasons and limitations;
- explicit read-only/no-ESPN-mutation wording.

A numeric split, when available under synthetic/approved authority, is labeled relative package asset value and explicitly not probability.

Browser smoke verifies the live empty-source path contains no winner label or numeric split.

### Read-only / baseline safety

No ESPN propose/send/accept/reject/veto mutation path was added.

Output remains:
- `readOnly: true`;
- `transactionActions: []`.

Counterparty ownership protections, stale-state reset, explicit-drop behavior, and FLEX/OP semantics remain present.

No TCW-035 team-needs/opportunity implementation, BUY_LOW / SELL_HIGH label, pending-offer ingestion, or acceptance probability was added.

## Field-validation boundary

`config/field-validation.json` is byte-identical at:
- authorized baseline `872aa799...`;
- frozen target `a40c8db8...`;
- current live master `3a0a8355...`.

Blob SHA:

`0b96e27e693ad778089f2967e486bc9a307b9747`

Field status remains:
- 10 passed;
- 1 pending.

`FV-SEASON-01` remains `pending` with no evidence entries. This audit does not claim Level-4 season/playoff validation.

## CI evidence independently verified

### FULL implementation checkpoint

Workflow #651 / run `35455187441`:
- exact head `c78a9edba202ae822abd21dabc845e40a35f9b45`;
- test job `105929096178`: PASS;
- effective mode FULL;
- 504/504 tests PASS;
- dependency audit PASS;
- Trade Analyzer browser smoke PASS;
- repository model/static/accessibility/readiness/mobile/extension/performance/security/workflow gates PASS;
- artifact `tcw-ci-evidence-35455187441-1` / `10587443547`.

### Final frozen Builder head

Workflow #652 / run `35455415346`:
- exact head `a40c8db8f7e6defcecdf58dc2d3ddd81ea88249a`;
- test job `105929704580`: PASS;
- effective mode DOCS_ONLY;
- predecessor continuity PASS to FULL #651;
- only post-FULL Builder delta is `.ai/builder/HANDOFF.md`;
- artifact `tcw-ci-evidence-35455415346-1` / `10588141778`.

### Green freeze master

Workflow #656 / run `35456662648`:
- exact freeze master `a93cd7a22d85f4554922157d290e7b98ef0668b8`;
- test job `105933052259`: PASS / FULL;
- dependency audit PASS;
- Trade Analyzer smoke PASS;
- artifact `tcw-ci-evidence-35456662648-1` / `10587899057`.

### Later current-master dependency-audit failure

Workflow #658 / run `35456959271`:
- exact current master `3a0a8355569aae52034768b6b492fbc65d14d5c9`;
- test job `105936650813`: FAIL only at dependency audit;
- Workflow V3.2 state audit passed;
- npm registry returned `400 Bad Request / Invalid package tree`;
- master advancement from freeze is control-plane-only.

This is not attributed to the frozen Builder target.

## Validation levels

| Level | Result | Evidence |
| --- | --- | --- |
| Level 1 — static correctness | **FAIL** | F01-F04 reproduced from exact frozen implementation; core source-authority/math/read-only boundaries otherwise hold |
| Level 2 — automated tests/CI | **PASS as supporting evidence** | #651 FULL 504/504, #652 exact-target continuity, #656 green freeze; existing suite misses the adversarial findings |
| Level 3 — controlled in-season/synthetic scenarios | **FAIL** | independent neutral-depth, slot-ineligible replacement, partial canonical horizon, and non-independent confidence adversaries expose defects; required package-value boundary scenarios otherwise resolve correctly |
| Level 4 — genuine authenticated/field validation | **NOT CLAIMED** | not required/established by TCW-044; FV-SEASON-01 remains pending |

## Final verdict

**FAIL — REMEDIATION REQUIRED**

The live package-value authority gate and synthetic 45–55 package-value math are materially correct, and no unauthorized provider or ESPN write path was found.

However:
- the new do-nothing user decision can treat raw position counts as material roster benefit/cost;
- the new replacement/scarcity contract can publish an unrelated all-pool maximum as replacement projection;
- canonical ROS/playoff completeness can be caller-shrunk before completeness evaluation;
- package confidence can overstate non-independent agreeing sources.

TCW-034 should return to bounded Builder remediation before PR #147 proceeds to Manager integration. TCW-035 must remain inactive.
