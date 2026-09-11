# The Chip Winner — Role Charters

Compact role files let fresh replacement chats reconstruct their state from GitHub instead of depending on long conversation history.

Permanent roles:
- `MANAGER.md`
- `BUILDER.md`
- `STRATEGY.md` — In-Season Strategy & Decision Intelligence
- `RND.md`
- `AUDITOR.md`

Temporary escalation role:
- `TROUBLESHOOTING.md`

Use `.ai/shared/WORKFLOW.md` and `.ai/shared/ACTIVE_TASKS.json` as the operating entry point. A fresh task-scoped worker normally reads its role charter, assigned task spec under `.ai/manager/tasks/`, relevant handoff, and actual branch/PR/CI/runtime evidence.

Draft Strategy belongs to The War Room. The Chip Winner Strategy role is in-season only.
