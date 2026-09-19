# In-Season Strategy Handoff

STATUS: MANAGER_REVIEW_READY (subject to exact-final-head CI)
TASK: TCW-032 — Trade Value + Team Needs Strategy Contract
ROLE: In-Season Strategy & Decision Intelligence Analyst
BRANCH: strategy/tcw-032-trade-value-team-needs-contract
BASE: edcf670e64acfacb6148fdea231f81f2bbb609a7 (verified canonical master and initial branch head)
AUTHORIZED BASELINE: c729753fe26a7eb074d29ffeef98d4bf591d2351
ACCEPTED DEPLOYED TRADE ANALYZER PRODUCT TARGET: 5362e2bff143a5aef050e160ccb0706a7060fb3d
PR: See the one TCW-032 Strategy PR against master; record exact final head/CI from live GitHub before acceptance.
DONE: Authored bounded production-ready policy; preserved read-only ESPN, TCW-022 legality/coverage/source/horizon/lineup safeguards; no production implementation.
CHANGED: .ai/strategy/TCW-032_TRADE_VALUE_TEAM_NEEDS_CONTRACT.md and .ai/strategy/HANDOFF.md only.
TESTS: Normative synthetic acceptance matrix of 22 deterministic scenario/boundary cases in the contract; no production tests executed by Strategy. PR docs-only CI still required at exact final head.
CI: Must be populated by live exact-final-head run metadata in Manager review/worker response; no assumption that an earlier commit's CI validates final head.
BLOCKERS: Truthful package-value winner/split cannot be shipped without a documented approved comparable additive value source; R&D TCW-033 must investigate and Manager must accept. Team consequence/need policy itself has no new source blocker. No ESPN incoming-offer research or field-validation evidence is claimed.
DECISIONS CONSUMED: TCW-031/042/043 closed; deployed UAT ACCEPT; TCW-043 PASS/no findings; master baseline workflow #640 PASS; V3.2 active task TCW-032 assigned. Sole pending field validation FV-SEASON-01 remains pending (10 passed / 1 pending).
DO NOT REPEAT: Do not reopen old TCW-022 blanket winner ban, source-average current and future projections, infer market price from one-week projections, claim V2 complete, start TCW-033/034 without Manager activation, or merge this PR.

## Contract in one paragraph

The named-source **package asset-value** result is YOU WIN only above 55% incoming value, FAIR from 45% through 55% inclusive, and THEY WIN below 45%, otherwise WITHHELD. A 57/43 display is received/sent relative additive package value, never a win or offer-acceptance probability. A separate do-nothing comparison computes actual legal optimized starting-lineup, contingent-depth, bye, legal replacement, FLEX/OP and named-horizon effects, with user decision IMPROVES/WORSENS/MIXED/NO_MATERIAL_CHANGE/WITHHELD. Severe known unfillable gaps override a positive starter gain in the user recommendation, not in the independent package-value label. Roster legality, complete source coverage, timestamp/identity, calibrated value availability and unknown opponent preferences fail closed per claim. Team-needs model reports before/after tiered legal-slot gaps, feasible upgrades and actual expendability. DO_NOT_TRADE is hard for generators, PREFER_TO_KEEP soft, ACTIVELY_SHOP search priority; manual evaluation explains conflicts. Two-manager plausibility is a documented football rationale, never an acceptance percentage. No supported beneficial legal plausible package -> valid NO WORTHWHILE TRADE result.

## Explicit TCW-033 / Manager dependencies

1. Validate and obtain Manager approval for a genuinely comparable additive asset-value source/model across both sides (including uneven packages), mapping, league scoring compatibility, age/TTL, full coverage, scale/version, source independence and non-double-counted scarcity. Until then TCW-034 should WITHHOLD package winner/split while retaining useful roster analysis. Manager should review the provisional inclusive 45–55 fairness heuristic.
2. Buy-low/sell-high labels require a separately approved market vs source-compatible forward-utility divergence threshold; otherwise OPPORTUNITY_UNVERIFIED.
3. Broader opponent/package generation depends on complete opponent roster and legal drop/availability data. Incoming ESPN offers remain a later read-only feasibility question with manual fallback, not assumed supported.

## Recommended next Manager action

Review the single exact-final-head CI-validated Strategy PR, accept or return bounded findings on the contract and its source-dependency/45–55 heuristic, then decide whether to route the *smallest necessary* TCW-033 research before authorizing TCW-034 implementation. Manager alone updates active machine state, activates downstream work and merges. Product UAT/independent audit remain separate future gates.

## Next Activation

| Order | Employee / Role | Status | Current Task / Gate | Copy/paste activation prompt / next action |
|---|---|---|---|---|
| 1 | Manager / Architect | RECOMMEND TO MANAGER | TCW-032 Strategy review | Verify final Strategy PR head/CI, evaluate the winner/fairness and value-source dependency, accept or route bounded rework; control TCW-033/034 activation and merge. |
| 2 | Implementation Engineer / Builder | WAIT | TCW-034 blocked on contract acceptance/value authority | Wait for Manager acceptance and explicit bounded implementation assignment; do not implement value from invented source. |
| 3 | In-Season Strategy & Decision Intelligence Analyst | COMPLETE | TCW-032 one-PR handoff | Stop after final-head CI and report exact PR/SHA/run/job to Manager; do not merge. |
| 4 | Research & Development (R&D) | WAIT | TCW-033 queued | Await Manager's smallest-necessary activation; research comparable additive value source and separately queued ESPN read-only offer feasibility without assuming results. |
| 5 | Independent Auditor / QA | WAIT | Future implementation audit | Await Manager's frozen implementation target; TCW-043 already PASS/no findings. |
| 6 | Troubleshooting & Root Cause Engineer — on-demand | IDLE | None | Act only if Manager routes a reproduced defect. |
