# The Chip Winner — Canonical Roadmap

Last reconciled: 2026-09-08
Manager task: TCW-004 — evidence-wave integration

## Current milestone

### M1 — Release 1.0 trustworthy read-only companion

Status: ACTIVE — FIELD VALIDATION

The deterministic implementation baseline for the reviewed Release 1.0 scope remains substantially complete. The primary remaining milestone work is evidence-backed field validation and final release gating, not broad feature expansion.

### Remaining Release 1.0 blockers

Pending field checks from `config/field-validation.json` remain:

1. FV-A11Y-02 — screen-reader critical workflow.
2. FV-ESPN-02 — authenticated custom FLEX/OP league.
3. FV-ESPN-04 — authenticated IR edge states.
4. FV-ESPN-05 — authenticated lock/availability transitions.
5. FV-SEASON-01 — real playoff and bye intelligence states.
6. FV-RECOVERY-01 — live ESPN/session/network failure and reconnect.
7. FV-WAIVER-01 — real waiver candidate volume and timing.

Field gate remains **6 passed / 7 pending**. TCW-002 and TCW-003 produced audit/research evidence but did not pass or fail any pending field item.

## Completed evidence wave — TCW-PW-001

Status: COMPLETE when TCW-004 reconciliation merges.

- `TCW-002` — Independent Release 1.0 baseline audit — Auditor / QA — COMPLETE, `PASS WITH NON-BLOCKING FINDINGS`, merged through PR #54.
- `TCW-003` — ESPN field-validation feasibility research — R&D — COMPLETE, authoritative handoff merged through PR #56.
- Duplicate TCW-003 PR #55 was closed unmerged as superseded.

Accepted evidence-wave conclusions:

- The v0.9.88 Release 1.0 baseline is defensible at the audited validation level.
- The seven remaining field checks are genuine real-world evidence blockers, not proof that closed deterministic scope is missing.
- `AGENTS.md` source-of-truth wording required reconciliation with the canonical `.ai/shared/*` workflow; TCW-004 owns that documentation fix.
- Recovery/reconnect is the strongest immediately executable field check.
- Lock/availability validation is time-windowed around a naturally relevant transition.
- Custom OP/FLEX requires materially different authenticated league state.
- IR and deeper season evidence are opportunity/season dependent.
- Waiver scale evidence may require aggregate-only observation support; no waiver-policy change is justified merely to gather metrics.

## Active next task

### TCW-005 — FV-RECOVERY-01 Live Failure/Reconnect Validation

Role: Independent Auditor / QA
Status: ACTIVE after TCW-004 merges
Dependency: TCW-004 canonical integration only

Objective: exercise one real deployed authenticated ESPN refresh failure caused by a temporary client network disconnect, verify that the last valid snapshot survives with honest source/freshness labeling, restore connectivity, and verify a successful reconnect/refresh.

This task is evidence gathering, not production implementation. If it reproduces a deterministic defect, Manager will route a separate Builder remediation task and require field retest before FV-RECOVERY-01 can pass.

## Next evidence opportunities after TCW-005

These are legitimate queued opportunities but are **not simultaneously activated specialist assignments**:

- FV-ESPN-05: use the next naturally relevant pre/post-kickoff or availability transition. Current 2026 Week 1 schedule provides near-term observation windows, but no recommendation/player state should be manufactured solely for the check.
- FV-ESPN-02: locate an existing authenticated ESPN LM league with a materially custom OP/superflex-style configuration.
- FV-ESPN-04: collect naturally occurring IR edge evidence as real status/capacity states arise.
- FV-SEASON-01: accumulate playoff/fallback, real bye, opponent, and future-projection evidence as season/source state permits.
- FV-WAIVER-01: capture aggregate enumeration counts and responsiveness when real projection coverage allows; use a separately approved observation aid only if needed.
- FV-A11Y-02: run the critical workflow with a real screen reader when a suitable assistive-technology environment is available.

No parallel specialist wave is created at this point because only TCW-005 has an immediately executable, fully defined specialist assignment with known prerequisites. IDLE remains preferable to manufacturing work.

## Ongoing seasonal evidence work

- Accumulate real weekly projection publications through the guarded one-click workflow.
- Preserve explicit provider IDs, source provenance, scoring compatibility, and complete-coverage gates.
- Use real authenticated ESPN states to validate already-complete waiver and season behavior.
- Convert reproducible defects into sanitized regression coverage where practical.

## Immediate dependency order

1. TCW-001 — bootstrap canonical `.ai` workflow — COMPLETE.
2. TCW-PW-001 — Auditor/R&D evidence wave — COMPLETE after TCW-004 reconciliation.
3. TCW-004 — integrate evidence wave, reconcile canonical authority, and route next field task — COMPLETE when its protected PR and post-merge production gate pass.
4. TCW-005 — perform live recovery/reconnect field validation.
5. If TCW-005 fails because of a reproduced deterministic defect, route Builder remediation and require Auditor field retest; otherwise integrate passing field evidence through the protected workflow.
6. Continue remaining real-world field checks as their actual prerequisites become available.
7. Run final Release 1.0 PR/master production gate only after all field checks pass.
8. Perform Roadmap Discovery before authorizing a successor milestone.

## Release 1.0 exit gate

Release 1.0 may be declared only when:

- every field-validation item is passed with privacy-safe evidence;
- no unresolved high-severity accessibility, privacy, security, ESPN-normalization, waiver-legality, or season-planning defect remains;
- the exact final release PR head passes the protected test job;
- after merge, `master` passes test, deploy, and production verification;
- the product remains read-only.

## Post-1.0 roadmap discovery

No successor milestone is automatically authorized by completion of Release 1.0.

After the field gate closes, Manager must perform Roadmap Discovery using current capabilities, open findings, product vision, R&D evidence, Strategy evidence where appropriate, and operational reliability. A valid conclusion is:

`NO SUCCESSOR MILESTONE CURRENTLY JUSTIFIED.`

If a successor is justified, it must be explicitly scoped and approved before implementation begins.

## Gated candidate areas

These are not active requirements:

- trade analysis;
- external injury/news and notifications;
- future-only IR-assisted stash discovery;
- playoff qualification/championship probability modeling;
- server-side model integrations;
- ESPN write actions.

Each requires its own reviewed requirements, evidence, safety boundaries, and acceptance criteria before authorization.