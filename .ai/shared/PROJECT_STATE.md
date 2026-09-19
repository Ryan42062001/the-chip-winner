# The Chip Winner — Canonical Project State

Last reconciled: 2026-09-19
Operating state: Workflow V3.2 closed + Trade Analyzer baseline accepted + TCW-032 Strategy active + Release 1.0 season gate waiting

## Repository / workflow
- Repository: `Ryan42062001/the-chip-winner`
- Default branch: `master`
- Final effective repaired Workflow V3.2 implementation target: `216b9e9030c3dc84d9e2af2b3120d1c8dbb3bee9`
- Active machine state: `.ai/shared/ACTIVE_TASKS.json`
- Field authority: `config/field-validation.json`

The Workflow V3.2 chain is closed. TCW-026/027/028/029 are no longer active.

## Product boundary
The Chip Winner remains an ESPN-connected, read-only, in-season fantasy-football decision companion. ESPN owns connected-league state. External rankings/projections remain separate overlays. Derived recommendations do not mutate source snapshots. ESPN write actions remain out of scope unless separately authorized later.

## Trade Analyzer correction

The TCW-024 → TCW-025 → TCW-030 remediation/audit chain remains historically valid and closed:
- deployed remediation `7bb690429ad5b829e36e5d464ae9d7e74cc77ce0`;
- TCW-030 independently cleared accepted F01-F04;
- audit/closeout master workflows passed.

However, real user feedback after closeout established that the Trade Analyzer is **not functionally complete in actual use**.

Therefore:
- the old remediation tasks remain CLOSED;
- the product-level claim that Trade Analyzer v1 was complete is withdrawn;
- Trade Analyzer V2 is the primary product roadmap;
- real deployed end-to-end user acceptance is mandatory before future Trade Analyzer product-complete claims.

## Trade Analyzer V2 target experience

Five user-facing workflows will share one common intelligence engine:
1. Evaluate Trade.
2. Find Me a Trade.
3. Target a Player.
4. Counter an Offer.
5. Shop My Players.

Required intelligence includes:
- explicit winner/fairness result and understandable relative value;
- do-nothing baseline;
- team-needs diagnosis;
- current/ROS/playoff lineup impact;
- depth/fragility and roster-consolidation effects;
- VORP/positional scarcity/replacement context;
- fairness band and separate evidence confidence;
- manager-to-manager fit and why the other manager may benefit;
- multi-package generation;
- preferences/untouchables;
- buy-low/sell-high context;
- playoff/bye fit when supported;
- incoming-offer analysis with researched ESPN ingestion or manual fallback;
- counteroffers and improve-this-trade;
- negotiation guidance;
- trade history / What Changed;
- later league-wide proactive opportunity scanning.

Canonical detailed roadmap: `.ai/shared/ROADMAP.md`.

## Current product lane

The Trade Analyzer functional-reset/remediation baseline is canonically accepted and closed.

Accepted deployed product target:
`5362e2bff143a5aef050e160ccb0706a7060fb3d`

Acceptance evidence:
- product-owner deployed UAT: **ACCEPT**;
- fresh TCW-043 independent audit: **PASS — no findings**;
- VERIFYING_MASTER PR #140 / workflow #637: PASS;
- closeout master `a64c90f3c45168adf73d9db0823f18aa8989db6e` / workflow #638: PASS;
- final closeout PR #141 exact-head workflow #639: PASS;
- canonical final-closeout master `c729753fe26a7eb074d29ffeef98d4bf591d2351` / workflow #640: PASS.

Active product task:
`TCW-032 — Trade Value + Team Needs Strategy Contract`

Primary owner: In-Season Strategy & Decision Intelligence Analyst.

TCW-033 R&D remains queued under smallest-necessary activation. TCW-034 Builder implementation remains blocked until Manager accepts the TCW-032 Strategy contract.

GM Action Plan remains paused behind the core Trade Analyzer V2 workflows.

## Release 1.0
Field registry remains **10 passed / 1 pending**.

Sole pending item:
- `FV-SEASON-01 — Real playoff and bye intelligence states`

It requires genuine qualifying season state and must not be manufactured.

Removed from Release 1.0 rather than falsely passed:
- FV-A11Y-02 under TCW-D012
- custom FLEX/OP/Superflex field certification under TCW-D013


## Trade Analyzer baseline acceptance — 2026-09-19

The functional-reset/remediation chain TCW-031 / TCW-042 / TCW-043 is CLOSED.

Accepted deployed product target:
`5362e2bff143a5aef050e160ccb0706a7060fb3d`

Acceptance evidence:
- product-owner deployed UAT: **ACCEPT**;
- fresh TCW-043 independent audit: **PASS — no findings**;
- VERIFYING_MASTER checkpoint #637 PASS;
- resulting canonical master #638 PASS.

The accepted baseline is the read-only evaluate-a-trade workflow. It does not yet claim winner/fairness scoring.

Active product lane:
`TCW-032 — Trade Value + Team Needs Strategy Contract`.

TCW-033 remains queued. TCW-034 remains blocked until the TCW-032 contract is Manager-accepted.
