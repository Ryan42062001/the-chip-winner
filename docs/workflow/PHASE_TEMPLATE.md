# Speed Workflow V2.1 — Phase Template

## Active phase

```markdown
# Current Phase

State: PLANNED

## Identity
- Phase: [ID — name]
- Product owner: Ryan
- Phase branch: [phase/...]
- Activation baseline: [SHA]
- Risk: LOW | MEDIUM | HIGH
- Production deployment: NOT AUTHORIZED unless explicitly changed

## Objective
[One coherent outcome.]

## Scope
- [in scope]

## Non-goals
- [deferred]

## Ordered implementation objectives
1. [objective]

## Acceptance criteria
- [testable outcome]

## Required automated validation
- FAST CI: [...]
- FULL PHASE CI: [...]

## Human preview requirements
- [...]

## Owner-only verification
- [manual/device/provider check, or "None required."]

## Exit criteria
- Preview approved.
- Phase Sync complete.
- Exact-candidate validation complete.
- Required audit/audit-skip complete.
- Ryan authorizes merge.
- Closure Sync + closure FAST complete.

## Stop conditions
- [...]
```

## CLOSED phase

```markdown
# Current Phase

State: CLOSED

## Identity
- Phase: [ID — name]
- Product owner: Ryan
- Risk: LOW | MEDIUM | HIGH
- Final immutable audited target: [SHA] # or LOW-risk skip target
- Merge commit / canonical master at merge: [SHA]
- Post-merge FAST CI: [run/job — SUCCESS]
- Closure Sync FAST CI: [run/job — SUCCESS]
- Final audit disposition: [PASS / LOW-risk SKIPPED with rationale]
- Next planned phase: [ID — name]
- Production deployment: [AUTHORIZED / NOT AUTHORIZED]

## Closure evidence
- [...]

## Stop conditions
[Persistent boundaries.]

## Phase metrics
- Builder activations:
- Product Owner/manual assists:
- CI failures requiring implementation repair:
- Audit findings:
- Remediation/re-audit cycles:
- Credit-saving owner/admin assists:
```

After Phase Sync, keep transient evidence in PR comments rather than evidence-only commits.
