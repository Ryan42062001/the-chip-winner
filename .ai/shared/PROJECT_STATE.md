# The Chip Winner — Canonical Project State

Last reconciled: 2026-09-18
Operating state: Workflow V3.2 integrated / independent audit pending + Trade Analyzer remediation deployed / independent retest pending + Release 1.0 season gate waiting

## Repository / workflow
- Repository: `Ryan42062001/the-chip-winner`
- Default branch: `master`
- Current integrated Workflow V3.2 target: `4e737f5f0b4cc5f3825f5c12ec4e5dccaf65c4f4`
- Active machine state: `.ai/shared/ACTIVE_TASKS.json`
- Field authority: `config/field-validation.json`

TCW-026 is integrated and production-verified but not closed. TCW-027 must independently audit the exact integrated V3.2 target before final canonical closure.

## Workflow V3.2 integration evidence
- source PR #114
- final source head `4a511c99f3726bd9c39be0ec9080320072e64661`
- PR run #576 / `35418225147`: FULL PASS
- integrated master `4e737f5f0b4cc5f3825f5c12ec4e5dccaf65c4f4`
- master run #577 / `35418315839`: full CI PASS, Pages deploy PASS, production smoke PASS
- fresh control-plane audit: TCW-027 ASSIGNED

V3.2 includes credit-efficient execution/refresh routing, active-only state determinism, blocker/user-action metadata, collision safety, Manager integration/audit tooling, transition/user-action helpers, integration/CI-debt queues, six-role routing visibility, and fail-closed docs-only CI with durable evidence.

Non-applicable War Room protected-scoring/draft machinery and Family Finance Hub financial/Supabase controls remain excluded.

## Product boundary
The Chip Winner remains an ESPN-only, read-only, in-season fantasy-football decision companion. ESPN owns connected-league state. External rankings/projections remain separate overlays. Derived recommendations do not mutate source snapshots. ESPN write actions remain out of scope.

## Trade Analyzer v1
TCW-025 remediation is integrated/deployed at `7bb690429ad5b829e36e5d464ae9d7e74cc77ce0`; master #571 passed full CI/Pages/production. It remains AUDIT_READY for a separate fresh F01-F04 retest.

## Release 1.0
Field registry remains **10 passed / 1 pending**.

Sole pending item:
- `FV-SEASON-01 — Real playoff and bye intelligence states`

It requires genuine qualifying season state and must not be manufactured.

Removed from Release 1.0 rather than falsely passed:
- FV-A11Y-02 under TCW-D012
- custom FLEX/OP/Superflex field certification under TCW-D013
