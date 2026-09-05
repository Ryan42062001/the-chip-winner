# New Codex task handoff prompt

This file is intentionally a point-in-time handoff. If the repository checkpoint or roadmap has advanced, refresh this file before using it.

Copy the block below into a new Codex task.

```text
Continue development of “The Chip Winner” in C:\Users\ryank\OneDrive\Documents\ChatGPT\The Chip Winner.

Read AGENTS.md completely, then inspect git status, recent commits, package.json, docs/roadmap.md, docs/advanced-roadmap.md, docs/architecture.md, and docs/ir-eligibility.md. Preserve user changes and never expose ESPN cookies, credentials, private snapshots, API keys, private mobile links, imported private files, or member data.

Checkpoint: protected master after the v0.9.65 Season Plan IR release. Do not rely on a SHA copied into this handoff: fetch origin/master and verify the actual tip before editing. The verified release baseline has 263 automated permanent tests plus 21 deployment-blocking model safety fixtures, and the GitHub Pages workflow must pass deployment and production smoke verification.

Current tooling baseline:
- Node.js >=20.
- GitHub Actions uses actions/checkout v7.
- axe-core 4.13.0 powers the automated accessibility audit.
- playwright-core 1.62.1 powers browser smoke and accessibility journeys.
- master is protected by an active repository ruleset. Work on a task branch, open a pull request to master, and require the GitHub Actions `test` status check to pass before merge.
- Total browser JavaScript graph size is informational; focused HTML, CSS, app-entry, and sample-data budgets remain release guardrails.
- `scripts/smoke-static.js` derives its asset-version assertion from package.json. The weekly-update UI cache assertion also derives its expected version from package.json.

Projection/identity foundation to preserve:
- Normal athletes use DynastyProcess's published FantasyPros-to-ESPN stable ID crosswalk whenever present.
- D/ST uses the source-published NFL team code plus the explicit ESPN pro-team table to derive ESPN's synthetic defense ID; unknown or conflicting values fail closed.
- v0.9.59 added ten reviewed athlete bridges that activate only while exact independent DynastyProcess ESPN-ID evidence remains unassigned.
- v0.9.60 added explicit provider-ID supersession. Roman Wilson's current FantasyPros ID `28896` supersedes historical `26160`; both map to ESPN `4431492` only through exact reviewed predecessor evidence.
- v0.9.61 classifies unresolved source rows without converting name/position diagnostics into identity evidence. Andrew Wellock FantasyPros ID `9019` is the initial reviewed stale-source row.
- Under the verified 2026-09-04 Week 1 source state, mapping coverage remains 648/682 (95.01%), with 34 unresolved. Do not force unsupported identities merely to improve the percentage.

Weekly browser workflow to preserve:
- A real cached ESPN snapshot supplies the authoritative season and current week. Sample mode does not expose the update control.
- The browser checks DynastyProcess's public weekly publication on startup, after ESPN source changes, and when the page returns to focus, with a local cooldown.
- The upstream weekly file still has no NFL week column. The user click is explicit approval to assign the latest fresh same-season publication to ESPN's current week; never silently infer or schedule the assignment.
- On a Week N transition, if Week N-1 is already stored, the source publication must be newer than the stored prior-week capture before Week N can be loaded. A publication older than eight days is blocked.
- A newer same-week publication may be explicitly refreshed.
- Browser requests are limited to public `raw.githubusercontent.com` and `api.github.com` source data. Never send ESPN cookies, credentials, league payloads, member data, or private sync data to those hosts.
- The browser reuses the same stable-ID/D-ST/reviewed-bridge/supersession staging rules as the CLI and commits through the existing atomic projection+identity transaction.
- Previous projection weeks are retained. Successful imports expand the planning horizon to imported weeks and save a small browser-local update receipt. Clear-local-data and clear-projections remove that receipt.
- Generic source `PPR` is compatible with ESPN labels that clearly belong to the same PPR family, such as `Head to Head PPR`, without relabeling the source. Different known scoring families remain blocked.
- The third-party weekly dataset is fetched on demand and is never mirrored into the public repository/site.
- The CLI command `npm run projections:dynastyprocess-weekly -- --season <year> --week <1-18>` remains available for recovery, auditing, and development.

ESPN IR policy and waiver/Season Plan behavior to preserve:
- `src/domain/ir-eligibility.js` is the policy owner. It uses only the normalized ESPN injury designation, current ESPN lineup slot, and ESPN-reported IR slot count.
- Do NOT use ESPN's generic `eligibleSlots` array as current health-based IR evidence. Community ESPN API examples can include IR among generic eligible slots even when a player is not currently injury-eligible.
- Current reviewed ESPN Fantasy Football policy: OUT and INJURED_RESERVE may be newly placed in IR; QUESTIONABLE and DOUBTFUL cannot be newly placed there but may remain if already in IR after an OUT/IR designation changes; SUSPENSION and healthy/no-designation states are ineligible.
- NFL PUP is not itself the fantasy eligibility signal. If ESPN surfaces a PUP player with an OUT/IR fantasy designation, that player qualifies. A bare normalized `PHYSICALLY_UNABLE_TO_PERFORM` value is unverified rather than automatically eligible or ineligible.
- A known-ineligible current IR occupant invalidates supported acquisition legality. New waiver recommendations are withheld and prior recommendations become obsolete because ESPN documents that a healthy player left in IR can block acquisitions.
- An unsupported current IR designation withholds acquisition legality as unverified rather than guessing.
- v0.9.64 added explicit `ir-assisted-add` recommendations. They require an open ESPN IR slot plus an eligible unlocked bench player, then simulate moving that player BE -> IR and adding an ESPN-available unlocked player with no drop.
- IR-assisted current-week simulations enforce ESPN acquisition limits, roster size, provider-position limits, locks, current availability, and the normal current-week projection threshold.
- When an equivalent add can be achieved either by a normal add/drop or an IR-assisted no-drop path at the same lineup gain, prefer the IR-assisted path.
- IR-assisted recommendations retain `drop: null` and explicit `irMove` provenance; What Changed and revalidation must never invent a drop.
- Revalidation checks both steps. Lost IR capacity, changed designation, locks, availability, roster/position limits, exhausted acquisitions, or insufficient projected gain can obsolete the plan; unsupported status evidence remains unverified.
- v0.9.65 extends the multiweek scenario planner and Season Plan deliberately for IR-assisted paths. A future IR scenario must be passed explicitly as `kind: "ir-assisted-add"` with the ESPN player being retained in IR; it is never translated into an add/drop.
- The multiweek planner independently verifies that the current ESPN-derived waiver engine still emits the matching IR-assisted add and IR-move player before evaluating future weeks.
- The simulated future roster keeps the injured player in the ESPN IR slot and adds the waiver target to the active roster with no drop. Current ESPN snapshots are never mutated.
- Every selected week requires complete mapped player-week projection coverage for both the baseline roster and the full simulated roster, including the IR-retained player. Weekly and horizon deltas are withheld if any required cell is missing.
- Season Plan labels these paths explicitly as moving the player to IR with no drop; current-week and future-week presentation must never dereference or invent a drop for an IR-assisted item.
- `docs/ir-eligibility.md` records the ESPN Fan Support sources, PUP nuance, policy review date, and explicit IR-assisted flow.

Other completed foundation to preserve:
- Atomic/inspectable multiweek imports and a single application state owner.
- Candidate-aware future coverage for the selected roster plus top current ESPN waiver candidates.
- Constraint-based lineup optimizer, roster-aware waiver simulation, ESPN acquisition/roster/position-limit enforcement, snapshot differencing, alerts, multiple local ESPN connections, encrypted mobile sync, accessibility automation, security scanning, and production smoke checks.
- Refresh-aware waiver recommendation revalidation against the latest ESPN state, including current IR roster validity and the two-step IR-assisted path.
- Fail-closed multiweek IR-retained roster simulation with explicit current-state revalidation and complete player-week coverage gating.

Primary execution sequence:
1. Accumulate real DynastyProcess PPR player-week coverage through the browser update flow as new source publications appear. Never fabricate future weeks, auto-map by display name, or weaken stable-ID protections.
2. Revisit unresolved rows only when new stable crosswalk evidence, explicit reviewed provider-ID rollover evidence, or authoritative ESPN Fantasy state appears.
3. Continue projection-gated multiweek waiver impact only where baseline and simulated rosters have complete mapped player-week coverage for every included week. Preserve the explicit IR-retained roster model for `ir-assisted-add` scenarios and fail closed when current ESPN legality or any future projection cell is missing.
4. Finish season/playoff intelligence only after a documented, approved position-specific strength-of-schedule source and methodology exist.
5. Continue production-readiness closeout with manual accessibility, companion threat review, recovery/deletion checks, and materially different authenticated read-only league states.

Requirements:
- Keep ESPN authoritative for league state, roster rules, injury designation, IR assignment/capacity, availability, locks, acquisition state, and current week.
- Preserve `null`; never fill missing facts with zero or inferred values. Preserve explicit source-provided zero projections as zero.
- Use provider-owned IDs and explicit maps for projection joins.
- Keep diagnostic matching classification-only.
- Preserve the D/ST bridge, fail-closed reviewed athlete bridges, provider-ID supersession, ordinary duplicate-ID conflict protection, and atomic cache commits.
- Preserve the ESPN IR fail-closed boundary; do not expand qualifying injury statuses from assumptions or generic eligible-slot arrays.
- Preserve explicit `ir-assisted-add` semantics: two steps, no invented drop, full current-state legality checks, and read-only output.
- For multiweek IR-assisted scenarios, retain the injured player in IR, keep `dropPlayerId` null, require the matching current ESPN-derived IR recommendation, and require complete projection coverage for every baseline and simulated roster player-week before exposing deltas.
- Revalidate recommendations against the latest valid snapshot without mutating cached ESPN state.
- Keep current-week projection, replacement value, ROS rank, IR legality, and multiweek scenario conclusions separately sourced and labeled.
- Add deterministic tests for every new legality, IR status transition, stale-state, missing-data, source-shape, identity-conflict, rollback, browser-update, or diagnostic-classification condition.
- Preserve mobile navigation, keyboard behavior, accessibility, CSP, cache migrations, companion least privilege, focused static-asset budgets, and production performance quality.
- Do not begin trade analysis, notifications, server-side model integration, or ESPN write actions unless the roadmap gate and user approval explicitly move the product boundary.

Before completion run npm test, npm run eval:model, npm run check, and git diff --check. Update roadmap/status and documented test counts only after full verification. For feature releases, bump the patch version/cache markers when appropriate, use a task branch and PR, require the protected `test` check, merge only after it is green and up to date, then verify the master deployment and production smoke. Never bypass the ruleset or push feature work directly to master.
```
