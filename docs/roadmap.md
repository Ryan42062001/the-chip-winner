# The Chip Winner Product Roadmap

> **Active governance:** Speed Workflow V2.1. The current execution contract lives in `.ai/CURRENT_PHASE.md`; workflow rules live in `docs/WORKFLOW.md`. This roadmap defines product direction and priority, not task-level governance.
>
> **Historical roadmap:** The detailed pre-refresh roadmap is preserved at `docs/history/roadmap-pre-v2-1-refresh-2026-09-29.md`.

## Product vision

The Chip Winner is a trustworthy, ESPN-focused in-season fantasy football command center. It should help a manager understand the current week, identify decisions that need attention, compare reasonable alternatives, and see exactly where facts and recommendations came from.

The product should prefer an honest **not available / insufficient evidence** state over an unsupported recommendation.

## Product principles

1. **ESPN owns league state.** Teams, rosters, lineup slots, matchups, league settings, transactions, and player availability come from ESPN.
2. **Projection sources remain independent.** External projections are overlays and never become ESPN facts.
3. **Facts and recommendations stay separated.** Derived advice exposes its inputs, source, timestamp, and limitations.
4. **Identity errors fail visibly.** Stable IDs are required; display-name guessing is not accepted as silent repair.
5. **Missing or untrusted evidence fails closed.** No invented kickoff, lock, injury, availability, or provider fact may create confident advice.
6. **Mobile is a primary surface.** Weekly decisions must work comfortably near kickoff on a phone.
7. **Read-only remains the default boundary.** ESPN write actions are a separately gated future capability.
8. **Production deployment is separate from merge.** Under Speed Workflow V2.1, GitHub Pages production deployment is manual-only and requires explicit authorization.
9. **Every release is testable.** Automated checks and real-world field validation must support the claims the product makes.

---

## Now / Next / Later

| Priority | Work | State | Outcome |
| --- | --- | --- | --- |
| **NOW** | **Release 1.0 Field Validation** | **Active evidence gate** | Close the remaining real-world validation evidence before the Release 1.0 decision |
| **NEXT** | **Trade Winner value source & advantage visualization** | **Source-gated planning** | Add an approved compatible package-value source, then an evidence-aware trade advantage meter that stays neutral when trustworthy value evidence is unavailable |
| **ONGOING** | Weekly projection coverage | Seasonal accumulation | Expand complete multiweek and playoff analysis without weakening identity or completeness rules |
| **LATER** | Trusted injury/news ecosystem | Gated | Add timely external availability context with licensing, timestamps, provenance, and privacy review |
| **LATER** | Notifications | Gated | Opt-in, deduplicated, quiet-hours-aware decision alerts |
| **LATER** | Advanced league intelligence | Planned | Opponent needs, transaction patterns, standings scenarios, and playoff leverage |
| **FUTURE** | Optional ESPN write actions | Locked | User-confirmed lineup/waiver/trade actions only after the read path proves reliable |

The active execution state is authoritative in `.ai/CURRENT_PHASE.md`. If this table and the phase contract ever disagree, the phase contract controls current execution and the roadmap should be corrected at the next Phase Sync or Closure Sync.

---

## Current product baseline

The current Release 1.0 candidate already has substantial read-only capability:

- authenticated private ESPN league refresh through the local Chrome companion;
- normalized league, team, roster, matchup, settings, projection, injury, availability, free-agent, and waiver state;
- responsive weekly dashboard with starter/bench views and kickoff-aware decision surfaces;
- legal lineup optimization and transparent start/sit comparisons;
- waiver analysis with roster, acquisition, position, lock, and ESPN IR constraints;
- IR-assisted no-drop acquisition paths when explicitly supported by current ESPN state;
- future add/drop scenarios that remain separate from current-week transaction legality;
- transparent waiver prioritization without a hidden weighted score;
- season and playoff intelligence with bye fillability, ESPN playoff opponents, projection-gated playoff outlook, and separately attributed FantasyPros SOS stars;
- imported weekly projection and identity caches with atomic updates and explicit provenance;
- encrypted mobile snapshot synchronization;
- local What Changed history between valid ESPN snapshots;
- browser, mobile, accessibility, performance, security, recovery, and dependency checks;
- an evidence-gated Release 1.0 field-validation registry.

The product remains deliberately read-only with respect to ESPN transactions.

---

