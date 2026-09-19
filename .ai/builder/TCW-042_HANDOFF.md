# Builder Handoff — TCW-042

STATUS: ASSIGNED — BOUNDED REMEDIATION READY
TASK: TCW-042 — Trade Analyzer Ownership Remediation + Player Input UI Polish
ROLE: Implementation Engineer / Builder
EXECUTION: STANDARD_CHAT_HIGH
REFRESH: BOUNDED_REMEDIATION_REFRESH
ASSIGNMENT MASTER: `efdb129e789e0d3d08080bf865578cfe6de909bd`
EXPECTED BRANCH: `builder/tcw-042-trade-ui-audit-remediation`

## Accepted inputs

1. TCW-041-F01 HIGH: outgoing ambiguous ownership is not fail-closed.
2. Product-owner deployed UAT usability feedback: the Add outgoing button is oversized and visually separated from Add incoming.

Read the Manager task for exact scope. Fix both on the same bounded Trade Analyzer proposal surface.

Do not add winner scoring, suggestions, counteroffers, or other TCW-032+ behavior.

## Next Activation

| Order | Employee / Role | Status | Current Task / Gate | Copy/paste activation prompt / next action |
| ---: | --- | --- | --- | --- |
| 1 | Manager / Architect | WAIT | Await TCW-042 candidate | Review exact Builder PR/head/CI, integrate only if accepted, then deploy and freeze fresh re-audit target. |
| 2 | Implementation Engineer / Builder | ACTIVE | TCW-042 bounded remediation | Fix outgoing ownership ambiguity plus compact/balanced Send/Receive input UI, validate desktop/mobile/browser behavior, open one PR, do not merge. |
| 3 | In-Season Strategy & Decision Intelligence Analyst | WAIT | TCW-032 held | No action. |
| 4 | Research & Development (R&D) | WAIT | TCW-033 held | No action. |
| 5 | Independent Auditor / QA | WAIT | Fresh re-audit follows repaired integrated target | No action until Manager freezes exact repaired SHA. |
| 6 | Troubleshooting & Root Cause Engineer — on-demand | IDLE | No convergence failure | Activate only on Manager routing. |
