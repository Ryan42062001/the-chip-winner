# The Chip Winner — Role Charters

Roles are durable; chats are disposable execution sessions. Repository state reconstructs context.

Permanent roles:
1. Manager / Architect
2. Implementation Engineer / Builder
3. In-Season Strategy & Decision Intelligence Analyst
4. Research & Development (R&D)
5. Independent Auditor / QA

On-demand role:
6. Troubleshooting & Root Cause Engineer

## Fresh-chat bootstrap

Normally read:
- `.ai/shared/WORKFLOW_V3_2.md`
- `.ai/shared/ACTIVE_TASKS.json`
- your role charter
- assigned Manager task
- relevant role handoff
- explicitly named accepted upstream artifacts
- exact branch/PR/CI/runtime evidence needed for the task

Repository/task evidence outranks the bootstrap prompt.

## Execution / refresh defaults

`STANDARD_CHAT_HIGH` and `FAST_REFRESH` are defaults.

`WORK_MODE` is an execution accelerator only when substantial autonomous execution materially reduces interaction overhead.

`FULL_REFRESH` is exceptional and requires a reason.

`BOUNDED_REMEDIATION_REFRESH` is for accepted same-task remediation.

Independent Auditor chats remain fresh.

## Context hygiene

Reuse a same-role chat for closely related sequential work when context remains relevant and independence is not required. Start fresh when independence, bias risk, or stale/oversized context warrants it.

## Handoff dashboard

Every meaningful employee handoff ends with the V3.2 Next Activation table containing all six roles. Workers may recommend Manager review but only Manager may mark a role `ACTIVATE NOW`.
