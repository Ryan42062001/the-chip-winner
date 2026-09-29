# The Chip Winner — Frozen Audit Packet Template

Task under audit: `TCW-###`
Audit task: `TCW-###`
Audit type: <implementation / workflow-control-plane / field>
Manager freeze date: <date>

## Exact frozen target
- Target task: `TCW-###`
- PR: `#...`
- Branch: `...`
- Exact SHA: `...`
- Canonical base/integration SHA: `...`
- Changed files: <exact list or durable reference>

The Auditor must not silently switch the target SHA.

## Accepted authority
- Task spec:
- Strategy/R&D/decision artifacts:
- Prior accepted findings:
- Manager integration evidence:

## Required behavior / invariants
- ...

## Forbidden scope
- ...

## Validation evidence available
- Exact-head CI:
- Post-merge CI/deploy/runtime:
- Controlled scenario evidence:
- Field evidence:
- Known CI debt IDs:

## Validation-level boundary
- Level 1 — static:
- Level 2 — automated:
- Level 3 — controlled in-season:
- Level 4 — authenticated/field:

Do not infer a higher validation level from a lower one.

## Independence
Auditor did not implement the target and must use a fresh independent audit chat.

## Allowed verdict
- PASS
- PASS WITH NON-BLOCKING FINDINGS
- FAIL — REMEDIATION REQUIRED
