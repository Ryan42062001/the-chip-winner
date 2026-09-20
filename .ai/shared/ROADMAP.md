# The Chip Winner — Canonical Roadmap

Last reconciled: 2026-09-19

## M1 — Release 1.0 trustworthy read-only companion
Status: ACTIVE — FIELD VALIDATION EVENT-GATED

Field registry: **10 passed / 1 pending**.

Sole pending field condition:
1. `FV-SEASON-01 — Real playoff and bye intelligence states`

Do not manufacture the season condition.

## Trade Analyzer product status

### Trade Analyzer v1 remediation chain
Status: **REMEDIATION/AUDIT CLOSED — PRODUCT ACCEPTANCE NOT SATISFIED**

Completed historical work:
1. TCW-022 Strategy contract.
2. TCW-023 initial production implementation.
3. TCW-024 independent audit — FAIL with F01-F04.
4. TCW-025 bounded remediation implementation, Manager integration, full master CI, Pages deployment, and production smoke.
5. TCW-030 fresh Independent Auditor re-audit — **PASS**, clearing TCW-024-F01 through F04 with no new findings.
6. Manager audit-evidence integration and fail-closed closeout checkpoints — master #599 and #601 PASS.

Canonical deployed remediation:
`7bb690429ad5b829e36e5d464ae9d7e74cc77ce0`

Important product-status correction:
- TCW-025/030 proved the four accepted TCW-024 remediation findings were cleared.
- They did **not** prove that the Trade Analyzer worked end-to-end as a useful product.
- Subsequent real user feedback established that the Trade Analyzer does not yet work acceptably in actual use.
- Therefore the remediation/audit chain remains historically closed, but **Trade Analyzer product completion is revoked**.
- Future Trade Analyzer milestones require real deployed end-to-end user acceptance before being called complete.

## Trade Analyzer V2 — active product priority
Status: **ACTIVE — BASELINE ACCEPTED; TCW-032 STRATEGY ACTIVE**

### Product objective

Build a complete in-season Trade Center that can answer five user workflows from the same underlying intelligence engine:

1. **Evaluate Trade** — determine whether a proposed trade materially improves the user's team and explain who benefits.
2. **Find Me a Trade** — diagnose team needs and generate realistic packages with other league managers.
3. **Target a Player** — select a player to acquire and generate several realistic packages to pursue that player.
4. **Counter an Offer** — evaluate an incoming trade request and generate better counteroffers.
5. **Shop My Players** — identify players whose market value may exceed their value to the user's specific roster and find realistic destinations/packages.

The system remains ESPN-connected and read-only. It may recommend or reconstruct transactions, but it must not propose/send/accept/reject/veto an ESPN trade unless a later separately authorized write-capability program explicitly changes that boundary.

### Required Trade Analyzer V2 intelligence

All of the following are roadmap requirements, not optional ideas:

- **Trade winner / relative value result**
  - Explicitly classify a trade as `YOU WIN`, `FAIR TRADE`, or `THEY WIN`.
  - Provide an understandable relative-value comparison such as 57/43 when supported.
  - The value split is a comparative trade-value result, **not** a probability that the trade will succeed or be accepted.
  - Keep evidence confidence separate from the winner/value result.

- **Do-nothing baseline**
  - Compare the trade against keeping the current roster.
  - Do not recommend a fair-value trade that fails to improve the user's actual team.

- **Team-needs diagnosis**
  - Identify the user's strongest and weakest starting positions, depth strengths/weaknesses, expendable assets, and priority upgrade areas.
  - Recompute needs after hypothetical moves.

- **Current / rest-of-season / playoff impact**
  - Separate this-week, rest-of-season, and fantasy-playoff consequences when data support them.
  - Preserve uncertainty when future data are incomplete.

- **Starting-lineup impact**
  - Quantify how the proposal changes the optimized starting lineup rather than comparing player values in isolation.

- **Depth and fragility impact**
  - Measure bench/depth losses, contingency coverage, positional risk, and the cost of 2-for-1 / 1-for-2 roster consolidation.

- **Roster consolidation value**
  - Understand that one elite starter can be worth more than multiple bench-level assets because starting slots are scarce.

- **Replacement-level / waiver context**
  - Include the quality and legality of available replacement options when valuing players being traded away.
  - Preserve the accepted distinction between presentation candidates and full structural availability.

