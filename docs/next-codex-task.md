# New Codex task handoff prompt

This file is intentionally a point-in-time handoff. If the repository checkpoint or roadmap has advanced, refresh this file before using it.

Copy the block below into a new Codex task.

```text
Continue development of “The Chip Winner” in C:\Users\ryank\OneDrive\Documents\ChatGPT\The Chip Winner.

Read AGENTS.md completely, then inspect git status, recent commits, package.json, docs/roadmap.md, docs/advanced-roadmap.md, and docs/architecture.md. Preserve user changes and never expose ESPN cookies, credentials, private snapshots, API keys, private mobile links, imported private files, or member data.

Checkpoint: protected master; application release v0.9.61 adds classified unresolved-row diagnostics to the zero-cost DynastyProcess weekly PPR staging path. Do not rely on a SHA copied into this handoff: fetch origin/master and verify the actual tip before editing. The verified release baseline has 239 automated tests plus 21 deployment-blocking model safety fixtures, and the GitHub Pages workflow must pass deployment and production smoke verification.

Current tooling baseline:
- Node.js >=20.
- GitHub Actions uses actions/checkout v7.
- axe-core 4.13.0 powers the automated accessibility audit.
- playwright-core 1.62.1 powers browser smoke and accessibility journeys.
- master is protected by an active repository ruleset. Work on a task branch, open a pull request to master, and require the GitHub Actions `test` status check to pass before merge.
- Total browser JavaScript graph size is measured and reported as an informational trend; focused HTML, CSS, app-entry, and sample-data budgets remain release guardrails.
- `scripts/smoke-static.js` derives its asset-version assertion from package.json.

Projection/identity foundation to preserve:
- The zero-cost command `npm run projections:dynastyprocess-weekly -- --season <year> --week <1-18>` stages the current DynastyProcess FantasyPros-derived weekly PPR `r2p_pts` signal into ignored local-data projection/identity CSVs plus a provenance metadata sidecar.
- The upstream weekly file has no NFL week column, so week must remain explicit.
- Normal athletes use DynastyProcess's published FantasyPros-to-ESPN stable ID crosswalk whenever present.
- D/ST rows use the source-published team code plus an explicit ESPN pro-team table to derive ESPN's synthetic defense ID; unknown team codes and conflicting direct IDs fail closed.
- v0.9.59 added ten reviewed athlete bridges where the weekly feed publishes a FantasyPros ID while the current DynastyProcess ID table independently publishes the target ESPN ID with no FantasyPros assignment. Each bridge activates only while that exact independent evidence persists and automatically yields to a future direct upstream mapping.
- v0.9.60 added explicit provider-ID supersession. A replacement provider ID may share an ESPN identity with a historical provider ID only through `supersedes_provider_player_id` and exact predecessor evidence. Roman Wilson remains the first reviewed rollover: current FantasyPros ID `28896` supersedes historical ID `26160`; both resolve to ESPN `4431492` only while the current DynastyProcess table still maps the predecessor to that ESPN identity.
- v0.9.61 classifies rows that remain unresolved after all stable-ID rules. The metadata sidecar now reports category counts and per-row status. A best-effort ESPN Fantasy public player-pool lookup may use exact normalized display name plus position only to explain why an already-unresolved row stays excluded. That diagnostic is NOT identity evidence and must never create, propose, persist, or auto-approve an ESPN mapping. If the ESPN diagnostic is unavailable, staging still succeeds and unresolved rows fall back to `stable-crosswalk-missing`, except explicitly reviewed stale source rows.
- The reviewed stale-source mechanism currently marks FantasyPros ID `9019` (Andrew Wellock) as a known bad/stale 2026 source row. Add future reviewed stale rows only with independent evidence; never use this list to hide an otherwise valid player merely to improve a coverage percentage.
- Under the verified 2026-09-04 Week 1 source state, stable mapping coverage remains 648/682 (95.01%). The remaining 34 should not be forced into identities. The refreshed ESPN Fantasy diagnostic classified 30 as absent from the current fantasy player pool, 3 as present but with ESPN `proTeamId: 0` (Michael Trigg, Cam Grandy, Charlie Smyth), and 1 as the reviewed stale Andrew Wellock source row. These classifications explain exclusion only; they do not change mapping coverage.

Other completed foundation to preserve:
- Browser entry-point split and atomic/inspectable multiweek imports.
- Single application state owner and focused projection-import/event/rendering modules.
- Candidate-aware future coverage for the selected roster plus top current ESPN waiver candidates.
- Constraint-based lineup optimizer, roster-aware waiver simulation, ESPN acquisition/roster/position-limit enforcement, snapshot differencing, alerts, multiple local ESPN connections, encrypted mobile sync, accessibility automation, security scanning, and production smoke checks.
- Refresh-aware waiver recommendation revalidation: prior current-week advice is checked against the latest ESPN availability, roster/drop legality, locks, acquisition limits, explicit roster rules, and current projected lineup gain. Unsupported moves become obsolete; missing evidence remains unverified.

Primary execution sequence:
1. Continue accumulating real DynastyProcess PPR player-week coverage whenever the live source and stable identity rules provide it. Review the v0.9.61 classification sidecar before investigating unresolved rows. Never fabricate future weeks, infer the source's missing week field, mirror the third-party weekly dataset into the public site, auto-map by display name, or chase 100% coverage by weakening identity rules.
2. Revisit unresolved rows only when new stable crosswalk evidence, an explicit reviewed provider-ID rollover, or new authoritative ESPN Fantasy state appears. Classification-only display matching must remain separate from identity resolution.
3. Model IR transitions only if the connected ESPN payload supplies authoritative eligibility and rule inputs. Otherwise preserve the limitation.
4. Add multiweek waiver impact only after both baseline and simulated rosters have complete mapped player-week projection coverage for every included week.
5. Finish season/playoff intelligence only after a documented, approved position-specific strength-of-schedule source and methodology exist.
6. Continue production-readiness closeout with manual accessibility, companion threat review, recovery/deletion checks, and materially different authenticated read-only league states when real-world inputs are available.

Requirements:
- Keep ESPN authoritative for league state, roster rules, availability, locks, and acquisition state.
- Preserve `null`; never fill missing facts with zero or inferred values. Preserve explicit source-provided zero projections as zero.
- Use provider-owned IDs and explicit maps for projection joins.
- Keep diagnostic matching classification-only. A display-name/position diagnostic may explain exclusion but can never produce an ESPN identity mapping.
- Preserve the D/ST bridge, fail-closed reviewed athlete bridges, explicit provider-ID supersession semantics, and ordinary duplicate-ID conflict protection.
- Revalidate recommendations against the latest valid snapshot without mutating cached ESPN state.
- Keep current-week projection, replacement value, ROS rank, and multiweek scenario conclusions separately sourced and labeled.
- Add deterministic tests for every new legality, stale-state, missing-data, source-shape, identity-conflict, rollback, or diagnostic-classification condition.
- Preserve mobile navigation, keyboard behavior, accessibility, CSP, cache migrations, companion least privilege, focused static-asset budgets, and production performance quality.
- Do not begin trade analysis, notifications, server-side model integration, or ESPN write actions unless the roadmap gate and user approval explicitly move the product boundary.

Before completion run npm test, npm run eval:model, npm run check, and git diff --check. Update roadmap/status and documented test counts only after full verification. For feature releases, bump the patch version/cache markers when appropriate, use a task branch and PR, require the protected `test` check, merge only after it is green and up to date, then verify the master deployment and production smoke. Never bypass the ruleset or push feature work directly to master.
```
