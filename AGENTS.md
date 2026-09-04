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

## Required invariants

- Never invent player identities, rankings, projections, injuries, availability, kickoff times, or league rules.
- Preserve `null` as missing data; do not coerce it to zero.
- Use provider-owned IDs and explicit identity maps. Do not join projection providers by display name.
- Respect ESPN lineup eligibility, bench/IR status, availability, acquisition rules, and game locks only where ESPN supplies authoritative inputs.
- Keep browser credentials and ESPN cookies out of snapshots, sync payloads, model context, logs, and tests.
- Model output is advisory. Pass recommendations through the contract and offline evaluator before an adapter receives them.
- Multiweek deltas require complete mapped projection coverage for both baseline and simulated rosters across every included week.
- Keep ESPN writes outside the current product boundary. No silent, scheduled, or automatic transactions.

## Architecture

- `src/providers/espn`: ESPN acquisition, connection state, normalization, and caching.
- `src/providers/rankings`: FantasyPros ROS ranking import and reconciliation.
- `src/providers/projections`: provider-neutral weekly projections, multiweek catalogs, manual imports, and explicit identity maps.
- `src/domain`: deterministic selectors, optimizers, recommendations, waiver logic, scenarios, contracts, and evaluation.
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

Every pushed change must keep the GitHub Pages workflow passing. Add tests for changed domain behavior, missing-data states, browser flow, accessibility, or security boundaries as appropriate. Update documented test counts only after verifying the complete suite.

## Current priorities

Work in the dependency order maintained in `docs/roadmap.md`. At the current stage that means:

1. Complete real multiweek projection coverage using only user-supplied or explicitly approved provider data and provider-to-ESPN identity mappings.
2. Finish Waiver Engine v2 gaps: refresh-obsolete recommendation state and IR transitions only when ESPN exposes authoritative inputs; add multiweek impact only after projection coverage gates pass.
3. Finish season/playoff intelligence with a documented, approved position-specific strength-of-schedule source and methodology before displaying difficulty grades.
4. Complete production-readiness closeout: manual accessibility, companion threat review, recovery/deletion checks, and materially different live ESPN league states.
5. Keep the browser UI maintainable as features grow; split oversized rendering modules along view boundaries without creating a second application store.

Trade analysis, external notifications, server-side models, and ESPN write actions remain gated by the roadmap. Do not pull them forward merely because their interfaces or schemas already exist.
