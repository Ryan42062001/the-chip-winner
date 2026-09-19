# Builder Handoff — TCW-034 Bounded Audit Remediation

STATUS: FINAL REPAIRED CANDIDATE — FRESH FULL CI REQUIRED ON THIS EXACT HEAD  
TASK: TCW-034 — Trade Winner Engine  
ROLE: Implementation Engineer / Builder  
EXECUTION: STANDARD_CHAT_HIGH  
REFRESH: BOUNDED_REMEDIATION_REFRESH  
BRANCH: `builder/tcw-034-trade-winner-engine`  
PR: #147 — MUST REMAIN DRAFT / UNMERGED  
FAILED FROZEN TARGET / REMEDIATION PARENT: `a40c8db8f7e6defcecdf58dc2d3ddd81ea88249a`  
CURRENT CANONICAL MASTER OBSERVED DURING REMEDIATION: `4672d9d12cd844c97d258e664040ed683c0ccb90`  
CANONICAL ADVANCEMENT: CONTROL_PLANE_ONLY — NOT MERGED INTO BUILDER BRANCH  
MERGE AUTHORITY: Manager / Architect only

## Accepted findings remediated

### F01 — listed-position counts are descriptive

- `depth.listedPositionChanges` remains visible/descriptive.
- `listedPositionChangesAreDescriptive: true`.
- Raw RB/WR/etc. count deltas do not directly set material `depthCost` / `depthGain`.
- Material depth cost/gain can come from verified legal contingency change.
- Supported bye-gap changes remain independent material evidence.
- A separately supported slot-aware replacement-quality cost may be material only when:
  - explicit configured-slot demand exists;
  - the replacement pool is current/same-snapshot;
  - the candidate is slot-eligible;
  - acquisition capacity is verified available;
  - a known legal roster acquisition path exists;
  - both outgoing and replacement projections are finite on the same current-week basis.
- UNKNOWN contingency plus raw count change cannot become WORSENS/IMPROVES/MIXED solely from the count.
- If raw counts change while contingency is UNKNOWN and no other material evidence resolves the trade, the do-nothing user decision remains WITHHELD.

Regressions cover neutral bench RB -> bench WR, raw count-only description, UNKNOWN contingency, genuine contingency loss/gain, plus preserved 2-for-1/1-for-2/dangerous-gap behavior.

### F02 — replacement numeric is demand/legality/feasibility bounded

`replacementScarcity` now:
- derives explicit affected configured-slot demand from supported contingency and known worsened bye-gap evidence;
- preserves full structural pool separately from presentation shortlist;
- uses real slot labels and existing `canFillSlot` semantics, including FLEX/OP;
- exposes `eligibleSlots` and structured `positionalAndFLEXOPDemand`;
- requires verified acquisition status `available`;
- requires known legal roster path;
- requires same captured snapshot/current-week basis;
- requires finite projection for the feasible slot-eligible candidate;
- otherwise returns `replacementProjectionOrNull: null`.

Regressions cover:
- high-projection ineligible QB vs lower eligible RB;
- no eligible candidate;
- FLEX;
- OP;
- exhausted acquisition;
- eligible candidate missing projection.

`marginalVorpOrNull` remains null and replacement/scarcity stays separate from package market value.

### F03 — canonical horizon completeness is authoritative

Playoffs:
- canonical week set comes only from `snapshot.league.playoffWeeks`;
- caller `playoffWeeks` cannot shrink it;
- any missing configured week keeps playoff aggregate/mean/direction UNKNOWN/null;
- explicit `futureWeeks` can still form a named partial FUTURE_WINDOW without becoming canonical playoffs.

ROS:
- canonical ROS week set comes only from authoritative league-state `snapshot.league.restOfSeasonWeeks`;
- caller `restOfSeasonComplete:true` is not authority;
- caller `restOfSeasonWeeks` cannot create or shrink canonical ROS;
- no authoritative full set => ROS UNKNOWN;
- complete authoritative set + full coverage => READY.

