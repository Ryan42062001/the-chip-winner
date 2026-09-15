# The Chip Winner — Canonical Roadmap

Last reconciled: 2026-09-14
Current work: Release 1.0 event-gated field validation + authorized Trade Analyzer v1 strategy lane

## Current milestone state

### M1 — Release 1.0 trustworthy read-only companion

Status: ACTIVE — FIELD VALIDATION EVENT-GATED

Authoritative live field status is `config/field-validation.json`.

Sole remaining blocker:
1. FV-SEASON-01 — real playoff/bye intelligence states.

Registry field gate is **10 passed / 1 pending**.

The remaining field check requires a genuine season condition and must not be manufactured merely to create work.

### Next feature lane — Trade Analyzer v1

Status: AUTHORIZED — STRATEGY CONTRACT IN PROGRESS

On 2026-09-14 the product owner explicitly chose to proceed with the **Trade Analyzer** now, ahead of the previously proposed GM Action Plan sequencing.

Manager opened `TCW-022 — Trade Analyzer v1 Strategy Contract` and routed the first bounded task to Strategy. This lane may proceed independently while `FV-SEASON-01` remains naturally event-gated. Release 1.0 is not falsely marked complete by starting this work.

Approved product direction:
- analyze proposed trades through roster consequences, not a single opaque trade-value score;
- analyze the connected user's team;
- support one-for-one and multi-player / unequal-count packages;
- evaluate immediate lineup impact, depth/replaceability, roster-space consequences, supported future/bye/playoff horizons, projection-source disagreement, uncertainty, known roster constraints, and short-term versus long-term team objectives;
- remain read-only with no ESPN trade write actions;
- use approved existing inputs for v1 and route genuine unresolved source/feasibility questions to R&D rather than inventing certainty.

Builder implementation is not yet authorized. Strategy must first produce the accepted decision contract under TCW-022.

## Release 1.0 verified field history

FV-RECOVERY-01 is passed after the TCW-005 -> TCW-009 -> TCW-011 recovery validation/remediation chain.

FV-WAIVER-01 is passed after TCW-012 exposed existing exhaustive-run diagnostics, the real deployed TCW-014 retest captured 89 considered adds / 88 complete adds / 352 evaluated scenarios / 0 qualified adds with acceptable responsiveness, the Independent Auditor returned PASS CANDIDATE through PR #78, and TCW-015 integrated the evidence through PR #79 with master workflow #473 passing.

FV-ESPN-04 is passed after real authenticated TCW-016 evidence captured a naturally occurring eligible/filled IR state, Independent Auditor PR #84 returned PASS CANDIDATE with no findings, and TCW-017 integrated the bounded evidence through PR #85 with master workflow #485 passing tests, Pages deployment, and production verification. The pass does not infer unobserved grandfathered, invalid, over-capacity, unsupported, or unverified IR states.

FV-ESPN-05 is passed after a genuine lock transition reproduced stale actionable-looking START / SIT guidance, TCW-020 remediated the defect, Independent Auditor PR #98 returned a post-remediation PASS CANDIDATE using a genuine naturally locked state, and Manager integrated and production-verified the field pass. Product integration master `85e4c6dfe1667be88cb5caec59216aca7c62f0d7` passed workflow #522 tests, Pages deployment, and production smoke.

Manual screen-reader field certification is no longer a Release 1.0 blocker. TCW-019 removed `FV-A11Y-02` from the field registry at the product owner's explicit direction rather than marking it passed without evidence. Completed keyboard-only and real 200% zoom evidence remain preserved, and automated accessibility/readiness regression checks remain deployment-blocking CI under durable decision TCW-D012.

Custom FLEX/OP/Superflex field certification is no longer a Release 1.0 blocker. TCW-021 removed `FV-ESPN-02` from the field registry at the product owner's explicit direction rather than marking it passed without evidence. Ordinary FLEX support, lineup-slot normalization, eligibility enforcement, fail-closed handling, and automated regression coverage remain intact under durable decision TCW-D013. No unobserved custom OP/Superflex behavior is claimed as field-validated.

TCW-021 verified integration:
- PR #102 exact-head workflow #530: PASS;
- merged master `fd845bfbc1c28a746ef7cb455c6abe80e6ac945e`;
- master workflow #531: full test PASS, GitHub Pages deploy PASS, production smoke PASS.

## Completed field-remediation chains

### Recovery
1. TCW-005 reproduced stale/live labeling and misleading failure guidance.
2. TCW-009 implemented bounded recovery-state remediation with deterministic regression coverage.
3. Independent post-remediation field retest passed.
4. TCW-011 integrated FV-RECOVERY-01 as passed.

### Waivers
1. Real FV-WAIVER-01 evidence confirmed responsiveness but lacked visible exhaustive-run counts.
2. TCW-012 exposed existing `futureDiscovery` diagnostics without changing waiver enumeration or recommendation logic.
3. TCW-014 real deployed retest captured the required diagnostics and responsiveness evidence.
4. Independent Auditor PR #78 returned PASS CANDIDATE with no findings.
5. TCW-015 integrated FV-WAIVER-01 as passed; PR #79 merged at `ae932395f87f77aad2c067ca16dc1042d4f79786` and workflow #473 passed test, deploy, and production verification.

