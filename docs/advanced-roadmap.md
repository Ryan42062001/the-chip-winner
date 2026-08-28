# Advanced Features Roadmap

## Purpose

This roadmap begins after The Chip Winner `0.4.0` connected foundation. The foundation already provides a private, read-only ESPN connection, normalized league state, current-week roster and matchup views, NFL schedule context, waiver availability, basic recommendations, source coverage, local caching, and automated deployment.

The advanced roadmap focuses on improving decision quality—not merely adding more screens. Every recommendation must remain legal for the connected league, traceable to named inputs, and honest about uncertainty.

## Product outcomes

The advanced product should help a manager answer five questions:

1. What requires attention before the next kickoff?
2. Which legal lineup produces the strongest risk-adjusted outlook?
3. Which available player improves the roster, and what is the cost?
4. How does a move affect the rest of the season and fantasy playoffs?
5. What changed since the last refresh, and why did the recommendation change?

## Priority framework

Features are ordered using four criteria:

- **Weekly value:** how often the feature supports a real decision.
- **Trust readiness:** whether reliable source data and identity matching exist.
- **Dependency leverage:** whether the work unlocks multiple later features.
- **Failure cost:** the harm caused by an incorrect or illegal recommendation.

This produces the following order:

| Priority | Capability | Why it comes here |
| --- | --- | --- |
| P0 | Player identity and projection sources | Required by nearly every advanced recommendation |
| P0 | Constraint-based lineup engine | Highest-frequency in-season decision |
| P1 | Player detail and recommendation explanations | Makes advanced outputs inspectable |
| P1 | Waiver engine v2 | High weekly value after availability is reliable |
| P1 | Change detection and decision timeline | Improves trust and refresh usefulness |
| P2 | Rest-of-season and playoff planning | Requires stronger projection data |
| P2 | Trade analysis | Requires stable ROS value and lineup-impact modeling |
| P2 | Notifications | Requires reliable alert ranking and freshness |
| P3 | Confirmed ESPN write actions | Highest failure cost; only after read reliability is proven |

---

## Release 0.5 — Player intelligence layer

Goal: establish the reliable player-data foundation required for better recommendations.

### External identity registry

- Add a source-independent canonical player identity record.
- Store ESPN player ID alongside future external provider IDs.
- Match using explicit provider IDs whenever available.
- Route unresolved and conflicting identities into a visible reconciliation report.
- Never automatically resolve using display name alone.

Acceptance criteria:

- Every projection or news record is attached to a stable provider identity.
- Unresolved records cannot influence recommendations.
- Identity mappings include provenance and modification time.
- Fixture tests cover suffixes, duplicate names, defenses, rookies, and team changes.

### Projection-provider implementation

- Implement the existing projection-provider contract for one trustworthy source.
- Follow the source selection, licensing gate, and shadow-mode bake-off in [`projection-source-research.md`](projection-source-research.md).
- Keep ESPN and external projections separately queryable.
- Support weekly projection, rest-of-season value, floor, and ceiling only when supplied.
- Store scoring format, source update time, and projection period.
- Add source freshness thresholds.

Acceptance criteria:

- Removing the projection source does not affect ESPN league refresh.
- A projection cannot be used for an incompatible scoring format without an explicit conversion.
- Stale projections are labeled and reduce recommendation confidence.
- Missing floor or ceiling data does not generate inferred values.

### Player detail view

- Add player cards or a detail drawer accessible from roster, waivers, alerts, and comparisons.
- Show ESPN roster status, lineup slot, NFL opponent, kickoff, injury status, bye, and available projections.
- Show recent fantasy scoring only when the scoring basis is compatible with the connected league.
- Display source names and timestamps beside each fact group.

Acceptance criteria:

- Every displayed number has an inspectable source.
- Conflicting projections remain separate before any consensus view.
- Missing fields render as unavailable.
- The detail view is keyboard accessible and mobile friendly.

Release exit: reliable player identities and at least one independent projection source support an inspectable player detail surface.

---

## Release 0.6 — Lineup optimizer v2

Goal: replace pairwise swaps with a full legal-lineup optimizer.

Status: **In progress.** Complete assignment search, duplicate prevention, supported-slot eligibility including OP/superflex, explicit ESPN locks, automatic ISO kickoff-time locks, missing-projection limitations, and UI explanations are implemented. Unparseable or missing kickoff times remain honestly unlocked. Broader live fixture coverage remains before release exit.

