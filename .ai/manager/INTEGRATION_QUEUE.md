# Integration Queue

## PENDING

### TCW-034 — Trade Winner Engine
- Owner: Implementation Engineer / Builder
- Expected branch: `builder/tcw-034-trade-winner-engine`
- Required source authority:
  - no live provider approved;
  - source-agnostic adapter/engine only;
  - production package winner/split WITHHELD;
  - synthetic approved-source fixtures allowed for deterministic validation.
- Expected implementation areas:
  - package-value contract/math/gate;
  - do-nothing and roster consequence;
  - lineup/depth/replacement/horizon/confidence integration;
  - Evaluate Trade UI explanation;
  - deterministic tests and browser smoke.
- Required before Manager consumption:
  - one Builder PR;
  - exact final-head FULL CI PASS;
  - audit-readiness PASS;
  - inspected bounded diff;
  - no provider/source-authority leakage.
- Manager merge authority only.
- Task-specific audit-readiness: PASS; blockers []; readyForManagerFreeze true.
- Frozen Builder target: `a40c8db8f7e6defcecdf58dc2d3ddd81ea88249a`.
- Frozen audit packet: `.ai/audit/TCW-044_TRADE_WINNER_ENGINE_AUDIT_PACKET_a40c8db8.md`.
- Fresh independent audit TCW-044 is ACTIVE on `auditor/tcw-044-trade-winner-engine-audit`.
- Auditor assignment base: `a93cd7a22d85f4554922157d290e7b98ef0668b8`.
- Immutable audit target: `a40c8db8f7e6defcecdf58dc2d3ddd81ea88249a`.
- No Manager integration of PR #147 until the exact audit verdict is consumed.

## CLOSED / CONSUMED

### TCW-033 — Trade Intelligence Data + ESPN Offer Research
- Manager verdict: ACCEPTED / SOURCE DECISION CONSUMED
- R&D head: `1f4d2f8671d60b26a873e7a11d84dc4ff6dc899c`
- PR #145 / workflow #647 run `35453462402`: PASS
- integration master: `2124602b0eb884fc9a6db407e4feb3b3f9afbf5a`
- master workflow #648 / run `35453637719`: PASS
- automated/live FantasyPros/FantasyCalc/RedraftCalc authority: NOT APPROVED
- approved path: source-agnostic fail-closed engine
- decision: `.ai/manager/evidence/TCW-033_VALUE_SOURCE_DECISION.md`

### TCW-032 — Trade Value + Team Needs Strategy Contract
- Manager verdict: ACCEPTED
- Strategy head: `a9ee2b8d970bb407fe876841d1f5706054f52f3b`
- integration master: `6120dc027dfafc8db9240d70fb9e6c32a8cc2ebc`
- 45–55 inclusive fairness band accepted as transparent v1 policy heuristic

### Trade Analyzer baseline reset/remediation
- TCW-031 — CLOSED
- TCW-042 — CLOSED
- TCW-043 — CLOSED
- accepted deployed product target: `5362e2bff143a5aef050e160ccb0706a7060fb3d`
- product-owner UAT: ACCEPT
- independent re-audit: PASS / no findings

## QUEUED

TCW-035 — Team Needs + Opportunity Model.
TCW-036 — Trade Finder + Target Explorer + Shop My Players.
TCW-037 — Incoming Offer + Counteroffer Engine.
TCW-038 — Trade Center UX + History.
TCW-039 — Independent Trade Intelligence Audit.
TCW-040 — Real-League Trade Center UAT.
