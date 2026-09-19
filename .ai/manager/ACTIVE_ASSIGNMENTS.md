# Active Assignments

Last updated: 2026-09-19
Machine authority: `.ai/shared/ACTIVE_TASKS.json`

## TCW-034 — ASSIGNED / BOUNDED REMEDIATION

Owner:
**Implementation Engineer / Builder**

Execution mode:
`STANDARD_CHAT_HIGH`

Refresh:
`BOUNDED_REMEDIATION_REFRESH`

Existing branch:
`builder/tcw-034-trade-winner-engine`

Existing PR:
`#147` — DRAFT / UNMERGED

Remediation parent:
`a40c8db8f7e6defcecdf58dc2d3ddd81ea88249a`

Control-plane/audit advancement checked through:
`fea421a9263e78ff9eeb23c1a339e95b412affe0`

Advancement classification:
`CONTROL_PLANE_ONLY`

Accepted independent audit findings:
- F01 HIGH — raw listed-position count changes must not become material decision evidence;
- F02 MEDIUM — replacement numeric context must be legal slot/FLEX/OP/acquisition-path specific or null;
- F03 MEDIUM — caller subsets cannot redefine canonical ROS/playoff completeness;
- F04 LOW — HIGH confidence requires genuinely independent agreeing approved sources.

Canonical Manager decision:
`.ai/manager/evidence/TRADE_WINNER_AUDIT_FINDING_DECISION.md`

Required next candidate:
- accepted F01-F04 only;
- fresh FULL implementation checkpoint;
- exact FULL head already includes final Builder handoff/evidence and is the proposed immutable repaired target;
- Builder returns that exact head to Manager without merge;
- Manager records the checkpoint and transitions to MANAGER_REVIEW_READY;
- task-specific audit-readiness then PASSes against the unchanged exact head;
- no later handoff-only target substitution;
- no merge.

Preserved:
- production provider set EMPTY;
- live package winner/split WITHHELD;
- ESPN read-only;
- field registry unchanged / FV-SEASON-01 pending;
- TCW-035+ inactive.

Next gate:
Builder returns the exact repaired SHA, fresh FULL run/test job, bounded changed files, deterministic finding regressions, and preserved-boundary evidence. Manager then records that exact checkpoint / MANAGER_REVIEW_READY state, runs the task-specific readiness gate against the unchanged head, and only on PASS freezes it for a fresh re-audit.
