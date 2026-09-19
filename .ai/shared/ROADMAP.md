# The Chip Winner — Canonical Roadmap

Last reconciled: 2026-09-18

## M1 — Release 1.0 trustworthy read-only companion
Status: ACTIVE — FIELD VALIDATION EVENT-GATED

Field registry: **10 passed / 1 pending**.

Sole pending field condition:
1. `FV-SEASON-01 — Real playoff and bye intelligence states`

Do not manufacture the season condition.

## Trade Analyzer v1
Status: REMEDIATION DEPLOYED — INDEPENDENT RETEST PENDING

Completed:
1. TCW-022 Strategy contract.
2. TCW-023 initial production implementation.
3. TCW-024 independent audit — FAIL with F01-F04.
4. TCW-025 bounded remediation implementation, Manager integration, full master CI, Pages deployment, and production smoke.

Current exact deployed remediation:
`7bb690429ad5b829e36e5d464ae9d7e74cc77ce0`

Next product-quality gate:
- fresh Independent Auditor retest of F01-F04.
- TCW-025 is not CLOSED before that verdict is integrated.

## Workflow / operating-system maturity
Status: TCW-026 IN PROGRESS

The product owner directed The Chip Winner to adopt all applicable workflow improvements already proven useful in The War Room and Family Finance Hub.

TCW-026 scope includes execution/refresh efficiency, active-state determinism, collision safety, Manager integration/audit tooling, full-team routing visibility, and fail-closed documentation-only CI efficiency.

TCW-026 excludes project-specific draft protected-execution machinery and Family Finance Hub financial/Supabase controls.

Exit gate:
- exact-head full CI;
- Manager integration;
- post-merge master CI/deploy/production verification;
- fresh independent workflow/control-plane audit.

## Later product discovery candidates
After current quality/control-plane gates:
1. GM Action Plan / recommendation synthesis
2. recommendation confidence + league-market intelligence
3. decision-impacting injury/news intelligence and notifications, only after trustworthy-source feasibility
4. playoff probability / championship-path modeling, only after calibrated prerequisites
5. ESPN write actions — later gated and separately authorized

Explicit product-owner direction continues to supersede older discovery ordering.
