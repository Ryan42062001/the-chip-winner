# New Codex task handoff prompt

This file is intentionally a point-in-time handoff. If the repository checkpoint or roadmap has advanced, refresh this file before using it.

Copy the block below into a new Codex task.

```text
Continue development of “The Chip Winner” in C:\Users\ryank\OneDrive\Documents\ChatGPT\The Chip Winner.

Read AGENTS.md completely, then inspect git status, recent commits, package.json, docs/roadmap.md, docs/advanced-roadmap.md, docs/architecture.md, and docs/ir-eligibility.md. Preserve user changes and never expose ESPN cookies, credentials, private snapshots, API keys, private mobile links, imported private files, or member data.

Checkpoint: protected master after the v0.9.68 future-only waiver discovery release. Do not trust a SHA copied into this handoff; fetch origin/master and verify the actual tip before editing. The expected release baseline is 291 automated permanent tests plus 21 deployment-blocking model safety fixtures, and the GitHub Pages workflow must pass test, deploy, and production smoke verification.

Core product boundary:
- ESPN-only, read-only in-season fantasy football companion.
- ESPN owns league state, roster rules, availability, locks, acquisition state, current week, injury designation, lineup slot, and IR capacity.
- External rankings/projections remain overlays.
- Preserve null as missing; never turn unknown values into zero.
- Use provider IDs and explicit identity maps only; never join by display name.
- Keep all ESPN write actions outside the product boundary.

Projection/identity rules to preserve:
- DynastyProcess weekly PPR is the zero-cost source path and uses the published FantasyPros-to-ESPN stable-ID crosswalk.
- D/ST identity may use only the source-published NFL team code plus the explicit ESPN pro-team table.
- Reviewed athlete bridges fail closed if their independent stable-ID evidence disappears or conflicts.
- Provider-ID rollover requires explicit supersedes_provider_player_id evidence; historical IDs remain mapped for historical weeks.
- Diagnostic name/position matching is classification-only and never identity evidence.
- The upstream weekly source has no NFL week column. ESPN supplies current week, and the user click is the explicit approval boundary. Do not silently infer or schedule week assignment.
- Weekly browser source checks may contact only approved public GitHub hosts and must never transmit ESPN private data.
- Projection + identity cache updates remain atomic.
- Multiweek deltas require complete mapped projection coverage for baseline and full simulated rosters for every included week.

ESPN IR policy to preserve:
- OUT and INJURED_RESERVE support new IR placement.
- QUESTIONABLE and DOUBTFUL may remain in IR if already there but cannot be newly placed.
- SUSPENSION and healthy/no designation are ineligible.
- Bare PHYSICALLY_UNABLE_TO_PERFORM is unverified unless ESPN also gives a qualifying OUT/IR fantasy designation.
- Known-ineligible current IR occupants invalidate supported acquisition legality; unsupported IR states fail closed as unverified.
- Current IR-assisted waiver recommendations model only BE -> IR, then ESPN-available add -> freed active roster space, with drop: null and explicit irMove provenance.
- IR-assisted current-week recommendations still require the current-week action threshold and must revalidate both steps after refresh.
- Multiweek IR-assisted scenarios retain the injured player in IR, add without a drop, independently match the current ESPN-derived IR recommendation, and require complete future coverage including the retained IR player.

Waiver Engine v2 state after v0.9.68:
- Ordinary explicit multiweek add/drop scenarios may model future value without clearing the current-week action threshold, but must pass current ESPN legality first: add availability, add/drop locks, unlocked bench drop, no proven acquisition exhaustion, supported current IR roster state, and explicit roster-size/position limits.
- Waiver priority uses transparent Pareto priority bands instead of a hidden weighted score. Current-week gain, selected-horizon gain, positive future-week rate, replacement value, same-position depth context, and roster preservation stay separately inspectable.
- Missing future or replacement evidence never becomes zero and cannot create a dominance advantage.
- v0.9.68 adds future-only ordinary add/drop discovery. A stash qualifies only when:
  1. selected future weeks, a compatible projection set, and an explicit identity map exist;
  2. every current roster player has complete selected-week coverage;
  3. the ESPN-available add is unlocked, has a known current-week projection, and has complete selected-week coverage;
  4. an unlocked bench drop exists;
  5. the existing scenario planner accepts the add/drop under current ESPN acquisition, IR-roster, roster-size, position-limit, availability, and lock rules;
  6. current-week lineup gain is below 0.5 points; and
  7. the complete selected future horizon delta is positive.
- For each future-only add, the board keeps the legal drop path with the strongest complete future-horizon gain, then positive-week rate, then current-week impact as transparent tie-breaks.
- Future-only stashes and current-week candidates are ranked together by the same Pareto-band policy.
- The Waiver Wire labels future-only items FUTURE STASH · ADD / DROP and current ordinary items HELPS NOW · ADD / DROP.
- v0.9.68 deliberately does not broaden future-only IR-assisted discovery. IR-assisted future paths keep the stricter current validated no-drop recommendation requirement.

Important current limitations:
- Future-only discovery is ordinary add/drop only.
- Future values remain unavailable whenever baseline or simulated-roster projection coverage is incomplete.
- Sourced position-specific strength-of-schedule grades are still gated pending an approved source/methodology.
- Real authenticated league validation is still needed across materially different acquisition caps, position limits, IR states, and lock transitions.

Primary execution sequence:
1. Accumulate real DynastyProcess player-week coverage as new weekly publications appear. Never fabricate weeks or weaken identity rules to chase 100% coverage.
2. Validate Waiver Engine v2—including current candidates, future-only ordinary stashes, and IR-assisted no-drop paths—against materially different authenticated ESPN league states.
3. Harden performance/browser behavior if real league candidate volume exposes expensive future-only scenario enumeration; do not silently truncate candidate discovery without an explicit, documented policy and UI limitation.
4. Revisit future-only IR-assisted discovery only as a separate reviewed policy/hardening slice; do not inherit ordinary add/drop assumptions.
5. Finish season/playoff intelligence only after approving a documented position-specific strength-of-schedule source and method.
6. Complete production-readiness closeout: manual accessibility, companion threat review, recovery/deletion, and materially different live ESPN states.

Requirements:
- Keep legality, current-week utility, future utility, replacement value, roster context, and roster preservation separate.
- Unknown scenario kinds fail closed.
- Revalidate recommendations against the latest ESPN snapshot without mutating it.
- Do not invent claim likelihood, injury eligibility, player identity, roster rules, or missing projections.
- Add deterministic tests for every new legality, stale-state, missing-data, projection-coverage, identity, browser, or IR transition.
- Preserve mobile navigation, keyboard accessibility, CSP, cache migrations, companion least privilege, focused performance budgets, and production smoke checks.
- Do not begin trade analysis, notifications, server-side models, or ESPN writes unless roadmap gates and user approval explicitly move the boundary.

Before completion run npm test, npm run eval:model, npm run check, and git diff --check. Update roadmap/status and documented test counts only after verification. Use a task branch and PR, require the protected test check, merge only green and up to date, then verify master deploy and production smoke.
```