# R&D Handoff — TCW-059 Protected Release External Identity + Ledger Feasibility Research

Task ID: TCW-059  
Role: Research & Development  
Status: MANAGER_REVIEW_READY — research complete; final exact-head CI custody will be recorded externally on PR #208 after this handoff commit

## Verified assignment and live state

- Repository: Ryan42062001/the-chip-winner
- Current canonical master independently refreshed: 63e87ece2eb38b5d150df25d83bf296f4783f3a1
- Immutable assignment / historical branch creation master: fe3ca66c8905afea8302ae6d6aca0ae7ffeb0952
- Assigned branch: rnd/tcw-059-protected-release-external-evidence-research
- Branch was verified 0 ahead / 0 behind the immutable assignment master before TCW-059 writes.
- Target advancement: CONTROL_PLANE_ONLY at 3f0cdcb324a803828987cc7490dd96196cfda8f4.
- The R&D branch was NOT synced, rebased, merged, cherry-picked, or fast-forwarded to current master.
- R&D PR: #208 — OPEN / UNMERGED.
- Research artifact commit: bcc37bb100ce7c35106161ebc72901463c68dde1.
- The exact final R&D head is the PR #208 head after this handoff commit. It is intentionally recorded in the final PR custody comment after exact-head CI, because a file cannot self-embed the SHA of the commit that contains itself.

## Top-level verdict

PROTOCOL_FEASIBLE_WITH_SEPARATE_OWNER_ACTIONS

A supported external-evidence architecture exists, but no real TCW-047 release attempt is safe yet. The dormant TCW-053 observer intentionally RELEASE_HOLDs the external actor/ledger/approval/rollback and retained-byte gates. Manager must authorize a separate setup/activation implementation, and that exact implementation must be independently audited and synthetically exercised before requesting one real TCW-047 staged-source authorization.

## Recommended identity architecture

- Owner: existing human GitHub account Ryan42062001, durable user ID 312284033, using a dedicated Owner Approval GitHub App user-access-token path for durable user+app attribution.
- Manager: separate dedicated GitHub App installation with its own app/installation identity.
- Auditor: separate dedicated GitHub App installation with its own app/installation identity.
- Optional infrastructure validator: separate expected-source App/integration for ledger validation; it is not a substitute for Owner, Manager, or Auditor.
- Same-account ChatGPT role switching, multiple GITHUB_TOKEN workflows, deploy keys, and multiple PATs for Ryan42062001 do not satisfy the accepted three-principal separation.

## Recommended ledger architecture

Use a same-repository, off-master, protected release-ledger branch with a dedicated future ruleset:

- PR required;
- strict required validator check;
- expected validator App/integration;
- no bypass;
- deletion blocked;
- force/non-fast-forward blocked;
- ledger merge method restricted to merge.

Each transition should use an event-anchor commit followed by a receipt commit so the receipt blob never claims its own Git commit SHA. The verifier derives receiptCommit and receiptBlob from Git after publication. Strict up-to-date ledger PRs serialize transitions and make a racing second terminal transition stale and rejectable. Consumed/aborted nonces remain terminal forever.

The accepted immutable tuple includes both Owner authority records, so this ledger is a release-consumption state machine after the complete evidence tuple exists, not the mechanism that gathers those approvals.

## Retained TCW-047 packet-byte custody conclusion

Historical artifact 10598497668 is STILL RETAINED and independently retrievable.

Verified live values:

- workflow: 35488171554
- job: 106018254992
- artifact: 10598497668
- size: 8,150 bytes
- expired: false
- expires: 2026-10-04T04:03:59Z
- GitHub artifact ZIP digest: 6b28875a0fef1e655da33d692f13692066e4ec8674844fdbcd3e3326e0ac7833
- independently downloaded ZIP SHA-256: 6b28875a0fef1e655da33d692f13692066e4ec8674844fdbcd3e3326e0ac7833
- raw original-packet.json SHA-256: d4189773aae9e40a5ac7729390c45c74f7f630d51b2a6b3ee56b0183e6a5b932
- historical helper canonical packet digest: f6d59762e3696f91696408e5312013481fb1dc5e9dd24d1ee469b1f590f96894

