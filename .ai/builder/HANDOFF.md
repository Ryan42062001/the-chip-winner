# Builder Handoff

HANDOFF

Task ID: TCW-025  
Role: Implementation Engineer / Builder  
Status: ASSIGNED — Trade Analyzer audit remediation

## Assignment

Execute:

`TCW-025 — Trade Analyzer Audit Remediation`

under canonical Workflow V3.1.

Canonical assignment master:

`1407da4043fbdf9ced1ef19b81dbc564d798ada6`

Expected branch:

`builder/tcw-025-trade-analyzer-audit-remediation`

Execution mode: `STANDARD_CHAT`  
Merge authority: Manager / Architect only.

## Accepted audit dependency

Independent Auditor task TCW-024 returned **FAIL** in PR #111 at exact head:

`d6c506b2cd504e12133a335979c2b399da7f0f2b`

Exact-head workflow #561 passed. Manager independently reviewed and accepted findings TCW-024-F01 through F04 and merged the audit evidence as master:

`1407da4043fbdf9ced1ef19b81dbc564d798ada6`

Master workflow #562 passed the full test gate; deploy and production verification were correctly skipped because that merge changed only `.ai/**`.

Authoritative evidence:
- `.ai/auditor/HANDOFF.md`
- `.ai/manager/tasks/TCW-025.md`
- `.ai/strategy/TCW-022_TRADE_ANALYZER_POLICY.md`

## Findings to remediate

### TCW-024-F01 — HIGH
Fix Trade Analyzer replacement-path verification so DANGEROUS eligibility uses slot-label strings correctly and checks the full relevant latest ESPN availability pool rather than the top-12 presentation shortlist. Preserve acquisition/roster constraints and conditional-only replacement semantics.

### TCW-024-F02 — HIGH
Ensure current explicit entry/player locks do not leak into future/playoff optimization. Current-week lock behavior must remain unchanged; future/playoff horizons must ignore current lock state without mutating source snapshots.

### TCW-024-F03 — MEDIUM
Do not assert `THIN` when contingency coverage is unverified. Preserve an explicit unknown/unverified fragility state and prevent unknown evidence from escalating to SCARCE_THIN or DANGEROUS.

### TCW-024-F04 — LOW
Add Trade Analyzer to the dedicated accessibility and relevant mobile/synced navigation audit loops. Preserve existing sync-fragment, overflow, touch-target, and accessibility checks.

## Scope boundary

Do not change accepted Strategy policy, field-validation state, projection materiality, source separation, proposal semantics unrelated to the findings, or read-only/no-score boundaries. Do not add a new source or ESPN trade write path.

## Required validation

Add focused deterministic regressions for every accepted finding, including eligible RB/FLEX/OP replacement paths, an eligible replacement beyond the presentation shortlist, future entry/player lock neutralization, unknown contingency behavior, and direct Trade Analyzer accessibility/mobile route coverage.

Run the complete repository CI gate on the final exact PR head.

Because production/test scripts change, Manager will require post-merge master CI, Pages deployment, and production verification before routing an independent Auditor retest.

## Exact next action

Fast Refresh from `1407da4043fbdf9ced1ef19b81dbc564d798ada6`, read Workflow V3.1, ACTIVE_TASKS, TCW-025, Builder role/handoff, TCW-024 Auditor evidence, TCW-022 Strategy policy, and only affected implementation/tests. Implement the bounded remediation, open one Builder PR, verify exact-head full CI, update this handoff, and stop for Manager review.
