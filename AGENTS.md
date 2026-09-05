# The Chip Winner agent guide

## Product boundary

The Chip Winner is an ESPN-only, read-only in-season fantasy football companion. ESPN owns league state. External rankings and projections are independent inputs. Derived recommendations never modify source snapshots.

## Source of truth

Before changing the repository, inspect `git status`, recent commits, `package.json`, `docs/roadmap.md`, and `docs/advanced-roadmap.md`.

- `package.json` owns the current application version.
- The **Current execution plan** in `docs/roadmap.md` owns the active implementation backlog and completion status.
- `docs/advanced-roadmap.md` owns the longer release sequence and feature gates.
- `docs/next-codex-task.md` is a point-in-time handoff. Refresh it when its checkpoint or primary task changes; do not treat an older handoff as more authoritative than the repository state or roadmap.
- Preserve user changes. Do not reimplement work already marked complete without first proving the current implementation is missing or incorrect.

## Protected master workflow

`master` is protected. Do not push feature, documentation, dependency, or maintenance changes directly to `master`.

- Fetch `origin/master` and verify the current tip before starting work.
- Create a task branch from the current `master` tip and make all changes there.
- Run the required local verification before pushing the branch.
- Open a pull request targeting `master`.
- The required GitHub Actions `test` status check must pass before merge. The protected branch is configured to require the PR branch to be up to date with `master` before merging.
- Merge only after the required check is green. Do not bypass the ruleset, force-push `master`, or delete `master`.
- After merge, wait for the `master` push workflow to complete deployment and production verification before reporting the work as fully complete.

## Required invariants

- Never invent player identities, rankings, projections, injuries, availability, kickoff times, or league rules.
- Preserve `null` as missing data; do not coerce it to zero.
- Use provider-owned IDs and explicit identity maps. Do not join projection providers by display name.
- The zero-cost DynastyProcess weekly path normally uses its published FantasyPros-to-ESPN stable ID crosswalk. D/ST may derive ESPN's synthetic team-defense identity only from the source-published NFL team code plus the explicit ESPN pro-team table. A narrow reviewed athlete bridge may activate only for documented FantasyPros IDs when the current DynastyProcess player-ID table independently still publishes the reviewed ESPN ID on an otherwise-unassigned FantasyPros row. If that evidence disappears, the mapping stays unresolved; if the ESPN ID becomes claimed by a different FantasyPros ID, staging fails closed. Never repair gaps by display name.
- Unresolved-row diagnostics may use an exact normalized display-name plus position check against ESPN Fantasy only to classify why a row is already excluded. Diagnostic matching is never identity evidence: it must not create, propose, persist, or auto-approve an ESPN mapping. If the ESPN diagnostic is unavailable, staging still succeeds and unresolved rows fall back to stable-ID-only status except explicitly reviewed stale source rows.
- Provider-ID rollover is explicit, not inferred. A replacement provider ID may share an ESPN identity with a historical provider ID only when the identity-map row explicitly declares `supersedes_provider_player_id` and the occupied ESPN identity is already owned by that exact predecessor. Historical provider IDs remain mapped so prior-week projections continue to resolve. Ordinary duplicate ESPN mappings remain conflicts.
- Treat DynastyProcess `r2p_pts` as a source-published PPR weekly estimate. Do not relabel it as a custom ESPN scoring projection.
- The upstream DynastyProcess weekly file does not publish an NFL week. In the browser workflow ESPN supplies the authoritative current season/week, but the user click remains the explicit approval to assign the latest fresh publication to that current week. On later week transitions, do not enable Week N unless the publication is newer than the stored Week N-1 capture. Do not silently schedule or infer weekly assignments.
- Weekly browser source checks may request only the approved public source hosts `raw.githubusercontent.com` and `api.github.com`. Never send ESPN credentials, cookies, private league payloads, or member data to those hosts. Do not mirror the third-party weekly dataset into the public repository/site.
- Weekly projection updates must use the existing atomic projection+identity import transaction. A failed update cannot partially replace either cache; prior valid weeks remain retained.
- Generic `PPR` and provider labels that clearly resolve to the same PPR scoring family may be considered compatible without relabeling source metadata. Known different scoring families remain blocked.
- ESPN IR eligibility is evaluated only from the normalized ESPN injury designation, the player's current ESPN lineup slot, and the league's ESPN-reported IR slot count. Do not use generic ESPN `eligibleSlots`, player names, projections, or external injury reports as evidence of current health-based IR eligibility.
- Under the reviewed ESPN Fantasy Football policy, OUT and INJURED_RESERVE are eligible for new IR placement; QUESTIONABLE/DOUBTFUL may remain only when already in IR; SUSPENSION and healthy/no-designation states are ineligible. Unsupported/new ESPN injury states fail closed as unverified. Do not broaden this set without re-reviewing ESPN's current documented policy and adding tests.
- A known-ineligible player currently left in ESPN IR invalidates supported acquisition legality; waiver recommendations must be withheld/obsoleted until the roster is corrected. An unverified current IR occupant withholds legality rather than guessing. Open IR capacity may be surfaced as a read-only roster-management opportunity, never as an ESPN transaction.
- Respect ESPN lineup eligibility, bench/IR status, availability, acquisition rules, and game locks only where ESPN supplies authoritative inputs.
- Keep browser credentials and ESPN cookies out of snapshots, sync payloads, model context, logs, and tests.
- Model output is advisory. Pass recommendations through the contract and offline evaluator before an adapter receives them.
- Multiweek deltas require complete mapped projection coverage for both baseline and simulated rosters across every included week.
- Keep ESPN writes outside the current product boundary. No silent, scheduled, or automatic transactions.

