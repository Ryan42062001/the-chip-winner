# Builder Handoff — TCW-031 Trade Analyzer Functional Reset + UAT Contract

STATUS: BUILDER IMPLEMENTATION VALIDATED — MANAGER REVIEW PENDING
TASK: TCW-031 — Trade Analyzer Functional Reset + UAT Contract
ROLE: Implementation Engineer / Builder
EXECUTION: STANDARD_CHAT_HIGH
REFRESH: FAST_REFRESH
BRANCH: `builder/tcw-031-trade-analyzer-functional-reset`
STARTING / CURRENT MASTER AT BUILDER REFRESH: `d0845af0abc304e14023bd835c2f8e23d1d40824`
IMPLEMENTATION CHECKPOINT: `6ad584063ad33f986326ece0b84873947b7cfea5`
PR: #129 — TCW-031 Trade Analyzer functional reset and UAT contract
FINAL HANDOFF-INCLUSIVE PR HEAD: verify directly from PR #129 after this evidence commit.
MERGE AUTHORITY: Manager / Architect only.

## Starting baseline reproduced and bounded

Code-path reproduction against exact starting master:
- `src/ui/trade-analyzer.js` originally built incoming choices from every snapshot player absent from the user's roster, with no partner selector.
- `src/domain/trade-analyzer.js` originally accepted any snapshot player not on the user's roster without checking that a single opposing roster owned them. Thus unrostered/free-agent and mixed-opponent proposals could pass shape validation.
- The routed Trade Analyzer view also retained its closure-scoped proposal/result across renders without binding either to the selected user team or loaded snapshot. A team switch or new snapshot could otherwise leave the old package/analysis visible.
- The sample ESPN snapshot has availability labels that overlap actual team-roster entries. Ownership must be determined by the current roster records rather than treating availability labels alone as authoritative trade rights.

These are deterministic baseline code-path findings, not a claim that Builder completed genuine deployed connected-league UAT. No additional unrelated production defect was found in the bounded flow.

## Completed bounded implementation

- Require `partnerTeamId` to resolve to exactly one opposing ESPN team and one loaded roster. Reject missing, self-team, unavailable, and unowned counterparties.
- Enforce outgoing selection from the user's current roster and every incoming ID from that one selected opposing roster at the domain boundary. Free agents, unrostered players, mixed-opponent packages, unknown player IDs, ambiguous incoming ownership, duplicate IDs, and cross-side IDs are invalid.
- Expose partner selector in the routed production UI. Incoming options are drawn only from the selected opponent's roster; unrostered and ambiguously owned IDs are never offered.
- Changing partner clears prior incoming players, follow-up drops, result, and transient errors. Changing selected user team or loaded snapshot clears the entire prior proposal/result. Add/remove/objective/reset operations also clear obsolete results.
- Bind analysis to the currently loaded snapshot/team and render an explicit blocked message on an unexpected failure instead of leaving a prior result visible.
- Make user team, partner team, sent/received players, and explicit follow-up drops visible in READY, INVALID_PROPOSAL, and ROSTER_ACTION_REQUIRED results.
- Preserve the existing 1-for-1 and unequal/multi-player consequence analyzer and explicit follow-up-drop path, and the read-only boundary. No ESPN trade mutation or V2 trade winner/fairness model was implemented.

## Changed files

- `src/domain/trade-analyzer.js`
- `src/ui/trade-analyzer.js`
- `scripts/smoke-trade-analyzer.js`
- `test/trade-analyzer-functional-reset.test.js` (new)
- `test/trade-analyzer.test.js`
- `test/trade-analyzer-contract-edges.test.js`
- `test/trade-analyzer-audit-remediation.test.js`
- `test/trade-analyzer-ui.test.js`
- `.ai/builder/HANDOFF.md` (this evidence commit)

No field registry, workflow, ESPN adapter, recommendation policy, source compatibility, lock/optimizer, roster-rule, waiver/replacement, or release-gate file was modified.

## Deterministic and browser validation

New fixtures contain a selected user's roster, **two distinct opposing team rosters**, and an unrostered/free-agent player. They cover missing/self/unavailable partner, valid 1-for-1, valid 2-for-1 and 1-for-2, explicit follow-up drop, owner mismatch after partner switch, mixed-opponent package, free-agent ID, ambiguous ownership, duplicate and cross-side IDs, outgoing ownership, incomplete current projection coverage, proposal-side visibility, and read-only semantics.

Existing Trade Analyzer v1, TCW-025/030 audit remediation, future/playoff lock neutrality, current lock, FLEX/OP, source separation, depth/fragility, roster legality, and incomplete-evidence tests remain in the full suite with explicit counterparties added to the historical fixture helpers.

Browser smoke now selects one real opposing team, compares the incoming option IDs with that exact team's snapshot roster, asserts none are offered without a partner, creates/analyzes/edits/re-analyzes a package, changes the selected user's team, confirms stale incoming/partner/result are cleared, runs a fresh package, resets, and checks no uncaught page errors.

Initial PR run #608 / `35425042098`: 476/476 Node tests PASS, browser smoke FAIL solely because a generic text locator matched the hidden partner `<option>` rather than its visible rendered result label. The locator was scoped to `.trade-results` on the same branch; the failing assertion was not waived.

Implementation checkpoint `6ad584063ad33f986326ece0b84873947b7cfea5`, FULL PR run #609 / `35425116406`:
- workflow audit / dependency audit PASS;
- full Node test suite **476/476 PASS, 0 FAIL**;
- model evaluation PASS;
- static smoke and dedicated Trade Analyzer browser smoke PASS;
- accessibility, readiness, mobile, extension, performance, and security PASS;
- CI classifier guardrails and evidence upload PASS (`tcw-ci-evidence-35425116406-1`);
- PR-only deploy / verify-production SKIPPED as expected.

