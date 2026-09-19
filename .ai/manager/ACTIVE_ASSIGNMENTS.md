# Active Assignments

Last updated: 2026-09-19
Machine authority: `.ai/shared/ACTIVE_TASKS.json`

## TCW-034 — MANAGER_REVIEW_READY

Owner:
**Implementation Engineer / Builder**

Execution mode:
`STANDARD_CHAT_HIGH`

Refresh:
`FAST_REFRESH`

Authorized working baseline:
`872aa79969743dafb3bf062a76b213c687397a6f`

PR:
`#147`

Exact worker checkpoint:
`a40c8db8f7e6defcecdf58dc2d3ddd81ea88249a`

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
Builder reruns `npm run workflow:audit-readiness -- --task TCW-034` against exact checkpoint `a40c8db8f7e6defcecdf58dc2d3ddd81ea88249a` using the reconciled canonical Manager state. On PASS, return the readiness packet to Manager for freeze and fresh independent audit. Do not merge.

TCW-035 and later Trade Analyzer tasks remain unactivated.
