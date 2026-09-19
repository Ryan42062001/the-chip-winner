# Manager / Architect Handoff

STATUS: TRADE ANALYZER V2 ROADMAP PRIORITIZED — NEXT ROUTE TCW-031
ROLE: Manager / Architect

## Product-status correction

The prior TCW-024 → TCW-025 → TCW-030 remediation/audit chain remains closed and valid for its bounded F01-F04 scope.

It did **not** establish that the Trade Analyzer worked end-to-end as a useful product. Real product-owner feedback subsequently established that the deployed Trade Analyzer is not acceptable in actual use.

Do not reopen TCW-025 or invalidate TCW-030. Instead, treat Trade Analyzer V2 as the new product program and use real deployed user acceptance as the final product-completion gate.

## Trade Analyzer V2 product priority

Canonical roadmap: `.ai/shared/ROADMAP.md`

Five target workflows:
- Evaluate Trade
- Find Me a Trade
- Target a Player
- Counter an Offer
- Shop My Players

The detailed roadmap now protects all requested capabilities, including:
- explicit trade winner/fairness result;
- relative value with separate confidence;
- do-nothing baseline;
- team-needs diagnosis;
- lineup/ROS/playoff impact;
- depth, fragility, consolidation, VORP, positional scarcity, and waiver replacement context;
- fairness band;
- manager-to-manager fit and why they may accept;
- multiple package generation;
- target explorer;
- trade finder;
- shop-my-players / preferences;
- buy-low / sell-high;
- playoff/bye fit;
- incoming-offer analysis;
- counteroffers;
- improve-this-trade;
- negotiation guidance;
- trade history / What Changed;
- later league-wide opportunity scanning.

ESPN transaction writes remain out of scope.

## Planned task sequence

1. `TCW-031 — Trade Analyzer Functional Reset + UAT Contract`
2. `TCW-032 — Trade Value + Team Needs Strategy Contract`
3. `TCW-033 — Trade Intelligence Data + ESPN Offer Research`
4. `TCW-034 — Trade Winner Engine`
5. `TCW-035 — Team Needs + Opportunity Model`
6. `TCW-036 — Trade Finder + Target Explorer + Shop My Players`
7. `TCW-037 — Incoming Offer + Counteroffer Engine`
8. `TCW-038 — Trade Center UX + History`
9. `TCW-039 — Independent Trade Intelligence Audit`
10. `TCW-040 — Real-League Trade Center UAT`

TCW-040 product-owner acceptance is required before Trade Analyzer V2 can be called COMPLETE.

## Release 1.0 field state

Field registry remains **10 passed / 1 pending**.

Sole pending field:
`FV-SEASON-01 — Real playoff and bye intelligence states`

This remains a separate genuine-season-event gate and must not be simulated or manufactured.

## Next Activation

| Order | Employee / Role | Status | Current Task / Gate | Copy/paste activation prompt / next action |
| ---: | --- | --- | --- | --- |
| 1 | Manager / Architect | ACTIVATE NOW | Route TCW-031 — Trade Analyzer Functional Reset + UAT Contract | Create the bounded TCW-031 task from current canonical master. Its first responsibility is to reproduce the actual deployed Trade Analyzer failure and establish a real end-to-end baseline/UAT contract before V2 intelligence work expands. |
| 2 | Implementation Engineer / Builder | WAIT | Await TCW-031 Manager routing | Do not begin V2 feature expansion until Manager routes TCW-031. |
| 3 | In-Season Strategy & Decision Intelligence Analyst | WAIT | TCW-032 planned after baseline reset | Prepare only when Manager routes the Trade Value + Team Needs Strategy contract. |
| 4 | Research & Development (R&D) | WAIT | TCW-033 planned after baseline reset | Research ESPN incoming-offer access and trade-intelligence data only when Manager routes TCW-033. |
| 5 | Independent Auditor / QA | WAIT | No fresh audit target yet | Audit TCW-031 or later V2 targets only when separately routed by Manager. |
| 6 | Troubleshooting & Root Cause Engineer — on-demand | IDLE | No assigned convergence failure | Activate only if TCW-031 reproduces a cross-layer failure that cannot be isolated in the normal Builder lane. |