### Constraint model

- Generate eligible assignments from ESPN roster settings and player eligibility.
- Support duplicate RB/WR slots, FLEX, OP/superflex, D/ST, K, bench, and IR.
- Respect player locks and games already started.
- Prevent duplicate assignments.
- Detect incomplete or unsupported lineup configurations.

### Optimization modes

- **Projected points:** maximize available mean projection.
- **Safe floor:** maximize floor only when floor data exists.
- **Upside:** favor ceiling only when ceiling data exists.
- **Matchup mode:** adjust risk preference based on projected matchup deficit or lead without changing source projections.

### Explanation engine

- Show current versus optimized lineup.
- Explain each changed slot and expected difference.
- Separate projection edge from confidence.
- Flag injury, stale-source, and near-lock risks.

Acceptance criteria:

- Every proposed lineup satisfies the exact ESPN configuration.
- Locked players never move.
- Brute-force tests confirm optimal solutions for representative small rosters.
- Missing required data returns an explicit limitation instead of a partial “optimal” claim.
- Risk modes cannot appear unless their required inputs exist.

Release exit: the app can construct and explain a complete legal lineup for the connected league.

---

## Release 0.7 — Waiver engine v2

Goal: evaluate waiver moves as roster changes rather than isolated weekly projection differences.

Status: **In progress.** ESPN availability filtering, unlocked-bench-only drops, full legal-lineup simulation, cross-position replacement, compatible move selection, and separate current-week/ROS presentation are implemented. Exact acquisition-limit consumption, waiver priority, IR eligibility transitions, multiweek projections, and replacement-value modeling remain open because the current snapshot does not yet prove those inputs.

### Candidate filtering

- Use ESPN availability as the authoritative candidate pool.
- Distinguish free agents, waivers, locked players, and unavailable players.
- Respect league acquisition limits, waiver schedule, roster size, positional limits, and IR eligibility.
- Exclude players whose identity or projection source is unresolved.

### Add/drop evaluation

- Calculate current-week lineup impact.
- Calculate multiweek and rest-of-season impact when data exists.
- Measure replacement value relative to league availability.
- Account for bye coverage, positional depth, and playoff-week usefulness.
- Separate streamers from long-term adds.

### Waiver presentation

- Rank a small compatible set rather than dozens of conflicting pairs.
- Explain add value, drop cost, intended time horizon, and legal constraints.
- Show acquisition status and likely processing time.
- Add watchlist and dismiss controls stored locally.

Acceptance criteria:

- Recommended players are available at refresh time.
- Every add/drop pair leaves a legal roster.
- The same player is not reused across a supposedly compatible set of moves.
- Rest-of-season claims disappear when ROS data is missing.
- Refresh revalidates availability and marks changed recommendations obsolete.

Release exit: waiver guidance is legal, time-horizon aware, and based on full-roster impact.

---

## Release 0.8 — Decision timeline and alerts

Goal: tell the manager what changed and what requires action.

Status: **Feature-complete for the current snapshot contract.** Two-snapshot local retention, deterministic differencing, team relevance filtering, identical-refresh suppression, recommendation appearance/change/clear explanations, the **What Changed** timeline, week-scoped persistent alert dismissal/restoration, and kickoff-aware urgency ranking are implemented.

### Snapshot differencing

- Compare the current valid snapshot with the previous valid snapshot.
- Detect lineup changes, roster transactions, availability changes, injury-status changes, matchup score changes, and projection movements.
- Store derived change records separately from both snapshots.
- Avoid retaining unnecessary raw history.

### Alert ranking

- Rank alerts by kickoff proximity, starter status, injury severity, lineup legality, and availability changes.
- Separate information from required action.
- Suppress duplicate or unchanged alerts.
- Expire alerts when their underlying condition is resolved.

### Decision timeline

- Show what changed, when it was observed, and which recommendation was affected.
- Explain recommendation reversals using changed inputs.
- Allow local dismissal without altering source data.

Acceptance criteria:

- Every alert links to its source condition.
- Refreshing identical data creates no new change records.
- Recommendation-change explanations identify the changed input.
- Alerts never claim real-time monitoring when the browser has not refreshed.

Release exit: each refresh produces a concise, trustworthy summary of meaningful changes.

---

## Release 0.9 — Rest-of-season and playoff planning

