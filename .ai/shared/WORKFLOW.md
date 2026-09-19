# The Chip Winner — Canonical Workflow

Status: ACTIVE — WORKFLOW V3.2 CANDIDATE INTEGRATION
Last reconciled: 2026-09-18
Owner: Manager / Architect

This is the base workflow for **The Chip Winner**, the ESPN-only, read-only, in-season fantasy-football decision companion.

Repository evidence overrides stale chat memory.

Workflow overlays:
1. `.ai/shared/WORKFLOW_V3_2.md` — newest governing candidate; controls where it narrows/supersedes earlier rules.
2. `.ai/shared/WORKFLOW_V3_1.md` — preserved predecessor.
3. this file — stable base principles.

TCW-026 may not be marked CLOSED until its exact integrated V3.2 target receives the required fresh independent workflow/control-plane audit.

## Project identity

Keep separate:
- The Chip Winner — in-season fantasy-football helper.
- The War Room — draft assistant.
- Family Finance Hub — personal-finance application.
- ECOG — church website.

Cross-project workflow patterns may be adopted only through an explicit Manager task and must be translated to The Chip Winner's actual roles/product boundaries.

## Operating model

ROLE = durable  
CHAT = disposable execution session  
TASK = unit of work  
REPOSITORY = durable memory  
MANAGER = router / integrator / canonical-state authority

Permanent employee roles:
1. Manager / Architect
2. Implementation Engineer / Builder
3. In-Season Strategy & Decision Intelligence Analyst
4. Research & Development (R&D)
5. Independent Auditor / QA

On-demand recovery role:
6. Troubleshooting & Root Cause Engineer

IDLE is valid. Do not manufacture work.

## Canonical authority

Machine-authoritative active state:
- `.ai/shared/ACTIVE_TASKS.json`

Human/durable authority:
- `.ai/shared/PROJECT_STATE.md`
- `.ai/shared/ROADMAP.md`
- `.ai/shared/DECISIONS.md`
- current workflow overlays
- active Manager task specs
- role charters/handoffs
- PR/commit/CI/runtime evidence

Field authority:
- `config/field-validation.json`

If sources disagree, actual repository/runtime/CI evidence outranks stale handoffs or chat memory.

## Roles

Manager owns roadmap, requirements, task routing, architecture, acceptance, canonical state, integration, merge authority, and milestone/release disposition.

Builder owns approved production implementation, routine debugging, tests, remediation, and implementation evidence.

In-Season Strategy owns what recommendations should mean: waiver/add-drop policy, lineup/start-sit reasoning, roster construction/depth, replacement value/scarcity, bye/playoff planning, IR/injury implications, and horizon tradeoffs.

R&D owns external/API/source/model/technical research, experiments, and feasibility.

Independent Auditor owns fresh adversarial verification and does not implement the target being audited.

Troubleshooting is temporary/on-demand for difficult cross-layer technical diagnosis and does not acquire product-policy, audit, or merge authority.

## Protected branch / PR discipline

For production and material control-plane work:
1. verify current `master`;
2. use a dedicated task branch;
3. change only authorized scope;
4. run required validation;
5. open PR to `master`;
6. Manager independently verifies exact head, scope, freshness, CI, and required evidence;
7. Manager alone authorizes merge;
8. verify post-merge master CI;
9. deploy/production-verify when deployable files changed;
10. reconcile canonical task state;
11. complete required independent audit/field gates before CLOSED.

A worker-ready PR, a green CI run, and a physical merge are distinct from Manager acceptance.

## Evidence levels

- Level 1 — static correctness
- Level 2 — automated tests/CI
- Level 3 — controlled in-season scenarios
- Level 4 — genuine authenticated/field behavior

A lower level never proves a higher one.

## Release 1.0 field boundary

`config/field-validation.json` remains separately authoritative.

Real-world field checks may not be passed from synthetic tests.

Privacy-safe evidence excludes credentials, cookies, tokens, private URLs, private raw snapshots, member identifiers, and similar secrets.

The sole current Release 1.0 pending condition, `FV-SEASON-01`, remains genuine-season-event gated and must not be manufactured.

## Anti-loop

After roughly three materially different failed approaches without meaningful progress or new evidence, stop speculative iteration and return a precise escalation packet. Manager decides whether to activate Troubleshooting or reroute ownership.

## Advanced V3.2 controls

Execution/refresh routing, active-only schema, blocker semantics, write-collision safety, execution packets, audit readiness/frozen targets, transition/user-action helpers, CI fast path/evidence, compact/full-workforce handoffs, control-plane audit requirements, and standing workflow-improvement authority are defined in `.ai/shared/WORKFLOW_V3_2.md`.
