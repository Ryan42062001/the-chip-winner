# Builder Handoff

HANDOFF

Task ID: TCW-023
Role: Implementation Engineer / Builder
Status: ASSIGNED

## Assignment

Implement the accepted **Trade Analyzer v1** production feature under `.ai/manager/tasks/TCW-023.md`.

Canonical assignment baseline:

`9273128e677e332dd37529993974bed36a341669`

Expected branch:

`builder/tcw-023-trade-analyzer-v1`

Execution mode: `STANDARD_CHAT`

Merge authority: Manager / Architect only.

## Accepted Strategy dependency

TCW-022 is accepted and merged. The production contract is:

`.ai/strategy/TCW-022_TRADE_ANALYZER_POLICY.md`

Builder must implement that policy without reinterpreting the recommendation model.

Important accepted decisions include:

- roster consequence over package arithmetic;
- pre/post best legal lineup comparison;
- explicit unequal-count roster-space handling;
- no silent drops, free-agent adds, or IR moves;
- current lock/kickoff semantics remain informational when action is not realizable;
- depth and legal contingency are separate lenses;
- narrow `DANGEROUS` positional fragility;
- complete-coverage gates for numeric current/future/playoff comparisons;
- multiweek direction uses mean weekly lineup delta at the accepted +/-1.0 projected-point-per-week materiality threshold;
- projection sources remain separate;
- cross-horizon gain/cost conclusions take precedence over generic upgrade/depth labels;
- no hidden trade/winner/confidence score;
- read-only only; no ESPN trade write action.

## Required implementation result

Create a usable Trade Analyzer entry point in the existing application where the connected user can:

- choose one or more outgoing roster players;
- choose one or more incoming players represented in the connected ESPN snapshot;
- construct unequal-count packages;
- select explicit follow-up drop(s) when known roster rules require them;
- select `BALANCED`, `CURRENT_WEEK_STABILITY`, or `FUTURE_UPSIDE`;
- run analysis and inspect lineup, depth, roster-space, replacement, bye/future/playoff, source-agreement, evidence, conclusion, and limitation output supported by current data.

Prefer a dedicated domain module for Trade Analyzer policy and keep UI rendering separate from decision logic.

## Required tests

Implement deterministic coverage for the Manager task and accepted Strategy scenarios, including:

- 1-for-1 starter upgrade;
- bench-only incoming improvement;
- 2-for-1 consolidation/open-slot/depth cost;
- 1-for-2 full-roster action requirement and explicit-drop resolution;
- roster position limits;
- no automatic IR placement;
- lock/kickoff qualification;
- incomplete projection coverage;
- source disagreement;
- complete/incomplete future and playoff windows;
- mean-weekly horizon materiality;
- bye relief;
- ordinary depth loss versus narrow dangerous fragility;
- missing replacement availability;
- objective framing without factual mutation;
- deterministic short-term/long-term conflict precedence;
- absence of hidden score or ESPN mutation path;
- UI/browser interaction for creating/editing/analyzing a proposal.

## Boundaries

Do not:

- modify the accepted Strategy policy except for an unavoidable implementation clarification escalated to Manager;
- add a new external data source;
- add injury/news ingestion;
- add trade-market/acceptance probability;
- add dynasty/keeper/draft-pick valuation;
- execute or stage ESPN trade mutation requests;
- modify `config/field-validation.json`;
- manufacture future/playoff evidence;
- merge your own PR.

## Exact next action

Fast Refresh from canonical `master`, read Workflow V3.1, ACTIVE_TASKS, TCW-023, Builder role/handoff, the accepted TCW-022 Strategy contract, and only production/domain/UI/tests needed for the bounded implementation.

Implement, test, open a Builder PR, verify exact-head full CI, update this handoff, and return `MANAGER_REVIEW_READY` or a precise escalation.
