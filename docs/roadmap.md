# The Chip Winner Product Roadmap

## Product goal

The Chip Winner should become a trustworthy, ESPN-only in-season fantasy football command center. It should help a manager understand the current week, identify decisions that need attention, compare reasonable alternatives, and act with clear knowledge of where every fact and recommendation came from.

The product is not intended to guarantee outcomes or conceal missing data. It should prefer an honest “not available” state over an unsupported recommendation.

## Guiding principles

1. **ESPN owns league state.** Teams, rosters, lineup slots, matchups, league settings, transactions, and player availability come from ESPN.
2. **Projection sources remain independent.** ESPN projections and future third-party projections are overlays, not part of ESPN league ingestion.
3. **Source facts and recommendations never mix.** Imported facts remain immutable; derived recommendations include their inputs, source, timestamp, and limitations.
4. **Read-only before write access.** The product must prove reliable league ingestion before attempting lineup or waiver transactions.
5. **Identity errors fail visibly.** Players are joined through stable IDs. A display-name guess is never silently accepted.
6. **Mobile is a primary surface.** Weekly decisions frequently happen near kickoff and must work comfortably on a phone.
7. **Every release is testable.** A milestone is complete only when its acceptance criteria and automated checks pass.

## Current baseline — Foundation preview

Status: **Complete and deployed with browser-local ESPN league onboarding**

The deployed preview includes:

- responsive roster and matchup dashboard;
- starter and bench views;
- lineup comparisons with lineup-slot eligibility;
- waiver, injury, and bye-week sections;
- normalized ESPN snapshot contract and JSON Schema;
- imported snapshot validation and browser-local caching;
- explicit ESPN position and lineup-slot mappings;
- independent projection-provider contract;
- data freshness and coverage indicators;
- automated GitHub Pages deployment;
- 313 automated permanent tests plus 21 deployment-blocking model safety fixtures covering league normalization, lineup and waiver legality, ESPN IR eligibility/roster validity, IR-assisted no-drop waiver paths, multiweek IR-retained scenario safety, future add/drop legality transitions, transparent waiver priority, future-only stash discovery, waiver transition/scale closeout, season/playoff intelligence, bye-slot ambiguity, projection-gated playoff aggregates, acquisition limits, identity reconciliation, projection imports, provider-ID supersession, zero-cost DynastyProcess staging, classified unresolved rows, encrypted sync, snapshot differencing, season planning, accessibility, browser behavior, local-data deletion, and the guarded one-click weekly projection update workflow.

Additional connected foundation capabilities now include:

- authenticated read-only access to a locally configured private ESPN league through the Chrome companion, including safe local parsing of ESPN team URLs;
- real team, roster, matchup, projection, injury, free-agent, and waiver data;
- public NFL opponent and kickoff context;
- non-conflicting waiver recommendations with acquisition status;
- projection thresholds that suppress marginal lineup churn;
- interactive start/sit comparison with preference, near-tie, and missing-data states;
- connected league scoring, lineup-slot, and waiver settings;
- ESPN IR eligibility intelligence using current ESPN injury designation, current IR assignment, and configured IR capacity, including OUT/IR placement, Q/D grandfathering, invalid healthy/ineligible IR blockers, and fail-closed unknown states;
- explicit current-week IR-assisted waiver paths that can move a supported unlocked bench player into an open ESPN IR slot and then add an ESPN-available player without dropping a rostered player when the complete two-step simulation remains legal;
- fail-closed multiweek IR-assisted Season Plan scenarios that retain the injured player in IR, keep the add as a no-drop path, revalidate against current ESPN waiver legality, and expose weekly or horizon deltas only when both baseline and full simulated rosters have complete player-week projection coverage;
- fail-closed ordinary multiweek add/drop scenarios that may model future value independently from the current-week action threshold while still requiring current ESPN availability, unlocked add/drop players, non-exhausted known acquisition capacity, a supported current IR roster state, and compliance with explicit roster-size and provider-position limits;
- transparent Pareto-band waiver prioritization across current-week gain, complete selected-horizon future gain, positive future-week rate, replacement value, same-position depth context, and roster preservation without a hidden weighted score;
- projection-gated future-only ordinary add/drop stash discovery for ESPN-available players that remain below the current-week action threshold but produce a positive fully covered selected-horizon lineup delta after current ESPN legality is revalidated;
- deterministic current-versus-future lock separation: current transaction legality honors ESPN locks and current kickoff time, while future-week utility does not reuse a current-week kickoff timestamp as an invented future lock;
- exhaustive future-only add/drop enumeration with visible `consideredAdds`, `completeAdds`, `scenarioCount`, and `qualifiedAdds` diagnostics rather than a hidden candidate cap;
- season/playoff intelligence that keeps known-bye roster fillability, ESPN fantasy playoff opponents, complete-coverage future projection outlook, and imported FantasyPros position-specific SOS stars as separate inspectable lenses rather than one opaque playoff score;
- bye-week capacity analysis that reports the maximum starter-slot fill count and, when FLEX eligibility creates multiple equally valid assignments, exposes every slot type that could be affected instead of inventing a unique gap;
- projection-gated playoff totals, high/low weeks, stable starters, and starter turnover that are withheld unless every configured playoff week has complete mapped baseline-roster coverage;
- optional FantasyPros `SOS SEASON` and `SOS PLAYOFFS` display from the user-imported ROS CSV without scraping or claiming the source-defined playoff field matches this ESPN league's exact configured playoff window;
- PUP handling keyed to ESPN's fantasy designation rather than blindly mirroring the NFL reserve list: an NFL PUP player qualifies when ESPN surfaces OUT/IR, while a bare raw PUP status remains unverified;
- a documented local-only privacy boundary;
- versioned browser modules for reliable production updates;
- deployed end-to-end encrypted mobile snapshot synchronization through Cloudflare Workers KV;
- locally derived change detection between the two most recent valid ESPN snapshots;
- a team-filtered **What Changed** timeline for roster, lineup, injury, projection, availability, matchup-score, and refresh-obsolete waiver recommendation changes;
- a one-click browser workflow that checks the latest public DynastyProcess weekly PPR publication, uses ESPN's current week as the explicit target, preserves prior weeks, and commits projection and identity updates atomically.

