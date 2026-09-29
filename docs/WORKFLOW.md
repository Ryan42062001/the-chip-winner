# Speed Workflow V2.1

## Operating model

Ryan is Product Owner. ChatGPT is Manager/Architect/Planner. One Primary Codex Builder owns each phase by default. GitHub Actions provides mechanical validation. Independent audit is applied at the phase boundary according to risk.

The phase is the unit of product work and governance. Permanent AI departments, task-per-branch governance, per-task freezes, and per-task audits are retired. Historical workflow material is evidence, not active authority.

The canonical product plan is `docs/roadmap.md`. The reusable phase contract is `docs/workflow/PHASE_TEMPLATE.md`.

## Lifecycle

`PLANNED → BUILDING → PREVIEW_READY → PUNCH_LIST → FREEZE_READY → AUDITING → REMEDIATING → CLOSED`

`REMEDIATING` may return to `FREEZE_READY`. `CLOSED` is post-merge only.

Normal evidence flow:

`Build → FAST → Preview → Punch list → Owner approval → Phase Sync → FULL → Freeze → Audit/skip → Remediation/re-audit if needed → Owner merge authorization → Merge → post-merge FAST → Closure Sync → closure FAST → CLOSED`

## Phase contract

Before BUILDING, `.ai/CURRENT_PHASE.md` defines objective, scope, non-goals, ordered objectives, acceptance criteria, risk, automated validation, human preview, owner-only verification, exit criteria, and stop conditions.

Owner-only verification is not a new workflow state. Use it only for behavior automation cannot fully prove; otherwise write `None required.`

## Building and failure budget

Use one phase branch and one phase PR. Meaningful checkpoint commits are implementation checkpoints, not governance gates.

The three-attempt budget applies only to the same material implementation/security/data blocker. Documentation typos, CI wiring mistakes, stale evidence wording, or bookkeeping defects do not consume the implementation budget.

Stop earlier for credentials/secrets, destructive or uncertain operations, production changes, paid requirements without approval, out-of-phase architecture, or requirements ambiguity that materially changes behavior.

## Credit-saving execution order

For external/admin work:

1. Manager connector.
2. `OWNER ACTION REQUIRED` for a short safe manual step.
3. Codex browser/computer-use only when materially justified.

Codex effort is primarily for code, tests, migrations, builds, and reasoning-heavy debugging.

Never create a repository commit solely to trigger an external redeploy.

## Risk and audit policy

- **LOW:** ordinary styling/content/docs/simple low-impact CRUD. Independent audit may be skipped only with a recorded rationale and no material security/privacy/data-integrity/destructive/external-contract/production boundary.
- **MEDIUM:** calculations, state transformations, important business logic, persistent-domain behavior, or meaningful integration logic. One fresh independent phase audit is required.
- **HIGH:** auth/authz, permissions, destructive operations, secrets, production infrastructure, security boundaries, or other high-impact controls. One fresh independent phase audit plus focused boundary verification is required.

Findings: `BLOCKER / HIGH / MEDIUM / LOW / NIT`. BLOCKER/HIGH must be fixed. MEDIUM normally must be fixed unless explicitly deferred. LOW may be backlogged. NIT is non-blocking.

## CI

FAST CI runs on pushes and is not duplicated by ordinary PR open/synchronize events.

FULL PHASE CI is deliberate:
- apply the `full-phase-ci` PR label to trigger one labeled-event FULL run; or
- manually dispatch `phase-ci.yml` in `full` mode.

FULL CI verifies and checks out the exact PR head SHA rather than a synthetic PR merge ref.

## Preview and owner verification

At PREVIEW_READY, Ryan reviews the whole phase and provides one consolidated punch list where practical. Complete any owner-only verification before freeze.

After Phase Sync, transient evidence such as preview receipts, owner checks, hosted checks, freeze declarations, and audit dispositions belongs in PR comments/evidence rather than evidence-only commits.

## Mandatory Phase Sync

After preview approval and before FULL/freeze, update only authoritative docs made stale by the implementation. Do not mechanically churn accurate files.

A new commit after Phase Sync should reflect a real implementation, phase-contract, or durable-documentation change.

## Freeze and audit

After Phase Sync, run FULL on the intended exact candidate. If it passes, declare that SHA immutable in PR evidence.

MEDIUM/HIGH phases receive one fresh independent audit. Eligible LOW phases may record an explicit audit-skip rationale.

Accepted findings are batched where practical. Any remediation creates a new candidate and targeted re-audit; repeat affected owner-only checks.

## Merge and Closure Sync

No auto-merge. Ryan explicitly authorizes merge of the exact approved target.

After merge:
1. verify post-merge FAST;
2. record merge SHA/PR state;
3. record final audited target or LOW-risk skip;
4. mark phase CLOSED;
5. update roadmap/source-of-truth docs only where stale;
6. record next phase and lightweight metrics;
7. run closure FAST.

Normal product/workflow/infrastructure changes are PR-only. A direct-to-`master` Closure Sync is the sole docs-only bookkeeping exception.

Production deployment is separate. For this repository, Pages production deploy is manual and must be explicitly authorized.

## CLOSED contract

A CLOSED phase preserves phase/risk, final audited target or LOW-risk skip target, merge SHA, post-merge FAST, closure FAST, audit disposition/skip rationale, next phase, closure evidence, metrics, and persistent safety boundaries. The validator is state-aware and does not require the full active-phase plan once CLOSED.