The f6d... digest is the helper’s canonical pre-sha-field JSON digest, not the raw pretty-printed JSON file hash. TCW-059 reproduced it from the retained bytes.

Required future custody action: before October 4, separately authorize archival of the exact ZIP bytes with both the ZIP digest and internal packet digest. GitHub immutable-release assets are a strong GitHub-native copy; an independently administered WORM/object-lock copy is recommended as a second custody domain. If the Actions artifact expires before exact-byte archival, reconstructed bytes must never be represented as the historical artifact.

## Owner approval mechanism

Two human Owner decisions remain mandatory.

A. Prestage creation capability:
- precompute exact S locally from frozen M and the exact four A blobs without publishing a GitHub stage ref;
- Owner publishes prestage capability C0 binding nonce, M, intended branch, exact S/tree/files, rollback operator, and expiry;
- after Manager creates only that exact stage ref/PR, the short-lived Owner Approval App automatically emits C1 sealing the actual stage PR to C0, with no new discretion;
- final authority.plan evidence points to C1 while C1 proves C0 predated stage creation.

B. Exact-S installation authorization:
- after exact-S FULL CI, preview, Auditor PASS, rollback proof, and ruleset verification;
- Owner separately publishes C2 binding repository, nonce, M, stage PR/branch, exact S/tree/files, audit evidence/verdict, CI/check provenance, ruleset digest, rollback operator, expiry, and C0/C1 digest;
- C2 must be a distinct immutable evidence commit/blob/ref/PR from C1.

Mutable chat, free-form comments, or dismissible PR review alone are not machine-consumed authority.

## Exact-S Auditor publication design

The Auditor App publishes a whole-tree exact-S report on an off-master same-repository Auditor ref and opens an evidence PR. The report binds S and S.tree but does not attempt to contain its own future commit SHA. After publication, the composite attestation records the observed evidence commit/tree/blob/ref/path/PR. Immediately before release, Manager independently re-fetches all of those objects plus publisher identity and confirms the ref still points to the exact evidence commit. No master advancement occurs, so publishing the audit does not stale S.

## Rollback model

Rollback is forward-only under current protected master:

- keep unexpected G as evidence;
- if G does not have exactly two ordered parents [M,S], G.tree=S.tree, and live master=G, do NOT write RELEASED;
- write terminal ABORTED after authenticated incident evidence;
- create rollback branch from live master;
- revert/restore through a normal protected PR;
- run required test from integration 15368;
- merge only through protected PR flow;
- verify resulting master/tree and post-merge CI.

Recommended rollback operator is the Manager GitHub App or separately designated Manager-operated principal, never the Auditor.

## Ruleset compatibility conclusion

Current Protect Master #22309639 remains compatible with the dormant contract:

- ACTIVE;
- PR required;
- strict required status test;
- integration ID 15368;
- no bypass actors;
- current-user bypass never;
- merge, squash, and rebase generally permitted.

The contract is stricter procedurally and requires an explicit future merge-method attempt plus postmerge G topology verification. Manager can use the merge API with sha=S and merge_method=merge, then inspect actual G. A future master-ruleset change that permits only merge is optional defense in depth, not mandatory for the accepted contract. TCW-059 changed no ruleset.

## Current dormant implementation blocker

The current integrated TCW-053 live observer intentionally cannot authorize a release even if external setup exists:

- observeFrozenSourceCustody currently sets originalPacketBytesVerified=false;
- verifyPremergeReadOnly intentionally adds external actor, ledger, Owner, Auditor, rollback, and packet-byte blockers;
- verifyPostmergeReadOnly intentionally holds pending authenticated postmerge evidence.

Therefore a separately authorized implementation must add authenticated observers for these external facts without deleting or weakening any fail-closed predicate. That activation implementation requires a fresh independent material workflow/security audit.

