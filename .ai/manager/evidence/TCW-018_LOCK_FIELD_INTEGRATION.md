# TCW-018 — FV-ESPN-05 Manager Integration Record

## Accepted upstream evidence

- Manager intake `.ai/manager/evidence/TCW-018_LOCK_FIELD_INTAKE.md` preserves privacy-safe facts from one genuine pre-kickoff -> post-kickoff ESPN lock transition.
- Independent Auditor PR #93 originally returned `FAIL — REPRODUCED DEFECT` with accepted finding `TCW-018-F01 — MEDIUM — BLOCKING` because the complete-lineup optimizer respected the real lock while the separate START / SIT comparison remained actionable-looking.
- TCW-020 remediated that finding in Builder PR #95 by reusing `getLineupLockReason()` and making locked/post-kickoff START / SIT comparisons explicitly informational/non-actionable.
- TCW-020 production integration baseline `b6e6a2dabb0e2d9e404704d7e8997110ce403060` passed workflow #509 test, GitHub Pages deploy, and production smoke.
- Independent post-remediation Auditor PR #98 returned `PASS CANDIDATE` with no findings and was accepted by Manager.
- PR #98 exact-head workflow #515 passed the full test/audit/security gate at `9d349fa924b60f39bed395b58a54a71ebd2c9c2a`.
- PR #98 merged at `29feabd4dc343b15f6e264fbdbd8614b2b2dc53d`; master workflow #516 passed the full test gate. Deploy and production verification were correctly skipped because the evidence merge was `.ai/**` only.

## Privacy-safe field facts accepted for registry integration

Original genuine transition evidence established that:
- before kickoff, ESPN still allowed the observed starting player to be moved;
- after kickoff, ESPN showed the game active and the move control was gone;
- the deployed app successfully refreshed to a valid current ESPN snapshot;
- the complete-lineup optimizer recognized the lock state and withheld an impossible lineup change;
- the pre-remediation generic START / SIT surface remained actionable-looking, which produced accepted finding TCW-018-F01.

The post-remediation real deployed observation established that:
- authenticated `Refresh ESPN` succeeded and the persistent source state showed `Live ESPN snapshot`;
- Lineup Lab recognized the naturally post-kickoff state and reported 15 roster locks respected because ESPN reported a lock or kickoff passed;
- the same START / SIT comparison class rendered `LINEUP MOVE LOCKED · INFORMATION ONLY` and `NO LINEUP ACTION`;
- the prior unqualified actionable `PROJECTION LEAN` was absent;
- ESPN projection values remained visible only as informational context;
- FantasyPros weekly context remained source-separated and explicitly informational rather than action-like;
- no roster transaction, lock state, or availability state was manufactured.

## Manager disposition

Accept the TCW-018 post-remediation `PASS CANDIDATE` for `FV-ESPN-05 — Authenticated lock and availability transitions`.

The original real transition supplies the genuine before/after lock evidence. The independent post-remediation observation supplies the required proof that advice is now obsoleted correctly after the real lock rather than remaining actionable-looking.

The pass is bounded to the observed real game-lock/post-kickoff behavior. It does not infer unobserved injury/availability transitions or other unobserved lock variants.

## Integration gate

This Manager integration changes `config/field-validation.json`, so the integration is not complete until the field-registry PR merges and the resulting `master` passes the full test gate, GitHub Pages deployment, and production smoke verification.
