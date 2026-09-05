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

Status: **Implemented for strict local imports, with a zero-cost weekly PPR acquisition path added in v0.9.57 and a guarded browser update path added in v0.9.62.** The app's provider-neutral weekly contract remains independent from ESPN ingestion. The DynastyProcess route retains the source-published PPR `r2p_pts` estimate, joins only through reviewed stable-ID evidence, requires explicit week approval because the upstream file omits an NFL week, records publication provenance, and excludes unresolved or ambiguous IDs rather than using names. The third-party weekly dataset is not bundled into the public site, and the PPR estimate is not relabeled as a custom ESPN-scoring projection.

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
- Zero-cost staging never guesses the omitted NFL week or repairs missing provider mappings by display name.

### Player detail view

Status: **Implemented for the current source contracts.** ESPN league facts, FantasyPros ROS rank metadata, and explicitly mapped external weekly projections render separately with capture provenance, week-by-week coverage, and honest missing, blocked, and unmapped states. Partial week coverage is never presented as a combined total.

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

Status: **Deterministic implementation complete for the supported snapshot contract; Release 1.0 field validation remains active.** Complete assignment search, duplicate prevention, supported-slot eligibility including OP/superflex, explicit ESPN locks, automatic ISO kickoff-time locks, missing-projection limitations, and UI explanations are implemented. Unparseable or missing kickoff times remain honestly unlocked. Real authenticated FLEX/OP and physical-device observations are now tracked through the v0.9.72 field-validation registry instead of keeping the optimizer implementation perpetually “in progress.”

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

Status: **Complete in v0.9.69 for the reviewed deterministic scope.** ESPN availability filtering, unlocked-bench-only drops, full legal-lineup simulation, cross-position replacement, current-week and projection-gated multiweek evaluation, acquisition-limit enforcement, explicit roster-size and provider-position limits, ESPN IR legality, no-drop IR-assisted adds, refresh-aware revalidation, transparent Pareto priority bands, future-only ordinary stash discovery, and exhaustive visible candidate enumeration are implemented. Real authenticated caps/limits, IR states, lock transitions, and candidate-scale observations are Release 1.0 field validation, not unfinished Waiver Engine v2 logic.

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

- Rank a small compatible presentation set after exhaustive legal candidate evaluation rather than silently capping discovery.
- Explain add value, drop cost, intended time horizon, and legal constraints.
- Show acquisition status when ESPN supplies it without claiming unsupported processing probability.
- Preserve no-drop IR-assisted provenance when that exact path is supported.

Acceptance criteria:

- Recommended players are available at refresh time.
- Every add/drop pair leaves a legal roster.
- The same player is not reused across a supposedly compatible set of moves.
- Rest-of-season or future claims disappear when the required data is missing.
- Refresh revalidates availability and relevant supported state, marks changed recommendations obsolete with the reason, and treats missing refresh inputs as unverified rather than inventing a failure.
- Future-only discovery cannot silently truncate the eligible add/drop search space.

Release exit: waiver guidance is legal, time-horizon aware, based on full-roster impact, and transparent about missing evidence.

---

## Release 0.8 — Decision timeline and alerts

Goal: tell the manager what changed and what requires action.

Status: **Feature-complete for the current snapshot contract through v0.9.56.** Two-snapshot local retention, deterministic differencing, team relevance filtering, identical-refresh suppression, lineup recommendation appearance/change/clear explanations, refresh-obsolete or unverified waiver recommendation explanations, acquisition-usage and waiver-setting changes, the **What Changed** timeline, week-scoped persistent alert dismissal/restoration, and kickoff-aware urgency ranking are implemented.

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

