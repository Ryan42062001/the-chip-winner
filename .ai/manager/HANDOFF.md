# Manager / Architect Handoff

HANDOFF

Task ID: TCW-018
Role: Manager / Architect
Status: WAITING_EXTERNAL_EVIDENCE — FV-ESPN-05 REAL GAME-LOCK / AVAILABILITY TRANSITION

Canonical prestage baseline: `dc1208a3199a0d2b86fe1291cd007cb2f1d7d7e2`.

Current Release 1.0 field gate:
- **9 passed / 4 pending**.
- Pending: FV-A11Y-02, FV-ESPN-02, FV-ESPN-05, FV-SEASON-01.

TCW-018 is pre-staged so the next genuine game-lock opportunity can be captured without additional setup delay.

Required field sequence:
- observe one real player shortly before a genuine ESPN lock/availability transition;
- refresh the deployed app while the player is still unlocked and show the relevant lineup/recommendation state;
- after ESPN actually locks or changes availability, refresh ESPN and the deployed app again;
- show the same relevant surface so prior advice can be evaluated for revalidation, withdrawal, qualification, or obsolescence;
- do not manufacture the state or perform a roster transaction merely to create evidence.

Task contract: `.ai/manager/tasks/TCW-018.md`.

Next gate:
- user supplies real pre/post transition recording;
- Manager records privacy-safe intake only;
- Independent Auditor / QA returns PASS CANDIDATE, FAIL — REPRODUCED DEFECT, or INCONCLUSIVE;
- Manager owns field-status integration only after an accepted PASS CANDIDATE.

ACTIVATE NOW:
- Manager / Architect — WAITING_EXTERNAL_EVIDENCE / evidence intake when received.
- Builder, Auditor, Strategy, R&D, Troubleshooting — IDLE / event-driven until evidence or a reproduced defect creates a bounded assignment.