`FV-SEASON-01` remains pending; no field evidence is manufactured.

### F04 — confidence uses trusted independence provenance

Source contract now carries:
- trusted `authority.independentEvidenceApproved`;
- `provenance.independenceGroup`;
- optional `provenance.derivativeOf`.

Confidence behavior:
- one approved source => at most MODERATE;
- duplicate/shared-origin rows => MODERATE;
- derivative/shared-origin rows => MODERATE;
- second row lacking explicit independent-evidence approval => MODERATE;
- HIGH only when at least two explicitly Manager-authorized independent evidence groups agree on one unit/scale;
- source disagreement remains generic WITHHELD regardless of independence metadata.

## Preserved boundaries

- `PRODUCTION_TRADE_VALUE_SOURCES = Object.freeze([])`;
- no live FantasyPros/FantasyCalc/RedraftCalc/RotoTrade provider;
- no scrape/bundle/manual numeric authority;
- live package winner/split remains WITHHELD;
- no rank/projection/SOS/ADP/VORP/waiver/replacement fallback into package market value;
- package-value absence does not suppress supported roster consequence;
- ESPN remains read-only;
- `transactionActions: []`;
- ownership/counterparty/stale-state/explicit-drop/roster-legality/source-separation/FLEX/OP safeguards preserved;
- `config/field-validation.json` unchanged;
- no TCW-035 work.

## Validation before final immutable head

A pre-final development checkpoint reached FULL green with the repaired F01-F04 deterministic suite, Trade Analyzer browser smoke, accessibility/readiness/mobile/security, and repository guardrails. That run is development evidence only and is not the Manager freeze target.

The exact commit containing this handoff is the proposed immutable repaired candidate and must receive a NEW FULL run. No Builder commit may follow it.

Task-specific `workflow:audit-readiness -- --task TCW-034` is intentionally deferred. Manager must first record the exact repaired FULL head as `worker_checkpoint_sha` and transition TCW-034 to `MANAGER_REVIEW_READY` without changing Builder HEAD; audit-readiness then runs against this unchanged head.

## Remediation diff relative to failed target

Exactly:
- `.ai/builder/HANDOFF.md`
- `src/domain/trade-analyzer.js`
- `src/domain/trade-value-engine.js`
- `src/domain/trade-value-source.js`
- `test/trade-winner-engine.test.js`
- `test/trade-winner-integration.test.js`

`test/trade-analyzer.test.js` is restored byte-for-byte to the failed-parent version and is not part of the remediation diff. No Manager/shared/audit/strategy/R&D/provider/workflow/package/extension/field-validation file is changed.

## Next Activation

| Order | Employee / Role | Status | Current Task / Gate | Copy/paste activation prompt / next action |
| ---: | --- | --- | --- | --- |
| 1 | Manager / Architect | RECOMMEND TO MANAGER | Record exact repaired FULL head and readiness state | After exact-head FULL PASS, record that exact SHA as TCW-034 worker_checkpoint_sha and transition to MANAGER_REVIEW_READY without changing Builder HEAD; then run task-specific audit-readiness and, if PASS, freeze that same SHA for fresh independent re-audit. |
| 2 | Implementation Engineer / Builder | COMPLETE AFTER EXACT-HEAD FULL PASS | TCW-034 bounded F01-F04 remediation | Do not add another commit, merge, or activate TCW-035. Return exact FULL repaired head to Manager. |
| 3 | In-Season Strategy & Decision Intelligence Analyst | WAIT | No new policy question | No activation. |
| 4 | Research & Development (R&D) | WAIT | No new source authority | No activation. |
| 5 | Independent Auditor / QA | WAIT | Fresh re-audit only after Manager freeze | Do not audit until Manager freezes the exact repaired FULL head. |
| 6 | Troubleshooting & Root Cause Engineer — on-demand | IDLE | No unresolved convergence blocker | No activation. |