Status: **Core deterministic scope complete in v0.9.70.** Season Plan reports positional depth, known-bye coverage, ESPN-reported fantasy opponents, explicit or labeled fallback playoff-week boundaries, complete/partial schedule coverage, and complete-coverage future projection scenarios. Season/Playoff Intelligence separates four lenses: current-roster bye fillability, ESPN fantasy playoff opponents, a projection-gated optimized playoff window, and optional imported FantasyPros `SOS SEASON` / `SOS PLAYOFFS` stars. Missing projections or identity mappings block aggregate future claims; no opponent strength, hidden playoff score, or championship probability is invented. Real playoff/bye states are tracked under `FV-SEASON-01` for Release 1.0.

Goal: support roster construction beyond the immediate week.

### Schedule intelligence

- Strength-of-schedule views by position and week from an explicitly attributed source.
- Bye-week collision analysis.
- Fantasy playoff schedule views based on connected league settings.
- Starter and bench coverage across future weeks.

### Roster portfolio analysis

- Positional depth and replaceability.
- Bench utility through existing replacement and scenario views where supported.
- Injury and bye concentration from known facts only.
- Stacking and correlated exposure only as descriptive context if later added from explicit inputs.

### Scenario planner

- Compare holding, adding, dropping, or reviewed IR-assisted no-drop paths without modifying ESPN.
- Show weekly lineup impact across a selectable horizon only with complete mapped coverage.
- Separate baseline projections from scenario-derived changes.

Acceptance criteria:

- Playoff weeks come from connected league settings when available; local fallback is labeled.
- Schedule difficulty names its source and methodology.
- Scenario plans never mutate the cached ESPN snapshot.
- Missing future projections prevent future-score claims.
- Source-defined FantasyPros playoff SOS is not relabeled as the connected league's exact playoff window.

Release exit: managers can evaluate supported roster moves across the season and playoffs with visible assumptions.

---

## Release 1.0 — Production-grade read-only companion

Status: **Field validation active in v0.9.72.** v0.9.71 completed the automatable production-readiness engineering: accessible onboarding, multiple browser-local ESPN profiles, companion health/version compatibility, refresh cooldown and recovery guidance, cache migrations, complete local deletion, mobile-sync revocation semantics, Content Security Policy, browser smoke automation, automated WCAG 2.2 A/AA checks, 200%-equivalent and 390px reflow auditing, Chrome companion v0.2.2 threat hardening/auditing, performance/security gates, lifecycle/recovery regression coverage, and post-deployment production smoke. v0.9.72 defines the remaining human and authenticated-real-state work as a finite evidence-backed registry in `config/field-validation.json` and `docs/field-validation.md`.

Goal: graduate the read-only product from a personal connected preview to a reliable weekly tool.

### Connection and onboarding

- Replace hard-coded league configuration with local league ID, season, and team setup.
- Support multiple locally saved ESPN leagues.
- Keep connection health, extension version compatibility, per-league refresh cooldown, and recovery guidance covered as the companion evolves.
- Add explicit disconnect and complete local-data deletion.

Status: **Implemented; live reconnect/failure observation remains under `FV-RECOVERY-01`.**

### Reliability

- Expand cache migrations whenever a persisted schema changes.
- Keep local desktop/mobile browser smoke tests and the post-deployment public URL smoke check green.
- Continue expanding the synthetic regular, superflex, playoff-final, partial-live, and offseason fixture matrix when new ESPN response shapes appear.
- Graceful partial-data behavior for every provider request.
- Keep deployment and extension rollback instructions current with the release workflow.

Status: **Automated contracts complete; authenticated field states are tracked by `FV-ESPN-01` through `FV-ESPN-05`, `FV-SEASON-01`, `FV-RECOVERY-01`, `FV-SYNC-01`, and `FV-WAIVER-01`.**

### Accessibility and performance

- Keep the automated WCAG 2.2 A/AA audit green and complete a manual assistive-technology review.
- Full keyboard operation and focus management.
- Screen-reader labels for recommendations, deltas, injuries, and status.
- Keep focused HTML, CSS, app-entry, and sample-data budgets green; report aggregate browser JavaScript graph size as a trend signal rather than a deployment-blocking hard cap. Add runtime performance thresholds when production telemetry has an approved privacy policy.
- Reduced-motion behavior.