- **Positional scarcity / VORP / roster fit**
  - Evaluate replacement value and positional scarcity within the league's actual lineup configuration.
  - Continue to honor supported FLEX/OP semantics.

- **Fairness band**
  - Avoid overstating tiny edges.
  - Treat near-even outcomes as a meaningful fair-trade range instead of declaring a dramatic winner.

- **Evidence confidence**
  - Expose confidence separately based on projection completeness, source freshness, identity mapping, future-data coverage, and other material evidence limitations.
  - Missing evidence must not silently become negative evidence.

- **Manager-to-manager fit**
  - Suggested deals must consider the other roster's needs and depth, not only the user's gain.
  - Prefer packages that have a plausible football reason for both managers.

- **Why the other manager might accept**
  - Explain the roster problem or value proposition the proposal addresses for the other team.
  - Do not represent this as an acceptance probability unless a future calibrated acceptance model is separately researched and approved.

- **Multiple package generation**
  - For a target player, generate several structures where legal and sensible: 1-for-1, 2-for-1, 1-for-2, player-plus-upgrade, and alternative targets/packages.
  - Do not generate packages merely to fill a quota.

- **Trade target explorer**
  - Allow the user to choose a need such as RB, WR, TE, QB, FLEX upside, depth, playoff upside, or another supported roster objective and surface realistic targets.

- **Trade finder**
  - Search league rosters for inverse-need matches, e.g. the user is WR-rich/RB-poor while another manager is RB-rich/WR-poor.
  - Rank opportunities by user's roster improvement, fairness, legality, and plausibility for the other roster.
  - It is valid to return **no worthwhile trade found**.

- **Shop-my-players / trade block intelligence**
  - Identify players who may be more valuable to another roster than to the user's current construction.
  - Allow user preferences such as `DO NOT TRADE`, `PREFER TO KEEP`, and `ACTIVELY SHOP`.

- **Buy-low / sell-high intelligence**
  - Compare supported market/value context with rest-of-season roster utility.
  - Present this as evidence-based divergence, not a prediction that future performance is guaranteed.

- **Playoff schedule fit**
  - When real season state and trustworthy data support it, incorporate fantasy-playoff schedule and opponent/bye considerations.
  - Do not manufacture the still-pending `FV-SEASON-01` evidence.

- **Bye-week conflict detection**
  - Flag trades that create meaningful lineup holes because important players share bye weeks.

- **Incoming offer analysis**
  - If ESPN provides a reliable read-only pending-offer interface, ingest incoming offers.
  - If not, provide a fast manual reconstruction workflow using the same analysis engine.
  - Automatic ingestion must be researched rather than assumed.

- **Counteroffer engine**
  - When an incoming offer is weak or merely fair, generate improved alternatives.
  - Support minimal-change counters, balanced counters, and best-roster-fit counters where appropriate.
  - Consider both teams' needs and legal roster consequences.

- **Improve-this-trade**
  - From any evaluated proposal, search nearby package variations and identify changes that move the trade toward a favorable/fair range for the user.

- **Negotiation guidance**
  - Explain what the user can reasonably concede before a deal stops being favorable.
  - Distinguish required value from optional sweeteners.

- **Trade history / What Changed**
  - Preserve evaluated proposals locally so the user can compare original offer, revised offer, and counteroffer.
  - Show what materially changed between versions.

- **League-wide opportunity scanning**
  - Detect strong complementary roster matches across the league and surface proactive trade opportunities even when the user has not selected a specific player.
  - This is a later V2 capability after the core winner/finder/counter engines are trustworthy.

### Trade Analyzer V2 execution roadmap

#### TCW-031 — Trade Analyzer Functional Reset + UAT Contract
Status: **CLOSED — BASELINE ACCEPTED**
Owner sequence: Manager → Builder → Auditor / User acceptance

Goals:
- reproduce why the currently deployed Trade Analyzer does not work acceptably in real use;
- repair broken end-to-end selection, state, analysis, and rendering paths needed for the existing baseline;
- define concrete real-user workflows and acceptance evidence;
- establish that deterministic/unit/browser tests are necessary but not sufficient for product completion.

Exit gate:
- existing Trade Analyzer can complete the baseline evaluate-a-trade workflow on the deployed site;
- real user acceptance is recorded for that baseline before advancing its product status.

