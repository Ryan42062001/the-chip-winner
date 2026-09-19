# The Chip Winner — Canonical Roadmap

Last reconciled: 2026-09-19

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
Status: COMPLETE — WORKFLOW V3.2 CANONICAL

TCW-026 implemented the applicable cross-project workflow improvements. TCW-027 independently audited the original integration and found F01/F02/F03. TCW-028 remediated those findings at `216b9e9030c3dc84d9e2af2b3120d1c8dbb3bee9`. TCW-029 then returned **PASS WITH NON-BLOCKING FINDINGS** on the exact repaired target.

Manager independently accepted TCW-029-F01 as LOW/non-blocking workflow debt: Markdown formatting can bypass the human-facing worker `ACTIVATE NOW` lint, but the bypass cannot mutate machine state or grant merge authority. It does not keep the V3.2 program open.

The canonical closeout sequence passed:
- repaired master #586 — full CI + Pages + production smoke;
- audit evidence master #590 — FULL PASS;
- explicit VERIFYING_MASTER closeout checkpoint #592 — FULL PASS.

TCW-026, TCW-028, and TCW-029 are closed and removed from active-only state.

## Later product discovery candidates
After the remaining Trade Analyzer quality gate and while the real-season field gate remains event-dependent:
1. GM Action Plan / recommendation synthesis
2. recommendation confidence + league-market intelligence
3. decision-impacting injury/news intelligence and notifications, only after trustworthy-source feasibility
4. playoff probability / championship-path modeling, only after calibrated prerequisites
5. ESPN write actions — later gated and separately authorized

Explicit product-owner direction continues to supersede older discovery ordering.