The website retains sample and manual-import modes for development. The configured private league can authenticate and refresh through the local Chrome companion. The product remains deliberately read-only and makes no ESPN transactions.

---

## Phase 1 — Reliable ESPN league connection

Goal: replace manual sample usage with a trustworthy, read-only ESPN league refresh.

### 1.1 Raw ESPN capture fixtures

- Capture sanitized examples for public and private leagues.
- Cover multiple scoring systems, roster sizes, flex configurations, divisions, and matchup states.
- Keep raw fixtures separate from normalized snapshots.
- Remove cookies, member names, email addresses, and other personal data.

Acceptance criteria:

- At least five materially different fixtures normalize successfully.
- A fixture cannot contain credentials or personal identifiers.
- Unsupported ESPN values produce explicit errors containing the field and source value.

### 1.2 ESPN response normalizer

- Translate real ESPN response shapes into snapshot contract v1.
- Normalize numerical lineup-slot and position IDs.
- Normalize team records, current scoring period, matchup scores, player ownership, and availability.
- Preserve missing projections, injury details, and NFL schedule data as missing.
- Retain capture timestamp and source endpoint metadata.

Acceptance criteria:

- Normalization is deterministic and fixture-tested.
- No interface code reads raw ESPN response fields.
- All normalized output passes runtime and schema validation.
- Unknown IDs fail visibly and never map to a guessed value.

### 1.3 Connection experience

- Add a first-run setup screen.
- Support league ID and season input for public leagues.
- Design a safe private-league connection path without storing ESPN credentials in the website bundle.
- Show connection, refresh, stale, partial, and failure states.
- Allow users to disconnect and clear locally cached league data.

Acceptance criteria:

- A user can connect, refresh, disconnect, and recover from failure.
- Private credentials are never committed, logged, or transmitted to an unrelated service.
- The dashboard clearly shows the league, season, selected team, source, and refresh time.

### 1.4 Cache and refresh policy

- Store the most recent valid snapshot locally.
- Keep the last valid snapshot if a refresh fails.
- Apply a short refresh cooldown to avoid unnecessary ESPN traffic.
- Make stale data visually distinct without blocking access.

Acceptance criteria:

- Refresh failure cannot destroy the last valid snapshot.
- The UI never labels cached data as live.
- Cache migrations are versioned and tested.

Phase 1 release definition: a manager can connect an ESPN league and reliably view current league state without importing JSON manually.

---

## Phase 2 — Complete weekly command center

Goal: make the dashboard sufficient for a manager’s weekly review.

### 2.1 Full league and roster modeling

- Model custom starting slots, multiple flex types, injured reserve, and league-specific limits.
- Add league standings and playoff position.
- Add all weekly matchups, current scores, and remaining players.
- Support completed, live, upcoming, and postponed NFL games.

Acceptance criteria:

- Custom lineup configurations render correctly from league settings.
- Partial matchup totals are never presented as complete projections.
- The selected week can be changed without mutating the active league snapshot.