## Recently completed — TCW-P01 Trade Winner

**Status:** CLOSED under Speed Workflow V2.1.

PR #245 integrated the Trade Winner engine onto the current product from the historical source checkpoint preserved in closed PR #147:

`22838ac515152db32789e97850f25e1e4576cb82`

The final independently audited target was:

`50ef275affc82e06e1a0f6a0e72c01a0fc1c10e0`

It merged to canonical master as:

`8e3ac9d26f91d4c3c6837063a9e14724b81aabc7`

### Delivered outcome

Trade Winner now:

- validates proposal ownership and stable ESPN player identity;
- separates package-value evidence from roster consequences;
- fails closed when package-value, kickoff/lock, roster-rule, or reciprocal legality evidence is incomplete;
- distinguishes structurally viable trades from trades requiring additional roster action;
- evaluates reciprocal opponent roster-size and position-limit consequences without inventing an opponent drop;
- preserves source, version, timestamp, freshness, unit, compatibility, and limitation details;
- remains read-only with no ESPN transaction path;
- provides a compact desktop/mobile decision-first experience with supporting evidence available by progressive disclosure.

### Persistent boundaries

The completed phase does **not** authorize:

- ESPN trade submission or any other ESPN mutation;
- production deployment;
- unapproved external value/projection providers;
- restoration of retired V3/V4 control-plane machinery;
- unsupported winner claims when trustworthy package-value evidence is unavailable.

A future trade-advantage meter should move toward either side only when an approved compatible package-value source supports the comparison. Without that evidence, it should remain neutral and explicitly show value unavailable.

---

## Current gate — Release 1.0 field validation

Automatable production-readiness engineering is substantially complete. Release 1.0 still depends on evidence from real environments.

The field-validation registry in `config/field-validation.json` tracks the required checks. The current gate covers:

- keyboard-only critical workflow;
- real screen-reader critical workflow;
- actual browser 200% zoom;
- representative physical-phone workflow;
- authenticated standard ESPN league;
- authenticated custom FLEX/OP league;
- ESPN acquisition and provider-position limits;
- ESPN IR edge states;
- lock and availability transitions;
- real playoff and bye intelligence states;
- live ESPN/session/network failure and reconnect;
- live deployed mobile-sync revoke/delete;
- real waiver candidate volume and timing.

### Release 1.0 acceptance

Release 1.0 is eligible only when:

- every required field-validation item is passed with privacy-safe evidence;
- no unresolved high-severity accessibility, privacy, security, ESPN-normalization, waiver-legality, season-planning, or decision-integrity defect remains;
- reproduced deterministic provider shapes or defects become regression coverage where practical;
- stable-ID, missing-data, ESPN-legality, IR-policy, provenance, and source-separation rules remain intact;
- the exact release candidate passes the required V2.1 phase validation and audit appropriate to its risk.

**Merge does not deploy production.** Any production Pages deployment remains a separate manual action requiring explicit authorization and exact deployed-SHA verification.

---

## Ongoing seasonal work — projection coverage

Projection coverage improves as real weekly publications accumulate.

Continue to:

- use explicit user-approved week assignment where the upstream source does not identify its NFL week;
- preserve prior weeks rather than relabeling stale publications;
- keep unresolved or ambiguous identities excluded;
- require provider, scoring basis, season, week, provider ID, value, and capture/publication provenance for every used external value;
- enable multiweek deltas and playoff aggregates only when every required baseline and simulated-roster player-week value is completely mapped;
- retain the CLI stager as recovery/audit tooling rather than the normal user workflow.

Incomplete coverage may reduce available analysis; it must never be silently converted into complete data.

---

## Capability roadmap

These are product capability areas, not Speed Workflow execution phases.

### A. Reliable ESPN connection — largely implemented

Keep strengthening:

- normalization across materially different league settings;
- explicit handling of unsupported provider values;
- refresh, stale, partial, disconnect, and recovery behavior;
- privacy-safe private-league access;
- fixture coverage for newly observed deterministic ESPN shapes.

### B. Weekly command center — implemented, continue field validation

Core outcomes:

- reliable roster/matchup dashboard;
- empty-slot, injury, bye, lock, and missing-projection awareness;
- source-aware player detail;
- mobile-friendly weekly review;
- clear stale and incomplete-data states.

### C. Recommendation engine — implemented, continue hardening