Status: **Automated browser/WCAG/reflow gates complete; `FV-A11Y-01`, `FV-A11Y-02`, `FV-A11Y-03`, and `FV-MOBILE-01` track the remaining human/device checks.**

### Security and privacy

- Threat model for the Chrome companion and page bridge.
- Keep the automated least-privilege companion audit green; require manual review for any permission expansion.
- Content Security Policy suitable for the static site.
- Secret scanning and dependency review.
- Documented data deletion and extension removal.

Status: **Automated least-privilege boundary complete for unpacked companion v0.2.2. Chrome Web Store packaging/privacy/distribution review is a separate gate only if distribution expands before 1.0.**

Acceptance criteria:

- every item in `config/field-validation.json` is `passed` with privacy-safe evidence;
- full weekly workflow passes across the registered desktop/mobile/assistive-technology and authenticated ESPN field paths;
- refresh failures preserve the last valid snapshot and live failure/reconnect behavior is observed honestly;
- no credentials, cookies, raw private payloads, member identifiers, or private sync secrets enter repository fixtures, logs, or field evidence;
- accessibility, privacy, security, ESPN-normalization, waiver-legality, and season-planning review has no unresolved high-severity finding;
- newly observed deterministic provider shapes or reproduced defects become permanent regression coverage where practical.

Release exit: after `npm run field:status -- --require-complete` succeeds, the exact final 1.0 PR head must pass the protected test job and post-merge `master` must pass test, deploy, and production verification. The product remains read-only.

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
| Strength of schedule | Explicit imported or documented NFL schedule-difficulty source/method |
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
- scenario isolation;
- field-validation registry integrity.

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
- extension-version mismatch guidance;
- deployment-blocking responsive/reflow checks.

### Release tests

- automated unit suite;
- model safety fixtures;
- browser/WCAG/reflow/extension/performance/security audits;
- production URL smoke test;
- evidence-backed field registry for the 1.0 milestone;
- clean protected-branch PR/merge/deploy workflow.

## Completed sprint: modular browser shell and atomic imports

Status: **Shipped in v0.9.49.** The browser shell is modular, guided projection imports are atomic and inspectable, and all size, desktop/mobile, keyboard, accessibility, and safety gates pass.

Sprint objective: create safe capacity for remaining features and finish the trust boundary around accumulating weekly CSV imports.

Planned work:

1. Split `src/app.js` into focused rendering, event-binding, and projection-import modules with explicit dependencies.
2. Keep snapshot ownership and application state centralized.
3. Preflight projection and identity-map merges together so conflicts cannot partially update caches.
4. Render added, updated, retained, ignored, and conflicted import counts plus capture range and week-level provenance.
5. Test repeated imports, idempotency, older/newer records, conflicts, mobile operation, and keyboard focus.
6. At the time of this sprint, keep the browser graph at or below 220 KiB while reducing `src/app.js` below 60 KiB. Current policy retains the focused app-entry budget but treats aggregate browser-graph size as informational.

Sprint exit criteria:

- The guided importer updates both caches or neither cache.
- Weeks accumulate without older records overwriting newer records.
- Users can inspect what changed and why a record was rejected.
- All required repository gates pass and the deployed production URL is verified.

## Recommended next sprint: complete Release 1.0 field validation

Use `npm run field:status` as the live checklist and complete the registered checks with privacy-safe evidence as real devices, assistive technology, ESPN league states, failure conditions, and projection coverage become available. Continue using the one-click DynastyProcess browser workflow for each actually published week; projection accumulation and field validation can proceed together.

Do not mark a field check passed because a synthetic test covers the same rule. Do not commit private ESPN payloads or secrets as evidence. If a real observation exposes a new provider shape or deterministic defect, reproduce it with sanitized fixture data, add regression coverage, fix it on a protected task branch, and retest the field item before marking it passed.