### 2.2 Weekly overview

Status: **Implemented for the current snapshot contract.** The overview combines exact configured-slot vacancies, unresolved starter injury and bye flags, reported game locks, kickoff-aware urgency, missing-projection gaps, and explicit missing-time limitations into a linked weekly checklist.

- Summarize projected matchup range and remaining player exposure.
- Show unresolved starter injuries, empty lineup slots, byes, and players whose games have started.
- Add a kickoff-aware decision checklist.
- Rank alerts by urgency and actionability.

Acceptance criteria:

- Every alert links to the relevant player or decision view.
- Locked players are visually and logically excluded from suggested changes.
- Missing NFL game times disable time-sensitive claims.

### 2.3 Player detail surface

Status: **Implemented for ESPN facts, FantasyPros ROS ranks, and explicitly mapped external weekly projections.** Player detail shows every imported week and mapped-week coverage without summing partial data. External values remain separate from ESPN projections and show provider, scoring basis, capture time, blocked compatibility, missing week, and missing mapping states.

- Display player identity, team, position, opponent, status, bye, recent scoring, and source-specific projections.
- Show source timestamps and missing fields.
- Include roster status and eligibility within the connected ESPN league.

Acceptance criteria:

- Conflicting sources are displayed separately.
- Player identity provenance is inspectable.
- No unverified news or injury detail appears as fact.

Phase 2 release definition: a manager can complete a reliable weekly roster review from one dashboard.

---

## Phase 3 — Recommendation engine v1

Goal: provide transparent decision support using only reliable available inputs.

### 3.1 Lineup optimization

- Build a constraint-based optimizer from the league’s actual lineup slots.
- Account for player locks, eligibility, byes, injuries, and missing projections.
- Compare current and optimized lineups.
- Explain every suggested move and projected difference.

Acceptance criteria:

- A player can occupy only one slot.
- Every generated lineup satisfies the connected league’s constraints.
- The optimizer returns “insufficient data” when a required comparison is unsupported.
- Brute-force fixture tests confirm optimality for small rosters.

### 3.2 Start/sit comparisons

Status: **Implemented for current ESPN and explicitly mapped external weekly inputs.** ESPN and external projection comparisons render independently so disagreement stays visible. Missing mappings, missing weekly values, or incompatible external sources withhold the external lean. Comparisons separate projection edge from a reproducible data-confidence score based on projection, injury, opponent, kickoff, and snapshot-freshness completeness. The interface explains every reduction and states that confidence is not an outcome probability.

- Compare two or more eligible players across available projection sources.
- Show projection spread, floor/ceiling only when supplied, injury status, opponent, game time, and source freshness.
- Provide a concise recommendation explanation with confidence derived from input completeness—not invented certainty.

Acceptance criteria:

- Recommendation confidence falls when sources are stale, conflicting, or incomplete.
- Every displayed number is traceable to a named source.
- Users can inspect why one player was favored.

### 3.3 Waiver recommendations

- Use ESPN league availability as the authoritative candidate pool.
- Compare adds against legal drop candidates.
- Respect roster limits, position constraints, waiver rules, and locked players.
- Separate short-term lineup help from rest-of-season value when corresponding inputs exist.

Acceptance criteria:

- An unavailable player is never recommended.
- An illegal drop is never recommended.
- Add-only and drop-only states are supported without forced pairings.
- Missing rest-of-season data prevents rest-of-season claims.

Phase 3 release definition: every recommendation is legal, explainable, sourced, and appropriately limited by missing data.

---

## Phase 4 — Projection and news ecosystem

Goal: improve recommendation quality without coupling external sources to ESPN league state.

### 4.1 External projection integration

- Implement the existing projection-provider contract.
- Add stable external player-ID mappings and reconciliation reports.
- Preserve each source independently before creating consensus views.
- Support weekly and rest-of-season projection types separately.

Acceptance criteria:

- Unresolved identities are reported and excluded.
- Projection source, scoring basis, and timestamp accompany every value.
- Removing an external provider does not affect ESPN league ingestion.

### 4.2 Injury and availability feed

- Add a licensed or otherwise trustworthy news/injury source.
- Track source timestamp and update history.
- Distinguish official status from practice participation and commentary.
- Add kickoff-proximity notifications inside the application.

Acceptance criteria:

- Stale news is labeled.
- No generated summary changes the underlying official designation.
- Contradictory reports remain separately attributable.

### 4.3 Recommendation confidence

Status: **Partially implemented.** Start/sit comparisons expose deterministic input completeness and freshness separately from projected advantage. Cross-provider agreement remains unavailable until multiple compatible projection sources exist.