### IR
1. A real authenticated league naturally presented one supported eligible/filled IR state without a manufactured roster transaction.
2. TCW-016 routed the privacy-safe deployed evidence to Independent Auditor / QA.
3. Independent Auditor PR #84 returned PASS CANDIDATE with no findings, bounded to the state actually observed.
4. TCW-017 integrated FV-ESPN-04 as passed; PR #85 merged at `55b9322fcb4ed37a2fa20ac3ce3564ce9463abab` and workflow #485 passed test, deploy, and production verification.

### Game lock / START-SIT
1. TCW-018 captured a real pre-kickoff -> post-kickoff transition and independently reproduced stale actionable-looking START / SIT guidance after lock.
2. TCW-020 implemented bounded lock-awareness remediation.
3. Independent Auditor PR #98 returned PASS CANDIDATE with no findings using a genuine naturally locked deployed state.
4. Manager integrated FV-ESPN-05 as passed and verified master test, Pages deployment, and production smoke in workflow #522.

## Coordination sequence

Completed:
- TCW-001 canonical workflow bootstrap.
- TCW-PW-001 Auditor/R&D evidence wave.
- TCW-002 baseline audit.
- TCW-003 ESPN field-feasibility research.
- TCW-004 evidence-wave integration.
- TCW-005 recovery field validation.
- TCW-006 blocked recovery-field reconciliation.
- TCW-007 Workflow V3 operating upgrade.
- TCW-008 post-1.0 roadmap candidate sequencing.
- TCW-009 recovery-state honesty remediation.
- TCW-010 Workflow V3.1 coordination hardening.
- TCW-011 FV-RECOVERY-01 evidence integration and recovery-loop closeout.
- TCW-012 waiver field diagnostics visibility.
- TCW-013 control-plane CI efficiency and merge-authority hardening.
- TCW-014 FV-WAIVER-01 deployed field retest.
- TCW-015 FV-WAIVER-01 evidence integration and closeout.
- TCW-016 FV-ESPN-04 authenticated IR eligible-state retest.
- TCW-017 FV-ESPN-04 evidence integration and closeout.
- TCW-018 FV-ESPN-05 real game-lock field validation and accepted post-remediation retest.
- TCW-019 manual screen-reader Release 1.0 field-gate removal while retaining automated accessibility CI.
- TCW-020 START/SIT lock-awareness remediation.
- TCW-021 custom FLEX/OP/Superflex Release 1.0 field-gate removal while retaining ordinary FLEX support and regression safeguards.

Active operational inventory is authoritative in `.ai/shared/ACTIVE_TASKS.json`.

## Immediate dependency order

1. Strategy completes TCW-022 Trade Analyzer v1 decision contract.
2. Manager accepts or returns that contract; route only genuine unresolved data/source questions to R&D.
3. After accepted policy, Manager may open a separately bounded Builder implementation task.
4. Independent Auditor verifies the implementation candidate before final Manager integration.
5. Complete `FV-SEASON-01` when its genuine real-world prerequisites exist; it remains independent and event-gated.
6. Use the Workflow V3.1 defect fast lane for any newly reproduced deterministic defect.

## Release 1.0 exit gate

Release 1.0 may close only when:
- every scoped item remaining in `config/field-validation.json` is passed with privacy-safe evidence;
- no unresolved high-severity privacy, security, ESPN-normalization, waiver-legality, recovery/freshness, or season-planning defect remains;
- automated accessibility/readiness CI remains green;
- exact final release PR validation is green;
- post-merge `master` test/deploy/production verification is green;
- product remains read-only.

Starting Trade Analyzer work does not waive or alter this exit gate.

## Product roadmap after explicit Trade Analyzer authorization

The earlier TCW-008 sequence was discovery input, not a binding order. The product owner has now explicitly selected Trade Analyzer ahead of GM Action Plan.

Current order:
1. **Trade Analyzer v1 — AUTHORIZED** — strategy contract first, then bounded implementation/audit if accepted.
2. **GM Action Plan / recommendation synthesis — DISCOVERY CANDIDATE**.
3. **Recommendation confidence + league-market intelligence — DISCOVERY CANDIDATE**.
4. **Decision-impacting injury/news intelligence and notifications — DISCOVERY CANDIDATE**, only after trustworthy-source feasibility.
5. **Playoff probability / championship-path modeling — DISCOVERY CANDIDATE**, only after calibrated-model prerequisites.
6. **ESPN write actions — LATER GATED**, requiring a separately authorized milestone and explicit confirmation safeguards.

Detailed design input remains in `docs/post-1.0-roadmap-candidates.md`; where that older discovery document conflicts with this explicit authorization, this canonical roadmap and ACTIVE_TASKS control current routing.