Final handoff-inclusive exact-head CI: verify after this handoff commit. If it runs DOCS_ONLY, it must prove immediate successful same-PR predecessor continuity from #609; implementation checkpoint #609 itself ran FULL. No code/test changes follow this handoff without re-running the full validation gate.

## Future real-deployed connected-ESPN UAT contract (NOT BUILDER-CERTIFIED)

The Manager/product owner must exercise the **actually deployed** Trade Analyzer against a genuine connected ESPN league after integration/master verification and independent audit. Record privacy-safe yes/no observations and an explicit product-owner acceptance or rejection, without private team/member IDs, raw snapshots, cookies, tokens, or authenticated URLs.

1. Open Trade Analyzer in a genuine connected ESPN league, confirm the chosen user team and roster match the connected league.
2. Select one real opposing manager/team; confirm its roster is available.
3. Confirm incoming choices exactly reflect that opponent's currently rostered players, not free agents, other opponents, or unknown-directory players.
4. Build and analyze a real 1-for-1 hypothetical using one outgoing current-roster player and one incoming partner-roster player.
5. Verify the result identifies both teams, sent/received players, any explicit drops, snapshot freshness, and either supported before/after consequences or an explicit truthful blocked/unknown limitation; no crash/blank area.
6. Edit to a multi-player package and rerun; check old analysis cannot remain visible. Where roster action is required, select an explicit follow-up drop and verify resolution (do not silently add/drop).
7. Switch to a different opposing team and confirm stale incoming selections and previous analysis disappear; only the new opponent's roster is offered.
8. Confirm an unrostered/free-agent ID and a player from a different opposing roster cannot be received as a trade asset.
9. Change the user's selected team or refresh/load a new snapshot and verify the old partner, proposal, and result do not carry over.
10. Confirm the feature is read-only: no ESPN trade transaction was sent, accepted, rejected, vetoed, or otherwise mutated.
11. Product owner records explicit `ACCEPT` or `REJECT` with date, deployed production checkpoint, privacy-safe observed results, and any actionable blockers.

**UAT STATUS: PENDING — MANAGER / PRODUCT OWNER.** Unit tests, CI, synthetic browser smoke, independent code audit, and deployment checks cannot substitute for this acceptance.

## Verification matrix

| Dimension | Status / evidence |
| --- | --- |
| Static / bounded diff review | PASS — nine task-owned files; no protected source/field-state changes |
| Domain counterparty and ownership tests | PASS — #609 |
| Multi-player, stale switch, duplicates, roster action, incomplete evidence | PASS — #609 |
| Existing TCW-025/030 protected regressions | PASS — #609 full suite |
| UI proposal/result visibility | PASS — #609 |
| Dedicated partner-aware browser smoke | PASS — #609 |
| Full repository CI on implementation checkpoint | PASS — #609 FULL, 476/476 tests |
| Final handoff-inclusive exact-head CI | PENDING — verify PR #129 |
| Post-merge master verification | PENDING — MANAGER OWNED |
| Production/deployed smoke | PENDING — MANAGER OWNED |
| Fresh independent TCW-031 audit | PENDING — INDEPENDENT AUDITOR OWNED |
| Real deployed product-owner UAT | PENDING — MANAGER / PRODUCT OWNER |

## Remaining limitations and exact next action

Builder has not performed or manufactured genuine private/authenticated ESPN UAT and has not submitted an ESPN trade. No winner/fairness score, acceptance probability, team-needs model, suggested/counter trades, new source, or any TCW-032–040 V2 intelligence was introduced.

Manager: verify PR #129 exact final head, branch freshness/diff, and exact-head CI; integrate only if the task gates are satisfied; verify post-merge master CI and deployed behavior; freeze a fresh independent audit target; then coordinate the eleven-step genuine connected-ESPN product-owner UAT above. Do not close TCW-031 as product-complete on Builder CI alone.

## Next Activation

| Order | Employee / Role | Status | Current Task / Gate | Copy/paste activation prompt / next action |
| ---: | --- | --- | --- | --- |
| 1 | Manager / Architect | RECOMMEND TO MANAGER | TCW-031 Builder PR #129 review and integration | Review the exact final PR head and CI; if satisfactory integrate, verify master/deployed output, route fresh audit, and coordinate genuine product-owner UAT. |
| 2 | Implementation Engineer / Builder | COMPLETE | TCW-031 implementation and deterministic/browser validation | Stop after final exact-head CI. Do not merge or self-certify UAT; remediate only if Manager/Auditor finds a task-owned defect. |
| 3 | In-Season Strategy & Decision Intelligence Analyst | WAIT | TCW-032 not authorized by Builder completion | Wait for Manager routing after baseline Trade Analyzer acceptance prerequisites. |
| 4 | Research & Development (R&D) | WAIT | TCW-033 not authorized by Builder completion | Wait for Manager routing and a genuine research dependency. |
| 5 | Independent Auditor / QA | WAIT | TCW-031 target not yet integrated/frozen | After Manager integration and freeze, independently audit counterparty integrity, stale-state handling, visibility, and read-only/legacy protections. |
| 6 | Troubleshooting & Root Cause Engineer — on-demand | IDLE | No unresolved convergence blocker | Activate only on Manager routing if a genuine cross-layer defect persists. |