- Calculate input-completeness and source-agreement scores.
- Separate data confidence from projected point advantage.
- Present uncertainty in plain language.

Acceptance criteria:

- Confidence can be reproduced from documented inputs.
- Confidence never implies probability of winning unless a calibrated model exists.

Phase 4 release definition: the product combines ESPN league state with independently sourced projections and timely player information while preserving provenance.

---

## Phase 5 — Advanced in-season tools

Goal: expand beyond immediate lineup decisions.

### 5.1 Rest-of-season roster planning

Status: **Season/playoff intelligence implemented in v0.9.70; broader bench utility continues through existing waiver/replacement views.** The Season view now separates current-roster bye fillability, ESPN fantasy playoff opponents, complete-coverage optimized playoff projections, and optional user-imported FantasyPros position-specific SOS stars. No composite playoff score is produced.

- Strength-of-schedule views by position.
- Upcoming bye conflicts and roster coverage.
- Playoff-week schedule planning.
- Bench utility and replaceability views.

### 5.2 Trade analysis

- Validate that all players belong to the connected league.
- Compare weekly lineup impact, depth, bye distribution, and rest-of-season values.
- Support multi-team and multi-player proposals only when league settings allow them.
- Avoid a single opaque “winner” score.

### 5.3 League intelligence

- Roster needs across opponents.
- Recent adds/drops and transaction patterns.
- Standings scenarios and playoff leverage.
- Manager-neutral views that do not expose unavailable private information.

Phase 5 release definition: planning tools improve future roster decisions without overstating forecast certainty.

---

## Phase 6 — Optional ESPN actions

Goal: allow carefully controlled actions only after the read path is proven.

Potential actions:

- submit lineup changes;
- add or drop a player;
- place a waiver claim;
- propose a trade.

Required safeguards:

- explicit preview of every change;
- user confirmation immediately before submission;
- revalidation against fresh ESPN state;
- detection of player locks and changed availability;
- clear success, partial-success, and failure receipts;
- no background or automatic transactions.

Phase 6 should not begin until the read-only integration has operated reliably across a full season segment.

---

## Cross-cutting workstreams

### Security and privacy

- Never place ESPN cookies or credentials in repository files, URLs, analytics, or client logs.
- Define retention and deletion behavior before server-side storage exists.
- Add dependency and secret scanning when external packages or services are introduced.
- Create a threat model before private-league authentication ships.

### Accessibility

- Target WCAG 2.2 AA for contrast, keyboard operation, focus, semantics, and motion.
- Test at 200% zoom and common mobile viewport sizes.
- Ensure status is never communicated through color alone.

### Performance

- Keep the initial dashboard usable on a mid-range phone connection.
- Keep focused HTML, CSS, app-entry, and sample-data budgets as deployment-blocking guardrails.
- Measure the aggregate browser JavaScript graph as an informational trend rather than a hard release cap.
- Add runtime interaction thresholds only after production telemetry has an approved privacy policy.
- Cache static assets while ensuring league data freshness remains visible.

### Observability

- Add privacy-conscious error reporting only after a policy and opt-out are defined.
- Track normalization failures by anonymous error category, not raw league payload.
- Monitor deployment health and public-page availability.

### Testing

- Unit tests for models, selectors, reducers, mappings, and recommendations.
- Fixture tests for every supported ESPN response variant.
- Browser tests for navigation, import, disconnect, refresh, and missing-data states.
- Mobile layout and keyboard-accessibility checks.
- Deployment smoke test against the production URL.

## Suggested delivery sequence

| Release | Primary outcome | Depends on |
| --- | --- | --- |
| 0.2 | Real ESPN fixture normalization | Current foundation |
| 0.3 | Read-only public-league connection | 0.2 |
| 0.4 | Safe private-league connection | Security design + 0.3 |
| 0.5 | Complete weekly dashboard | 0.4 |
| 0.6 | Constraint-based lineup optimizer | League settings + player locks |
| 0.7 | Legal waiver recommendations | Reliable availability + roster rules |
| 0.8 | External projections | Identity reconciliation |
| 0.9 | Injuries, confidence, and production hardening | Trusted external feeds |
| 1.0 | Trustworthy read-only in-season companion | Full-season validation |
| 2.0 | Optional confirmed ESPN actions | Proven read path + action safeguards |

## Current execution plan — after v0.9.70

The original Phase 1 sprint is complete. Work should now proceed in dependency order.

### P0 — Split the browser application entry point

