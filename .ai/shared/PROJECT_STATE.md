# The Chip Winner — Canonical Project State

Last reconciled: 2026-09-08
Manager task: TCW-006 — blocked recovery-field reconciliation

## Repository

- Repository: `Ryan42062001/the-chip-winner`
- Protected default branch: `master`
- Package version: `0.9.88`
- Canonical `.ai` workflow was bootstrapped by TCW-001.
- TCW-001 closeout checkpoint: `110f198145ad117902e79768239151f8ddb769eb`.
- TCW-002 Auditor handoff merged through PR #54 at `b63f162f1ae0c3267c543819622d21d2c780ce70`; post-merge workflow #417 passed.
- TCW-003 authoritative R&D handoff merged through PR #56 at `f714cab4b8a50c876510c332faea42102428d638`; duplicate PR #55 closed unmerged as superseded.
- TCW-004 canonical integration merged at `2ef036eb02efd6600049d91f2f076c0f3a633a1b`; workflow #421 passed test, deploy, and production verification.
- TCW-005 Auditor blocked/inconclusive handoff merged through PR #58 at `748aed086de038cdd627d3cefb433c7bc1458761`.

## Product boundary

The Chip Winner remains an ESPN-only, read-only, in-season fantasy-football decision companion. ESPN is authoritative for connected-league state. External rankings/projections are independent overlays. Derived recommendations never mutate source snapshots. ESPN write actions remain outside Release 1.0.

## Architecture

Four primary layers remain established:

1. Provider layer — ESPN acquisition/normalization/caching and external projection/ranking overlays.
2. Domain layer — normalized model, selectors, optimizers, scenarios, legality, and recommendations.
3. Application layer — single state owner and explicit browser/application transitions.
4. Interface layer — rendering and interaction without source normalization or a second state store.

## Completed major work

- Read-only authenticated ESPN companion path is implemented.
- Waiver Engine v2 reviewed deterministic scope is complete as of v0.9.69.
- Season/Playoff Intelligence reviewed deterministic scope is complete as of v0.9.70.
- Automatable production-readiness engineering is complete as of v0.9.71.
- Evidence-backed Release 1.0 field-validation registry exists as of v0.9.72.
- Subsequent field-driven fixes and validation advanced through v0.9.88.
- Authenticated standard ESPN workflow validation is passed in the registry.
- TCW-001 canonical workflow bootstrap is merged and production-verified.
- TCW-002 independently audited the v0.9.88 Release 1.0 baseline: `PASS WITH NON-BLOCKING FINDINGS`.
- TCW-003 completed ESPN field-validation feasibility research.
- TCW-004 integrated the evidence wave and reconciled `.ai/shared/*` as canonical coordination authority in `AGENTS.md`.
- TCW-005 completed one Auditor execution attempt but could not perform the mandatory real local failure/reconnect observation; verdict `INCONCLUSIVE / BLOCKED`.

## Current milestone

### Release 1.0 — trustworthy read-only companion

Status: ACTIVE — FIELD VALIDATION

The deterministic implementation baseline remains substantially complete. The active milestone is evidence-backed real-world validation and final release gating, not broad feature expansion.

## Release 1.0 field gate

Machine-readable source: `config/field-validation.json`.

Current verified status remains **6 passed / 7 pending**.

Passed:
- FV-A11Y-01
- FV-A11Y-03
- FV-MOBILE-01
- FV-ESPN-01
- FV-ESPN-03
- FV-SYNC-01

Pending:
- FV-A11Y-02
- FV-ESPN-02
- FV-ESPN-04
- FV-ESPN-05
- FV-SEASON-01
- FV-RECOVERY-01
- FV-WAIVER-01

No TCW-005 evidence was added to the registry because the required live field sequence was not observed. Release 1.0 remains blocked until all registry items pass with privacy-safe evidence and the final release PR/master gates are green.

## TCW-005 outcome — recovery/reconnect

Auditor verdict: **INCONCLUSIVE / BLOCKED — REQUIRED AUTHENTICATED FIELD ENVIRONMENT NOT AVAILABLE TO THAT SESSION**.

What was verified:

- TCW-005 was authorized against a production-verified v0.9.88 baseline.
- FV-RECOVERY-01 remained pending before the attempt.
- The Auditor environment could inspect repository/CI state but could not access the user's authenticated Chrome/ESPN session, Chrome companion runtime, or OS/device network controls.
- No production code, ESPN state, field status, credentials, or private league data were changed.

