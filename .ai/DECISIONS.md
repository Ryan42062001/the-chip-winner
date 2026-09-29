# Current Decisions

- Ryan is Product Owner. ChatGPT acts as Manager/Architect/Planner. One Primary Codex Builder owns a coherent phase by default.
- Speed Workflow V2.1 supersedes Workflow V3.x/V4 experiments as active repository governance.
- Historical V3/V4 control-plane, role, task, audit, and evidence files are preserved under `docs/history/workflow-v3-v4/`; they are historical evidence only.
- One phase branch and one phase PR are preferred. Task-per-branch governance and per-task audit chains are retired.
- FAST CI runs on branch pushes; ordinary PR open/synchronize events do not duplicate FAST CI.
- FULL PHASE CI is deliberate through a `full-phase-ci` label event or manual full dispatch and verifies the exact PR head.
- MEDIUM/HIGH phases require one fresh independent phase audit. Eligible LOW phases may skip only with an explicit rationale.
- External/admin execution order is Manager connector → OWNER ACTION REQUIRED → Codex browser/computer-use only when justified.
- After Phase Sync, transient evidence belongs in PR comments/evidence rather than evidence-only commits.
- The three-attempt failure budget applies to the same material implementation/security/data blocker, not bookkeeping or CI-wiring mistakes.
- Production Pages deployment is separate from phase merge and requires explicit manual dispatch.
- ESPN integration remains read-only. No lineup or transaction mutation is authorized.
- Historical PR #147 / head `22838ac515152db32789e97850f25e1e4576cb82` is preserved as source evidence for the next Trade Winner phase; because it is hundreds of master commits behind, it will not be merged directly.
- Historical accepted Trade Winner concerns about viable-vs-structurally-invalid trade classification and missing/malformed kickoff evidence are carried forward into TCW-P01 acceptance criteria.
- Historical workflow/protected-release PRs remain untouched by this migration; their existence does not make them active V2.1 work.
