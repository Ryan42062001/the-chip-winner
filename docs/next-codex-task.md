# New Codex task handoff prompt

This file is intentionally a point-in-time handoff. If the repository checkpoint or roadmap has advanced, refresh this file before using it.

Copy the block below into a new Codex task.

```text
Continue development of “The Chip Winner” in C:\Users\ryank\OneDrive\Documents\ChatGPT\The Chip Winner.

Read AGENTS.md completely, then inspect git status, recent commits, package.json, docs/roadmap.md, docs/advanced-roadmap.md, and docs/architecture.md. Preserve user changes and never expose ESPN cookies, credentials, private snapshots, API keys, private mobile links, imported private files, or member data.

Checkpoint: protected master; application release v0.9.58 extends the zero-cost DynastyProcess weekly PPR staging path with a deterministic ESPN D/ST identity bridge. D/ST uses the source-published NFL team code plus an explicit ESPN pro-team-ID table to derive ESPN's synthetic team-defense player ID; normal athlete identities remain stable FantasyPros-to-ESPN ID joins only. Do not rely on a SHA copied into this handoff: fetch origin/master and verify the actual tip before editing. The verified release baseline has 227 automated tests and 21 model-safety fixtures, and the GitHub Pages workflow must pass deployment and production smoke verification.

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
- The zero-cost command `npm run projections:dynastyprocess-weekly -- --season <year> --week <1-18>` stages the current DynastyProcess FantasyPros-derived weekly PPR `r2p_pts` signal into ignored local-data projection/identity CSVs and a provenance sidecar. The upstream weekly file has no NFL week column, so week must remain explicit. Normal athletes use the published stable FantasyPros-to-ESPN ID crosswalk only. D/ST rows use the source-published team code plus an explicit ESPN pro-team table to derive ESPN's synthetic defense ID; unknown team codes and conflicting direct IDs fail closed. Display names are never used as identity joins. Live Week 1 validation on the 2026-09-04 source mapped 637/682 rows overall, including all 32/32 D/ST rows; the pre-bridge baseline was 605/682 with 0/32 D/ST.
- The lineup optimizer, roster-aware waiver simulation, acquisition/roster/position-limit enforcement, snapshot differencing, alerts, multiple local ESPN connections, encrypted mobile sync, accessibility automation, security scanning, and production smoke checks are implemented.
- Current-week waiver candidates show a separate ESPN-pool replacement benchmark; do not collapse replacement value into legal-lineup gain.
- Prior current-week waiver recommendations are reconstructed from the previous valid ESPN capture and revalidated against the latest ESPN availability, roster/drop legality, locks, acquisition limits, explicit roster rules, and current projected lineup gain. Moves that are no longer supported appear in What Changed as obsolete with the exact reason; missing refresh inputs remain explicitly unverified rather than being treated as a proven failure.

Primary execution sequence:
1. Use the zero-cost DynastyProcess staging path to accumulate real PPR player-week coverage whenever the live source and stable identity rules provide it. Keep exact player-week and mapping gaps visible; never fabricate future weeks, infer the source's missing week field, mirror the third-party weekly dataset into the public site, or auto-join athletes by display name. Preserve the verified explicit D/ST team-code bridge and fail closed on unknown/conflicting team identities.
2. Model IR transitions only if the connected ESPN payload supplies authoritative eligibility and rule inputs. Otherwise preserve the limitation and do not infer eligibility.
3. Add multiweek waiver impact only after both baseline and simulated rosters have complete mapped player-week projection coverage for every included week.
4. Finish season/playoff intelligence only after a documented, approved position-specific strength-of-schedule source and methodology exist; do not invent schedule difficulty.
5. Continue production-readiness closeout with manual accessibility, companion threat review, recovery/deletion checks, and materially different authenticated read-only league states when the required real-world test inputs are available.

Requirements:
- Keep ESPN authoritative for league state, roster rules, availability, locks, and acquisition state.
- Preserve `null`; never fill missing facts with zero or inferred values. Preserve an explicit source-provided projection value of zero as zero.
- Use provider-owned IDs and explicit maps for projection joins.
- For DynastyProcess weekly staging, accept only the source's supported PPR pages, publication provenance, FantasyPros IDs, and explicit stable identity evidence. Normal athletes require the published ESPN ID crosswalk. D/ST may derive ESPN's synthetic team-defense ID only from the source-published NFL team code and the explicit ESPN pro-team table. Reject unknown team codes, ambiguous mappings, or direct/derived conflicts instead of using names.
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