## Architecture

- `src/providers/espn`: ESPN acquisition, connection state, normalization, and caching.
- `src/providers/rankings`: FantasyPros ROS ranking import and reconciliation.
- `src/providers/projections`: provider-neutral weekly projections, multiweek catalogs, manual imports, explicit identity maps, and the browser weekly source/update provider.
- `src/domain`: deterministic selectors, optimizers, recommendations, waiver logic, ESPN IR policy, scenarios, contracts, and evaluation.
- `src/application`: application state transitions and the single state owner.
- `src/ui`: browser rendering and view-specific interaction helpers. Keep large renderers decomposable rather than moving state ownership into UI modules.
- `src/models`: provider-neutral model boundary; no provider credentials belong in the browser bundle.
- `src/sync` and `worker`: client-side encrypted mobile snapshot transport.
- `schema`: machine-readable external contracts.
- `test/fixtures`: deterministic regression and safety cases.

## Verification

Use the repository's configured Node runtime and run:

```text
npm test
npm run eval:model
npm run check
git diff --check
```

Every pushed branch change must keep the GitHub Pages workflow passing. Add tests for changed domain behavior, missing-data states, browser flow, accessibility, or security boundaries as appropriate. Update documented test counts only after verifying the complete suite.

Performance policy: focused HTML, CSS, app-entry, and sample-data budgets remain deployment-blocking guardrails. The aggregate browser JavaScript graph size is measured and reported as an informational trend only; do not fail or reshape a useful feature solely to stay below a historical total-source-size number. Optimize when user-experienced performance, maintainability, or a focused budget warrants it.

## Current priorities

Work in the dependency order maintained in `docs/roadmap.md`. At the current stage that means:

1. Accumulate real multiweek projection coverage through the one-click browser workflow as each source publication becomes available. Preserve the explicit week-approval boundary, guarded publication rollover, stable-ID crosswalk, D/ST bridge, fail-closed reviewed identity bridges, explicit provider-ID supersession semantics, reviewed stale-source exclusions, and classification-only diagnostics. Never chase 100% coverage by weakening identity rules.
2. Finish the remaining Waiver Engine v2 work with projection-gated multiweek impact only after coverage gates pass. ESPN IR eligibility/roster-validity handling is implemented in v0.9.63; keep it fail-closed and read-only. A dedicated IR-assisted add-without-drop scenario is optional follow-up, not permission to mutate ESPN.
3. Finish season/playoff intelligence with a documented, approved position-specific strength-of-schedule source and methodology before displaying difficulty grades.
4. Complete production-readiness closeout: manual accessibility, companion threat review, recovery/deletion checks, and materially different live ESPN league states.
5. Keep the browser UI maintainable as features grow; split oversized rendering modules along view boundaries without creating a second application store.

Trade analysis, external notifications, server-side models, and ESPN write actions remain gated by the roadmap. Do not pull them forward merely because their interfaces or schemas already exist.
