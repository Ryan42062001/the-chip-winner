# Builder Handoff — TCW-034 Trade Winner Engine

STATUS: BLOCKED — MANAGER CONTROL-PLANE READINESS PREREQUISITE  
TASK: TCW-034 — Trade Winner Engine  
ROLE: Implementation Engineer / Builder  
EXECUTION: STANDARD_CHAT_HIGH  
REFRESH: FAST_REFRESH  
BRANCH: `builder/tcw-034-trade-winner-engine`  
VERIFIED STARTING / CURRENT MASTER AT IMPLEMENTATION: `872aa79969743dafb3bf062a76b213c687397a6f`  
TASK-RECORDED ASSIGNMENT MASTER: `2124602b0eb884fc9a6db407e4feb3b3f9afbf5a`  
PRODUCTION / FULL-CI CHECKPOINT: `c78a9edba202ae822abd21dabc845e40a35f9b45`  
PR: #147 — TCW-034 Trade Winner Engine  
MERGE AUTHORITY: Manager / Architect only

## Decisions consumed

- TCW-032 Strategy contract is accepted authority.
- TCW-033 R&D evidence is accepted.
- Manager's TCW-033 value-source decision is binding.
- Production approved package-value provider set remains **EMPTY**.
- No named third-party package-value provider is authorized.
- No ranking, projection, SOS, `restOfSeasonValue`, ADP, waiver score, VORP, replacement value, or scarcity metric may substitute for package market value.

## Completed implementation

### Package-value authority and source contract

Added `src/domain/trade-value-source.js`:
- immutable production source set: `PRODUCTION_TRADE_VALUE_SOURCES = Object.freeze([])`;
- generic additive value-source contract carrying source ID/version, as-of time, unit, redraft mode, league season/scoring/team-count compatibility, trusted Manager-approved authority state, exact ESPN player-ID values, freshness contract, and per-asset mapping/error state;
- fail-closed handling for unapproved, non-additive, stale/invalid freshness, incompatible mode/season/scoring/team-count, missing/ambiguous/error assets, nonfinite/negative values, and mixed source/settings/vintages;
- test-only synthetic approved-source constructor; no synthetic fixture is referenced by production UI/runtime configuration.

Added `src/domain/trade-value-engine.js`:
- additive outgoing/incoming package totals;
- exact unrounded incoming-share classification:
  - below 45 -> `THEY_WIN`
  - 45 through 55 inclusive -> `FAIR_TRADE`
  - above 55 -> `YOU_WIN`;
- presentation-only rounded split with fairness-boundary warning where rounding could visually disagree;
- explicit zero is valid, missing is never coerced to zero, zero/zero withholds;
- multiple approved sources are never averaged;
- materially different source winner labels -> `SOURCE_DISAGREEMENT` and generic winner `WITHHELD`;
- agreeing multi-source result requires one designated primary source for the published split;
- explicit attestation that package share is not win probability, performance probability, or acceptance probability.

### Live production behavior

With no injected test source, `analyzeTrade` uses the empty production source set and returns:
- `packageValue.status = WITHHELD`;
- `packageValue.winner = WITHHELD`;
- `incomingShare/outgoingShare/displayedSplit = null`;
- reason `NO_APPROVED_COMPARABLE_VALUE_SOURCE`.

Live Trade Analyzer UI says:
> No approved package-value source is configured. The analyzer will not invent a market-value winner or split.

Browser smoke rejects any live package card containing `YOU WIN`, `FAIR TRADE`, `THEY WIN`, or an NN/NN numeric split while the production source set is empty.

### Independent do-nothing / roster consequence

Extended the accepted Trade Analyzer without replacing its existing lineup/depth/horizon engine:
- `doNothing.userDecision`: `IMPROVES | WORSENS | MIXED | NO_MATERIAL_CHANGE | WITHHELD`;
- separate recommendation: `CONSIDER | DO_NOT_PROCEED | REVIEW_TRADEOFF | HOLD_DO_NOTHING | NOT_ENOUGH_EVIDENCE`;
- package winner and roster decision remain independent;
- current-week locked evidence remains informational/counterfactual and does not create an executable `CONSIDER` recommendation;
- supported `DANGEROUS` fragility forces roster decision `WORSENS`, even when synthetic package value says `YOU_WIN`;
- starter/depth/bye costs and benefits remain distinct;
- 2-for-1 open roster space never adds imaginary waiver points;
- 1-for-2 preserves explicit-drop gating and never silently removes a player.

Added mapped TCW-032-compatible fields for:
- validation / read-only transaction boundary;
- lineup source results and assignment effects;
- user roster-space consequences;
- replacement/scarcity evidence with full structural-pool use and `marginalVorpOrNull: null`;
- current/future/ROS/playoff horizons;
- separate package-value/user-decision confidence.