Status: in progress. Season Plan reports positional depth, starter bye conflicts, ESPN-reported fantasy opponents and schedule coverage for the selected horizon, explicitly supplied playoff schedule-strength fields, current-week legal moves, multiweek baselines and isolated add/drop deltas. Missing and duplicate ESPN matchup records are visible, and no opponent strength is inferred. Projection provider, scoring format, source capture time, freshness, ESPN season/scoring compatibility, ID-map size, player-week coverage, persisted user-selectable horizons, per-week usable/blocked readiness and withheld-delta reasons are visible. CSV imports require consistent source metadata on every row; import time is never mislabeled as source capture time. Incompatible sources are blocked; stale sources remain explicitly warned. Missing identity mappings are distinguished from missing week-specific projection values, with exact ESPN roster identities shown locally and available as a repair report; names are informational and never used for provider joins. Position-specific NFL schedule strength still requires a documented external data source and method.

Goal: support roster construction beyond the immediate week.

### Schedule intelligence

- Strength-of-schedule views by position and week.
- Bye-week collision analysis.
- Fantasy playoff schedule views based on connected league settings.
- Starter and bench coverage across future weeks.

### Roster portfolio analysis

- Positional depth and replaceability.
- Bench utility by future starter probability.
- Injury and bye concentration.
- Stacking and correlated exposure as descriptive context, not guaranteed advantage.

### Scenario planner

- Compare holding, adding, dropping, or trading players without modifying ESPN.
- Show weekly lineup impact across a selectable horizon.
- Separate baseline projections from scenario-derived changes.

Acceptance criteria:

- Playoff weeks come from connected league settings when available.
- Schedule difficulty names its source and methodology.
- Scenario plans never mutate the cached ESPN snapshot.
- Missing future projections prevent future-score claims.

Release exit: managers can evaluate roster moves across the season and playoffs with visible assumptions.

---

## Release 1.0 — Production-grade read-only companion

Status: **In progress.** Accessible first-run connection/sample onboarding, multiple browser-local ESPN league/season/team profiles, companion health/version compatibility, per-league refresh cooldowns and recovery guidance, versioned browser-cache migrations, complete browser-local deletion, best-effort mobile-sync revocation, Content Security Policy, accessibility controls, desktop/mobile browser smoke automation, an automated WCAG 2.2 A/AA audit, and a least-privilege companion audit are implemented. Independent manual accessibility and security review remain open.

Goal: graduate the read-only product from a personal connected preview to a reliable weekly tool.

### Connection and onboarding

- Replace hard-coded league configuration with local league ID, season, and team setup.
- Support multiple locally saved ESPN leagues.
- Keep connection health, extension version compatibility, per-league refresh cooldown, and recovery guidance covered as the companion evolves.
- Add explicit disconnect and complete local-data deletion.

### Reliability

- Expand cache migrations whenever a persisted schema changes.
- Keep local desktop/mobile browser smoke tests and the post-deployment public URL smoke check green.
- Continue expanding the synthetic regular, superflex, playoff-final, partial-live, and offseason fixture matrix when new ESPN response shapes appear.
- Graceful partial-data behavior for every provider request.
- Keep deployment and extension rollback instructions current with the release workflow.

### Accessibility and performance

- Keep the automated WCAG 2.2 A/AA audit green and complete a manual assistive-technology review.
- Full keyboard operation and focus management.
- Screen-reader labels for recommendations, deltas, injuries, and status.
- Keep HTML, CSS, app-entry, sample-data, and total source-JavaScript budgets green; add runtime performance thresholds when production telemetry has an approved privacy policy.
- Reduced-motion behavior.

### Security and privacy

- Threat model for the Chrome companion and page bridge.
- Keep the automated least-privilege companion audit green; require manual review for any permission expansion.
- Content Security Policy suitable for the static site.
- Secret scanning and dependency review.
- Documented data deletion and extension removal.

Acceptance criteria:

- Full weekly workflow passes on desktop and mobile.
- Refresh failures preserve the last valid snapshot.
- No credentials, cookies, raw private payloads, or member identifiers enter repository fixtures or logs.
- Accessibility and security reviews have no unresolved high-severity findings.

Release exit: a trustworthy, accessible, read-only ESPN companion ready for regular in-season use.

---

## Release 1.1 — Trade analyzer

Goal: evaluate trades through lineup impact, depth, schedule, and uncertainty.

