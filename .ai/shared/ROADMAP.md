# The Chip Winner — Canonical Roadmap

Last reconciled: 2026-09-11
Current milestone: Release 1.0 field validation

## Current milestone

### M1 — Release 1.0 trustworthy read-only companion

Status: ACTIVE — FIELD VALIDATION

Remaining milestone work is evidence-backed real-world validation and final release gating. Broad feature expansion remains out of scope.

## Release 1.0 blockers

Pending checks in `config/field-validation.json`:
1. FV-A11Y-02 — screen-reader critical workflow.
2. FV-ESPN-02 — authenticated custom FLEX/OP league.
3. FV-ESPN-04 — authenticated IR edge states.
4. FV-ESPN-05 — authenticated lock/availability transitions.
5. FV-SEASON-01 — real playoff/bye intelligence states.
6. FV-RECOVERY-01 — live ESPN/session/network failure and reconnect.
7. FV-WAIVER-01 — real waiver candidate volume and timing.

Field gate remains **6 passed / 7 pending**.

## Coordination sequence

Completed:
- TCW-001 canonical workflow bootstrap.
- TCW-PW-001 Auditor/R&D evidence wave.
- TCW-002 baseline audit.
- TCW-003 ESPN field-feasibility research.
- TCW-004 evidence-wave integration.
- TCW-005 Auditor execution attempt (field task remains blocked).
- TCW-006 blocked recovery-field reconciliation.
- TCW-007 Workflow V3 operating upgrade; PR #60 merged at `61c06843999df6a66236f352627f0fb2c29908c1`; workflow #427 passed test/deploy/production verification.

## Immediate dependency order

1. Keep Manager event-driven and specialists IDLE unless a real prerequisite, finding, or explicit new requirement exists.
2. Obtain privacy-safe user-operated TCW-005 recovery/reconnect observations.
3. Re-activate Auditor under TCW-005 for an independent field verdict.
4. If the verdict reproduces a deterministic defect, route a narrow Builder remediation and require independent real field retest.
5. If recovery passes, integrate privacy-safe field evidence/status through a separate protected task.
6. Execute the other pending field checks only when their genuine real-world prerequisites exist.
7. Complete final Release 1.0 PR/master gates after all field checks pass.
8. Perform Roadmap Discovery before authorizing a successor milestone.

## Release 1.0 exit gate

Release 1.0 may close only when:
- every field-validation item is passed with privacy-safe evidence;
- no unresolved high-severity accessibility, privacy, security, ESPN-normalization, waiver-legality, or season-planning defect remains;
- exact final release PR validation is green;
- post-merge `master` test/deploy/production verification is green;
- product remains read-only.

## Post-1.0 Roadmap Discovery

No successor milestone is automatically authorized. A valid conclusion remains:

`NO SUCCESSOR MILESTONE CURRENTLY JUSTIFIED.`

The following sequence is **Roadmap Discovery input**, not an authorized implementation schedule. It should be revalidated against real Release 1.0 usage, field evidence, source feasibility, and user value before any successor milestone is opened.

### Proposed candidate order

1. **GM Action Plan / recommendation synthesis**
   - Convert existing lineup, waiver, season-plan, change-detection, freshness, and alert intelligence into one prioritized weekly action surface.
   - Answer: **What should I do with my fantasy team today, and why?**
   - Prefer synthesis of existing approved facts/recommendations over creating a new hidden scoring authority.

2. **Trade Analyzer**
   - Compare trades through lineup impact, depth, replacement value, bye/playoff effects, and short-vs-long-horizon consequences.
   - Avoid a single opaque “winner” grade.
   - Keep assumptions, projection coverage, and uncertainty inspectable.

3. **Recommendation confidence + league-market intelligence**
   - Expand confidence beyond simple point edge using source agreement/freshness, injury uncertainty, coverage, and state freshness where evidence exists.
   - Add connected-league market context such as opponent roster needs, positional scarcity in the ESPN player pool, and transaction patterns when ESPN or another approved source supplies the facts.
   - Never invent private opponent information or imply outcome probability from an uncalibrated score.

4. **Decision-impacting injury/news intelligence and notifications**
   - Research and approve a trustworthy source before implementation.
   - Surface news only when it materially changes a lineup, waiver, trade, IR, or planning decision.
   - Preserve source attribution, freshness, official-vs-commentary distinctions, and the read-only boundary.

5. **Playoff probability / championship-path modeling**
   - Treat qualification odds, championship odds, and opponent-win probability as separate calibrated modeling work.
   - Require documented assumptions, validated inputs, uncertainty handling, and independent evaluation before user-facing probabilities are allowed.

6. **ESPN write actions remain later gated**
   - Lineup changes, add/drop submissions, waiver claims, trades, or other ESPN mutations require a separate explicitly authorized milestone after the read-only path proves trustworthy.
   - No background or automatic transactions.

Detailed discovery notes: `docs/post-1.0-roadmap-candidates.md`.

Other gated candidate areas remain future-only IR-assisted stash discovery, server-side models, additional projection/news sources, and optional confirmed ESPN actions.