ROS remains `UNKNOWN` unless an explicit complete ROS window is supplied and certified complete. Partial weeks are never relabeled ROS. `FV-SEASON-01` remains untouched/pending.

### UI

The results now render two independent high-level cards:
1. **PACKAGE VALUE · INDEPENDENT**
2. **YOUR ROSTER IMPACT · VS DO NOTHING**

Production shows package value unavailable but still shows independently supported roster analysis. Synthetic tests prove a package can display `YOU WIN` while roster impact displays `WORSENS / DO_NOT_PROCEED`, and the split is explicitly labeled relative package asset value rather than probability.

Existing counterparty ownership, TCW-042 compact Send/Receive controls, stale-state clearing, current locks, future/playoff lock neutrality, explicit follow-up drops, FLEX/OP, source separation, replacement structural pool, ESPN read-only behavior, and transactionActions `[]` remain in the full suite.

## Deterministic coverage added

`test/trade-winner-engine.test.js`:
- exact 45/55 inclusive fairness boundaries;
- 55.01 outside boundary despite 55/45 presentation rounding;
- `THEY_WIN`;
- explicit zero versus missing;
- zero/zero withhold;
- live production source set empty;
- unapproved values do not create authority;
- stale source;
- incompatible scoring/mode/season;
- missing/ambiguous/error/NaN/infinite/negative/mixed-vintage assets;
- unequal package summation;
- approved-source disagreement;
- agreeing sources + designated primary without averaging;
- no ranking/projection/ROS/ADP/waiver/VORP/SOS fallback.

`test/trade-winner-integration.test.js`:
- no approved source -> package WITHHELD while roster consequence still works;
- FAIR package but roster WORSENS;
- synthetic YOU_WIN plus supported DANGEROUS gap -> WORSENS / DO_NOT_PROCEED;
- 2-for-1;
- 1-for-2 explicit drop;
- bench-only incoming asset;
- lower abstract value but better roster fit;
- current/future conflict;
- incomplete playoffs and ROS withheld;
- strong/unknown replacement evidence with unsupported numeric VORP withheld;
- simultaneous FLEX/OP legality;
- source disagreement independent of roster improvement;
- current-week locked/counterfactual state.

Existing full suite continues to cover TCW-025/030 replacement/fragility/lock neutrality and accepted baseline ownership/UI semantics.

## Validation evidence

Implementation checkpoint:
- SHA: `c78a9edba202ae822abd21dabc845e40a35f9b45`
- PR #147
- workflow #651 / run `35455187441`
- test job `105929096178`
- effective CI mode: **FULL**
- full Node suite: **504 / 504 PASS, 0 FAIL**
- all TCW-034 package-value and integration tests: PASS
- Trade Analyzer browser smoke: PASS
- workflow registry/state validation: PASS
- dependency audit: PASS
- model/static validation: PASS
- accessibility: PASS
- general readiness audit (`npm run audit:readiness`): PASS
- mobile: PASS
- extension/performance/security: PASS
- CI evidence / classifier guardrails: PASS
- artifact: `tcw-ci-evidence-35455187441-1` / artifact ID `10587443547`
- PR deploy / production verification: skipped as expected.

Local command execution is not claimed: the Standard Chat container cannot resolve `github.com`. GitHub Actions is the executable validation evidence.

## Required workflow:audit-readiness blocker

The task additionally requires:

`npm run workflow:audit-readiness -- --task TCW-034`

The current canonical helper was inspected directly. It fails closed unless:
- active-task status is one of `MANAGER_REVIEW_READY | AUDIT_READY | MERGE_READY`;
- the registry's optional worker checkpoint matches HEAD;
- all files in `assignment_master_sha..HEAD` match the task's allowed write prefixes.

Current authoritative `.ai/shared/ACTIVE_TASKS.json` still records TCW-034 as:
- `status: ASSIGNED`;
- `pr: null`;
- `worker_checkpoint_sha: null`;
- `assignment_master_sha: 2124602b0eb884fc9a6db407e4feb3b3f9afbf5a`.

However the Manager-authorized working branch began from canonical master:
`872aa79969743dafb3bf062a76b213c687397a6f`.

The single commit from recorded assignment master `2124602...` to authorized current master `872aa799...` is Manager/control-plane routing only and changes forbidden/non-Builder paths including:
- `.ai/manager/**`;
- `.ai/shared/ACTIVE_TASKS.json`;
- `.ai/shared/PROJECT_STATE.md`;
- `.ai/shared/ROADMAP.md`.

Therefore the task-specific readiness helper cannot mechanically pass on this Builder branch in current canonical state: it would reject both the `ASSIGNED` lifecycle state and Manager-owned routing files appearing in its diff baseline.

Builder is explicitly forbidden to modify those machine-state/Manager paths. This gate cannot be truthfully bypassed or self-certified.

## Exact Manager prerequisite

