# New Codex task handoff prompt

This file is intentionally a point-in-time handoff. If the repository checkpoint or roadmap has advanced, refresh this file before using it.

Copy the block below into a new Codex task.

```text
Continue development of “The Chip Winner” in C:\Users\ryank\OneDrive\Documents\ChatGPT\The Chip Winner.

Read AGENTS.md completely, then inspect git status, recent commits, package.json, docs/roadmap.md, docs/advanced-roadmap.md, docs/architecture.md, docs/ir-eligibility.md, docs/season-playoff-intelligence.md, docs/production-readiness.md, docs/field-validation.md, docs/release-notes-v0.9.76.md, and config/field-validation.json. Preserve user changes and never expose ESPN cookies, credentials, private snapshots, API keys, private mobile links, imported private files, or member data.

Checkpoint: expected protected master after the v0.9.76 Performance Pass. Do not trust a copied SHA; fetch origin/master and verify the actual tip before editing. The expected release baseline is 328 automated permanent tests plus 21 deployment-blocking model safety fixtures. The protected GitHub Pages workflow must pass test, deploy, and verify-production including npm run smoke:production.

Core product boundary:
- ESPN-only, read-only in-season fantasy football companion.
- ESPN owns league state, roster rules, availability, locks, acquisition state, current week, injury designation, lineup slot, fantasy matchups, and explicit playoff weeks when supplied.
- External rankings/projections remain overlays.
- Preserve null as missing; never turn unknown values into zero.
- Use provider-owned IDs and explicit identity maps only; never join projections by display name.
- Keep all ESPN write actions outside the product boundary.

Projection/identity foundation to preserve:
- DynastyProcess `r2p_pts` is a source-published PPR weekly estimate, not a custom ESPN projection.
- Normal athletes use the published FantasyPros-to-ESPN stable ID crosswalk.
- D/ST uses source NFL team code plus the explicit ESPN pro-team bridge.
- Reviewed athlete bridges activate only while exact independent source evidence remains valid and unassigned.
- Provider-ID rollover requires explicit supersession evidence; historical IDs remain mapped.
- Display-name diagnostics are classification-only and can never create identity evidence.
- The browser weekly updater assigns the public source to ESPN's current week only after explicit user approval because the source contains no NFL week field.
- Later-week imports require a publication newer than the stored prior-week capture; publications older than eight days are blocked.
- Public source requests stay limited to approved GitHub hosts and never include ESPN private data.
- Projection and identity updates commit atomically and retain prior weeks.
- Verified 2026 Week 1 source coverage remains 648/682 mapped (95.01%), with 34 unresolved; never chase 100% by weakening identity rules.

ESPN IR policy to preserve:
- OUT and INJURED_RESERVE support new IR placement.
- QUESTIONABLE and DOUBTFUL may remain only when already in IR.
- SUSPENSION and healthy/no-designation states are ineligible.
- Bare PHYSICALLY_UNABLE_TO_PERFORM is unverified unless ESPN also supplies a qualifying OUT/IR fantasy designation.
- Known-ineligible current IR occupants block supported acquisitions; unverified IR occupants withhold legality.
- IR-assisted current recommendations model only eligible unlocked BE -> IR followed by an ESPN-available unlocked add with drop: null.
- Revalidate both IR steps after refresh.
- Multiweek IR-assisted scenarios retain the injured player in IR, require the matching current ESPN no-drop recommendation, and require complete future coverage for the full simulated roster.
- Future-only IR-assisted stash discovery is separately gated and is not part of Waiver Engine v2.

Waiver Engine v2 is complete. Preserve:
- current-week waiver action threshold of 0.5 projected lineup points;
- future-only ordinary add/drop candidates only after current ESPN legality is proven;
- complete selected-week projection coverage for baseline and simulated roster before future deltas are exposed;
- transparent Pareto priority bands with no hidden weighted score;
- missing evidence remains missing and cannot become zero or an advantage;
- exhaustive eligible-add x unlocked-bench-drop enumeration with visible consideredAdds, completeAdds, scenarioCount, and qualifiedAdds;
- no hidden candidate cap;
- current transaction legality and future lineup utility use separate lock semantics;
- unknown future transaction kinds fail closed;
- source ESPN snapshots are never mutated.

Season/Playoff Intelligence is complete for the reviewed deterministic scope. Preserve:
- ESPN playoff weeks authoritative; browser-local league/season fallback only when ESPN omits them and always labeled as fallback;
- ESPN fantasy playoff opponents are schedule facts, not NFL defensive grades or probabilities;
- bye coverage uses explicit known byes and maximum legal starter-slot fillability from the current non-IR roster;
- missing byes remain unknown and FLEX/OP ambiguity is exposed rather than guessed;
- playoff aggregates require complete mapped projection coverage across every configured week;
- FantasyPros SOS fields remain optional source-defined overlays and are not relabeled as the exact ESPN playoff window;
- no hidden playoff score or qualification/championship probability.

v0.9.76 performance invariants:
- lineup optimization uses memoized dynamic programming while preserving deterministic tie behavior, locks, slot eligibility, and missing-data semantics;
- waiver simulations reuse one player index and lineup optimizer context;
- waiver analysis caching must remain sensitive to roster entries, availability, projections, position, injuries, acquisition facts, roster/waiver rules, explicit locks, and kickoff-derived lock transitions;
- cache display limits are applied only after the exhaustive analysis so a small UI limit never truncates the legal candidate pool;
- same-object source changes must invalidate cached waiver results;
- priority/scenario evaluation reuses the current waiver result instead of recalculating it;
- future-week player/index/optimizer contexts are reused across scenarios;
- playoff-only future baseline evaluation can skip current-waiver derivation when current scenarios are not requested;
- immutable future projection sets may reuse normalized/indexed structures;
- ESPN normalization indexes NFL scoreboard context once per capture;
- Chrome companion v0.2.3 may issue independent ESPN read requests concurrently, but MINIMUM_COMPANION_VERSION remains 0.2.2 so the upgrade is optional;
- `npm run audit:performance` includes runtime budgets and an exhaustive 24-add x 4-drop (96-scenario) workload. Never make the budget pass by silently truncating candidates.

Production-readiness / field state:
- v0.9.71 completed automatable production-readiness engineering.
- v0.9.72 created the finite Release 1.0 field registry.
- v0.9.73-v0.9.75 repaired live ESPN roster/acquisition parity and real 200% reflow issues discovered during field work.
- v0.9.76 performs the comprehensive runtime-efficiency pass triggered by real Waivers/Season Plan responsiveness observations.
- Field statuses are pending, passed, blocked, or failed. Passed/failed require privacy-safe evidence; blocked remains incomplete.
- FV-A11Y-01 and FV-ESPN-03 are passed from real field evidence. Other items remain pending unless config/field-validation.json says otherwise.
- FV-WAIVER-01 remains pending until the deployed v0.9.76 build is retested in the real authenticated browser. CI timings are supporting deterministic evidence only.
- FV-A11Y-03 remains pending until the deployed build is retested at actual Chrome 200% zoom.
- Never put ESPN cookies, credentials, raw private snapshots, member identifiers, or private sync tokens/URLs into field evidence.
- New deterministic provider shapes or reproduced defects should become sanitized permanent regression fixtures where practical.

Current priorities after v0.9.76:
1. Complete Release 1.0 field validation honestly.
2. Retest real Waivers and Season Plan responsiveness on deployed v0.9.76 and record visible enumeration counts/timing where available.
3. Retest actual Chrome 200% zoom on the deployed compact-desktop reflow.
4. Accumulate real DynastyProcess multiweek coverage as new weekly publications appear.
5. Validate completed waiver and season intelligence against real ESPN transitions without reopening policy boundaries unnecessarily.
6. Label the product 1.0 only after every field item passes with evidence and the exact final 1.0 PR/master production gates are green.

Still separately gated:
- trade analysis;
- external notifications;
- future-only IR-assisted stash discovery;
- playoff qualification/championship probability modeling;
- server-side model integration;
- ESPN write actions.

Before completion run npm test, npm run eval:model, npm run check, npm run field:status, and git diff --check. Update documented test counts only after the complete suite is verified. For feature releases, work on a task branch, open a PR to protected master, require the exact final PR head to pass the full protected test job, merge only while up to date, then verify master test, deploy, and npm run smoke:production. Never bypass the ruleset or push feature work directly to master.
```
