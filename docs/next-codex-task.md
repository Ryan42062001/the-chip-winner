# New Codex task handoff prompt

Copy the block below into a new Codex task.

```text
Continue development of “The Chip Winner” in C:\Users\ryank\OneDrive\Documents\ChatGPT\The Chip Winner.

Read AGENTS.md completely, then inspect git status, recent commits, docs/roadmap.md, and docs/advanced-roadmap.md. Preserve user changes and never expose ESPN cookies, credentials, private snapshots, API keys, or member data.

Checkpoint: master; v0.9.48; feature commit 7bcdb8c (“Preserve multiweek projection imports”); public site https://ryan42062001.github.io/the-chip-winner/; 199 automated tests and 21 model-safety fixtures passed. Weekly FantasyPros CSVs now merge across weeks, retain per-record capture times and prior explicit identity mappings, prefer newer player-week captures, and reject equal-time projection conflicts or identity collisions. The current blocker is size: src/app.js is 78.7 KiB/80 KiB and the browser graph is 218.0 KiB/220 KiB.

Primary task: complete “P0 — Split the browser application entry point,” then “P0 — Make multiweek imports atomic and inspectable” if gates remain green.

Requirements:
1. Inspect dependencies and choose cohesive extraction boundaries before editing.
2. Extract section rendering, event binding, and projection-import orchestration from src/app.js. Keep one state owner and explicit dependencies; no hidden snapshot copies or second store.
3. Preserve behavior, mobile navigation, accessibility, CSP, and cache semantics.
4. Reduce src/app.js below 60 KiB while keeping the browser graph at or below 220 KiB. Do not raise budgets just to pass.
5. Preflight projection and identity-map merges together before either cache write. Failure must leave both unchanged.
6. Add a deterministic import summary: added, updated, retained, ignored older, and conflicts. Show capture range and week-level provenance.
7. Preserve null, use provider-owned IDs, never join by display name, and withhold multiweek deltas unless both rosters have complete mapped coverage.
8. Test identical, older, and newer re-imports; source incompatibility; identity conflict; atomic rollback; keyboard focus; and mobile flow.
9. Update roadmap/status and test count only after full verification.

Run npm test, npm run eval:model, npm run check, and git diff --check. Continue autonomously unless a choice changes product direction, privacy, cost, external services, or the ESPN-only/read-only boundary. When complete, bump the patch version and cache markers, commit, push master, wait for GitHub Pages and production verification, confirm a clean worktree, and report the commit, test totals, live URL, and next roadmap item.
```
