# New Codex task handoff prompt

This file is intentionally a point-in-time handoff. If the repository checkpoint or roadmap has advanced, refresh this file before using it.

Copy the block below into a new Codex task.

```text
Continue development of “The Chip Winner” in C:\Users\ryank\OneDrive\Documents\ChatGPT\The Chip Winner.

Read AGENTS.md completely, then inspect git status, recent commits, package.json, docs/roadmap.md, docs/advanced-roadmap.md, and docs/architecture.md. Preserve user changes and never expose ESPN cookies, credentials, private snapshots, API keys, private mobile links, imported private files, or member data.

Checkpoint: master; application release v0.9.55 after the dependency and performance-policy cleanup. Do not rely on a SHA copied into this handoff: fetch origin/master and verify the actual tip before editing. The verified baseline has 212 automated tests and 21 model-safety fixtures, and the GitHub Pages workflow passes deployment and production smoke verification.

Current tooling baseline:
- Node.js >=20.
- GitHub Actions uses actions/checkout v7.
- axe-core 4.13.0 powers the automated accessibility audit.
- playwright-core 1.62.1 powers browser smoke and accessibility journeys.
- Total browser JavaScript graph size is measured and reported as an informational trend; it is not a deployment-blocking hard cap. Focused HTML, CSS, app-entry, and sample-data budgets remain release guardrails.

Completed foundation to preserve:
- The browser entry-point split and atomic/inspectable multiweek imports are complete.
- The app has a single application state owner and focused projection-import/event/rendering modules.
- FantasyPros weekly projection infrastructure, explicit provider-to-ESPN identity mapping, coverage diagnostics, Season Plan scenarios, and selected-horizon completeness gates are implemented.
- Candidate-aware future coverage checks the top current ESPN waiver adds across the selected horizon and distinguishes missing identity mappings from missing player-week projections.
- The lineup optimizer, roster-aware waiver simulation, acquisition/roster/position-limit enforcement, snapshot differencing, alerts, multiple local ESPN connections, encrypted mobile sync, accessibility automation, security scanning, and production smoke checks are implemented.
- Current-week waiver candidates show a separate ESPN-pool replacement benchmark; do not collapse replacement value into legal-lineup gain.

Primary execution sequence:
1. Complete real projection coverage when the required user-supplied FantasyPros weekly exports and explicit identity approvals are available. Never fabricate provider data, scrape unsupported pages, or auto-join by display name.
2. If required private/local projection files are not present, move to the next code-only Waiver Engine v2 item: make recommendations refresh-aware so an add/drop recommendation derived from an older ESPN snapshot is visibly obsolete when availability or relevant source state changes.
3. Model IR transitions only if the connected ESPN payload supplies authoritative eligibility/rule inputs. Otherwise preserve an explicit limitation instead of inferring eligibility.
4. Add multiweek waiver impact only after both baseline and simulated rosters have complete mapped player-week projection coverage for every included week.

Requirements:
- Keep ESPN authoritative for league state, roster rules, availability, locks, and acquisition state.
- Preserve `null`; never fill missing facts with zero or inferred values.
- Use provider-owned IDs and explicit maps for projection joins.
- Revalidate derived recommendations against the latest valid snapshot and make stale/obsolete state explainable.
- Do not mutate cached ESPN snapshots during scenarios.
- Keep current-week projection, replacement value, ROS rank, and multiweek scenario conclusions separately sourced and labeled.
- Add deterministic tests for every new legality, stale-state, missing-data, and rollback condition.
- Preserve mobile navigation, keyboard behavior, accessibility, CSP, cache migrations, companion least privilege, focused static-asset budgets, and production performance quality.
- Do not treat aggregate raw source-JavaScript size as a release blocker. Use it as a trend signal and optimize when user-experienced performance or maintainability warrants it.
- If UI work expands src/ui/section-renderer.js, prefer cohesive view-level extraction rather than adding more application state there.
- Do not begin trade analysis, notifications, server-side model integration, or ESPN write actions unless the roadmap gate and user approval explicitly move the product boundary.

Before completion run npm test, npm run eval:model, npm run check, and git diff --check. Update roadmap/status and any documented test count only after full verification. When a feature task is complete, bump the patch version and cache markers when appropriate, commit, push master, wait for the GitHub Pages workflow and production verification, confirm a clean worktree, and report the commit, test totals, live URL, and next roadmap item.
```