Status: **Complete in v0.9.49.** Section rendering, shell event binding, and projection-import transactions now use focused modules with explicit dependencies. The application store remains the single snapshot and UI-state owner. `src/app.js` remains below the focused 60 KiB budget. The aggregate browser graph was kept within the historical 220 KiB sprint constraint at the time; current policy measures that aggregate graph as an informational trend instead of a release blocker.

Historical rationale: before the split, the browser JavaScript graph measured 218.0 KiB against the then-220 KiB cap and `src/app.js` was 78.7 KiB against an 80 KiB budget.

Tasks:

1. Extract section renderers, event binding, and projection-import orchestration into focused modules.
2. Keep one application state owner; extracted modules receive explicit dependencies and cannot retain hidden snapshot copies.
3. Add focused unit tests and browser coverage for navigation, player detail, and projection import.
4. Preserve focused static-asset budgets; use aggregate browser-graph size as a trend signal rather than a hard cap.

Acceptance criteria:

- `src/app.js` is below 60 KiB and primarily performs composition and top-level coordination.
- The aggregate browser graph remains measured and inspectable without serving as a hard release cap.
- Desktop/mobile smoke and accessibility checks show no regression.

### P0 — Make multiweek imports atomic and inspectable

Status: **Complete in v0.9.49.** Guided imports preflight projections and identity mappings before either write, roll both caches back on commit failure, classify deterministic merge outcomes, and expose capture ranges plus week-level provenance in League Setup.

Tasks:

1. Preflight projection and identity-map merges before writing either cache.
2. Report added, updated, retained, ignored-older, and rejected-conflict records.
3. Show oldest/newest retained capture times and per-week capture provenance.
4. Keep guided weekly import as merge-by-default; add a confirmed replace-all workflow separately.
5. Prove with tests that a failed merge cannot partially alter either cache.

Acceptance criteria:

- An import updates both caches or neither cache and identical re-import is idempotent.
- Older data cannot overwrite newer data.
- Equal-time projection conflicts and ambiguous IDs fail visibly without data loss.

### P1 — Complete real projection coverage

Status: **Partially implemented through v0.9.70.** Season Plan renders an exact roster-and-ESPN-candidate coverage matrix across the selected horizon and distinguishes missing identity mappings from missing player-week projections. The free DynastyProcess path retains the source-published PPR `r2p_pts` signal, stable FantasyPros-to-ESPN IDs, the explicit D/ST team bridge, fail-closed reviewed athlete bridges, and explicit provider-ID supersession. v0.9.61 added classification-only diagnostics for rows that remain unresolved without weakening identity rules. v0.9.62 makes the same staging logic available directly in the browser: a real cached ESPN snapshot supplies the authoritative season/current week, the site checks the public latest publication on startup/ESPN refresh/focus, and the user explicitly approves **Update Week X projections** or **Refresh Week X projections**. Because the source file omits its NFL week, the click remains the explicit assignment boundary. Once Week N-1 is stored, Week N is blocked until the publication is newer than the prior-week capture; publications older than eight days are also blocked. Successful updates retain prior weeks, expand the planning horizon, save a local provenance receipt, and commit projections plus identity mappings through the existing atomic transaction. The browser sends no ESPN credentials or league payload to the public source hosts and does not mirror the weekly dataset into the site. Generic source `PPR` is compatible with ESPN labels in the same PPR scoring family without relabeling source metadata. Under the verified 2026-09-04 Week 1 source state, stable coverage remains **648/682 mapped (95.01%)**, D/ST 32/32, K 32/34, with 34 unsupported/unresolved source rows excluded rather than forced.

A temporary live Chrome canary validated the actual browser path before release: the current source and publication endpoints returned HTTP 200, the control became **Update Week 1 projections**, the click imported 648 Week 1 projection records through the normal caches, and the receipt recorded 648/682 with 34 unresolved. The temporary canary was removed; the current permanent suite is 313 tests.

1. During the season, refresh/connect ESPN and use the browser update control when a fresh weekly source publication becomes available.
2. Preserve the explicit first-import approval and prior-week publication guard; do not infer or schedule an upstream week assignment.
3. Review unresolved classifications/coverage only when a decision-relevant ESPN player is actually missing; never repair gaps by display name.
4. Keep the CLI stager as a recovery/audit path rather than the normal user workflow.
5. For future provider-ID rollovers, require explicit reviewed predecessor-to-replacement evidence and exact stable ESPN identity evidence.
6. Enable multiweek deltas and playoff-window aggregates only when the relevant baseline and simulated rosters have complete mapped coverage for every selected week, including every retained IR player in an IR-assisted scenario.

