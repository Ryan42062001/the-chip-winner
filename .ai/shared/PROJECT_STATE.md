# The Chip Winner — Canonical Project State

Last reconciled: 2026-09-19
Operating state: Workflow V3.2 closed + TCW-031 Trade Analyzer functional reset assigned + Release 1.0 season gate waiting

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

## Next product lane

Active worker task:
`TCW-031 — Trade Analyzer Functional Reset + UAT Contract`

Owner: Implementation Engineer / Builder.

TCW-031 must first restore a real counterparty-aware baseline evaluate-trade workflow and establish the deployed UAT gate. After that baseline is actually usable, TCW-032 Strategy and TCW-033 R&D may proceed as the policy/data foundations for the V2 winner/finder/counter engines.

GM Action Plan is paused behind the core Trade Analyzer V2 workflows.

## Release 1.0
Field registry remains **10 passed / 1 pending**.

Sole pending item:
- `FV-SEASON-01 — Real playoff and bye intelligence states`

It requires genuine qualifying season state and must not be manufactured.

Removed from Release 1.0 rather than falsely passed:
- FV-A11Y-02 under TCW-D012
- custom FLEX/OP/Superflex field certification under TCW-D013