## Unresolved external setup actions

1. Product Owner / Manager authorizes setup only, not TCW-047 staging.
2. Archive artifact 10598497668 exact bytes before 2026-10-04.
3. Enable immutable releases if chosen for one custody copy.
4. Create/select distinct Owner Approval, Manager, and Auditor authenticated principals.
5. Pin durable numeric actor/App/installation IDs.
6. Configure least-privilege App permissions.
7. Establish private-key vault/rotation/revocation handling.
8. Create protected off-master Owner/Auditor evidence-ref policy.
9. Create protected same-repo release-ledger branch/ruleset.
10. Create expected-source independent ledger validator.
11. Protect stage/evidence refs sufficiently to preserve role separation.
12. Implement authenticated artifact-byte, actor-rights, approval, Auditor, ledger, rollback, and postmerge observers.
13. Independently audit the exact activation implementation.
14. Run a synthetic non-TCW-047 end-to-end exercise including concurrency, replay, stale S, moved ref, wrong actor, wrong merge method, ABORTED, credential revocation, and rollback.
15. Only after that PASS return to Owner for the real decision A.

## Exact Manager decision required next

Review PR #208 and its exact-head CI. If accepted, authorize a separate protected-release external-evidence setup/activation task with no TCW-047 staging authority. Require exact-byte archival before artifact expiry and require an independent audit plus synthetic end-to-end PASS before any real staged-source decision.

TCW-047 remains WAITING_EXTERNAL_EVIDENCE. Builder PR #162 remains DRAFT / OPEN / UNMERGED at 17e5f413f2afd3d743fd28d401f0df421825df2a.

## Authorized changed-file inventory

Exactly two authorized R&D paths after this handoff commit:

1. .ai/rnd/TCW-059_PROTECTED_RELEASE_EXTERNAL_EVIDENCE_RESEARCH.md
2. .ai/rnd/HANDOFF.md

No other repository path is authorized or intentionally changed.

## No-action confirmation

NO TCW-047 stage branch/PR was created.  
NO Builder PR #162 change occurred.  
NO R&D sync/rebase/merge to canonical master occurred.  
NO GitHub account/App/credential/token was created.  
NO ledger or approval record was written.  
NO ruleset/branch protection was changed.  
NO TCW-047 workflow was installed or dispatched.  
NO PR was merged.  
NO product/ESPN/trade source was modified.  
NO staging/install/release authority is claimed.

## Next Activation dashboard

| Order | Employee / Role | Status | Project / gate | Next action |
| ---: | --- | --- | --- | --- |
| 1 | Manager / Architect | ACTIVATE AFTER EXACT-HEAD CI | TCW-059 review | Independently review PR #208, verdict, artifact custody, actor model, ledger design, and exact-head CI. Decide whether to authorize setup-only activation work. |
| 2 | Implementation Engineer / Builder | WAIT | TCW-047 WAITING_EXTERNAL_EVIDENCE | Keep PR #162 frozen at 17e5f413...; no staging/install work. |
| 3 | In-Season Strategy & Decision Intelligence Analyst | IDLE | No TCW-059 strategy gate | No action unless Manager routes a policy question. |
| 4 | Research & Development | STOP AFTER HANDOFF | TCW-059 complete | No further branch writes after final handoff unless Manager returns a bounded research question. |
| 5 | Independent Auditor / QA | WAIT | Future activation audit | Do not treat this research or future green implementation CI as an audit verdict. Activate only after Manager freezes a setup/activation target. |
| 6 | Troubleshooting & Root Cause Engineer — on-demand | IDLE | No execution blocker | Activate only for a reproduced setup/CI/tooling blocker under Manager scope. |

## Dynamic custody note

PR #208 and exact-head CI identifiers cannot be self-embedded into the same commit whose SHA/run they identify without creating a recursive publication problem. The final immutable branch head, changed-file proof, exact-head run/job/conclusion, and complete handoff dashboard are therefore also recorded as a top-level PR #208 custody comment after the final handoff commit and its CI complete.