Acceptance criteria: every used value includes provider, scoring, season, explicitly approved week, provider ID, points, and capture/publication provenance; incompatible scoring blocks comparisons; missing or ambiguous IDs remain excluded; weekly browser updates never send ESPN private data to the source hosts; stale prior-week publications cannot be silently relabeled as the next ESPN week; projection and identity caches commit atomically; prior weeks remain available; partial coverage never produces a summed advantage; third-party weekly source data is not bundled into the public site.

### P1 — Finish season and playoff intelligence

Status: **Complete in v0.9.70 for the reviewed deterministic scope.** The normalized ESPN contract preserves only explicitly supplied playoff-week arrays and rejects malformed values. ESPN-reported playoff weeks override browser-local fallback; when ESPN omits them, Season Plan requires a clearly labeled league-and-season-scoped local selection and never derives a boundary from schedule length or matchup numbering. The Season view now presents four independent lenses: current-roster bye fillability, the ESPN fantasy playoff opponent slate, a complete-coverage optimized playoff projection window, and optional imported FantasyPros position-specific season/playoff SOS stars. No composite playoff score is produced.

v0.9.70 closes the previously open schedule-difficulty methodology by using only explicit `SOS SEASON` and `SOS PLAYOFFS` star values already present in the user-imported FantasyPros ROS CSV. FantasyPros' 2026 public methodology describes fantasy SOS as position-specific Fantasy Points Allowed adjusted for strength of schedule and uses matchup star ratings for favorable/difficult context. The Chip Winner does not scrape those pages or recompute the provider methodology. Because the imported CSV does not prove the exact week range behind `SOS PLAYOFFS`, that field is labeled as **FantasyPros playoffs** and is not claimed to match the ESPN league's configured playoff weeks. Missing stars remain unavailable.

Bye coverage uses ESPN roster slots, player positions, and explicit bye weeks to calculate the maximum number of configured starter slots the current non-IR roster can fill after known bye players are removed. When flexible slot eligibility permits multiple equally valid maximum lineups, the engine reports the uncovered-slot count plus every slot type that could be affected instead of inventing one unique uncovered position. Missing bye weeks remain uncertainty.

The playoff projection window reruns the legal lineup optimizer for every configured playoff week using only compatible explicitly mapped weekly projections. Weekly totals are blocked when baseline roster coverage is incomplete. Window total, average, high/low week, stable-starter count, and adjacent-week starter turnover are withheld unless **every** configured playoff week is complete; partial weeks are never summed or zero-filled.

Implementation is closed. Remaining work is seasonal evidence accumulation and field validation:

1. Accumulate real weekly projection publications so more configured playoff weeks become fully evaluable without weakening identity or completeness rules.
2. Validate bye coverage, playoff opponent rendering, local playoff fallback, and imported SOS availability against materially different authenticated ESPN league states.
3. Re-review the external SOS methodology before broadening beyond the existing imported FantasyPros star fields or before claiming an exact league-specific playoff window.
4. Treat playoff qualification probability, championship odds, and opponent win probability as separate future modeling work requiring calibrated inputs; v0.9.70 does not infer them.

Acceptance criteria: ESPN remains authoritative for fantasy schedule and playoff weeks when supplied; local fallback is labeled and never overrides an explicit ESPN boundary; known-bye roster gaps respect legal slot eligibility and do not invent an exact FLEX assignment where multiple maximum lineups are equivalent; unknown bye weeks remain unknown; every playoff projection aggregate requires complete mapped coverage for every configured week; FantasyPros SOS remains independently attributed and cannot alter ESPN facts or weekly projection totals; source-defined `SOS PLAYOFFS` is not relabeled as this league's exact playoff schedule; no single hidden playoff score or win probability is produced. See `docs/season-playoff-intelligence.md`.

### P1 — Complete waiver engine v2

Status: **Complete in v0.9.69.** Live ESPN normalization preserves explicit roster-size and provider-position limits, and waiver simulations enforce them without inferring absent rules. Current-week candidates show a transparent replacement benchmark: the add projection minus the highest projected other ESPN-available player at the same position. Missing comparable players keep the benchmark unavailable and replacement value remains separate from legal-lineup gain. Refresh-aware recommendation revalidation reconstructs prior current-week advice from the previous valid capture and checks the latest ESPN availability, roster legality, locks, acquisition limits, explicit roster rules, and current projected lineup gain.

