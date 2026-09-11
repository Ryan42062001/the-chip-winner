# The Chip Winner — Canonical Project State

Last reconciled: 2026-09-11
Manager task: TCW-007 — Workflow V3 operating upgrade

## Repository

- Repository: `Ryan42062001/the-chip-winner`
- Protected default branch: `master`
- Verified TCW-007 starting `master`: `a7d9d1a3f36241bd11a0cae1c9bbb66f0c0cea63`
- Package version: `0.9.88`
- TCW-006 merged through PR #59 at `a7d9d1a3f36241bd11a0cae1c9bbb66f0c0cea63`.
- Post-TCW-006 `master` workflow #425 passed test, deploy, and production verification.

## Product boundary

The Chip Winner remains an ESPN-only, read-only, **in-season** fantasy-football decision companion. ESPN is authoritative for connected-league state. External rankings/projections remain independent overlays. Derived recommendations do not mutate source snapshots. ESPN write actions remain outside Release 1.0.

## Current milestone

### Release 1.0 — trustworthy read-only companion

Status: ACTIVE — FIELD VALIDATION

The deterministic implementation baseline remains substantially complete. Current work is evidence-backed field validation and final release gating, not broad feature expansion.

## Field gate

Authoritative registry: `config/field-validation.json`.

Current verified status remains **6 passed / 7 pending**.

Passed:
- FV-A11Y-01
- FV-A11Y-03
- FV-MOBILE-01
- FV-ESPN-01
- FV-ESPN-03
- FV-SYNC-01

Pending:
- FV-A11Y-02
- FV-ESPN-02
- FV-ESPN-04
- FV-ESPN-05
- FV-SEASON-01
- FV-RECOVERY-01
- FV-WAIVER-01

TCW-007 does not modify production behavior or field status.

## Completed coordination

- TCW-001 — canonical `.ai` workflow bootstrap — COMPLETE.
- TCW-002 — independent Release 1.0 baseline audit — COMPLETE / PASS WITH NON-BLOCKING FINDINGS.
- TCW-003 — ESPN field-validation feasibility research — COMPLETE.
- TCW-004 — evidence-wave integration/canonical authority reconciliation — COMPLETE.
- TCW-005 — Auditor execution attempt completed truthfully but field task remains BLOCKED awaiting local evidence.
- TCW-006 — blocked recovery-field reconciliation — CLOSED after PR #59 merge and successful workflow #425.

## TCW-007 — Workflow V3 operating upgrade

State: IN_PROGRESS on control-plane-only branch `manager/tcw-007-workflow-v3`.

Purpose:
- adopt durable roles / disposable chats / repository memory;
- add Fast Refresh and Full Refresh;
- add Manager-owned `.ai/shared/ACTIVE_TASKS.json`;
- add compact role charters;
- classify new tasks as STANDARD_CHAT / WORK_MODE_PREFERRED / WORK_MODE_HIGH_VALUE with normal-chat fallback;
- add anti-loop temporary Troubleshooting escalation;
- make Manager event-driven;
- correct Strategy from draft strategy to **In-Season Strategy & Decision Intelligence**;
- preserve all current product behavior and Release 1.0 gates.

Execution mode: WORK_MODE_PREFERRED; normal GitHub/repository execution is the fallback and remains valid.

## Active coordination state

- Manager — ACTIVE for TCW-007 control-plane upgrade only; after completion returns to event-driven Release 1.0 orchestration.
- Auditor — IDLE/BLOCKED on TCW-005 until user-operated local recovery evidence exists.
- Builder — IDLE; no reproduced deterministic defect exists.
- R&D — IDLE; no unresolved research prerequisite currently requires it.
- In-Season Strategy — IDLE; no recommendation-policy uncertainty is active.
- Troubleshooting & Root Cause — IDLE/not instantiated.

No new parallel specialist wave is justified.

## TCW-005 external prerequisite

FV-RECOVERY-01 remains pending. Resume Auditor only after a privacy-safe real deployed authenticated sequence records:
1. successful pre-failure Refresh ESPN baseline and sanitized source/capture/freshness labels;
2. temporary OS/device network disconnect while the page remains open;
3. failed Refresh ESPN after normal cooldown and sanitized failure class/message;
4. retained snapshot usability and exact post-failure source/freshness/error labels;
5. navigation behavior without sample fallback;
6. restored network and successful reconnect/refresh with updated capture/freshness state;
7. OS/browser version and deployed checkpoint when known.

Do not include player, league, team, member, cookie, credential, raw payload, or private URL data.

## Known gated work

Other pending field opportunities remain prerequisite-dependent: screen-reader workflow, materially custom FLEX/OP league, naturally occurring IR edge state, real lock/availability transition, seasonal playoff/bye state, and waiver-scale/timing evidence.

Trade analysis, notifications, future-only IR-assisted stash discovery, playoff probability modeling, server-side models, and ESPN write actions remain gated future work.