What was **not** observed:

- a successful authenticated pre-failure Refresh ESPN baseline in the user's browser;
- a real OS/device network disconnect with the page held open;
- the actual failed-refresh message/class;
- the retained snapshot's exact post-failure source/freshness/error labels;
- authenticated navigation behavior in that failed-refresh state;
- a restored-network reconnect/refresh.

Therefore FV-RECOVERY-01 remains pending. The existing code observation that a retained prior `live-companion` snapshot may continue to display `Live ESPN snapshot` after refresh failure remains a strong risk, not a reproduced field defect.

## External prerequisite to resume TCW-005

A real user-operated deployed authenticated session must record only privacy-safe observations:

1. OS and browser/version.
2. Deployed/package checkpoint when known.
3. Successful pre-failure Refresh ESPN result and sanitized source/capture/freshness labels.
4. Temporary OS/device network disconnect while the loaded page stays open.
5. Refresh ESPN while offline after normal cooldown and the sanitized failure class/message.
6. Whether the prior valid snapshot remains usable.
7. Exact sanitized source/freshness/error labels after failure.
8. Whether navigation stays on retained ESPN state without sample fallback.
9. Restored network plus successful reconnect/refresh and updated capture/freshness state.

No player, league, team, member, cookie, credential, raw payload, or private URL data is needed.

When that evidence exists, Auditor should be re-activated under TCW-005 to render the independent field verdict. Builder remains unwarranted until a deterministic failure is actually reproduced.

## Other accepted evidence-wave findings

- FV-ESPN-05 is time-windowed around a real lock/availability transition.
- FV-ESPN-02 requires a materially different authenticated custom FLEX/OP league.
- FV-ESPN-04 is naturally occurring/opportunity-dependent.
- FV-SEASON-01 is seasonal/staged.
- FV-WAIVER-01 remains coverage/observability-dependent; domain counters exist but the normal UI does not clearly surface the full required tuple.
- The Chrome companion currently requests ESPN availability with `limit: 100`; whether this materially truncates live availability remains unverified.
- A whole-period lock configuration remains a live coverage risk; no production defect is declared without relevant live evidence.

## Active coordination state

- TCW-006 — Manager reconciliation of the blocked TCW-005 attempt — ACTIVE until its protected PR and post-merge production verification complete.
- Manager remains active for Release 1.0 field-gate orchestration.
- Auditor is IDLE while TCW-005 waits on the external local evidence prerequisite.
- Builder is IDLE because no field-reproduced deterministic defect exists.
- R&D is IDLE because TCW-003 is complete and no new research is currently necessary.
- Strategy is IDLE because no recommendation-policy uncertainty is active.

No new parallel specialist wave is justified at this checkpoint.

## Current focus

1. Obtain the privacy-safe user-operated TCW-005 recovery/reconnect evidence package described above.
2. Re-activate Auditor under TCW-005 only after that evidence exists.
3. If Auditor confirms a deterministic recovery defect, route a narrow Builder remediation with regression coverage and require a real field retest.
4. If recovery passes, integrate the evidence/status through a separate protected field-registry change.
5. Continue the other six field checks only when their real prerequisites exist; do not manufacture league state or specialist work.
6. Preserve Release 1.0 read-only scope and existing fail-closed identity/missing-data/IR/lock boundaries.

## Known limitations / gated work

- Screen-reader critical-workflow field validation is incomplete.
- Authenticated custom FLEX/OP validation is incomplete.
- Real ESPN IR-edge and lock/availability transition validation is incomplete.
- Real playoff/bye intelligence validation is incomplete.
- Live recovery/reconnect validation is incomplete and currently blocked on user-operated local evidence.
- Real waiver enumeration/timing evidence is incomplete.
- Internal ESPN JSON endpoints/views remain observed integrations rather than a documented public ESPN API contract.
- Trade analysis, external notifications, future-only IR-assisted stash discovery, playoff probability modeling, server-side models, and ESPN write actions remain gated future work.

## Reconciliation findings

The following remain intentionally recorded as stale/historical rather than silently rewritten:

- `docs/next-codex-task.md` still describes an expected v0.9.76 checkpoint.
- `docs/roadmap.md` contains historical status wording from earlier Release 1.0 execution despite work advancing through v0.9.88.
- `config/field-validation.json` has `baselineVersion: 0.9.81` while package version is v0.9.88; current item statuses/evidence remain authoritative for field-check state.