v0.9.63 added authoritative ESPN IR eligibility/roster-validity handling from already-normalized ESPN facts: OUT and INJURED_RESERVE support new IR placement; QUESTIONABLE/DOUBTFUL may remain when already in IR but cannot be newly moved there; SUSPENSION and healthy/no-designation states are ineligible; unsupported injury states fail closed. A raw `PHYSICALLY_UNABLE_TO_PERFORM` value is explicitly **unverified** unless ESPN also surfaces a qualifying OUT/IR fantasy designation, because NFL PUP status and ESPN Fantasy IR eligibility are not assumed to be identical. Current invalid IR occupants block new waiver recommendations and obsolete prior advice because ESPN documents that a healthy/ineligible IR roster can prevent acquisitions. Generic `eligibleSlots` remains excluded as health evidence. See `docs/ir-eligibility.md`.

v0.9.64 promotes open IR capacity into an explicit current-week **IR-assisted add** scenario. When ESPN proves an open IR slot plus an eligible unlocked bench player, the engine simulates `BE -> IR`, then adds an ESPN-available unlocked player into the freed active-roster space with `drop: null`. The two-step simulation enforces acquisition limits, roster size, provider-position limits, locks, current availability, and the normal projected-lineup action threshold. If an equivalent add/drop and no-drop IR path produce the same lineup gain, the no-drop path is preferred so the app does not recommend discarding a rostered player unnecessarily. Waiver Wire labels the plan **IR-ASSISTED ADD** and **MOVE TO IR · NO DROP** rather than disguising it as a normal swap.

IR-assisted advice is revalidated as a two-step plan after ESPN refreshes. Lost IR capacity, a changed injury designation, a lock, changed availability, exhausted acquisition capacity, roster/position-limit changes, or insufficient projected gain can make the prior plan obsolete; unsupported status evidence keeps it unverified. The **What Changed** timeline preserves the explicit IR move and never invents a drop.

v0.9.65 extends the multiweek scenario planner and Season Plan for those same explicit IR-assisted paths. A future IR simulation first proves the matching current ESPN-derived `ir-assisted-add` recommendation still exists, moves only the supported unlocked bench player into IR, and adds the ESPN-available target without a drop. The simulated roster retains both players, so projection coverage is evaluated across the full roster state rather than pretending the injured player disappeared. Weekly and horizon deltas are withheld when either the baseline or simulated roster lacks any required player-week value. Season Plan labels current-week and future IR paths as **move to IR · no drop** and no longer assumes every waiver scenario contains `drop` data.

v0.9.66 closes the corresponding legality gap for ordinary future add/drop inputs. Before a multiweek add/drop is simulated, the planner verifies that ESPN still reports the add available, both add and drop are unlocked at one shared evaluation time, the drop remains on the selected bench, acquisition capacity is not proven exhausted, the current IR roster state is supported, and the resulting roster obeys every explicit ESPN size and provider-position limit. This legality gate is intentionally separate from the current-week action threshold: a move that is not useful this week may still be evaluated for future value when its current ESPN transaction state is legal. Unsupported future scenario kinds fail closed rather than defaulting to add/drop. IR-assisted future paths retain the stricter current matching-recommendation requirement because their two-step eligibility/capacity semantics are current-state dependent.

v0.9.67 adds a transparent waiver priority board. It uses Pareto priority bands rather than a hidden weighted score. Current-week lineup gain, selected-horizon future gain, positive future-week rate, current replacement value, exact same-position roster depth context, and IR/no-drop preservation remain separately inspectable. A move outranks another only when it is no worse on every fully comparable known factor and better on at least one. Missing future or replacement evidence stays missing and cannot become zero or create an advantage.

v0.9.68 broadens discovery to ordinary **future-only add/drop stashes** without weakening the current-week action threshold. Discovery begins only when selected future weeks, a compatible future projection set, and an explicit identity map exist. Every player on the current roster must have complete selected-week coverage before any future-only search is admitted. The add must be ESPN-available, unlocked, have a known current-week projection, and have complete selected-week coverage; the drop must be an unlocked current bench player. Every generated add/drop pair is passed through the existing scenario planner so acquisition exhaustion, current IR roster validity, roster size, provider-position limits, availability, and locks remain authoritative. A candidate qualifies only when its current-week lineup gain is below 0.5 points and its completely covered selected future horizon delta is positive. The board keeps the best fully covered legal drop path for each future-only add and then ranks those stashes alongside current-week candidates using the same Pareto policy. Waiver Wire labels them **FUTURE STASH · ADD / DROP**. Future-only IR-assisted discovery remains intentionally outside this release; IR paths retain the stricter current validated no-drop recommendation requirement.

