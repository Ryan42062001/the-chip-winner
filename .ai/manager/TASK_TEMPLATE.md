# The Chip Winner — Task Template

Use for new meaningful tasks under Workflow V3.2. Historical closed tasks are not rewritten solely for format parity.

```md
# TCW-### — <Title>

Schema: TCW_TASK_V2
ROLE ROUTING: <role>
STATUS: PLANNED
DEPENDENCY: INDEPENDENT | SOFT | HARD
EXECUTION MODE: STANDARD_CHAT_HIGH | WORK_MODE
REFRESH MODE: FAST_REFRESH | BOUNDED_REMEDIATION_REFRESH | FULL_REFRESH
REFRESH REASON: N/A | <required for FULL_REFRESH; bounded finding for remediation refresh>
ACTIVATION: WAITING | READY | ACTIVE | USER_AUTHORIZED | BLOCKED
BLOCKER TYPE: NONE | USER_ACTION | UPSTREAM_TASK | EXTERNAL_SERVICE | EXTERNAL_EVIDENCE | TECHNICAL | AUDIT
USER ACTION REQUIRED: false
BLOCKED ON: NONE | <task/evidence>
NEXT OWNER: <role>

## AUTHORIZED BASELINE
Canonical assignment master:
`<40-char SHA>`

Expected branch:
`<role/task branch>`

## OBJECTIVE
...

## REQUIRED BEHAVIOR
...

## NON-GOALS
...

## OWNED FILES / SYSTEMS
Allowed path prefixes:
- ...

Forbidden path prefixes:
- ...

## MANAGER INTEGRATION RECORD
PRODUCTION_SHA: Not yet established
VALIDATED_CI: Not yet established
HANDOFF_SHA: Not yet established
INTEGRATION_SHA: Not yet established
MANAGER_VERDICT: PENDING
AUDIT_STATUS: NOT_READY

## KNOWN CI OWNERSHIP
- Task-owned: ...
- Inherited: reference `.ai/manager/KNOWN_CI_DEBT.md` IDs or NONE.

## ACCEPTANCE CRITERIA
...

## VALIDATION PLAN
...

## NEXT ACTION
...
```

Semantics:
- `STANDARD_CHAT_HIGH` is default; `WORK_MODE` requires substantial autonomous-execution value.
- `FULL_REFRESH` requires a reason.
- `BOUNDED_REMEDIATION_REFRESH` is only for accepted/published same-task remediation.
- `MANAGER_VERDICT` remains PENDING until Manager independently accepts/rejects the result.
- Merge state does not imply acceptance or audit completion.
- Material control-plane work requires a fresh independent workflow audit before CLOSED.
