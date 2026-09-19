# Manager / Architect Handoff

STATUS: ACTIVE
TASK: TCW-026 — Workflow V3.2 Cross-Project Parity Upgrade
ROLE: Manager / Architect
BRANCH: `manager/tcw-026-workflow-v32-parity-upgrade`
BASE: `7bb690429ad5b829e36e5d464ae9d7e74cc77ce0`
PR: pending until implementation commit

## DONE
- Compared current The Chip Winner workflow with current mature War Room and Family Finance Hub workflow/control-plane patterns.
- Selected only cross-project controls that materially apply.
- Explicitly excluded War Room protected historical-scoring authority machinery and Family Finance Hub financial/Supabase-specific controls.
- Integrated TCW-025 first so the already-green Trade Analyzer remediation would not be made stale by the workflow upgrade.
- TCW-025 merged as `7bb690429ad5b829e36e5d464ae9d7e74cc77ce0`; master #571 passed full CI, Pages deploy, and production smoke.
- TCW-025 remains AUDIT_READY for independent F01-F04 retest.

## TCW-026 TARGET
Implement Workflow V3.2:
- STANDARD_CHAT_HIGH default / WORK_MODE execution-leverage routing;
- FAST / BOUNDED_REMEDIATION / reason-gated FULL refresh;
- active-only schema v3 and stronger validator;
- blocker/user-action metadata;
- branch/PR/worker-slot/write-prefix collision checks;
- Manager execution packets and integration records;
- audit-readiness/frozen-target tooling;
- dry-run transition helper and user-action queue;
- integration queue and CI-debt registry;
- compact handoffs and six-role Next Activation dashboard;
- fail-closed docs-only CI fast path with predecessor continuity and durable evidence;
- material workflow audit gate and standing bounded workflow-improvement authority.

## BLOCKERS
None known.

## NEXT ACTION
Finish exact branch implementation, open one Manager PR, run FULL exact-head CI, inspect complete diff, merge only if clean, verify master CI/Pages/production, then freeze the exact integrated workflow target for fresh independent control-plane audit.

Trade Analyzer product retest remains separately required; do not conflate the two audit gates.
