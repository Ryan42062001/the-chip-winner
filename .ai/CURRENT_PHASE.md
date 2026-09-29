# Current Phase

State: PREVIEW_READY

## Identity

- Phase: TCW-P01 — Trade Winner Engine Stabilization & Integration
- Product owner: Ryan
- Phase branch: `phase/tcw-p01-trade-winner-stabilization`
- Activation baseline: `b765ccb21cfca2bd8957fafe5bb30f8b96f46545` (canonical `master` at TCW-P01 activation)
- Historical source checkpoint: PR #147 / `22838ac515152db32789e97850f25e1e4576cb82`
- Risk: MEDIUM
- Production deployment: NOT AUTHORIZED by phase merge
- ESPN write access: NOT AUTHORIZED

## Objective

Integrate the useful Trade Winner implementation from the historical TCW-034 work onto current canonical master as one clean V2.1 phase, preserve the read-only/source-separated product boundaries, close the accepted trade-classification and kickoff-evidence correctness gaps, and deliver a trustworthy human-approved trade-analysis experience.

## Scope

- Reapply or cherry-pick only the relevant Trade Winner product/test changes from historical PR #147 onto a fresh current-master phase branch.
- Trade value source/engine behavior needed by the Trade Winner experience.
- Trade analyzer domain and UI integration.
- Focused trade analyzer smoke and regression coverage.
- Correctly distinguish a genuinely viable trade from a structurally invalid or merely numerically attractive trade.
- Fail closed when kickoff/lock evidence needed for a recommendation is missing or malformed.
- Preserve source provenance and the existing ESPN read-only boundary.

## Non-goals

- Merging historical PR #147 directly.
- Reinstating Workflow V3/V4 task/audit/control-plane machinery.
- Protected-release orchestration experiments from TCW-047/053/060 or V4 control-plane PRs.
- ESPN lineup, waiver, or trade write actions.
- New projection/provider integrations.
- Production deployment.
- Unrelated Release 1.0 field-validation changes.

## Ordered implementation objectives

1. Create the fresh V2.1 phase branch from then-current `master`.
2. Diff historical PR #147 product files against current master and port only still-relevant behavior.
3. Reconcile Trade Winner logic with current domain/provider contracts instead of restoring stale surrounding code.
4. Repair viable-vs-structural-invalid classification and missing/malformed kickoff evidence handling.
5. Preserve read-only/source-separated recommendation boundaries.
6. Add/refresh focused unit, integration, UI, and smoke coverage.
7. Reach PREVIEW_READY and complete Ryan's whole-phase review.
8. Perform Phase Sync, deliberate exact-head FULL CI, immutable freeze, and one fresh independent phase audit.
9. Remediate/re-audit findings if required.
10. Merge only after Ryan explicitly authorizes the exact approved candidate; production deployment remains a separate decision.

## Acceptance criteria

- Historical source changes are ported onto current master without importing retired workflow/control-plane files.
- Trade Winner recommendations distinguish structurally legal/viable outcomes from trades that only look favorable numerically.
- Missing, malformed, or untrusted kickoff/lock evidence cannot silently produce an overconfident trade recommendation.
- Trade value inputs retain visible source/provenance boundaries.
- Existing lineup, waiver, projection, ESPN companion, mobile sync, and read-only behavior do not regress.
- Focused Trade Winner tests and the existing product suite pass.
- Browser smoke covers the Trade Winner interaction on current code.
- No ESPN mutation path is added.
- Ryan approves the complete phase preview before freeze.
- Exact candidate FULL PHASE CI passes.
- One fresh independent MEDIUM-risk phase audit passes, including targeted review of the carried-forward historical findings.

## Required automated validation

- FAST CI: V2.1 contract validation, install, syntax checks, Node tests, static smoke.
- FULL PHASE CI: complete current test suite, model evaluation, browser/trade smoke, accessibility, readiness, mobile, extension, performance, security scan, field-validation status, and dependency audit.
- Focused Trade Winner regressions must cover structural validity, source provenance, locked/kickoff evidence, and current integration contracts.

## Human preview requirements

- Trade Analyzer/Trade Winner is understandable on desktop and phone.
- Inputs clearly show what is being given and received.
- Recommendation/rationale does not imply certainty unsupported by source data.
- Invalid/incomplete trade states are visibly withheld rather than presented as wins.
- Existing major navigation and decision surfaces still work.

## Owner-only verification

Using the read-only ESPN setup, Ryan performs one owner-operated Trade Winner check in the real browser environment without sharing ESPN credentials/cookies. Verify the displayed players, lock/kickoff state, source labels, and recommendation match the visible inputs. No ESPN action is submitted.

## Exit criteria

- Preview and owner-only verification approved.
- Phase Sync complete.
- Exact candidate FULL PHASE CI passes.
- Fresh independent MEDIUM-risk phase audit/re-audit passes.
- Ryan separately authorizes merge.
- Post-merge FAST, Closure Sync, and closure FAST pass.
- Production remains undeployed unless Ryan separately authorizes manual Pages deployment.

## Stop conditions

Stop for any ESPN write-path implication, credential/cookie exposure, ambiguous identity repair by display-name guess, unsupported provider inference, destructive data handling, production-deploy implication without authorization, or the same material implementation blocker after three total attempts.
