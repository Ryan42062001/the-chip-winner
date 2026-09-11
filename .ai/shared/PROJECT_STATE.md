# The Chip Winner — Canonical Project State

Last reconciled: 2026-09-11
Current operating state: Release 1.0 field-gate orchestration / no active implementation task

## Repository

- Repository: `Ryan42062001/the-chip-winner`
- Protected default branch: `master`
- Verified Workflow V3 integration checkpoint: `61c06843999df6a66236f352627f0fb2c29908c1`
- Package version: `0.9.88`
- TCW-007 PR #60 merged at `61c06843999df6a66236f352627f0fb2c29908c1`.
- Post-merge `master` workflow #427 passed test, deploy, and production verification.
- Workflow V3 is canonical.

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

TCW-007 changed only the AI-team control plane. It did not modify production behavior or field status.

## Completed coordination

- TCW-001 — canonical `.ai` workflow bootstrap — COMPLETE.
- TCW-002 — independent Release 1.0 baseline audit — COMPLETE / PASS WITH NON-BLOCKING FINDINGS.
- TCW-003 — ESPN field-validation feasibility research — COMPLETE.
- TCW-004 — evidence-wave integration/canonical authority reconciliation — COMPLETE.
- TCW-005 — Auditor execution attempt completed truthfully but field task remains BLOCKED awaiting local evidence.
- TCW-006 — blocked recovery-field reconciliation — CLOSED.
- TCW-007 — Workflow V3 operating upgrade — CLOSED after PR #60 merge and successful workflow #427.

## Workflow V3 operating state

The normal permanent team is:
- Manager / Architect
- Implementation Engineer / Builder
- In-Season Strategy & Decision Intelligence Analyst
- R&D
- Independent Auditor / QA

Troubleshooting & Root Cause remains temporary/on-demand.

`ROLE = DURABLE`, `CHAT = DISPOSABLE`, `TASK = UNIT OF WORK`, `REPOSITORY = MEMORY`, `MANAGER = ROUTER / INTEGRATOR`.

New meaningful tasks are classified `STANDARD_CHAT`, `WORK_MODE_PREFERRED`, or `WORK_MODE_HIGH_VALUE`; Work Mode is an accelerator, not a dependency, and preferred/high-value tasks receive a normal-chat fallback when feasible.

## Active coordination state

- Manager — effectively IDLE/event-driven for Release 1.0 field-gate orchestration.
- Auditor — IDLE/BLOCKED on TCW-005 until user-operated local recovery evidence exists.
- Builder — IDLE; no reproduced deterministic defect exists.
- R&D — IDLE; no unresolved research prerequisite currently requires it.
- In-Season Strategy — IDLE; no recommendation-policy uncertainty is active.
- Troubleshooting & Root Cause — IDLE/not instantiated.

No parallel specialist wave is justified.

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
