# TCW-046 — Third Repaired Trade Winner Engine Independent Re-Audit Packet

Manager freeze date: 2026-09-19
Workflow authority: V3.2
Source task: TCW-034 — Trade Winner Engine

## Exact immutable audit authority

Builder PR #147: DRAFT / UNMERGED.
Builder branch: `builder/tcw-034-trade-winner-engine`.
**IMMUTABLE TARGET**: `035c5f5112b7393f9d4f17685792548afa67dd2e`.
Previous failed immutable target / bounded repair baseline: `24be4be45f7fde351c0a6e209353dd2beed8d854`.
Earlier historical failed target: `a40c8db8f7e6defcecdf58dc2d3ddd81ea88249a`.
Original Builder PR baseline: `872aa79969743dafb3bf062a76b213c687397a6f`.

Never substitute latest PR HEAD, Manager master, or a later commit for this frozen target. If the target branch advances, preserve this exact audit target and report the divergence.

## Mechanical readiness and FULL evidence

Builder's actual task-specific readiness output on unchanged exact target, with canonical Manager task/registry overlaid locally:
- schema: `TCW_AUDIT_READINESS_V1`;
- task: `TCW-034`;
- branch: `builder/tcw-034-trade-winner-engine`;
- HEAD: `035c5f5112b7393f9d4f17685792548afa67dd2e`;
- assignmentMasterSha: `24be4be45f7fde351c0a6e209353dd2beed8d854`;
- PR: `147`;
- auditRequired: `true`;
- changedFiles: five files listed below;
- blockers: `[]`;
- readyForManagerFreeze: `true`;
- packet sha256: `750892a305cab589a6c3e904f39488189382542a4a9070ab25fa1a148043c1df`.

Fresh FULL validation on the exact SAME SHA INCLUDING the final Builder handoff:
- workflow #692 / run `35477501875`: SUCCESS;
- test job `105989175098`: SUCCESS;
- no later handoff-only SHA substitution.

Canonical Manager checkpoint master: `936b9885ed27d0ec288e749d841d38b44b7a4c4d`, workflow #694 / run `35478099599`: SUCCESS; test job `105990786264`: SUCCESS.

These are mechanical/Builder/Manager evidence, NOT an Auditor verdict or product acceptance.

## Exact bounded repair diff

Compare `24be4be45f7fde351c0a6e209353dd2beed8d854..035c5f5112b7393f9d4f17685792548afa67dd2e`: exactly five Builder-owned files:
- `.ai/builder/HANDOFF.md`
- `src/domain/trade-analyzer.js`
- `src/domain/trade-value-engine.js`
- `test/trade-winner-engine.test.js`
- `test/trade-winner-integration.test.js`

Also inspect the original complete trade-winner implementation diff from `872aa79969743dafb3bf062a76b213c687397a6f` to the immutable repaired target for preserved behavioral regressions.

## Authority and prior findings

Accepted Strategy: `.ai/strategy/TCW-032_TRADE_VALUE_TEAM_NEEDS_CONTRACT.md`.
Accepted Manager source decision: `.ai/manager/evidence/TCW-033_VALUE_SOURCE_DECISION.md`.
Historical audits and Manager decisions:
- TCW-044 audit report / F01–F04: `.ai/audit/TCW-044_TRADE_WINNER_ENGINE_AUDIT.md`, Manager `.ai/manager/evidence/TRADE_WINNER_AUDIT_FINDING_DECISION.md`.
- TCW-045 report / F02-R1 and F04-R1: `.ai/audit/TCW-045_TRADE_WINNER_ENGINE_REAUDIT.md`, Manager `.ai/manager/evidence/TRADE_WINNER_SECOND_AUDIT_DECISION.md`.

This is a FRESH independent audit. Earlier F01/F03 were reported closed only within the stated boundaries; independently challenge preservation rather than blindly carrying their prior verdict forward. Audit the following two newly accepted defects with adversarial cases beyond Builder tests:

### F02-R1 — MEDIUM / BLOCKING — roster-rule path evidence

Historical defect: `rosterRuleState` could return unverified/malformed/incomplete rules with no listed violations; `hasKnownLegalAcquisitionPath` treated that as legal and emitted unsupported numeric replacement and material quality/depth claims.

Independently test:
- absent/partial league roster rules; missing/nonfinite roster size; absent, malformed or incompletely evidenced position limits; unknown position; no violations under unverified rules must NOT become KNOWN_LEGAL;
- explicit trusted complete applicable settings, legal direct-add control;
- genuinely supported known-blocked control; UNKNOWN cannot be mislabeled BLOCKED/DANGEROUS without independent blocking evidence;
- direct-add and conditional hypothetical drop separately, with explicit legal/drop and current-week locks, never automatic transaction;
- numeric `replacementProjectionOrNull`, feasible IDs, `supportedReplacementQualityCost`, fragility/replacementPathState, slot/FLEX/OP/source/horizon and projection coverage;
- a conditional/drop-dependent path must not silently authorize unconditional numeric replacement;
- preserve any actually supported bye/contingency consequences independent of missing acquisition-rule evidence.

### F04-R1 — LOW / SAME-PASS — independent evidence provenance

Historical defect: distinct declared group labels could confer HIGH despite `provenance.derivativeOf` declaring one source derived from another.

Independently challenge:
- two different group labels but a direct derivative relation;
- derivative chains/shared roots, duplicate IDs, ambiguity, missing/unknown ancestor, cycles, contradictory group labels;
- a derivative among two otherwise independent roots, ensuring confidence does not overstate provenance;
- one approved root at most MODERATE;
- HIGH only for genuinely verified, Manager-authorized independent agreeing origins for the same claim/unit/scale;
- source disagreement WITHHELD; synthetic fixture authority cannot enable live providers.

## Preserved hard boundaries

Production approved trade-value provider set EMPTY; no scraping/bundled/named third-party trade values or arbitrary user-entered value authority. Live packageValue/winner and numeric split WITHHELD. No rank/projection/SOS/ADP/VORP/waiver/replacement fallback into market value. ESPN read-only, `transactionActions: []`, no propose/send/accept/reject/veto. No silent drops; preserve configured slots, FLEX/OP, ownership/current locks, source/horizon separation, F01 listed-count descriptive semantics, F03 canonical ROS/playoff completeness, confidence independence, field-validation unchanged and `FV-SEASON-01` still pending. No TCW-035+ activation or product-completion claim.

## Validation, write scope and verdict

Perform independent Level 1 static inspection, Level 2 independent automated/CI checks, Level 3 controlled adversarial scenarios when feasible. No Level 4 real-league UAT claim absent actual evidence. Challenge the frozen implementation and tests independently; do not treat PASS CI as correctness proof.

Write ONLY `.ai/audit/TCW-046_TRADE_WINNER_ENGINE_REAUDIT.md` and `.ai/auditor/TCW-046_HANDOFF.md`. One Auditor PR with exact final-head CI. Never modify Builder implementation/tests, Manager/shared files, frozen packet, field registry or packages.

Return exactly one verdict: PASS, PASS WITH NON-BLOCKING FINDINGS, or FAIL — REMEDIATION REQUIRED. Report F02-R1 and F04-R1 as CLOSED/STILL OPEN/NEW RELATED FINDING with severity, evidence, impact, remediation, independent validation and confidence; report regression/new findings separately. Do not merge PR #147 or Auditor PR; return exact branch/head/PR/run/job and preserved immutable-target verification to Manager.

A separate workflow-improvement task for automating future readiness checks is not part of this audit and cannot be used as evidence about this frozen target.