#### TCW-032 — Trade Value + Team Needs Strategy Contract
Status: **CLOSED — MANAGER ACCEPTED**
Primary owner: In-Season Strategy & Decision Intelligence
Strategy head: `a9ee2b8d970bb407fe876841d1f5706054f52f3b`
Integration master: `6120dc027dfafc8db9240d70fb9e6c32a8cc2ebc`
Validation: PR #143 / workflow #643 PASS; integration master workflow #644 PASS

Define:
- winner/fairness semantics;
- relative-value interpretation;
- fairness band;
- VORP/replacement value;
- positional scarcity;
- lineup delta;
- depth/fragility;
- consolidation value;
- team-needs scoring;
- do-nothing comparison;
- current/ROS/playoff horizons;
- confidence/evidence semantics;
- manager-to-manager plausibility principles;
- buy-low/sell-high framing;
- untouchable/preference behavior.

This contract intentionally supersedes the old blanket prohibition on a trade winner/value result. It does **not** authorize misleading win-probability or acceptance-probability claims.

Manager accepted the inclusive 45–55 package-value fairness band as a transparent v1 policy heuristic. The contract requires package winner/split to remain WITHHELD until Manager approves a comparable additive asset-value source.

#### TCW-033 — Trade Intelligence Data + ESPN Offer Research
Status: **CLOSED — MANAGER ACCEPTED**
Primary owner: R&D
R&D head: `1f4d2f8671d60b26a873e7a11d84dc4ff6dc899c`
Integration master: `2124602b0eb884fc9a6db407e4feb3b3f9afbf5a`
Validation: PR #145 / workflow #647 PASS; integration master workflow #648 PASS

Research:
- reliable read-only access, if any, to received/pending ESPN trade offers;
- identity and state requirements for reconstructing offers;
- trustworthy value/ranking/projection sources already available to The Chip Winner;
- whether a distinct market-value source materially improves trade quality;
- freshness and failure behavior;
- data needed for league-wide opportunity matching.

Do not assume undocumented ESPN trade-offer access is reliable.

Manager source decision after TCW-033:
- no external provider is approved for automated/live authority yet;
- FantasyPros/FantasyCalc/RedraftCalc remain future candidates only under a separately approved source contract;
- source-agnostic fail-closed package-value engine implementation is approved;
- production approved-provider set is empty, so live winner/split must remain WITHHELD.

Decision artifact:
`.ai/manager/evidence/TCW-033_VALUE_SOURCE_DECISION.md`

#### TCW-034 — Trade Winner Engine
Status: **AUDIT_READY — THIRD FULL REPAIRED TARGET FROZEN / TCW-046 FRESH AUDIT ACTIVE**
Primary owner: Builder
Builder PR: `#147` — DRAFT / UNMERGED
Failed frozen target / remediation parent: `a40c8db8f7e6defcecdf58dc2d3ddd81ea88249a`
Accepted audit findings: F01 HIGH, F02 MEDIUM, F03 MEDIUM, F04 LOW
Repaired FULL candidate: `24be4be45f7fde351c0a6e209353dd2beed8d854` / workflow #674 PASS
Readiness PASS: blockers [] / readyForManagerFreeze true, packet sha256 `ae906987bfbad2bab022bd7d1afd24693b4fd047397ebe779dca101c82e7de4b`. Manager froze exact FULL repaired head `24be4be45f7fde351c0a6e209353dd2beed8d854`. Next gate: TCW-045 fresh independent re-audit.

Implement:
- `YOU WIN / FAIR TRADE / THEY WIN`;
- relative-value comparison;
- do-nothing baseline;
- starting-lineup impact;
- current/ROS/playoff impact;
- depth/fragility/consolidation effects;
- positional scarcity/VORP;
- replacement/waiver context;
- fairness band;
- separate evidence confidence;
- plain-language reasons and limitations.

Independent audit result:
- `TCW-044 — Trade Winner Engine Independent Audit`
- status: **CLOSED — FAIL CONSUMED**
- exact Auditor head: `b30732e8f170885c309389f44657bddb3923c8b8`
- verdict: **FAIL — REMEDIATION REQUIRED**
- F01-F03 blocking; F04 accepted for same-pass remediation
- canonical finding decision: `.ai/manager/evidence/TRADE_WINNER_AUDIT_FINDING_DECISION.md`

