# TCW-020 — START/SIT Lock-Awareness Remediation Integration Evidence

## Accepted finding

Source field task: `TCW-018 — FV-ESPN-05 Real Game-Lock / Availability Transition Field Retest`.

Independent Auditor PR #93 returned `FAIL — REPRODUCED DEFECT` with accepted finding:

`TCW-018-F01 — MEDIUM — BLOCKING`

The real deployed post-lock state showed the complete-lineup optimizer correctly respecting roster locks while the separate START / SIT comparison still rendered an unqualified actionable-looking projection lean involving the locked player.

## Builder remediation

Task: `TCW-020 — START/SIT Lock-Awareness Remediation`.

Builder PR: #95.

Production changes were bounded to:
- `src/ui/start-sit-comparison.js`;
- `test/start-sit-comparison-ui.test.js`.

The remediation reuses the optimizer's existing `getLineupLockReason()` semantics. A selected player who is explicitly locked by ESPN or whose reported kickoff has passed causes the START / SIT comparison to become clearly informational/non-actionable rather than presenting an unqualified `PROJECTION LEAN`. External projection context remains source-separated and informational-only for the locked case. Unlocked behavior remains unchanged.

## Immutable checkpoints

- Manager routing master: `4f362c78e4cc07447ad4415da90988c99ba8c0d1`.
- Builder implementation checkpoint: `6804c8c0a1b55f5959daab8635fa8d71d6a43f73`.
- Builder handoff checkpoint: `545bacc25a49a71179335323d6b1befc01562149`.
- Manager merge-ready PR head: `61ade8aec1b9db28468f61ad698954d48c35d3b2`.
- PR #95 exact-head workflow: #508 / run `34776489165` — PASS.
- Manager merge commit: `b6e6a2dabb0e2d9e404704d7e8997110ce403060`.
- Post-merge master workflow: #509 / run `34776578979` — PASS.

## Verification matrix

| Dimension | Status | Evidence |
| --- | --- | --- |
| Static/code review | PASS | Manager reviewed PR #95; scope is limited to lock-aware START / SIT rendering, focused tests, handoff, and Manager-owned registry checkpoint |
| Deterministic automated tests | PASS | exact-head workflow #508 full test gate PASS |
| Exact-head PR CI | PASS | workflow #508 at `61ade8a...` |
| Post-merge master verification | PASS | workflow #509 at `b6e6a2d...` |
| Production deployment | PASS | workflow #509 GitHub Pages deploy job PASS |
| Production smoke | PASS | workflow #509 `verify-production` / `npm run smoke:production` PASS |
| Real field validation | PENDING | fresh Independent Auditor post-remediation TCW-018 deployed field retest still required |

## Field status

`config/field-validation.json` was not modified by TCW-020.

`FV-ESPN-05` remains `pending` until Independent Auditor / QA returns `PASS CANDIDATE` from the post-remediation real deployed locked-state retest and Manager separately integrates that field result.

## Next gate

Reactivate TCW-018 on a fresh Auditor branch. Reuse the existing real pre-lock/transition evidence where valid. Capture only the smallest genuine deployed post-remediation locked-state evidence necessary; do not manufacture another lock transition.
