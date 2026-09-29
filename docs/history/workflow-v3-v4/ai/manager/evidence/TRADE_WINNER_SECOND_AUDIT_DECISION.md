# Trade Winner Engine — Second Independent Audit Finding Decision

Manager / Architect — 2026-09-19

## Exact authority and evidence

Source task: TCW-034. Independent re-audit: TCW-045.
Audit evidence PR #157 exact head: `a9ab541f46d571347c22b291534d343477bf37bb`.
PR #157 changes exactly:
- `.ai/audit/TCW-045_TRADE_WINNER_ENGINE_REAUDIT.md`
- `.ai/auditor/TCW-045_HANDOFF.md`

Exact-head audit workflow #679 / run `35476232619`, test job `105985840004`: SUCCESS.
Audit evidence integrated via exact-head guarded merge of PR #157 at master `c6ba9b3599e4befa9abce9a958f6a7c45a0245dc`.
Integration master workflow #680 / run `35476504713`, test job `105986552934`: SUCCESS.

Independently reviewed exact immutable audited Builder target:
`24be4be45f7fde351c0a6e209353dd2beed8d854`.
Builder PR #147 is DRAFT / UNMERGED at that SHA.

Manager examined the frozen implementation's `rosterRuleState`, `hasKnownLegalAcquisitionPath`, `replacementPathState`, `supportedReplacementQualityCost`, `replacementScarcityContract`, `packageValueConfidence`, provenance preservation in `inspectTradeValueSource`, and targeted tests. The audit report's extracted-function counterexamples were evaluated against actual call paths, not accepted merely on Auditor assertion.

## F02-R1 — ACCEPTED / MEDIUM / BLOCKING

Finding: missing or partially known roster rules can be treated as a known legal acquisition path, publishing unsupported numeric replacement and affecting material depth-cost evidence.

Exact source evidence:
- `rosterRuleState(snapshot,...)` returns `status: "unverified"` and `violations: []` when `snapshot.league.rosterRules` is absent. An existing but incomplete rules object can also return `status: "verified"` without proving all applicable size/position limits.
- `hasKnownLegalAcquisitionPath` currently returns true on `!direct.violations.length` (or the same no-violation test after a hypothetical drop); it never requires verified complete applicable rules.
- `replacementScarcityContract` uses that helper to populate `feasibleCandidateIds` and `replacementProjectionOrNull`; `supportedReplacementQualityCost` uses it to establish a material depth cost. `replacementPathState` may also treat the unverified path as VERIFIED.
- A supported slot-eligible available projected RB and current matching snapshot can therefore yield a numeric replacement projection despite `rosterRuleState.status="unverified"`. A missing rules object is lack of evidence, not affirmative legal permission.

The accepted Strategy and TCW-034 contract require known feasible legal roster/acquisition paths before a replacement-quality numerical claim. Incomplete settings cannot be silently interpreted as unrestricted rules.

Disposition: **ACCEPTED — BLOCKING.** Frozen target `24be4be45f7fde351c0a6e209353dd2beed8d854` is not integration-eligible.

Bounded repair:
- Preserve separate KNOWN_LEGAL / KNOWN_BLOCKED / UNKNOWN acquisition-path outcomes rather than a Boolean no-violations proxy.
- Require verified *complete applicable* roster-size and position-limit evidence for direct-add and hypothetical-drop paths; an omitted or partial rules object must not become VERIFIED merely because no known violation was found. Distinguish known explicit lack of position limits from missing/unknown position-limit settings using existing provider semantics; do not invent an ESPN rule.
- Reuse this conservative tri-state in numeric replacement/feasible IDs, supportedReplacementQualityCost, and fragility/replacementPathState so UNKNOWN does not become either VERIFIED or a falsely proven BLOCKED/DANGEROUS result.
- An arbitrary simulated drop is conditional context, never an automatic or authorized transaction. Preserve all existing explicit follow-up-drop/current-week lock/read-only gates.
- Add missing/partial-rule direct-add and drop-path regressions; known-legal positive and genuinely known-blocked negative controls; unknown rules => replacementProjectionOrNull null, no unsupported material replacement-quality cost, and truthful reason/status. Preserve F01/F03 fixes and complete slot/FLEX/OP/same-horizon requirements.

## F04-R1 — ACCEPTED / LOW / SAME-PASS REPAIR

Finding: differently labeled independence groups can confer HIGH confidence even when the source explicitly declares derivative provenance.

Exact source evidence:
- `inspectTradeValueSource` preserves `provenance.derivativeOf`, including when it references another source's ID.
- `packageValueConfidence` counts distinct `provenance.independenceGroup` labels for rows with approved flags and a shared unit, but does not inspect `derivativeOf` or resolve shared origin.
- Thus two approved, same-unit synthetic rows labeled as distinct groups can yield HIGH even when the second expressly declares derivation from the first; existing tests put the derivative in the same group and miss the conflicting-label case.

Disposition: **ACCEPTED — LOW / repair with F02-R1.** This overstates evidence independence. Live package value remains WITHHELD because the production provider set is EMPTY; this is not evidence of an active live provider.

Bounded repair:
- Treat explicit derivative ancestry/shared origin as dependence regardless of conflicting group labels. Contradictory provenance may cap confidence at MODERATE or WITHHELD, never HIGH.
- Resolve direct and chained/cyclic derivative references conservatively, including missing/ambiguous origins; do not claim independence without approved trusted provenance.
- HIGH requires at least two actually independent, genuinely Manager-authorized agreeing roots on one comparable unit/scale and claim. Keep one source, duplicates and derivatives at most MODERATE; preserve disagreement => generic WITHHELD.
- Add distinct-group-but-derivative, chains/cycles/shared origins, missing-origin and valid truly independent agreeing positive regressions.

## Audit disposition and integration gate

Accept TCW-045's `FAIL — REMEDIATION REQUIRED` for this exact target. Historical F01 and F03 are CLOSED only within the audit's stated validation boundaries; preserve those fixes during F02-R1/F04-R1 remediation. No Level-4 authenticated ESPN field verification was established. FV-SEASON-01 remains pending.

TCW-045 evidence is accepted/consumed and CLOSED; it is not a PASS for Builder integration. Keep PR #147 DRAFT / UNMERGED, preserve both historical frozen targets, and activate only same-task bounded TCW-034 remediation. The remediation parent is exactly `24be4be45f7fde351c0a6e209353dd2beed8d854`.

Builder must return a NEW exact FULL-CI final head that already includes the final handoff; no later handoff-only SHA may replace it. Manager then reconciles worker checkpoint and readiness status without altering Builder HEAD, obtains task-specific readiness PASS against the unchanged bounded diff, freezes that exact FULL head, and routes another FRESH Independent Auditor re-audit. No TCW-035 or later Trade Analyzer activation.

Preserve production approved value-source set EMPTY, live winner/split WITHHELD, ESPN read-only, `transactionActions: []`, original validation/legality/FLEX/OP/source/horizon protections, and unchanged field validation.