TCW-045 re-audits exact immutable repaired target `24be4be45f7fde351c0a6e209353dd2beed8d854`; TCW-035 remains inactive until the repaired target passes that fresh independent re-audit and Manager consumes the verdict.

#### TCW-035 — Team Needs + Opportunity Model
Owner sequence: Strategy → Builder

Implement:
- roster strengths/weaknesses;
- upgrade priorities;
- expendable depth;
- preference flags;
- complementary manager matching;
- why-the-other-manager-might-accept reasoning;
- no-trade-is-worth-it outcome.

#### TCW-036 — Trade Finder + Target Explorer + Shop My Players
Primary owner: Builder

Implement the three proactive workflows:
- Find Me a Trade;
- Target a Player;
- Shop My Players.

Generate and rank legal/plausible packages, including multiple package structures where justified.

#### TCW-037 — Incoming Offer + Counteroffer Engine
Owner sequence: R&D where required → Strategy → Builder

Implement:
- incoming ESPN offer ingestion if verified reliable;
- fast manual reconstruction fallback;
- automatic winner evaluation;
- minimal counter;
- balanced counter;
- best-roster-fit counter;
- improve-this-trade package search;
- negotiation/concession guidance.

#### TCW-038 — Trade Center UX + History
Primary owner: Builder

Unify the user experience around:
- Evaluate Trade;
- Find Me a Trade;
- Target a Player;
- Counter an Offer;
- Shop My Players.

Also add:
- trade history / What Changed;
- clear source/freshness/confidence presentation;
- mobile/accessibility/reload/private-state safeguards;
- read-only action boundary.

#### TCW-039 — Independent Trade Intelligence Audit
Primary owner: Independent Auditor / QA

Freshly audit the complete V2 behavior:
- winner/fairness math and semantics;
- do-nothing baseline;
- roster-needs logic;
- lineup/depth/replacement effects;
- multiple-package generation;
- manager-to-manager plausibility;
- incoming-offer/counter behavior;
- uncertainty/confidence;
- legality;
- source separation;
- ESPN read-only boundary;
- mobile/accessibility/state persistence;
- deterministic adversarial cases.

Green implementation CI is evidence, not the Auditor verdict.

#### TCW-040 — Real-League Trade Center UAT
Owner: Manager + product owner/user

Exercise the deployed Trade Center against the real connected league:
- evaluate real trade packages;
- verify winner/fairness explanations are useful;
- generate team-needs-driven trade suggestions;
- target at least one player and inspect generated packages;
- shop at least one user player;
- analyze a genuine received offer when naturally available, or exercise the approved manual reconstruction fallback;
- generate and inspect counteroffers;
- verify usability on the actual deployed workflow.

**Trade Analyzer V2 is not COMPLETE until this real deployed UAT is accepted by the product owner.**

### Later V2 enhancement after core UAT

**League-wide opportunity scanning** becomes a dedicated follow-on once winner, needs, finder, and counter engines are accepted. It should proactively identify complementary rosters and worthwhile trade windows without forcing a recommendation.

## Trade Analyzer product acceptance rule

Effective immediately:

> No Trade Analyzer milestone may be marked product-complete solely because deterministic tests, CI, deployment smoke, or an implementation audit pass. Any major user-facing Trade Analyzer capability requires successful real deployed end-to-end user acceptance before product completion.

Technical audit findings may still be closed independently. Closing a bug/remediation task does not imply the whole Trade Analyzer product is complete.

## Workflow / operating-system maturity
Status: COMPLETE — WORKFLOW V3.2 CANONICAL

TCW-026 implemented the applicable cross-project workflow improvements. TCW-027 independently audited the original integration and found F01/F02/F03. TCW-028 remediated those findings at `216b9e9030c3dc84d9e2af2b3120d1c8dbb3bee9`. TCW-029 then returned **PASS WITH NON-BLOCKING FINDINGS** on the exact repaired target.

Manager independently accepted TCW-029-F01 as LOW/non-blocking workflow debt: Markdown formatting can bypass the human-facing worker `ACTIVATE NOW` lint, but the bypass cannot mutate machine state or grant merge authority. It does not keep the V3.2 program open.

The canonical closeout sequence passed:
- repaired master #586 — full CI + Pages + production smoke;
- audit evidence master #590 — FULL PASS;
- explicit VERIFYING_MASTER closeout checkpoint #592 — FULL PASS.