Manager must reconcile the TCW-034 active-task machine entry under Manager authority before Builder can complete the mechanical readiness gate. At minimum:
1. update the assignment/checkpoint baseline used by `workflow:audit-readiness` so the authorized Builder diff begins at `872aa79969743dafb3bf062a76b213c687397a6f` rather than attributing the Manager routing commit to Builder;
2. record PR #147;
3. when the candidate is frozen, transition TCW-034 to a readiness-eligible lifecycle state such as `MANAGER_REVIEW_READY`;
4. record the exact worker checkpoint if the workflow requires it.

Then rerun:
`npm run workflow:audit-readiness -- --task TCW-034`
against the exact Builder candidate and retain the packet/result.

Until that control-plane prerequisite is reconciled, Builder cannot truthfully return `MANAGER_REVIEW_READY`.

## Changed files at production checkpoint

- `scripts/smoke-trade-analyzer.js`
- `src/domain/trade-analyzer.js`
- `src/domain/trade-value-engine.js` (new)
- `src/domain/trade-value-source.js` (new)
- `src/ui/trade-analyzer.js`
- `test/trade-analyzer-ui.test.js`
- `test/trade-winner-engine.test.js` (new)
- `test/trade-winner-integration.test.js` (new)

This handoff adds only:
- `.ai/builder/HANDOFF.md`

No Provider, Manager, Strategy, R&D, Auditor, workflow, extension, package, or `config/field-validation.json` file is changed by Builder.

## Verification matrix

| Dimension | Status / evidence |
| --- | --- |
| Package-value source authority gate | PASS — deterministic suite / #651 |
| Live production provider set empty | PASS — source constant + test + browser / #651 |
| Live winner/split WITHHELD | PASS — domain + browser / #651 |
| 45/55 + 55.01 synthetic boundaries | PASS — #651 |
| Source disagreement / stale / invalid / incompatible / missing | PASS — #651 |
| No rank/projection/VORP fallback | PASS — #651 |
| Independent do-nothing roster decision | PASS — #651 |
| 2-for-1 / 1-for-2 / bench-only / lower-value-better-fit | PASS — #651 |
| Current/future/playoff/ROS separation | PASS — #651 |
| Replacement/scarcity separation | PASS — #651 |
| FLEX/OP + current lock preservation | PASS — #651 |
| Browser smoke | PASS — #651 |
| Accessibility/readiness/mobile/security | PASS — #651 |
| Full repository CI | PASS — #651, 504/504 |
| Task-specific workflow:audit-readiness | **BLOCKED — MANAGER CONTROL-PLANE STATE** |
| Exact handoff-inclusive head CI | PENDING — this handoff commit |
| Post-merge master/deployment | PENDING — MANAGER OWNED |
| Fresh independent TCW-034 audit | PENDING — AUDITOR OWNED |
| Real deployed V2 UAT | LATER — product lane; not Builder-certified |

## Remaining limitations

- No external package-value provider is approved or integrated.
- No live `YOU WIN / FAIR TRADE / THEY WIN` or percentage split is produced.
- Opponent reciprocal team-needs/plausibility is intentionally UNKNOWN/deferred to TCW-035 and later authorized work.
- No trade finder, target/shop, incoming offer, counteroffer, negotiation, BUY LOW/SELL HIGH, acceptance probability, or ESPN write behavior is implemented.
- TCW-035 is not activated by this handoff.

## Next Activation

| Order | Employee / Role | Status | Current Task / Gate | Copy/paste activation prompt / next action |
| ---: | --- | --- | --- | --- |
| 1 | Manager / Architect | RECOMMEND TO MANAGER | Reconcile TCW-034 audit-readiness machine state | Update the Manager-owned TCW-034 assignment baseline/checkpoint, PR #147, and readiness lifecycle state so the canonical workflow:audit-readiness helper can evaluate only the authorized Builder diff; then return TCW-034 to Builder for the mechanical readiness run. |
| 2 | Implementation Engineer / Builder | BLOCKED | Production candidate FULL-green; task-specific audit-readiness cannot pass current Manager-owned state | After Manager reconciliation, rerun workflow:audit-readiness on the exact candidate, verify exact-head CI, and return the final unmerged PR. |
| 3 | In-Season Strategy & Decision Intelligence Analyst | WAIT | TCW-032 already consumed; no new policy question | Do not activate new Strategy work unless Manager finds a genuine policy ambiguity. |
| 4 | Research & Development (R&D) | WAIT | TCW-033 already consumed; no provider approved | Do not research/integrate another value source without separate Manager routing. |
| 5 | Independent Auditor / QA | WAIT | TCW-034 is not audit-ready until Builder readiness gate and Manager integration/freeze | No audit activation yet. |
| 6 | Troubleshooting & Root Cause Engineer — on-demand | IDLE | No technical convergence failure | No activation unless Manager identifies a genuine cross-layer defect. |
