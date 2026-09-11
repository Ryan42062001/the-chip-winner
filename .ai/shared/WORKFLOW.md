# The Chip Winner — Canonical Workflow

Status: ACTIVE — WORKFLOW V3
Last reconciled: 2026-09-11
Owner: Manager / Architect

This file is the canonical AI-team workflow for **The Chip Winner**, the ESPN-only, read-only, **in-season** fantasy-football decision companion. Repository evidence overrides stale chat memory.

## Project identity boundary

Keep these projects distinct:
- **The Chip Winner** = in-season fantasy-football helper.
- **The War Room** = live fantasy-football draft assistant.
- **Family Finance Hub** = personal-finance application.
- **ECOG** = church website.

Draft-specific strategy belongs in The War Room. The Chip Winner Strategy role owns in-season recommendation policy only.

## Core operating model

**ROLE = DURABLE**  
**CHAT = DISPOSABLE**  
**TASK = UNIT OF WORK**  
**REPOSITORY = MEMORY**  
**MANAGER = ROUTER / INTEGRATOR**

The normal permanent team is intentionally small:
1. **Manager / Architect** — roadmap, requirements, architecture, priorities, task decomposition, acceptance criteria, execution-mode recommendation, integration/merge authority, canonical shared state.
2. **Implementation Engineer / Builder** — approved production implementation, normal debugging, tests, remediation, branches/PRs, implementation evidence.
3. **In-Season Strategy & Decision Intelligence Analyst** — waiver/add-drop policy, lineup/start-sit reasoning, roster construction, replacement value/scarcity, bye/playoff planning, IR/injury implications, horizon tradeoffs, and whether in-season recommendations make fantasy-football sense.
4. **Research & Development (R&D)** — ESPN/external data/API research, source rights, projection/model research, feasibility, experiments, technical unknowns, future architecture opportunities.
5. **Independent Auditor / QA** — independent requirement, regression, strategic-behavior, live-state, field-validation, and release-gate verification.

A temporary **Troubleshooting & Root Cause Engineer** may be instantiated only when the anti-loop escalation rule is triggered or the Manager determines that a fresh cross-layer diagnosis is warranted.

IDLE is valid. Do not manufacture work merely to keep roles active.

## Canonical repository sources

Fast-path current task state:
- `.ai/shared/ACTIVE_TASKS.json` — Manager-owned current task/dependency/status registry.

Human-readable canonical coordination:
- `.ai/shared/PROJECT_STATE.md`
- `.ai/shared/ROADMAP.md`
- `.ai/shared/DECISIONS.md`
- `.ai/shared/WORKFLOW.md`
- `.ai/manager/ACTIVE_ASSIGNMENTS.md`
- `.ai/manager/HANDOFF.md`
- assigned `.ai/manager/tasks/TCW-###.md`
- applicable `.ai/roles/*.md`
- latest relevant role handoff

Product/field authority remains where already established, including `config/field-validation.json`, `docs/field-validation.md`, product code/tests, and current runtime/CI evidence.

Repository state overrides stale conversation history. Contradictions must be surfaced and reconciled explicitly.

## Refresh modes

Workers should load minimum sufficient context first.

### Fast Refresh
Use for routine `continue`, status checks, task-scoped worker startup, and ordinary task resumption.

Read/verify first:
1. actual `master` SHA;
2. `.ai/shared/ACTIVE_TASKS.json`;
3. role charter;
4. assigned task spec;
5. latest relevant role handoff;
6. branch/PR/CI/runtime state when relevant.

Expand only when the task requires it.

### Full Refresh
Required before:
- creating or activating a meaningful new task;
- roadmap/architecture decisions;
- durable product or workflow decisions;
- major Strategy/R&D disposition;
- production merge/release decisions;
- audit/release-gate decisions with meaningful integration risk;
- resolving contradictory state;
- resuming after a materially stale checkpoint.

Also read/verify PROJECT_STATE, ROADMAP, DECISIONS, WORKFLOW, Manager handoff, relevant predecessor handoffs, open PRs, and target advancement.

## Chat lifecycle and context hygiene

Worker chats should normally be **task-scoped**. Prefer a fresh chat per meaningful Builder, Strategy, R&D, or Auditor task.

A same-task remediation may remain in the same chat while it stays responsive and focused. Replace a chat when conversation size causes slowdown, stale-state mistakes, repeated confusion, old logs/diffs dominate context, or troubleshooting loops develop.

Manager may span a milestone but should roll over at a milestone boundary or earlier when context size materially harms speed or accuracy.

Replacement chats reconstruct state from GitHub. The user should not need to manually transfer long conversation history.

## Task IDs and lifecycle

Tasks use `TCW-###`; parallel coordination may use `TCW-PW-###`; durable decisions use `TCW-D###`.

Manager owns `.ai/shared/ACTIVE_TASKS.json`. Workers report state through handoffs/PR evidence and do not directly edit the registry unless a workflow task explicitly authorizes it.

Registry lifecycle states:
- `PLANNED`
- `BLOCKED`
- `ASSIGNED`
- `IN_PROGRESS`
- `MANAGER_REVIEW_READY`
- `AUDIT_READY`
- `MERGE_READY`
- `REWORK_REQUIRED`
- `MERGED`
- `CLOSED`

Do not combine unrelated work under one Task ID.

## Work Mode acceleration

