# New Codex task handoff prompt

This file is intentionally a point-in-time handoff. If the repository checkpoint or roadmap has advanced, refresh this file before using it.

Copy the block below into a new Codex task.

```text
Continue development of “The Chip Winner” in C:\Users\ryank\OneDrive\Documents\ChatGPT\The Chip Winner.

Read AGENTS.md completely, then inspect git status, recent commits, package.json, docs/roadmap.md, docs/advanced-roadmap.md, docs/architecture.md, and docs/ir-eligibility.md. Preserve user changes and never expose ESPN cookies, credentials, private snapshots, API keys, private mobile links, imported private files, or member data.

Checkpoint: expected protected master after the v0.9.69 Waiver Engine v2 closeout release. Do not trust a SHA copied into this handoff; fetch origin/master and verify the actual tip before editing. The expected release baseline is 300 automated permanent tests plus 21 deployment-blocking model safety fixtures, and the GitHub Pages workflow must pass test, deploy, and production smoke verification.

Core product boundary:
- ESPN-only, read-only in-season fantasy football companion.
- ESPN owns league state, roster rules, availability, locks, acquisition state, current week, injury designation, lineup slot, and IR capacity.
- External rankings/projections remain overlays.
- Preserve null as missing; never turn unknown values into zero.
- Use provider IDs and explicit identity maps only; never join by display name.
- Keep all ESPN write actions outside the product boundary.

Projection/identity foundation to preserve:
- DynastyProcess `r2p_pts` is a source-published PPR weekly estimate, not a custom ESPN projection.
- Normal athletes use the published FantasyPros-to-ESPN stable ID crosswalk.
- D/ST uses source NFL team code plus the explicit ESPN pro-team bridge.
- Reviewed athlete bridges activate only while exact independent source evidence remains valid and unassigned.
- Provider-ID rollover requires explicit supersession evidence; historical IDs remain mapped.
- Display-name diagnostics are classification-only and can never create identity evidence.
- The browser weekly updater uses ESPN's current week only after an explicit user approval click because the upstream file contains no NFL week field.
- Later-week imports require a publication newer than the stored previous-week capture; publications older than eight days are blocked.
- Weekly source requests are limited to approved public GitHub hosts and never include ESPN private data.
- Projection and identity updates commit atomically and preserve prior weeks.
- Verified 2026 Week 1 source coverage remains 648/682 mapped (95.01%), with 34 unresolved; never chase 100% by weakening identity rules.

ESPN IR policy to preserve:
- OUT and INJURED_RESERVE support new IR placement.
- QUESTIONABLE and DOUBTFUL may remain only when already in IR.
- SUSPENSION and healthy/no-designation states are ineligible.
- Bare PHYSICALLY_UNABLE_TO_PERFORM is unverified unless ESPN also supplies a qualifying OUT/IR fantasy designation.
- Known-ineligible current IR occupants block supported acquisitions; unverified IR occupants withhold legality.
- IR-assisted current recommendations model only eligible unlocked bench BE -> IR followed by an ESPN-available unlocked add with drop: null.
- Revalidate both IR steps after refresh.
- Multiweek IR-assisted scenarios retain the injured player in IR, require the matching current ESPN no-drop recommendation, and require complete future coverage for the entire simulated roster.
- Future-only IR-assisted stash discovery is NOT part of completed Waiver Engine v2. It requires a separate policy review before expansion.

Waiver Engine v2 is complete in v0.9.69. Preserve all of these behaviors:
- Current-week waiver actions retain the existing 0.5-point lineup-gain threshold.
- Ordinary future add/drop scenarios may be useful below that threshold but must first pass current ESPN legality.
- Future-only ordinary stash discovery requires complete selected-week coverage for the current roster and simulated roster, a known current add projection, current lineup gain below 0.5, and a positive complete horizon delta.
- Every future-only add/drop pair is revalidated through the scenario planner for ESPN availability, locks, acquisition exhaustion, IR roster validity, roster size, and position limits.
- Transparent Pareto bands compare current-week gain, future-horizon gain, positive-week rate, replacement value, and roster preservation without a hidden weighted score.
- Missing evidence remains missing and cannot become zero or an advantage.
- Candidate enumeration is exhaustive over eligible ESPN-available adds x unlocked bench drops and exposes consideredAdds, completeAdds, scenarioCount, and qualifiedAdds. Do not add a hidden candidate cap.
- v0.9.69 directly tests a 24-add x 4-drop synthetic pool (96 scenarios), available-player permutation invariance, source immutability, availability removal, kickoff transitions, all-bench locks, invalid IR state, raw-PUP unverified IR state, and current-week behavior without future inputs.
- Current ESPN transaction legality and future utility have separate lock semantics. Current legality honors current kickoff and explicit ESPN locks at the supplied evaluation time. Future-week lineup optimization must not reuse the current snapshot's kickoff as an invented future-week lock because authoritative future kickoff data is absent. Explicit ESPN locked:true flags remain enforced.
- Unknown future transaction kinds fail closed.
- Source ESPN snapshots are never mutated.

Current priorities after v0.9.69:
1. Accumulate real DynastyProcess multiweek coverage through the explicit browser workflow as new weekly publications appear.
2. Finish season/playoff intelligence only after approving and documenting a position-specific strength-of-schedule source and methodology.
3. Complete production-readiness closeout: manual keyboard/screen-reader/200% zoom/mobile checks, Chrome companion threat review, recovery/deletion/mobile-sync revocation, and authenticated materially different ESPN league states.
4. Use those authenticated league states as field validation of the already-complete Waiver Engine v2. Reopen implementation only for a reproduced defect.
5. Observe real waiver candidate volume/timing as multiweek coverage grows. If exhaustive enumeration becomes materially slow, define a visible documented shortlist policy before changing behavior; never silently truncate candidates.
6. Keep the browser UI maintainable as feature depth grows without creating a second application state owner.

Still gated:
- future-only IR-assisted stash discovery (separate policy review);
- trade analysis;
- external notifications;
- server-side model integration;
- ESPN write actions.

Before completion run npm test, npm run eval:model, npm run check, and git diff --check. Update documented test counts only after the complete suite is verified. For feature releases, work on a task branch, open a PR to protected master, require the exact final PR head to pass the full protected test job, merge only while up to date, then verify master test, GitHub Pages deploy, and npm run smoke:production. Never bypass the ruleset or push feature work directly to master.
```