### Trade workspace

- Select players from actual league rosters.
- Support multi-player and multi-team structures only when league rules permit.
- Calculate weekly and ROS lineup impact for each team.
- Account for open roster spots and replacement-level free agents.
- Show bye, playoff schedule, depth, and risk changes.

### Presentation principles

- Avoid a single opaque “winner” grade.
- Show short-term and long-term outcomes separately.
- Display projection-source disagreement.
- Identify which assumptions drive the result.

Acceptance criteria:

- Every selected player belongs to the connected league.
- Both sides are evaluated under the same scoring and projection basis.
- The analyzer shows uncertainty and replacement effects.
- Missing ROS inputs block ROS conclusions.

---

## Release 1.2 — Notifications

Goal: notify managers only when a high-value action may be required.

Potential channels:

- local in-browser notifications;
- optional email, push, or task integration after separate consent and privacy review.

Requirements:

- User-configured quiet hours and urgency threshold.
- Deduplication and expiration.
- Clear source timestamp.
- No claim of background monitoring unless a real scheduler exists.
- Separate opt-in for every external notification channel.

Acceptance criteria:

- Notifications correspond to an active in-app alert.
- The user can disable and clear them.
- No league data is sent to a third party without explicit, specific consent.

---

## Release 2.0 — Optional confirmed ESPN actions

Goal: reduce manual effort without allowing silent or stale transactions.

Candidate actions:

- submit lineup changes;
- add or drop a free agent;
- submit a waiver claim;
- propose a trade.

Mandatory safety design:

1. Refresh ESPN state immediately before action preview.
2. Validate locks, eligibility, availability, and roster legality.
3. Show the exact ESPN changes and affected players.
4. Require confirmation immediately before submission.
5. Submit one bounded action.
6. Read ESPN again and present a success or failure receipt.
7. Never schedule or execute automatic transactions.

Release gate:

- The read-only product has operated reliably during a meaningful in-season period.
- ESPN write behavior is documented and fixture-tested.
- Security review covers replay, stale state, partial failure, and session handling.
- A transaction kill switch exists.

---

## Data-source gates

Advanced features must remain disabled until their data gates are satisfied:

| Feature | Required data |
| --- | --- |
| Floor/ceiling optimizer | Sourced floor and ceiling projections |
| ROS waivers | Compatible ROS projections and identity mapping |
| Strength of schedule | Documented NFL schedule and difficulty method |
| Trade analyzer | ROS values, schedule, league rosters, replacement pool |
| News summaries | Licensed or trustworthy timestamped news source |
| Win probability | Calibrated historical model and validation set |
| ESPN actions | Fresh authenticated state and validated write adapter |

No UI placeholder should imply that a gated capability already works.

## Testing expansion

### Domain tests

- lineup constraints and optimality;
- waiver legality and compatible move sets;
- identity reconciliation conflicts;
- confidence and freshness calculations;
- snapshot differences and alert deduplication;
- scenario isolation.

### Provider tests

- sanitized ESPN response variants;
- projection-source schema changes;
- missing and stale inputs;
- partial endpoint failures;
- provider identity conflicts.

### Browser tests

- connect, refresh, disconnect, and reconnect;
- start/sit, optimizer, waiver, and detail interactions;
- keyboard and mobile workflows;
- production asset-version behavior;
- extension-version mismatch guidance.

### Release tests

- automated unit suite;
- production URL smoke test;
- authenticated read-only Chrome verification;
- no-console-error check;
- clean Git worktree and successful deployment.

## Recommended next sprint: projection-backed season intelligence

Sprint objective: connect a trustworthy weekly projection export and extend season planning without weakening source or identity requirements.

Planned work:

1. Obtain a weekly projection export with provider-owned player IDs and explicit capture metadata.
2. Complete its provider-to-ESPN identity map without display-name joins.
3. Validate complete player-week coverage for selected planning horizons.
4. Add deeper bye, playoff-week, and schedule coverage explanations.
5. Expand waiver-rule modeling only where ESPN supplies authoritative inputs.
6. Keep model, keyboard/mobile, WCAG, security, and production gates green.

Sprint exit criteria:

- Incompatible or stale external inputs are visible and excluded or warned appropriately.
- Multiweek deltas appear only with complete mapped coverage for both rosters.
- Every projected value remains attributable to its source and capture time.
- All new domain and browser tests pass before deployment.
