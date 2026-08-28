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

Status: **Complete and deployed for the configured ESPN league**

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
- 100 automated tests covering league normalization, recommendations, identity reconciliation, encrypted sync, snapshot differencing, lineup locks, roster-aware waiver simulation, season planning, persistent alerts, recommendation contracts, privacy-safe model context, guarded model adapters, model-output evaluation, and future projection inputs.

Additional connected foundation capabilities now include:

- authenticated read-only access to private ESPN league `118749183` through the Chrome companion;
- real team, roster, matchup, projection, injury, free-agent, and waiver data;
- public NFL opponent and kickoff context;
- non-conflicting waiver recommendations with acquisition status;
- projection thresholds that suppress marginal lineup churn;
- interactive start/sit comparison with preference, near-tie, and missing-data states;
- connected league scoring, lineup-slot, and waiver settings;
- a documented local-only privacy boundary;
- versioned browser modules for reliable production updates;
- deployed end-to-end encrypted mobile snapshot synchronization through Cloudflare Workers KV;
- locally derived change detection between the two most recent valid ESPN snapshots;
- a team-filtered **What Changed** timeline for roster, lineup, injury, projection, availability, and matchup-score changes.

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

- Summarize projected matchup range and remaining player exposure.
- Show unresolved starter injuries, empty lineup slots, byes, and players whose games have started.
- Add a kickoff-aware decision checklist.
- Rank alerts by urgency and actionability.

Acceptance criteria:

- Every alert links to the relevant player or decision view.
- Locked players are visually and logically excluded from suggested changes.
- Missing NFL game times disable time-sensitive claims.

### 2.3 Player detail surface

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
- Establish budgets when a build system is introduced: JavaScript, CSS, image weight, and interaction latency.
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

## Immediate next sprint

The next sprint should focus only on Phase 1.1 and 1.2:

1. define a sanitized raw-capture fixture format;
2. obtain representative ESPN response samples without credentials;
3. complete the response-to-snapshot normalizer;
4. add fixture tests for custom slots and missing data;
5. add a developer-facing normalization report;
6. document unsupported ESPN values and failure behavior.

Sprint exit criteria: a raw ESPN fixture can be converted reproducibly into a valid snapshot without UI involvement, guessed identities, or fabricated fields.
