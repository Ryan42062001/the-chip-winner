# New Codex task handoff prompt

This file is intentionally a point-in-time handoff. If the repository checkpoint or roadmap has advanced, refresh this file before using it.

Copy the block below into a new Codex task.

```text
Continue development of “The Chip Winner” in C:\Users\ryank\OneDrive\Documents\ChatGPT\The Chip Winner.

Read AGENTS.md completely, then inspect git status, recent commits, package.json, docs/roadmap.md, docs/advanced-roadmap.md, and docs/architecture.md. Preserve user changes and never expose ESPN cookies, credentials, private snapshots, API keys, private mobile links, imported private files, or member data.

Checkpoint: protected master; application release v0.9.60 adds explicit provider-ID supersession semantics to the zero-cost DynastyProcess weekly PPR staging path. Normal athletes still prefer DynastyProcess's direct stable FantasyPros-to-ESPN crosswalk. Reviewed unassigned-ESPN bridges remain fail-closed. D/ST continues to use the source-published NFL team code plus the explicit ESPN pro-team-ID table. Provider rollover is now modeled explicitly: a replacement identity row may name `supersedes_provider_player_id`, allowing both historical and replacement provider IDs to resolve to the same ESPN identity only through that declared predecessor relationship. Do not rely on a SHA copied into this handoff: fetch origin/master and verify the actual tip before editing. The verified release baseline has 236 automated tests and 21 model-safety fixtures, and the GitHub Pages workflow must pass deployment and production smoke verification.

Current tooling baseline:
- Node.js >=20.
- GitHub Actions uses actions/checkout v7.
- axe-core 4.13.0 powers the automated accessibility audit.
- playwright-core 1.62.1 powers browser smoke and accessibility journeys.
- master is protected by an active repository ruleset. Work on a task branch, open a pull request to master, and require the GitHub Actions `test` status check to pass before merge.
- Total browser JavaScript graph size is measured and reported as an informational trend; it is not a deployment-blocking hard cap. Focused HTML, CSS, app-entry, and sample-data budgets remain release guardrails.
- `scripts/smoke-static.js` derives its asset-version assertion from package.json so release markers cannot silently drift from the package version.

Completed foundation to preserve:
- The browser entry-point split and atomic/inspectable multiweek imports are complete.
- The app has a single application state owner and focused projection-import/event/rendering modules.
- FantasyPros weekly projection infrastructure, explicit provider-to-ESPN identity mapping, coverage diagnostics, Season Plan scenarios, and selected-horizon completeness gates are implemented.
- Candidate-aware future coverage checks the top current ESPN waiver adds across the selected horizon and distinguishes missing identity mappings from missing player-week projections.
- The zero-cost command `npm run projections:dynastyprocess-weekly -- --season <year> --week <1-18>` stages the current DynastyProcess FantasyPros-derived weekly PPR `r2p_pts` signal into ignored local-data projection/identity CSVs and a provenance sidecar. The upstream weekly file has no NFL week column, so week must remain explicit. Normal athletes use the published stable FantasyPros-to-ESPN ID crosswalk whenever present. D/ST rows use the source-published team code plus an explicit ESPN pro-team table to derive ESPN's synthetic defense ID; unknown team codes and conflicting direct IDs fail closed. v0.9.59 added ten audited athlete bridges where the weekly feed publishes a FantasyPros ID while the current DynastyProcess player-ID table independently publishes the target ESPN ID with no FantasyPros assignment. Each bridge remains active only while that exact unassigned ESPN evidence persists, fails closed if the ESPN ID becomes claimed by another FantasyPros ID, and automatically yields to a future direct upstream mapping. Display names are never used as runtime identity joins.
- v0.9.60 adds explicit provider-ID supersession. The identity CSV may contain `supersedes_provider_player_id`. Ordinary duplicate ESPN mappings still fail. A replacement provider ID can share an already-mapped ESPN identity only when it explicitly names the exact predecessor provider ID already owning that ESPN identity. Historical provider IDs remain in the local map so previously imported player-week projections continue to resolve. A fresh current-only import can use the replacement provider ID directly. Explicit chains are validated and ambiguous/cyclic relationships fail closed.
- Roman Wilson is the first reviewed rollover: current FantasyPros ID `28896` supersedes historical FantasyPros ID `26160`; both resolve to ESPN `4431492`. DynastyProcess staging activates this reviewed supersession only while its current player-ID table still maps predecessor `26160` to ESPN `4431492`. If that evidence disappears or changes, the replacement remains unresolved or staging fails closed as appropriate. If DynastyProcess later publishes a direct `28896 -> 4431492` mapping, the direct mapping automatically takes precedence.
- Under the verified 2026-09-04 Week 1 source state, mapping coverage is now 648/682 (95.01%). D/ST is 32/32 and kicker coverage is 32/34. The unresolved set is 34: QB 1, RB 10, WR 8, TE 13, K 2. Michael Trigg, Cam Grandy, and Charlie Smyth have identifiable ESPN records but stale/unsupported external team affiliation relative to ESPN, so they remain excluded. Andrew Wellock remains clearly stale/bad third-party data and excluded.
- The lineup optimizer, roster-aware waiver simulation, acquisition/roster/position-limit enforcement, snapshot differencing, alerts, multiple local ESPN connections, encrypted mobile sync, accessibility automation, security scanning, and production smoke checks are implemented.
- Current-week waiver candidates show a separate ESPN-pool replacement benchmark; do not collapse replacement value into legal-lineup gain.
- Prior current-week waiver recommendations are reconstructed from the previous valid ESPN capture and revalidated against the latest ESPN availability, roster/drop legality, locks, acquisition limits, explicit roster rules, and current projected lineup gain. Moves that are no longer supported appear in What Changed as obsolete with the exact reason; missing refresh inputs remain explicitly unverified rather than being treated as a proven failure.

Primary execution sequence:
1. Use the zero-cost DynastyProcess staging path to accumulate real PPR player-week coverage whenever the live source and stable identity rules provide it. Keep exact player-week and mapping gaps visible; never fabricate future weeks, infer the source's missing week field, mirror the third-party weekly dataset into the public site, or auto-join athletes by display name. Preserve the verified D/ST team-code bridge, reviewed identity bridges, and explicit provider-ID supersession rules. Future rollover cases require a reviewed predecessor-to-replacement relationship and exact ESPN identity evidence; never relax duplicate-ID protections generically.
2. Model IR transitions only if the connected ESPN payload supplies authoritative eligibility and rule inputs. Otherwise preserve the limitation and do not infer eligibility.
3. Add multiweek waiver impact only after both baseline and simulated rosters have complete mapped player-week projection coverage for every included week.
4. Finish season/playoff intelligence only after a documented, approved position-specific strength-of-schedule source and methodology exist; do not invent schedule difficulty.
5. Continue production-readiness closeout with manual accessibility, companion threat review, recovery/deletion checks, and materially different authenticated read-only league states when the required real-world test inputs are available.

Requirements:
- Keep ESPN authoritative for league state, roster rules, availability, locks, and acquisition state.
- Preserve `null`; never fill missing facts with zero or inferred values. Preserve an explicit source-provided projection value of zero as zero.
- Use provider-owned IDs and explicit maps for projection joins.
- For DynastyProcess weekly staging, accept only the source's supported PPR pages, publication provenance, FantasyPros IDs, and explicit stable identity evidence. Normal athletes prefer the published direct ESPN ID crosswalk. A documented reviewed bridge may activate only while the current DynastyProcess player-ID table independently exposes the exact reviewed ESPN ID without a FantasyPros assignment. A documented provider-ID supersession may activate only while the reviewed predecessor still maps to the exact reviewed ESPN identity; the replacement identity row must explicitly name that predecessor. D/ST may derive ESPN's synthetic team-defense ID only from the source-published NFL team code and the explicit ESPN pro-team table. Reject unknown team codes, missing reviewed evidence, ambiguous mappings, unreviewed duplicate ESPN identities, cycles, or direct/derived conflicts instead of using names.
- Revalidate derived recommendations against the latest valid snapshot and make stale/obsolete state explainable.
- Do not mutate cached ESPN snapshots during scenarios or revalidation.
- Keep current-week projection, replacement value, ROS rank, and multiweek scenario conclusions separately sourced and labeled.
- Add deterministic tests for every new legality, stale-state, missing-data, source-shape, identity-conflict, and rollback condition.
- Preserve mobile navigation, keyboard behavior, accessibility, CSP, cache migrations, companion least privilege, focused static-asset budgets, and production performance quality.
- Do not treat aggregate raw source-JavaScript size as a release blocker. Use it as a trend signal and optimize when user-experienced performance or maintainability warrants it.
- If UI work expands src/ui/section-renderer.js, prefer cohesive view-level extraction rather than adding more application state there.
- Do not begin trade analysis, notifications, server-side model integration, or ESPN write actions unless the roadmap gate and user approval explicitly move the product boundary.

Before completion run npm test, npm run eval:model, npm run check, and git diff --check. Update roadmap/status and any documented test count only after full verification. When a feature task is complete, bump the patch version and cache markers when appropriate, commit and push the task branch, open a pull request targeting master, wait for the required `test` check to pass, update the branch if master advanced, and merge only after the protected-branch requirements are satisfied. Then wait for the master push workflow to complete deployment and production verification, confirm a clean worktree, and report the branch/PR, merge commit, test totals, live URL, and next roadmap item. Never bypass the ruleset or push feature work directly to master.
```
