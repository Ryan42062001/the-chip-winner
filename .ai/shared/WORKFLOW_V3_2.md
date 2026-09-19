# Workflow V3.2 — Efficiency, Determinism & Auditability Overlay

Status: CANONICAL ON MERGE / MATERIAL CONTROL-PLANE AUDIT REQUIRED BEFORE TCW-026 CLOSURE
Owner: Manager / Architect
Task: TCW-026
Base: `.ai/shared/WORKFLOW_V3_1.md` + `.ai/shared/WORKFLOW.md`

This overlay ports the workflow improvements that materially apply to **The Chip Winner** from the newer War Room and Family Finance Hub operating models. Repository state remains authoritative over chat memory. Where this overlay conflicts with V3/V3.1 routing or execution guidance, V3.2 controls.

It does **not** import project-specific controls that have no The Chip Winner analogue, including War Room protected historical-scoring authority/receipt machinery or Family Finance Hub financial reconciliation rules.

## 1. Two execution modes only

Forward-looking tasks use exactly:

- `STANDARD_CHAT_HIGH` — default.
- `WORK_MODE` — only when substantial autonomous computer/tool execution materially reduces user interaction or execution overhead.

For every assignment ask:

> Does autonomous computer/tool execution materially reduce user interaction or execution overhead compared with STANDARD_CHAT_HIGH?

If NO, use `STANDARD_CHAT_HIGH`. If YES and the execution burden is substantial, use `WORK_MODE`. If marginal or uncertain, use `STANDARD_CHAT_HIGH`.

Importance, difficulty, code scope, file count, GitHub use, architecture complexity, or High reasoning alone do not justify Work mode.

A Standard Chat worker may return `WORK_MODE_ESCALATION_RECOMMENDED` with exact task/branch/SHA/PR, completed work, remaining work, execution-heavy reason, files/components, tests/failures, required validation, and exact next action.

A Work worker returns `STANDARD_CHAT_HIGH_HANDOFF_RECOMMENDED` once remaining work is primarily reasoning, review, audit, architecture, documentation, or routing. Preserve branch/SHA/PR/evidence; do not restart.

## 2. Refresh modes

`FAST_REFRESH` is the default for routine status, task startup, task creation/activation, continuation, Manager routing, most merges, and assigned audits when the minimum authoritative context is sufficient.

Minimum normal context:
1. current `master` SHA;
2. `.ai/shared/ACTIVE_TASKS.json`;
3. role charter;
4. assigned task spec;
5. current role handoff;
6. explicitly named accepted upstream artifacts;
7. exact branch/PR/test/CI/runtime evidence needed by the task.

`BOUNDED_REMEDIATION_REFRESH` is allowed only for an explicitly bounded same-task remediation after a published/accepted finding. Load the finding, affected implementation/tests, current branch/PR/SHA, required preserved behavior, and only enough upstream authority to prevent semantic drift.

`FULL_REFRESH` is exceptional and requires a non-empty `refresh_reason`. Use it only when Fast Refresh cannot establish authoritative state, control-plane state is contradictory, a major workflow/control-plane reconciliation genuinely needs broad context, milestone/integration risk warrants it, or an audit cannot be responsibly bounded.

Importance alone is not a Full Refresh reason.

## 3. Active-only machine state, blocker semantics, and task schema

`.ai/shared/ACTIVE_TASKS.json` uses schema version 3 and is active-only. CLOSED history belongs in task specs, PRs, evidence, handoffs, decisions, commits, and Git history.

Every active task records:
- `task_id`, `title`, `owner`, `status`, `dependency`;
- `execution_mode` and `refresh_mode`;
- `refresh_reason` when Full Refresh is used;
- `merge_authority: "Manager"`;
- `blocker_type`;
- `user_action_required`;
- `blocked_on_tasks`;
- human-readable `blocked_on`;
- `assignment_master_sha`;
- branch/PR/checkpoint metadata;
- `worker_slot` when useful;
- `allowed_path_prefixes` and `forbidden_path_prefixes`;
- `audit_required`;
- `post_merge_canary_required`;
- exact next gate.

Canonical blocker types:
- `NONE`
- `USER_ACTION`
- `UPSTREAM_TASK`
- `EXTERNAL_SERVICE`
- `EXTERNAL_EVIDENCE`
- `TECHNICAL`
- `AUDIT`

`BLOCKED` and `REWORK_REQUIRED` require a non-`NONE` blocker. `user_action_required: true` means the user is genuinely the next gate, not merely that a worker has not tried an available technical path.

New meaningful tasks use `.ai/manager/TASK_TEMPLATE.md` and `Schema: TCW_TASK_V2`. Historical closed task files are not mass-rewritten merely to adopt V3.2.

## 4. Manager Integration Record

Every new `TCW_TASK_V2` task carries a compact Manager Integration Record:

- `PRODUCTION_SHA`
- `VALIDATED_CI`
- `HANDOFF_SHA`
- `INTEGRATION_SHA`
- `MANAGER_VERDICT`
- `AUDIT_STATUS`

These fields are distinct. Worker readiness is not Manager acceptance. A merged PR is not Manager acceptance. An integrated checkpoint is not automatically audit-complete.

Verification-only/control-plane tasks may use explicit `N/A — <reason>`.

## 5. Same-role concurrency and write-collision safety

A durable role is not a single-worker lock. Manager may activate multiple task-scoped chats for the same role when lanes are independent or safely soft-dependent, branches are dedicated, write surfaces and integration order are controlled, and independence rules are preserved.

The workflow audit fails closed on:
- duplicate active Task IDs;
- duplicate branch claims;
- duplicate owned PRs;
- duplicate worker slots;
- dependency cycles;
- unsafe write-prefix overlap between simultaneously runnable tasks that are not explicitly serialized.

Use `allowed_path_prefixes` and `forbidden_path_prefixes` to make write ownership inspectable. If two runnable lanes overlap, narrow scope or serialize with an explicit HARD dependency rather than bypassing the check.

## 6. Manager execution packet and decision consumption

Before routing implementation/remediation, Manager should provide whenever practical:

Task ID; exact role; execution mode; refresh mode; refresh reason if Full; canonical base branch/SHA; assigned branch; expected PR if known; approved scope; forbidden scope; accepted upstream decisions; exact artifacts to read; implementation requirements; acceptance criteria; required tests; CI expectations; known blockers; completion definition; and handoff destination.

Workers should not rediscover information Manager already knows.

Accepted Strategy/R&D/Manager policy artifacts are downstream inputs, not invitations to re-litigate. Contradictory evidence routes back to the owning role/Manager; workers do not silently redefine accepted semantics.

## 7. Audit readiness and frozen audit packets

Do not launch formal independent audit until implementation is reasonably complete and self-validated.

Before Manager freeze, the implementer normally:
- finishes approved scope;
- runs required tests/lint/build/browser checks as applicable;
- resolves expected failures;
- inspects the full diff;
- verifies no unrelated changes;
- updates implementation evidence;
- publishes one final candidate SHA.

`npm run workflow:audit-readiness -- --task TCW-###` is a mechanical preflight, not an audit verdict.

For high-impact audits, use `.ai/audit/AUDIT_PACKET_TEMPLATE.md`. Freeze the exact target task/PR/branch/SHA, changed files, accepted requirements, CI, prior findings, known CI debt, forbidden scope, and validation-level boundary. An Auditor must not silently switch target SHA.

Active Auditor assignments must carry exact target metadata in the registry when that target is known.

Independent Auditor chats remain fresh even when same-role chat reuse is otherwise allowed.

## 8. Manager transition helper

`npm run workflow:transition` is a dry-run-by-default helper for Manager-owned registry changes.

It may prepare/apply bounded state metadata changes and remove completed tasks from the active-only registry, but removal is fail-closed. A task may be removed only from the final `VERIFYING_MASTER` lifecycle point after machine state records explicit closeout evidence: Manager acceptance, an exact integration SHA, successful post-merge/master verification with a run ID, an accepted independent audit verdict when `audit_required` is true (or explicit `NOT_APPLICABLE` otherwise), and successful canary verification when `post_merge_canary_required` is true (or explicit `NOT_APPLICABLE` otherwise).

The helper:
- never merges a PR;
- never issues an Auditor verdict;
- never bypasses validation;
- remains dry-run by default;
- rolls back an applied registry write byte-for-byte if static workflow validation fails.

Manager remains the authority for transitions and for recording the closeout evidence consumed by the helper.

## 9. User-action queue

`npm run workflow:user-actions` derives the user-action queue from machine state. Do not maintain a second manual list.

A task appears only when `user_action_required` is true. Event-gated evidence may remain idle/blocked without inventing a user action.

## 10. Integration queue and known CI debt

Manager maintains:
- `.ai/manager/INTEGRATION_QUEUE.md` — accepted/ready integration candidates and ordering.
- `.ai/manager/KNOWN_CI_DEBT.md` — stable inherited CI failures with `CI-###` IDs, exact failure identity, ownership basis, last verified checkpoint, and closure gate.

Known debt never excuses a new or changed failure. Re-attribute when failure identity changes.

## 11. Credit-efficient CI fast path with durable evidence

The workflow job/check remains always present.

For pull requests only, CI may classify a change as `DOCS_ONLY` when **every** changed path is:
- root-level `*.md`;
- `.ai/**/*.md`;
- `docs/**/*.md`.

Everything else is `FULL`.

