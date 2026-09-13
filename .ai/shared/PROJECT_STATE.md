# The Chip Winner — Canonical Project State

Last reconciled: 2026-09-12
Current operating state: Release 1.0 field validation / TCW-005 recovery retest waiting on external evidence

## Repository

- Repository: `Ryan42062001/the-chip-winner`.
- Default branch: `master`.
- Package: v0.9.88.
- TCW-009 remediation merged via PR #67 at `267b44e7ccea02b903938ead2ee4658d60c2d20b`; master workflow #444 passed test, deploy, and production verification.
- Workflow V3.1 merged via PR #68 at `86f1fadfb071f811d681de9244899a8abc2957e5`; master workflow #448 passed test, deploy, and production verification.
- Workflow V3.1 is canonical through `.ai/shared/WORKFLOW_V3_1.md` over the V3 base workflow.

## Product boundary

The Chip Winner remains an ESPN-only, read-only, in-season fantasy-football decision companion. ESPN is authoritative for connected-league state. External rankings/projections remain independent overlays. Derived recommendations do not mutate source snapshots. ESPN write actions remain outside Release 1.0.

## Release 1.0 field gate

Status: ACTIVE — FIELD VALIDATION / RECOVERY RETEST.

`config/field-validation.json` remains authoritative at **6 passed / 7 pending**.

Passed: FV-A11Y-01, FV-A11Y-03, FV-MOBILE-01, FV-ESPN-01, FV-ESPN-03, FV-SYNC-01.

Pending: FV-A11Y-02, FV-ESPN-02, FV-ESPN-04, FV-ESPN-05, FV-SEASON-01, FV-RECOVERY-01, FV-WAIVER-01.

FV-RECOVERY-01 previously produced `FAIL — REPRODUCED DEFECT` under TCW-005. TCW-009 is now merged, deployed, and production-verified, but the field item remains pending until the same real failure/reconnect sequence is independently retested against the deployed remediation.

## Current coordination

`.ai/shared/ACTIVE_TASKS.json` is the machine-authoritative operational registry.

- TCW-005 — Auditor — `WAITING_EXTERNAL_EVIDENCE`. The required next input is a real deployed authenticated network disconnect/reconnect retest with privacy-safe observations.
- TCW-009 — Builder — `AUDIT_READY`. Implementation is merged/deployed; no further Builder work is authorized unless the independent retest reproduces another deterministic defect.
- Manager — ACTIVE/event-driven for Release 1.0 field-gate orchestration.
- Builder — IDLE.
- Auditor — waiting on external evidence for TCW-005.
- R&D — IDLE.
- In-Season Strategy — IDLE.
- Troubleshooting & Root Cause — IDLE/not instantiated.

## Workflow V3.1

Workflow V3.1 adds the machine-authoritative active-task registry, `WAITING_EXTERNAL_EVIDENCE`, `VERIFYING_MASTER`, atomic merge-to-verification closeout, reproduced-defect fast lane, verification matrices, PR/task supersession controls, assignment-staleness classification, and `npm run audit:workflow` enforced through the existing `npm test` CI gate.

## Completed coordination

TCW-001, TCW-002, TCW-003, TCW-004, TCW-006, TCW-007, TCW-008, and TCW-010 are closed. TCW-005 remains open for the independent recovery retest. TCW-009 remains `AUDIT_READY` until that retest completes.

## Remaining gated work

Other Release 1.0 checks still require their real prerequisites: screen-reader validation, a custom FLEX/OP league, natural IR edge states, real lock/availability transitions, seasonal playoff/bye states, and waiver enumeration/timing evidence.

Post-1.0 Roadmap Discovery input remains recorded in `.ai/shared/ROADMAP.md` and `docs/post-1.0-roadmap-candidates.md`. No successor milestone is authorized.
