# Active Assignments

Last updated: 2026-09-19
Machine authority: `.ai/shared/ACTIVE_TASKS.json`

## TCW-034 — ASSIGNED

Owner:
**Implementation Engineer / Builder**

Execution mode:
`STANDARD_CHAT_HIGH`

Refresh:
`FAST_REFRESH`

Canonical assignment master:
`2124602b0eb884fc9a6db407e4feb3b3f9afbf5a`

Expected branch:
`builder/tcw-034-trade-winner-engine`

Task:
`.ai/manager/tasks/TCW-034.md`

Accepted upstream:
- TCW-032 Manager-accepted Strategy contract
- TCW-033 Manager-accepted R&D research
- source decision: `.ai/manager/evidence/TCW-033_VALUE_SOURCE_DECISION.md`
- no live external provider approved
- production approved-provider set empty
- package winner/split must remain WITHHELD in live production
- synthetic test fixtures may exercise approved-source package-value math

Next gate:
Builder implements bounded TCW-034, preserves provider fail-closed behavior and existing Trade Analyzer protections, runs full validation plus `npm run workflow:audit-readiness -- --task TCW-034`, opens one Builder PR, validates the exact final head, and returns to Manager without merging.

TCW-035 and later Trade Analyzer tasks remain unactivated.