Fail closed to FULL for:
- source/tests/scripts/config/package/lock/workflow files;
- any `.ai` non-Markdown machine-state file;
- mixed documentation + non-documentation changes;
- unknown/malformed status;
- rename ambiguity;
- empty/unparseable diff;
- missing/invalid SHAs;
- classifier failure;
- unsupported PR action;
- manual dispatch;
- every `master` push.

The verify/test job must always exist. Do not use workflow-level `paths-ignore` or a job-level condition that removes the check.

A docs-only `synchronize` event may skip expensive application validation only when the immediately preceding PR head has a successful same-PR `Deploy website` run. This predecessor-continuity rule prevents a final handoff/docs commit from hiding an unvalidated earlier code change.

Every run records durable evidence:
- mode/reason;
- changed paths;
- base/head/tested SHA;
- run identity;
- predecessor proof when required;
- stage outcomes;
- captured stage logs where run.

Artifacts are evidence, not a replacement for exit codes.

## 12. Chat reuse and worker spawn cost

A new Task ID does not itself require a fresh chat.

Reuse a same-project/same-role chat for closely related sequential work when context remains relevant, state can be refreshed safely, and independence is not required.

Use a fresh chat when:
- independent audit requires it;
- role separation matters;
- prior context may bias the task;
- the chat is materially stale/large/confused.

Before spawning a worker, Manager asks whether another role already answered the question, whether the current chat can safely finish it, whether independence truly requires a fresh chat, whether Work/Full Refresh is actually justified, and whether context can be smaller.

Do not manufacture work to keep roles active.

## 13. Compact handoffs and full-workforce dashboard

Continuation handoffs should prefer:

`STATUS | TASK | ROLE | BRANCH | HEAD | BASE | PR | DONE | CHANGED | TESTS | CI | BLOCKERS | DECISIONS CONSUMED | NEXT ACTION | FILES / ARTIFACTS THAT MATTER | DO NOT REPEAT`

Detailed history belongs in task evidence, not every handoff.

Every meaningful employee handoff and Manager routing response ends with a `Next Activation` table containing exactly these six rows:

1. Manager / Architect
2. Implementation Engineer / Builder
3. In-Season Strategy & Decision Intelligence Analyst
4. Research & Development (R&D)
5. Independent Auditor / QA
6. Troubleshooting & Root Cause Engineer — on-demand

Minimum columns:

`Order | Employee / Role | Status | Current Task / Gate | Copy/paste activation prompt / next action`

Use truthful statuses such as `ACTIVATE NOW`, `ACTIVE`, `RECOMMEND TO MANAGER`, `WAIT`, `BLOCKED`, `IDLE`, `COMPLETE`, or `USER ACTION`.

Only Manager may use `ACTIVATE NOW`. Workers recommend Manager review rather than self-authorizing downstream work.

## 14. Material control-plane audit gate

A material workflow/control-plane change requires one fresh independent workflow/control-plane audit before its governing task may be CLOSED.

This includes changes to:
- workflow semantics/lifecycle;
- validators or machine-state rules;
- role authority/separation;
- audit/frozen-target rules;
- branch/SHA/merge/release controls;
- execution/refresh defaults;
- CI routing/classification;
- other governance behavior that changes how work is authorized, validated, audited, or integrated.

Manager freezes the exact integrated target and supplies a bounded audit packet. The Auditor uses a fresh chat in `STANDARD_CHAT_HIGH`. Green CI is evidence, not proof.

Allowed workflow-audit verdicts:
- `PASS`
- `PASS WITH NON-BLOCKING FINDINGS`
- `FAIL — REMEDIATION REQUIRED`

## 15. Standing workflow-improvement authority

The product owner authorizes Manager to implement bounded workflow/control-plane upgrades when they materially improve determinism, reliability, auditability, routing, prompt quality, state hygiene, observability, or execution efficiency.

Manager may do so without separate per-change approval when:
- in-season fantasy-football policy/behavior is unchanged;
- ESPN/read-only/product boundaries are unchanged;
- role separation, Manager authority, independent audit, CI attribution, and release gates are preserved or strengthened;
- no destructive production/external-account/security/spending action is introduced.

Crossing a protected product, data-source, security, external-account, paid-resource, or production-behavior boundary still requires the normal task/authorization path.

## 16. V3.1 safeguards preserved

V3.2 preserves V3.1:
- `WAITING_EXTERNAL_EVIDENCE`;
- `VERIFYING_MASTER`;
- atomic merge -> master verification closeout;
- reproduced-defect fast lane;
- verification matrices;
- duplicate Task-ID PR control;
- target-advancement classification;
- Manager-only merge authority/provenance handling;
- field-validation separation;
- control-plane-only deploy skipping.

Release 1.0 remains independently gated by `config/field-validation.json`. `FV-SEASON-01` still requires genuine season evidence and must not be manufactured.