Every new meaningful task receives one execution classification:
- `STANDARD_CHAT`
- `WORK_MODE_PREFERRED`
- `WORK_MODE_HIGH_VALUE`

Use Work Mode when sustained multi-step repository/browser/runtime execution, repeated edits/tests, broad evidence gathering, or complex integration work would materially accelerate execution.

**Work Mode is an accelerator, not a dependency.**

Every Work-preferred/high-value task must include a concise normal-chat fallback whenever the underlying work can still be completed without Work Mode. If credits are unavailable, continue through normal repository/web/tool execution, exact patches/commands, or smaller sequential steps. Block only the exact capability that is genuinely unavailable.

## Role routing

Use **In-Season Strategy** when the unresolved question is what the product SHOULD recommend or how connected in-season context should affect a recommendation, including waiver value vs roster need, lineup decisions, replacement value, positional depth/scarcity, bye/playoff planning, IR implications, and short-vs-long-horizon tradeoffs.

Use **R&D** for ESPN/external data facts, APIs, source rights, projections/models, technical feasibility, experiments, undocumented behavior, or future architecture.

Use **Builder** only after objective, scope, dependencies, and acceptance criteria are sufficiently settled.

Use **Auditor** for independent verification of production behavior, recommendation logic, live ESPN/state flows, persistence/recovery, high-risk shared behavior, field validation, and release/milestone gates.

Strategy and R&D are advisory. Manager approves final requirements, architecture, roadmap, and product-policy changes.

## Evidence hierarchy

Prefer evidence in this order:
1. actual repository contents;
2. actual runtime/test/field output;
3. verified branch/commit/PR/CI state;
4. approved Manager task specification;
5. canonical decisions;
6. current authoritative external evidence;
7. specialist handoffs/reports;
8. conversation summaries;
9. assumptions.

Never elevate an assumption into a verified fact.

## Release 1.0 field-validation boundary

`config/field-validation.json` remains authoritative for Release 1.0 field-check status. Real-world field checks cannot be passed merely because deterministic tests cover related behavior.

Privacy-safe field evidence must exclude ESPN cookies, credentials, private raw snapshots, member identifiers, private sync URLs/tokens, and other secrets.

A missing field opportunity may remain `BLOCKED`; do not manufacture a pass, failure, league state, or specialist assignment.

## Anti-loop escalation

All roles must stop unproductive loops.

If approximately **three materially different approaches/hypotheses** fail without meaningful progress or new evidence:
1. STOP speculative iteration.
2. Persist `STALLED / ESCALATION REQUIRED`.
3. State what is known, what was tried, results, missing evidence, and who should act next.

For engineering/debugging, include symptom, expected/observed behavior, reproduction, logs/errors, branch/SHA, hypotheses tested, attempted changes, outcomes, suspected layers, and unresolved questions.

Manager may then activate a fresh temporary Troubleshooting & Root Cause Engineer. The troubleshooter independently diagnoses and normally returns root cause/remediation guidance; the appropriate Builder implements the approved production fix and Auditor verifies when required.

## Parallel work

Classify dependencies as:
- `INDEPENDENT`
- `SOFT DEPENDENCY`
- `HARD DEPENDENCY`

Create `TCW-PW-###` only when at least two legitimate assignments can safely proceed in parallel. Optimize useful throughput, not employee utilization.

Production workers use dedicated task branches, minimize overlap, preserve starting checkpoints, and do not independently modify `.ai/shared/*` unless specifically authorized.

Do not force every task through every role. Manager chooses the shortest valid path.

## Protected branch and PR workflow

`master` remains protected.

For production and control-plane changes:
1. verify current `master` tip;
2. create a task branch from the verified checkpoint;
3. make only approved-scope changes;
4. run/observe required validation when capability exists;
5. open a PR to `master`;
6. verify scope, branch freshness, CI, required strategic/audit/field evidence, conflicts, and blocking findings;
7. merge only when the applicable gate is satisfied;
8. verify post-merge `master` test/deploy/production verification before reporting full completion;
9. reconcile canonical task state after meaningful merge/checkpoint changes.

Never invent tests, CI, branch freshness, runtime behavior, or field evidence.

## Target advancement

When a task branch falls behind `master`, classify the advance:
- `CONTROL_PLANE_ONLY` — `.ai/**`/coordination-only and non-overlapping;
- `NON_OVERLAPPING` — product/tooling changes without coupled task-surface overlap;
- `OVERLAPPING_RISK` — same files or tightly coupled behavior changed.

Control-plane-only target movement does not automatically invalidate unchanged product evidence. Overlapping risk requires reconciliation and materially affected revalidation before audit/merge.

## Validation levels

- **Level 1 — Static correctness**
- **Level 2 — Automated tests/CI**
- **Level 3 — Controlled in-season scenarios/simulations**
- **Level 4 — Real authenticated/field validation**

A lower validation level does not prove a higher one.

## Handoff contract

Keep handoffs concise. Detailed evidence belongs in task reports, PRs, CI, field evidence, and dedicated research/audit artifacts.

Every meaningful handoff should record:
- Task ID / Role / Status
- verified starting state
- work completed
- evidence produced
- files updated
- open findings/blockers
- recommended next role
- exact next action
- checkpoint/SHA when verified

If a fact was not verified, say so.

## Stable / maintenance mode

No worker must remain active merely for utilization. Development may reactivate for verified defects, real-world field evidence, explicit product requirements, changed dependencies, or evidence-backed opportunities. A trigger does not itself authorize implementation.
