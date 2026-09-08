# The Chip Winner — Canonical Roadmap

Last reconciled: 2026-09-08
Manager task: TCW-006 — blocked recovery-field reconciliation

## Current milestone

### M1 — Release 1.0 trustworthy read-only companion

Status: ACTIVE — FIELD VALIDATION

The reviewed deterministic implementation baseline remains substantially complete. Remaining milestone work is evidence-backed field validation and final release gating, not broad feature expansion.

### Remaining Release 1.0 blockers

Pending field checks from `config/field-validation.json` remain:

1. FV-A11Y-02 — screen-reader critical workflow.
2. FV-ESPN-02 — authenticated custom FLEX/OP league.
3. FV-ESPN-04 — authenticated IR edge states.
4. FV-ESPN-05 — authenticated lock/availability transitions.
5. FV-SEASON-01 — real playoff and bye intelligence states.
6. FV-RECOVERY-01 — live ESPN/session/network failure and reconnect.
7. FV-WAIVER-01 — real waiver candidate volume and timing.

Field gate remains **6 passed / 7 pending**.

## Completed coordination sequence

1. TCW-001 — canonical `.ai` workflow bootstrap — COMPLETE.
2. TCW-PW-001 — independent Auditor/R&D evidence wave — COMPLETE.
3. TCW-002 — Release 1.0 baseline audit — COMPLETE, `PASS WITH NON-BLOCKING FINDINGS`.
4. TCW-003 — ESPN field-validation feasibility research — COMPLETE.
5. TCW-004 — evidence-wave integration and source-of-truth reconciliation — COMPLETE at `2ef036eb02efd6600049d91f2f076c0f3a633a1b`, workflow #421 passed.
6. TCW-005 — recovery/reconnect Auditor execution attempt — COMPLETE FOR THAT ATTEMPT, `INCONCLUSIVE / BLOCKED`; handoff merged through PR #58 at `748aed086de038cdd627d3cefb433c7bc1458761`.

## Current Manager task

### TCW-006 — Reconcile Blocked Recovery Field Attempt

Role: Manager / Architect
Status: ACTIVE until its protected PR and post-merge production verification pass.

Objective: record the TCW-005 blocked result accurately, preserve FV-RECOVERY-01 as pending, document the external evidence prerequisite, and avoid assigning work that cannot execute in the available specialist environments.

## TCW-005 status after reconciliation

### FV-RECOVERY-01 Live Failure/Reconnect Validation

Field task status: **BLOCKED — awaiting user-operated local field evidence**.

The Auditor could not access the user's authenticated Chrome/ESPN session, Chrome companion runtime, or OS/device network controls, so it correctly refused to infer a PASS/FAIL field result from repository code.

Required external evidence is limited to privacy-safe observations of:

- successful authenticated Refresh ESPN baseline;
- source/capture/freshness labels;
- a temporary OS/device network disconnect while the page remains open;
- failed Refresh ESPN result/message after normal cooldown;
- retained snapshot usability and exact post-failure source/freshness/error labels;
- safe navigation without sample fallback;
- restored network and successful reconnect/refresh;
- OS/browser/version and deployed checkpoint when known.

No private league/player/member identifiers, credentials, cookies, raw payloads, or private URLs are required.

When this evidence exists, re-activate Auditor under TCW-005 for an independent verdict. Do not activate Builder unless the field cycle reproduces a deterministic defect.

## Next evidence opportunities

These remain legitimate but are not active specialist assignments until their real prerequisites exist:

- FV-ESPN-05 — next real game-lock or availability transition across authenticated refreshes.
- FV-ESPN-02 — an existing authenticated materially custom OP/superflex-style league.
- FV-ESPN-04 — naturally occurring IR edge states.
- FV-SEASON-01 — playoff/bye/opponent/future-projection evidence as real season state permits.
- FV-WAIVER-01 — aggregate enumeration counts and responsiveness when real projection coverage/observation permits.
- FV-A11Y-02 — a real screen-reader critical workflow with browser/AT versions.

No new parallel specialist wave is justified now. Repeating tasks in environments that lack their required controls would not advance the evidence gate.

## Immediate dependency order

1. Complete TCW-006 protected reconciliation and post-merge verification.
2. Obtain the user-operated privacy-safe TCW-005 field observations.
3. Re-activate Auditor under TCW-005 to judge those observations.
4. If the verdict is `FAIL — REPRODUCED DEFECT`, route a narrow Builder remediation and require independent field retest after merge.
5. If the verdict supports pass, integrate privacy-safe evidence/status through a separate protected field-registry change.
6. Continue the other pending field checks when their genuine prerequisites become available.
7. Run the final Release 1.0 PR/master production gate only after all field checks pass.
8. Perform Roadmap Discovery before authorizing any successor milestone.

## Release 1.0 exit gate

Release 1.0 may be declared only when:

- every field-validation item is passed with privacy-safe evidence;
- no unresolved high-severity accessibility, privacy, security, ESPN-normalization, waiver-legality, or season-planning defect remains;
- the exact final release PR head passes the protected test job;
- after merge, `master` passes test, deploy, and production verification;
- the product remains read-only.

## Post-1.0 roadmap discovery

No successor milestone is automatically authorized by Release 1.0 completion. Manager must perform Roadmap Discovery using current capabilities, open findings, product vision, specialist evidence, and operational reliability.

A valid conclusion remains:

`NO SUCCESSOR MILESTONE CURRENTLY JUSTIFIED.`

## Gated candidate areas

Not active requirements:

- trade analysis;
- external injury/news and notifications;
- future-only IR-assisted stash discovery;
- playoff qualification/championship probability modeling;
- server-side model integrations;
- ESPN write actions.
