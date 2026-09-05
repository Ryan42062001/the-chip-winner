# New Codex task handoff prompt

This file is intentionally a point-in-time handoff. If the repository checkpoint or roadmap has advanced, refresh this file before using it.

Copy the block below into a new Codex task.

```text
Continue development of “The Chip Winner” in C:\Users\ryank\OneDrive\Documents\ChatGPT\The Chip Winner.

Read AGENTS.md completely, then inspect git status, recent commits, package.json, docs/roadmap.md, docs/advanced-roadmap.md, and docs/architecture.md. Preserve user changes and never expose ESPN cookies, credentials, private snapshots, API keys, private mobile links, imported private files, or member data.

Checkpoint: protected master; application release v0.9.62 adds the one-click browser weekly projection update workflow. Do not rely on a SHA copied into this handoff: fetch origin/master and verify the actual tip before editing. The verified release baseline has 246 automated permanent tests plus 21 deployment-blocking model safety fixtures, and the GitHub Pages workflow must pass deployment and production smoke verification.

Current tooling baseline:
- Node.js >=20.
- GitHub Actions uses actions/checkout v7.
- axe-core 4.13.0 powers the automated accessibility audit.
- playwright-core 1.62.1 powers browser smoke and accessibility journeys.
- master is protected by an active repository ruleset. Work on a task branch, open a pull request to master, and require the GitHub Actions `test` status check to pass before merge.
- Total browser JavaScript graph size is informational; focused HTML, CSS, app-entry, and sample-data budgets remain release guardrails.
- `scripts/smoke-static.js` derives its asset-version assertion from package.json.

Projection/identity foundation to preserve:
- Normal athletes use DynastyProcess's published FantasyPros-to-ESPN stable ID crosswalk whenever present.
- D/ST uses the source-published NFL team code plus the explicit ESPN pro-team table to derive ESPN's synthetic defense ID; unknown or conflicting values fail closed.
- v0.9.59 added ten reviewed athlete bridges that activate only while exact independent DynastyProcess ESPN-ID evidence remains unassigned.
- v0.9.60 added explicit provider-ID supersession. Roman Wilson's current FantasyPros ID `28896` supersedes historical `26160`; both map to ESPN `4431492` only through exact reviewed predecessor evidence.
- v0.9.61 classifies unresolved source rows without converting name/position diagnostics into identity evidence. Andrew Wellock FantasyPros ID `9019` is the initial reviewed stale-source row.
- Under the verified 2026-09-04 Week 1 source state, mapping coverage remains 648/682 (95.01%), with 34 unresolved. Do not force unsupported identities merely to improve the percentage.

v0.9.62 weekly browser workflow to preserve:
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
- A temporary live Chrome canary proved the real browser path against the 2026-09-04 source: the control became `Update Week 1 projections`, both public source endpoints returned 200, the click imported 648 projections, and the receipt recorded 648/682 with 34 unresolved. The temporary canary was removed and is not part of the permanent suite.

Other completed foundation to preserve:
- Atomic/inspectable multiweek imports and a single application state owner.
- Candidate-aware future coverage for the selected roster plus top current ESPN waiver candidates.
- Constraint-based lineup optimizer, roster-aware waiver simulation, ESPN acquisition/roster/position-limit enforcement, snapshot differencing, alerts, multiple local ESPN connections, encrypted mobile sync, accessibility automation, security scanning, and production smoke checks.
- Refresh-aware waiver recommendation revalidation against the latest ESPN state.

Primary execution sequence:
1. Accumulate real DynastyProcess PPR player-week coverage through the v0.9.62 browser update flow as new source publications appear. Never fabricate future weeks, auto-map by display name, or weaken stable-ID protections.
2. Revisit unresolved rows only when new stable crosswalk evidence, explicit reviewed provider-ID rollover evidence, or authoritative ESPN Fantasy state appears.
3. Model IR transitions only if connected ESPN payloads supply authoritative eligibility/rule inputs.
4. Add multiweek waiver impact only after both baseline and simulated rosters have complete mapped player-week coverage for every included week.
5. Finish season/playoff intelligence only after a documented, approved position-specific strength-of-schedule source and methodology exist.
6. Continue production-readiness closeout with manual accessibility, companion threat review, recovery/deletion checks, and materially different authenticated read-only league states.

Requirements:
- Keep ESPN authoritative for league state, roster rules, availability, locks, acquisition state, and current week.
- Preserve `null`; never fill missing facts with zero or inferred values. Preserve explicit source-provided zero projections as zero.
- Use provider-owned IDs and explicit maps for projection joins.
- Keep diagnostic matching classification-only.
- Preserve the D/ST bridge, fail-closed reviewed athlete bridges, provider-ID supersession, ordinary duplicate-ID conflict protection, and atomic cache commits.
- Revalidate recommendations against the latest valid snapshot without mutating cached ESPN state.
- Keep current-week projection, replacement value, ROS rank, and multiweek scenario conclusions separately sourced and labeled.
- Add deterministic tests for every new legality, stale-state, missing-data, source-shape, identity-conflict, rollback, browser-update, or diagnostic-classification condition.
- Preserve mobile navigation, keyboard behavior, accessibility, CSP, cache migrations, companion least privilege, focused static-asset budgets, and production performance quality.
- Do not begin trade analysis, notifications, server-side model integration, or ESPN write actions unless the roadmap gate and user approval explicitly move the product boundary.

Before completion run npm test, npm run eval:model, npm run check, and git diff --check. Update roadmap/status and documented test counts only after full verification. For feature releases, bump the patch version/cache markers when appropriate, use a task branch and PR, require the protected `test` check, merge only after it is green and up to date, then verify the master deployment and production smoke. Never bypass the ruleset or push feature work directly to master.
```
