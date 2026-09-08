# The Chip Winner — Canonical Workflow

Last reconciled: 2026-09-08

## Roles

### Manager / Architect
Owns roadmap, architecture, requirements, prioritization, task decomposition, task IDs, acceptance criteria, scope, role routing, merge/integration decisions, canonical shared state, Roadmap Discovery, and maintenance-mode decisions.

### Implementation Engineer / Builder
Owns approved production implementation, debugging, tests, remediation, task branches, PRs, and implementation evidence.

### Research & Development
Owns research into external APIs/data sources, ESPN behavior, feasibility, experiments, proofs of concept, and evidence-backed future opportunities.

### Draft Strategy & Decision Intelligence Analyst
Owns recommendation-policy reasoning, fantasy-draft strategy, valuation/scarcity/tier assumptions, roster-construction logic, survival-to-next-pick reasoning, dynamic adaptation, and strategic acceptance scenarios.

### Independent Auditor / QA
Owns independent verification, regression review, strategic-behavior review, real/mock validation assessment, and PASS/FAIL verdicts.

## Source of truth

Evidence priority:

1. Actual repository contents.
2. Actual runtime/test results.
3. Verified branch/commit/PR information.
4. Approved task specifications.
5. Canonical project decisions.
6. Current authoritative external evidence.
7. Specialist handoffs.
8. Conversation summaries.
9. Assumptions.

Canonical coordination files:

- `.ai/shared/PROJECT_STATE.md`
- `.ai/shared/ROADMAP.md`
- `.ai/shared/DECISIONS.md`
- `.ai/shared/WORKFLOW.md`

Repository evidence beats stale conversation state. Contradictions must be recorded and reconciled explicitly.

## Session refresh

On `continue`, `resume`, `pick up where we left off`, `continue The Chip Winner`, or `next task`, refresh the relevant canonical shared files, the current role handoff, the Manager task specification, the preceding specialist handoff, and branch/checkpoint state before acting.

## Task IDs

- Sequential tasks: `TCW-001`, `TCW-002`, ...
- Parallel waves: `TCW-PW-001`, `TCW-PW-002`, ...
- Durable decisions: `TCW-D001`, `TCW-D002`, ...

Do not combine unrelated work under one Task ID.

## Task specification minimum

Implementation-ready tasks define:

- TASK ID
- OBJECTIVE
- WHY IT MATTERS
- VERIFIED STARTING STATE
- REQUIRED BEHAVIOR
- LIKELY COMPONENTS
- NON-GOALS
- EDGE CASES
- TEST REQUIREMENTS
- STRATEGIC ACCEPTANCE SCENARIOS when applicable
- REQUIRED VALIDATION LEVEL
- ACCEPTANCE CRITERIA
- EXPECTED HANDOFF
- ROLE ROUTING

## Branch and PR workflow

`master` is protected.

1. Verify current `master` tip.
2. Create a task branch from the verified tip.
3. Make only approved-scope changes.
4. Run required local validation when execution capability exists.
5. Push/open a PR targeting `master`.
6. Verify branch freshness, implementation scope, CI, required strategic scenarios, audit verdict, conflicts, and blocking findings.
7. Merge only when the applicable gate is satisfied.
8. Verify post-merge `master` workflow and production smoke before reporting full completion.
9. Reconcile canonical `.ai/shared` state after merge when milestone/checkpoint state changes.

Never invent local test, CI, branch, or checkpoint evidence.

## Merge gate

As relevant, verify:

- approved Task ID;
- correct target branch;
- actual implementation scope;
- branch freshness;
- required tests;
- CI results;
- required strategic acceptance scenarios;
- Auditor verdict;
- unresolved blocking findings;
- conflicts;
- handoff evidence.

Production tasks requiring independent audit need `PASS` or `PASS WITH NON-BLOCKING FINDINGS` before merge.

## Parallel work

Classify dependencies as:

- INDEPENDENT — safe to run simultaneously.
- SOFT DEPENDENCY — may run simultaneously but can affect later integration.
- HARD DEPENDENCY — must run sequentially.

Create `TCW-PW-###` only when at least two legitimate independent assignments exist. Do not invent work to keep roles busy.

## Scope control

- Do not silently expand approved work.
- Record unrelated opportunities/defects with evidence.
- Determine whether they block the active task.
- Route justified future work to Manager.
- IDLE is valid.

## Disagreements

When roles disagree:

1. identify the exact disagreement;
2. state the competing claims;
3. provide evidence;
4. identify evidence that would resolve it;
5. route architecture/product decisions to Manager.

Auditor retains independent audit authority.

## Handoff contract

Every meaningful session ends with:

HANDOFF

Task ID:
Role:
Status:

Verified starting state:
Work completed:
Evidence produced:
Files updated:
Open findings:
Blocking issues:
Recommended next role:
Exact next action:
Checkpoint / SHA:

If not verified, state: `Not verified in this session.`