v0.9.69 closes the deterministic v2 implementation with an explicit transition and scale matrix. Availability loss, kickoff transitions, all-bench-drop locks, known-invalid IR occupants, raw-PUP/unverified IR occupants, available-player permutation, source-snapshot immutability, missing-future-input regression, and larger candidate enumeration are covered directly. A 24-add × 4-drop synthetic pool proves that all 96 complete unlocked-bench add/drop scenarios are passed through legality evaluation before the display limit is applied; the engine reports the enumeration counts rather than silently truncating the search. The closeout matrix also exposed and fixed a clock leak in multiweek planning: current ESPN transaction legality still uses the shared explicit evaluation time and current kickoff, but future-week lineup optimization uses no inferred kickoff lock because the projection source supplies no authoritative Week N kickoff. Explicit ESPN `locked: true` states remain enforced. This keeps future utility deterministic without inventing future schedule facts.

Waiver Engine v2 implementation is closed. The following are field-validation or separately gated policy work, not unfinished v2 logic:

1. Continue accumulating real multiweek source publications; future impact remains visible only where baseline and simulated rosters have complete mapped player-week coverage.
2. Exercise the completed engine against materially different authenticated ESPN league states during production-readiness validation, especially custom acquisition caps, position limits, IR states, availability changes, and game-lock transitions. A reproduced defect can reopen implementation; the absence of another live fixture does not keep v2 perpetually partial.
3. Monitor real-league candidate volume and browser timing. The current engine exhaustively evaluates eligible add/drop pairs and exposes enumeration counts. If real performance becomes user-visible, introduce only an explicit documented shortlist with visible limitations—never a hidden silent cap.
4. Treat future-only IR-assisted stash discovery as a separate reviewed policy enhancement. It is not implied by or required for Waiver Engine v2 because IR-assisted paths intentionally depend on a current validated no-drop recommendation.

Acceptance criteria: every current-week move remains legal after full-roster simulation; ordinary multiweek add/drop paths may be future-positive without a current-week gain but must pass current ESPN availability, lock, acquisition, IR-roster, size, and provider-position legality before simulation; projection-gated future-only ordinary stashes require complete current-roster and simulated-roster selected-week coverage, remain below the current-week action threshold, and produce a positive complete horizon delta; current-week kickoff and lock facts gate current transaction legality without being reused as invented future-week kickoff locks; IR-assisted paths prove both the bench-to-IR step and the subsequent acquisition while retaining `drop: null`; multiweek IR-assisted paths independently match current ESPN legality, retain the IR player, and require complete projection coverage before any delta is exposed; current invalid IR state blocks acquisition advice while unsupported IR state remains unverified; unknown future transaction kinds fail closed; prior advice that no longer satisfies the latest supported state is marked obsolete; unsupported acquisition likelihood is never claimed; current-week, replacement-value, future-only, ROS ranking, IR legality, and multiweek conclusions remain separately sourced; candidate enumeration is observable and cannot be silently truncated.

### P2 — Production-readiness closeout

1. Complete manual keyboard, screen-reader, 200% zoom, and representative phone checks.
2. Perform a manual Chrome companion threat review covering cookies, page bridge, logs, and permissions.
3. Exercise refresh failure, cache recovery, disconnect, deletion, and mobile-sync revocation.
4. Run authenticated read-only checks across materially different live league states and document limitations and rollback. Include Waiver Engine v2 field validation for custom acquisition caps, position limits, filled/invalid/unverified IR states, availability changes, and game-lock transitions.
5. Validate Season/Playoff Intelligence with materially different ESPN playoff formats, FLEX/OP slot combinations, bye patterns, missing bye facts, local playoff-week fallback, and partially covered future projection windows.
6. Observe real Waiver Engine v2 candidate volumes/timing as weekly projection coverage grows; if exhaustive enumeration becomes materially slow, define and document a visible shortlist policy before changing discovery behavior.

Acceptance criteria: no unresolved high-severity accessibility, privacy, or security findings; the weekly workflow succeeds on desktop/mobile; authenticated field validation does not reveal an unhandled waiver legality or season-planning transition; any future enumeration optimization preserves visible limitations and deterministic behavior; every release passes all repository gates.

### Later gated work

- Trade analysis requires compatible ROS values, multiweek projections, replacement-pool modeling, and stable identity coverage.
- External injury/news requires an approved trustworthy source, licensing review, timestamps, and privacy review.
- Notifications require opt-in, real scheduling semantics, quiet hours, deduplication, and data-sharing review.
- Server-side models require explicit provider, privacy, cost, secret-storage, contract, and evaluator approval.
- Future-only IR-assisted stash discovery requires a separate ESPN IR policy review and deterministic safety matrix before it can expand beyond the current validated no-drop path.
- Playoff qualification/championship probability requires a separately reviewed calibrated model and must not be inferred from SOS stars or incomplete weekly projections.
- ESPN write actions remain outside the current boundary until the read-only product proves reliable over a meaningful season period.