# Active Assignments

Last updated: 2026-09-12
Fast-path registry: `.ai/shared/ACTIVE_TASKS.json`
Workflow overlay: `.ai/shared/WORKFLOW_V3_1.md`

## Completed coordination

- TCW-001 — canonical `.ai` workflow bootstrap — COMPLETE.
- TCW-002 — independent Release 1.0 baseline audit — COMPLETE / PASS WITH NON-BLOCKING FINDINGS.
- TCW-003 — ESPN field-validation feasibility research — COMPLETE.
- TCW-004 — evidence-wave integration/canonical authority reconciliation — COMPLETE.
- TCW-006 — blocked recovery-field reconciliation — CLOSED.
- TCW-007 — Workflow V3 operating upgrade — CLOSED.
- TCW-008 — post-1.0 roadmap candidate sequencing — CLOSED.
- TCW-010 — Workflow V3.1 coordination hardening — CLOSED after PR #68 merge at `86f1fadfb071f811d681de9244899a8abc2957e5` and successful master workflow #448 verification.

## TCW-005 — FV-RECOVERY-01 Live Failure/Reconnect Validation

Role: Independent Auditor / QA
Current state: `WAITING_EXTERNAL_EVIDENCE`
Latest field verdict: FAIL — REPRODUCED DEFECT before remediation
Auditor PR: #65

The accepted recovery defect has been remediated and deployed by TCW-009. The next required input is external/user-operated: repeat the authenticated network disconnect/reconnect sequence against the deployed site and provide privacy-safe observations of retained-data labeling, failure guidance, navigation persistence, and successful reconnect.

After that evidence exists, re-activate Auditor under TCW-005 for the independent verdict. Do not change `config/field-validation.json` directly from the Auditor task.

## TCW-009 — Recovery State Honesty Remediation

Role: Implementation Engineer / Builder
Status: `AUDIT_READY`
Task: `.ai/manager/tasks/TCW-009.md`
Builder PR: #67
Merged checkpoint: `267b44e7ccea02b903938ead2ee4658d60c2d20b`
Post-merge workflow #444: test, deploy, and production verification PASS.

Builder implementation is complete. No further Builder work is authorized unless TCW-005 independently reproduces another deterministic defect.

## Role state

### Manager / Architect
ACTIVE / event-driven Release 1.0 field-gate orchestration and evidence integration.

### Implementation Engineer / Builder
IDLE — TCW-009 is merged/deployed and awaiting independent field retest.

### In-Season Strategy & Decision Intelligence Analyst
IDLE. No recommendation-policy uncertainty is involved.

### R&D
IDLE. No unresolved research dependency is required for the recovery retest.

### Independent Auditor / QA
WAITING_EXTERNAL_EVIDENCE — TCW-005 resumes after the user-operated deployed recovery retest.

### Troubleshooting & Root Cause Engineer
IDLE / not instantiated.

No parallel specialist wave is justified while the next recovery gate is external field evidence.