Core outcomes:

- constraint-valid lineup optimization;
- transparent start/sit comparisons;
- legal waiver recommendations;
- current-week and future value kept conceptually separate;
- deterministic confidence based on evidence completeness, not outcome probability.

### D. Projection and injury ecosystem — projections active; broader injury/news gated

Projection integration already exists with explicit provenance and identity reconciliation.

Future external injury/news work requires:

- an approved trustworthy/licensed source;
- timestamp and update-history rules;
- separation of official status, practice participation, and commentary;
- contradiction handling;
- privacy and data-sharing review.

### E. Advanced in-season planning — partially implemented

Already implemented:

- season/playoff intelligence;
- bye-week roster fillability;
- ESPN fantasy playoff opponent views;
- projection-gated playoff outlook;
- optional imported SOS context;
- advanced waiver/future scenario analysis.

Recently completed:

- TCW-P01 Trade Winner core analysis and responsive decision experience.

Future possibilities:

- opponent roster needs;
- recent add/drop patterns;
- standings and playoff leverage;
- approved package-value sourcing and an evidence-aware trade advantage visualization;
- additional trade planning only where league settings and evidence support it;
- calibrated probabilities only if a separately reviewed model and data contract justify them.

### F. Optional ESPN actions — future locked capability

Potential future actions include:

- submit lineup changes;
- add or drop a player;
- place a waiver claim;
- propose a trade.

This capability remains locked until the read-only product has proved reliable over a meaningful real-world period.

Any future write path must include:

- explicit preview of every change;
- immediate user confirmation;
- fresh ESPN-state revalidation;
- lock and availability checks;
- clear success/partial-success/failure receipts;
- no background or automatic transactions;
- dedicated security, privacy, and failure-recovery review.

---

## Cross-cutting quality bars

### Security and privacy

- Never place ESPN cookies or credentials in repository files, URLs, analytics, evidence, or client logs.
- Define retention/deletion and user consent before new server-side personal-data storage.
- Keep dependency and secret scanning active.
- Re-review threats when authentication, sync, providers, or write capabilities materially change.

### Accessibility

- Target WCAG 2.2 AA.
- Maintain keyboard operation, focus visibility, semantics, reflow, and non-color-only status.
- Continue real assistive-technology validation before Release 1.0.

### Performance

- Keep the main dashboard usable on representative phone hardware and connections.
- Maintain focused asset budgets as guardrails.
- Treat aggregate browser graph size as an observable trend unless a future evidence-backed hard limit is adopted.

### Observability

- Prefer privacy-safe operational evidence.
- Do not send raw private league payloads to unrelated telemetry.
- Add broader error reporting only with a defined privacy policy and opt-out model.

### Testing

Maintain layered coverage for:

- domain and recommendation logic;
- ESPN/provider normalization;
- identity and provenance;
- legality and lock transitions;
- browser flows;
- mobile/reflow behavior;
- accessibility;
- recovery and local-data deletion;
- security and dependency health;
- production verification when a production deployment is explicitly authorized.

---

## Later gated capabilities

These remain intentionally outside the current phase unless separately activated:

- trusted external injury/news feeds;
- notifications and scheduling;
- future-only IR-assisted stash discovery beyond the current validated policy;
- calibrated playoff qualification, matchup, or championship probabilities;
- server-side AI/models requiring provider, privacy, cost, secret-storage, and evaluation review;
- ESPN write actions.

---

## Persistent safety boundaries

Unless a future explicitly approved phase changes them:

- ESPN league integration is read-only.
- Stable identity is required; display-name guessing is not a valid repair strategy.
- Missing facts remain missing.
- Imported source facts are not rewritten by recommendations.
- Projection and league-state sources remain distinguishable.
- No hidden weighted score should obscure why a recommendation was produced.
- Production deployment is a separate explicit action from merge.
- No background or automatic ESPN transactions are allowed.

---

## Roadmap maintenance rule

Keep this document strategic and current.

Detailed implementation chronology, historical versions, old task-state narratives, exact legacy CI receipts, and retired workflow mechanics belong in focused feature docs or `docs/history/`, not in the active roadmap.

At each V2.1 Closure Sync:

1. update **Now / Next / Later** only if priority changed;
2. update the affected capability area's status;
3. preserve newly durable safety boundaries;
4. archive detail instead of allowing the active roadmap to become a release-history log.
