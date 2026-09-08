# Active Assignments

Last updated: 2026-09-08

## TCW-001 — Bootstrap canonical `.ai` workflow

Role: Manager / Architect
Status: ACTIVE
Dependency: none
Branch: `manager/tcw-001-ai-workflow-bootstrap`

Objective:
Inspect the actual repository, reconcile verified state, and establish the canonical `.ai` coordination workflow without changing production behavior.

Acceptance criteria:

- canonical shared state files exist and reflect verified repository evidence;
- Manager handoff and active assignments exist;
- Builder, R&D, Strategy, and Auditor role directories exist;
- stale repository handoffs/status text are identified rather than silently reconciled;
- bootstrap uses the protected branch/PR workflow;
- no production code or product behavior changes are introduced.

## Specialist activation

Builder: IDLE
R&D: IDLE
Strategy: IDLE
Auditor: IDLE

Reason:
TCW-001 establishes the authoritative coordination layer. Specialist assignment is intentionally deferred until the bootstrap state is merged or otherwise made authoritative. This is a HARD DEPENDENCY for clean routing; no parallel wave is justified yet.

## Candidate next work after TCW-001

Manager must refresh the merged canonical state and then decide whether to:

- route an independent baseline/field-gate verification to Auditor;
- route ESPN-behavior uncertainty for pending custom FLEX/OP, IR-edge, or lock-transition field work to R&D;
- leave Builder idle unless a reproduced defect or approved implementation task exists;
- leave Strategy idle unless recommendation-policy uncertainty or a new decision-engine requirement exists.

No candidate item is authorized merely by appearing here.