TCW-026, TCW-028, and TCW-029 are closed and removed from active-only state.

## Other product discovery candidates

Trade Analyzer V2 is now the primary product lane. The following remain later candidates:
1. GM Action Plan / recommendation synthesis — paused until the core Trade Analyzer winner/finder/counter workflows are functional and accepted.
2. broader recommendation confidence + league-market intelligence outside Trade Analyzer.
3. decision-impacting injury/news intelligence and notifications, only after trustworthy-source feasibility.
4. playoff probability / championship-path modeling, only after calibrated prerequisites.
5. ESPN write actions — later gated and separately authorized.

Explicit product-owner direction continues to supersede older discovery ordering.


#### TCW-042 — Ownership Remediation + Player Input UI Polish
Status: **CLOSED — DEPLOYED / AUDITED / UAT ACCEPTED**

Exact repaired deployed target:
`5362e2bff143a5aef050e160ccb0706a7060fb3d`

TCW-041-F01 outgoing ownership remediation and the compact balanced Send/Receive UI are deployed. Master workflow #621 passed FULL CI, Pages deployment, and production verification.

#### TCW-043 — Ownership remediation re-audit
Status: **CLOSED — PASS / NO FINDINGS**

Owner: Independent Auditor / QA

Audit exact deployed target `5362e2bff143a5aef050e160ccb0706a7060fb3d` for TCW-041-F01 closure and preserved Trade Analyzer ownership/package/read-only behavior. Product-owner UI/UAT acceptance remains a separate parallel gate.

The TCW-031 baseline gates are cleared. TCW-032 and TCW-033 are closed and Manager-accepted. TCW-034 is active in bounded source-agnostic mode. Live package-value winner/split remains disabled until Manager separately approves a provider contract.


### Baseline closeout note — 2026-09-19

TCW-031, TCW-042, and TCW-043 are closed after:
- exact repaired deployed target `5362e2bff143a5aef050e160ccb0706a7060fb3d`;
- product-owner deployed UAT ACCEPT;
- TCW-043 PASS with no findings;
- V3.2 VERIFYING_MASTER checkpoint #637 PASS;
- resulting canonical master #638 PASS.

The accepted TCW-032 contract defines scoring semantics and TCW-033 established that no researched provider currently has sufficient authority for automated live use. Manager therefore activated TCW-034 only for source-agnostic fail-closed implementation: synthetic fixtures may prove the winner math, but live YOU WIN / FAIR TRADE / THEY WIN and relative-value percentages remain WITHHELD until a provider is separately approved.


### Second Trade Winner audit disposition — 2026-09-19

TCW-045 concluded FAIL on exact frozen `24be4be45f7fde351c0a6e209353dd2beed8d854`. Evidence PR #157 / workflow #679 PASS was integrated on master `c6ba9b3599e4befa9abce9a958f6a7c45a0245dc` / workflow #680 PASS. Manager accepted F02-R1 (BLOCKING) and F04-R1 (same-pass) and returned only TCW-034 to Builder on existing draft/unmerged PR #147. A fresh FULL final handoff-inclusive repaired head, readiness, immutable freeze and new independent audit are still required; TCW-035 and later tasks remain inactive.


### Third repaired Trade Winner target / independent workflow automation — 2026-09-19

TCW-034 Builder PR #147 remains DRAFT / UNMERGED. Exact FULL-tested third immutable target `035c5f5112b7393f9d4f17685792548afa67dd2e`; task-specific readiness PASS (blockers [], readyForManagerFreeze true, packet hash `750892a305cab589a6c3e904f39488189382542a4a9070ab25fa1a148043c1df`). TCW-046 fresh Independent Auditor re-audit is assigned; TCW-035 and later Trade Analyzer milestones remain inactive.

**Separate operating-system enhancement TCW-047 — Automated Exact-SHA Task Audit-Readiness Gate: ASSIGNED.** Implement a GitHub Actions-based workflow that reads canonical Manager state and immutable Builder SHA, runs existing readiness without manual user checkout, and publishes fail-closed per-task evidence. Distinct Builder branch/scope; independent workflow/security audit mandatory. No auto-freeze, auto-merge, provider approval or retroactive effect on current TCW-046 audit. This enhancement is NOT completed/installed yet.
