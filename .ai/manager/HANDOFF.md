# Manager / Architect Handoff

STATUS: TCW-031 TRADE ANALYZER FUNCTIONAL RESET ROUTED
ROLE: Manager / Architect
ASSIGNMENT BASE: `3eee60a38e464dd3406f7a67f287c3d63a5f6a74`

## Active task

`TCW-031 — Trade Analyzer Functional Reset + UAT Contract`

Owner: Implementation Engineer / Builder  
Execution: STANDARD_CHAT_HIGH  
Refresh: FAST_REFRESH  
Expected branch: `builder/tcw-031-trade-analyzer-functional-reset`

## Why this task exists

The prior TCW-025/030 chain correctly closed four bounded audit findings, but real product-owner feedback established that the Trade Analyzer still does not work acceptably end-to-end.

Manager also confirmed a concrete baseline integrity defect in current code:
- the UI offers every non-user snapshot player as an incoming trade asset;
- there is no explicit opposing-team selector;
- domain validation does not require incoming players to belong to one selected counterparty;
- unrostered/free-agent and mixed-opponent pseudo-trades can therefore be constructed.

TCW-031 fixes the baseline product workflow before V2 winner/finder/counter intelligence expands.

## Scope

Builder must:
- reproduce the current evaluate-trade workflow;
- introduce explicit counterparty selection;
- restrict incoming players to that partner's roster;
- enforce ownership in domain validation;
- prevent free-agent/unrostered and mixed-opponent trade packages;
- preserve multi-player editing, roster legality, source separation, lock semantics, and read-only behavior;
- prevent stale analysis after partner/package edits;
- strengthen deterministic/browser coverage;
- define the real deployed UAT checklist.

TCW-031 does **not** add winner scoring, suggested trades, counteroffers, or new external data. Those remain TCW-032+.

## Completion boundary

Builder completion is not product completion.

After Manager integrates a valid implementation:
1. post-merge/full master verification is required;
2. a fresh independent audit is required;
3. genuine deployed user acceptance is required.

The user acceptance gate cannot be satisfied by CI or simulation.

## Release boundary

`config/field-validation.json` remains unchanged.

Field state remains **10 passed / 1 pending**:
`FV-SEASON-01 — Real playoff and bye intelligence states`

Do not manufacture that condition.

## Next Activation

| Order | Employee / Role | Status | Current Task / Gate | Copy/paste activation prompt / next action |
| ---: | --- | --- | --- | --- |
| 1 | Manager / Architect | WAIT | TCW-031 routed; await Builder candidate | Review Builder PR/head/CI and independently inspect the baseline reset before any integration. |
| 2 | Implementation Engineer / Builder | ACTIVATE NOW | TCW-031 — Trade Analyzer Functional Reset + UAT Contract | Continue The Chip Winner as Implementation Engineer / Builder. Execute TCW-031 from the prepared branch using STANDARD_CHAT_HIGH + FAST_REFRESH. Reproduce the baseline Trade Analyzer failure, fix explicit counterparty/ownership integrity and any directly blocking baseline workflow defect, add focused/browser regression coverage, preserve read-only and field state, open one PR, verify exact-head CI, and do not merge. |
| 3 | In-Season Strategy & Decision Intelligence Analyst | WAIT | TCW-032 planned after baseline reset | Do not define V2 winner/value policy until Manager routes TCW-032. |
| 4 | Research & Development (R&D) | WAIT | TCW-033 planned after baseline reset | Do not research ESPN incoming-offer access until Manager routes TCW-033. |
| 5 | Independent Auditor / QA | WAIT | Fresh TCW-031 audit follows integrated candidate | Do not audit before Manager freezes the integrated target. |
| 6 | Troubleshooting & Root Cause Engineer — on-demand | IDLE | No convergence failure yet | Activate only if Builder returns a genuine cross-layer diagnosis stall. |
