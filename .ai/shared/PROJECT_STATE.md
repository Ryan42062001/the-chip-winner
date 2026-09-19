# The Chip Winner — Canonical Project State

Last reconciled: 2026-09-18
Operating state: Trade Analyzer remediation deployed/audit-ready + Workflow V3.2 parity integration + Release 1.0 field gate event-waiting

## Repository / workflow
- Repository: `Ryan42062001/the-chip-winner`
- Default branch: `master`
- V3.2 candidate overlay: `.ai/shared/WORKFLOW_V3_2.md`
- Active machine state: `.ai/shared/ACTIVE_TASKS.json`
- Field authority: `config/field-validation.json`

TCW-026 is a material control-plane upgrade. Its exact integrated target must receive a fresh independent workflow/control-plane audit before TCW-026 may close.

## Product boundary
The Chip Winner remains an ESPN-only, read-only, in-season fantasy-football decision companion. ESPN owns connected-league state. External rankings/projections remain separate overlays. Derived recommendations do not mutate source snapshots. ESPN write actions remain out of scope.

## Trade Analyzer v1
TCW-022 Strategy is accepted.

TCW-023 initial production implementation was independently audited under TCW-024 and returned FAIL on four bounded findings.

TCW-025 remediated those findings and is now integrated/deployed:
- Builder PR #113 final head: `368a601046df1d4de2f477936f4ac5598e5de753`
- integration master: `7bb690429ad5b829e36e5d464ae9d7e74cc77ce0`
- master workflow #571: full tests/model/browser/a11y/mobile/security PASS
- GitHub Pages deployment PASS
- production smoke PASS

TCW-025 remains AUDIT_READY until a fresh Independent Auditor retests TCW-024-F01 through F04. No Level-4 private ESPN evidence is fabricated or implied.

## Workflow V3.2 parity upgrade
TCW-026 implements applicable maturity from The War Room and Family Finance Hub:
- two-mode credit-efficient execution;
- Fast/Bounded/Full refresh discipline;
- active-only state, blocker/user-action metadata, write scopes and concurrency collision checks;
- Manager Integration Records and TCW_TASK_V2;
- execution packets, decision consumption, audit readiness/frozen targets;
- transition and user-action helpers;
- integration queue / known CI debt;
- full-workforce Next Activation dashboard;
- fail-closed docs-only PR CI fast path with predecessor continuity and evidence artifacts;
- material control-plane audit gate;
- standing bounded workflow-improvement authority.

Project-specific scoring-authority, financial reconciliation, Supabase, or draft-only machinery is intentionally excluded.

## Release 1.0
Field registry remains **10 passed / 1 pending**.

Sole pending item:
- `FV-SEASON-01 — Real playoff and bye intelligence states`

It requires genuine qualifying season state and must not be manufactured.

Removed from Release 1.0 scope rather than falsely passed:
- FV-A11Y-02 under TCW-D012
- custom FLEX/OP/Superflex field certification under TCW-D013
