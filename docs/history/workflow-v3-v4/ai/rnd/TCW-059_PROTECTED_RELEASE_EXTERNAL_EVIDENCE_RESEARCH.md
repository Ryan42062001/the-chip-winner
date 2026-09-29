# TCW-059 — Protected Release External Identity + Ledger Feasibility Research

Workflow V3.2  
Role: Research & Development  
Execution mode: STANDARD_CHAT_HIGH  
Refresh mode: FAST_REFRESH  
Repository: Ryan42062001/the-chip-winner  
Assigned branch: rnd/tcw-059-protected-release-external-evidence-research  
Immutable assignment master: fe3ca66c8905afea8302ae6d6aca0ae7ffeb0952  
Current canonical master independently refreshed: 63e87ece2eb38b5d150df25d83bf296f4783f3a1  
Target advancement classification: CONTROL_PLANE_ONLY at 3f0cdcb324a803828987cc7490dd96196cfda8f4  
Research date: 2026-09-21 America/New_York

## Top-level verdict

PROTOCOL_FEASIBLE_WITH_SEPARATE_OWNER_ACTIONS

A real external evidence architecture is feasible without weakening Workflow V3.2 or the current strict protected-master ruleset, but it is not presently activated and the current integrated TCW-053 observer intentionally cannot clear the release hold. Before any TCW-047 staged-source attempt, the Manager must obtain separate product-owner authorization for a setup/implementation program, provision genuinely distinct authenticated publishers, protect an off-master durable ledger, archive the still-retained original TCW-047 artifact bytes, extend the dormant read-only verifier to authenticate those external facts, and obtain a fresh independent audit of that activation implementation.

No staging, installation, release, ruleset change, credential creation, ledger mutation, Builder PR #162 mutation, workflow dispatch, or merge is authorized by this result.

## Evidence labels

Repository and live GitHub observations are classified as VERIFIED FACT when independently fetched from current GitHub state. GitHub platform semantics documented in current GitHub documentation are classified as STRONG EVIDENCE plus OFFICIALLY SUPPORTED. Architecture conclusions that combine those facts are INFERENCE unless the exact future configuration has been deployed and exercised.

## 1. Independently refreshed repository facts

| Observation | Result | Evidence classification | Platform classification |
| --- | --- | --- | --- |
| Canonical master | 63e87ece2eb38b5d150df25d83bf296f4783f3a1 | VERIFIED FACT | OBSERVED AND REPRODUCIBLE |
| R&D branch baseline before TCW-059 writes | fe3ca66c8905afea8302ae6d6aca0ae7ffeb0952 | VERIFIED FACT | OBSERVED AND REPRODUCIBLE |
| Assignment branch versus assignment master | 0 ahead / 0 behind | VERIFIED FACT | OBSERVED AND REPRODUCIBLE |
| Connected actor | Ryan42062001, durable user ID 312284033 | VERIFIED FACT | OBSERVED AND REPRODUCIBLE |
| Connected actor repository permission | admin | VERIFIED FACT | OBSERVED AND REPRODUCIBLE |
| Source Builder PR #162 | OPEN / DRAFT / UNMERGED at 17e5f413f2afd3d743fd28d401f0df421825df2a | VERIFIED FACT | OBSERVED AND REPRODUCIBLE |
| PR #162 effective-baseline changed paths | exactly four authorized Builder paths | VERIFIED FACT | OBSERVED AND REPRODUCIBLE |
| Protect Master ruleset | #22309639 ACTIVE | VERIFIED FACT | OBSERVED AND REPRODUCIBLE |
| Master PR requirement | enabled | VERIFIED FACT | OBSERVED AND REPRODUCIBLE |
| Strict required check | test, integration ID 15368, strict=true | VERIFIED FACT | OBSERVED AND REPRODUCIBLE |
| Ruleset bypass actors | none | VERIFIED FACT | OBSERVED AND REPRODUCIBLE |
| Current user bypass | never | VERIFIED FACT | OBSERVED AND REPRODUCIBLE |
| Allowed repository merge methods | merge, squash, rebase | VERIFIED FACT | OBSERVED AND REPRODUCIBLE |

The master branch endpoint also reports the branch protected while the repository ruleset API is the authoritative live source for the actual active rules. The current ruleset has deletion and non-fast-forward protection in addition to the PR and strict required-status rules.

## 2. What TCW-053 already proves and what it deliberately does not

The integrated dormant source at scripts/workflow-composite-release.js is a fail-closed contract, not an operational release implementation.

VERIFIED FACT — the local contract requires:

- unique Owner, Manager, and Auditor actor IDs;
- a high-entropy 24–128 character nonce and finite attempt lifetime;
- one immutable tuple digest covering source, master, stage, ruleset, Auditor evidence, Owner authority, and rollback custody;
- a durable protected ledger with PREPARED, REVIEWED, OWNER_APPROVED, then RELEASED, or irreversible ABORTED;
- append-only event order and replay rejection;
- a separate Manager-owned stage ref and PR whose S directly descends frozen M;
- mergeMethod=merge for the stage and the release ruleset record;
- exact-S FULL test provenance from required integration 15368;
- a verified M/S synthetic merge preview;
- an exact-S whole-tree Auditor PASS on an off-master evidence ref;
- two distinct Owner evidence commits for plan and installation consent;
- a rollback operator distinct from the Auditor;
- post-merge G with exactly two ordered parents M then S, G.tree=S.tree, and live master=G.

VERIFIED FACT — the current live observer is intentionally incomplete. verifyPremergeReadOnly always returns RELEASE_HOLD after its bounded GitHub observations and explicitly adds blockers for authenticated actor rights, protected ledger, Owner approvals, rollback, and immutable Auditor evidence. observeFrozenSourceCustody also sets originalPacketBytesVerified=false even when the historical run/job metadata can be read. verifyPostmergeReadOnly likewise returns RELEASE_HOLD pending actual merge method, merged inventory, master CI/deploy, and consumed ledger verification.

Therefore TCW-059 does not recommend “turning on” the existing CLI. A future activation implementation must add authenticated observers for the evidence architecture below and then receive its own independent material workflow/security audit.

## 3. Distinct authenticated GitHub actors / publishers

### Candidate evaluation

| Candidate | Stable independently fetchable identity | Least privilege | Durable publication attribution | Role separation | Finding |
| --- | --- | --- | --- | --- | --- |
| Three genuinely different human GitHub accounts | Yes; durable numeric user IDs are fetchable and logins can change | Repository roles are coarse; personal-repo Owner remains admin | PR/review/comment/resource actor metadata can be fetched | Yes only if they are truly different human principals | Feasible but operationally heavier |
| Owner human + dedicated Manager GitHub App + dedicated Auditor GitHub App | Yes; GitHub Apps have numeric app IDs and installation identity; app metadata is fetchable | Strong; installation tokens can be repo- and permission-scoped and expire after one hour | Installation-token actions are attributed to the app; user-access-token actions are attributed to user + app | Yes | RECOMMENDED |
| Multiple GitHub Actions workflows using GITHUB_TOKEN | Workload runs are distinct, but GITHUB_TOKEN is an installation token for the same repository GitHub Actions App | Job permissions can be minimized | Actions activity is attributable to the GitHub Actions integration | No for the accepted three distinct actor IDs; separate workflows are not separate GitHub Apps | Unsuitable as Owner/Manager/Auditor separation |
| Deploy keys | Repository-scoped key, not a user/account identity | Read or write to one repo | Git author strings remain self-asserted; key is attached to repository, not an account | No independently attributable human/app publisher | Unsuitable |
| PATs for the same Ryan42062001 account | Same durable user ID regardless of token | Fine-grained PAT can be scoped | Activity remains the same user | No | Unsuitable |
| Separate service accounts using human credentials | Could produce distinct user IDs | Coarser credential custody, manual lifecycle | Attributed as users | Technically possible but inferior to Apps | Not recommended |

GitHub officially documents that an installation access token attributes activity to the GitHub App and that a user access token attributes activity to both the user and the app. GitHub also documents one-hour installation tokens, eight-hour expiring user access tokens, six-month refresh tokens, app-private-key rotation, and installation scoping.

### Recommended identity policy

1. Owner principal: the existing human account Ryan42062001, durable GitHub user ID 312284033. Do not use Git author text as identity. The owner decision path should use a dedicated Owner Approval GitHub App user access token so GitHub attributes the write to the human user and the app. No long-lived classic PAT should be part of the protocol.
2. Manager principal: a dedicated TCW Release Manager GitHub App with its own immutable app ID and installation ID.
3. Auditor principal: a separate TCW Protected Release Auditor GitHub App with its own app ID and installation ID.
4. Infrastructure validator: a separate ledger/status validator integration may be used. It is not a substitute for any of the three human/governance roles.

The authority policy must pin numeric IDs, not only mutable login/slug strings. GitHub now exposes a user-by-durable-ID endpoint specifically because a login can change.

### Manager App minimum rights

The exact permission set must be validated against the endpoints actually implemented. The feasible minimum is:

- Metadata: read.
- Contents: write — needed to create the exact stage commit/ref and to merge a PR through the merge endpoint.
- Pull requests: write — needed to create/manage the Manager stage PR and ledger transition PRs.
- Actions: read — needed to read exact run/job/artifact provenance.
- Checks: read — needed to inspect exact check-run/app provenance.
- Workflows: write only because the authorized staged source itself contains .github/workflows/task-audit-readiness.yml. GitHub explicitly requires Workflows permission when an App needs to edit workflow files.
- No Administration write.
- No Actions write/dispatch authority for TCW-047.
- No secrets/environment administration.
- No master bypass.

For the public repository, repository-ruleset reads are officially supported with Metadata read. Future setup should mechanically inspect X-Accepted-GitHub-Permissions for each endpoint and reduce permissions if possible.

### Auditor App minimum rights

Because the accepted TCW-053 evidence shape requires the Auditor commit/blob/ref/PR to be in the same repository, the Auditor publisher needs same-repository off-master publication capability:

- Metadata: read.
- Contents: read for source/stage inspection and write only for the dedicated Auditor evidence ref.
- Pull requests: read and write only to open the off-master evidence PR.
- Actions: read.
- Checks: read.
- No Workflows write.
- No Administration write.
- No Actions write.
- No master bypass.

GitHub App permissions are repository-scoped rather than path-scoped. Therefore branch/ruleset controls plus immediate exact-S verification must prevent the Auditor’s repository Contents write from becoming stage/master authority. Any unexpected write to S changes its SHA/ref and fails closed.

### Credential custody and incident handling

STRONG EVIDENCE / OFFICIALLY SUPPORTED:

- GitHub App installation tokens expire after one hour.
- Token permissions can be reduced below the App’s installed permissions when minted.
- App private keys do not expire automatically, can be rotated with overlapping keys, and can be revoked.
- GitHub recommends vault-backed/sign-only storage for private keys.
- Uninstalling/revoking the app or token terminates future authenticated actions.

Protocol requirement: compromise of Owner Approval, Manager, Auditor, or validator credentials immediately aborts every open nonce. Rotate/revoke first; never “repair” the ledger history or reuse the nonce.

Primary GitHub documentation:

- https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/about-authentication-with-a-github-app
- https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/best-practices-for-creating-a-github-app
- https://docs.github.com/en/rest/apps/apps
- https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app
- https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/managing-private-keys-for-github-apps
- https://docs.github.com/en/actions/concepts/security/github_token
- https://docs.github.com/en/rest/deploy-keys/deploy-keys
- https://docs.github.com/en/rest/users/users

## 4. Protected durable nonce / consumption ledger

### Recommended GitHub-native ledger

Use a dedicated same-repository off-master branch such as refs/heads/manager/protected-release-ledger, protected by a new purpose-built ruleset. Do not store ledger state in master, PR comments, branch names, Git author text, or arbitrary unprotected JSON.

Future ledger ruleset properties:

- exact ledger branch target;
- active enforcement;
- pull request required;
- strict required status check from one expected validator GitHub App/integration;
- deletion blocked;
- force pushes blocked;
- allowed merge method restricted to merge for the ledger branch;
- no bypass actors;
- validator has no Contents write;
- Manager App may submit transition PRs but cannot mark its own required validator check successful.

This is a new future evidence ruleset, not a change authorized by TCW-059.

### Record shape

For each attempt:

- attempt ID;
- 256-bit random nonce encoded base64url, producing approximately 43 characters and satisfying the accepted nonce grammar;
- repository ID/full name;
- immutable tuple digest;
- issuedAt and expiresAt with the accepted maximum one-hour attempt window;
- state;
- consumed and aborted booleans;
- ordered transition events;
- each event’s immutable anchor commit;
- previous event anchor;
- tuple digest;
- exact evidence-set digests;
- terminal merge G when RELEASED or incident reason when ABORTED.

Nonce uniqueness must be checked against all retained ledger history. Terminal nonces are never reused.

### Avoiding a self-referential commit SHA

A receipt file cannot truthfully contain the SHA of the same Git commit that contains that file. The accepted contract wisely separates event commit fields from outer receiptCommit/receiptBlob fields, so the implementation can avoid self-reference:

1. create event anchor commit E from the current protected ledger head;
2. create receipt commit R as E’s child; its ledger blob records E as the new event commit and the prior event anchor, but does not claim its own R SHA;
3. the verifier fetches R and its ledger blob and constructs the outer authenticated observation with receiptCommit=R and receiptBlob=the observed Git blob SHA;
4. open the ledger transition PR with R as head;
5. the independent validator verifies the previous protected ledger head, legal single transition, unchanged tuple digest, nonce freshness, exact prefix history, actor evidence, and receipt blob;
6. only a green expected-source validator check allows protected merge.

This makes every claimed commit/blob value externally observable without attempting a cryptographic fixed point.

### Concurrency and replay prevention

The global protected ledger branch serializes transitions. With strict up-to-date status checks, if two transition PRs race from the same ledger head, the first merge advances the base. The second becomes stale and must be rebuilt/revalidated against the new state. A second RELEASED/ABORTED path then fails because the nonce is already terminal.

GitHub’s ref API additionally supports non-force fast-forward-only updates and returns conflict on invalid concurrent movement, but the recommended ledger uses protected PRs rather than relying on direct ref mutation.

### Transition model

The accepted tupleDigest includes both Owner evidence records, so the protected TCW-053 state machine is best treated as a release-consumption ledger after the external evidence tuple is complete, not as the mechanism that gathers the evidence.

Operational sequence:

1. external prestage Owner capability is created;
2. exact S/stage PR is created and sealed to that capability;
3. exact-S CI and Auditor evidence are produced;
4. separate Owner installation approval is produced;
5. the complete immutable release tuple is assembled;
6. ledger PREPARED receipt;
7. ledger REVIEWED receipt after independent verification;
8. ledger OWNER_APPROVED receipt after verifying the second Owner decision;
9. attempt protected merge;
10. if G passes exact postmerge predicates, terminal RELEASED receipt; otherwise terminal ABORTED receipt and forward rollback.

This preserves the accepted invariant that every ledger event has one immutable tuple digest.

### Incident recovery

- Validator unavailable: fail closed; do not bypass.
- Credential compromise: ABORT open nonce, revoke/rotate affected credential, investigate, create a new attempt only after remediation.
- Ledger branch drift: fail closed; compare protected ruleset and full history from a trusted checkpoint.
- Lost off-master evidence ref: fail closed; a commit SHA existing somewhere is not enough if the accepted evidence ref no longer points to it.
- Terminal state: never rewrite. Any correction is a new incident/recovery record linked to the terminal attempt.

Platform basis:

- Rulesets can require strict status checks and pin an expected GitHub App source: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets
- Rulesets can target selected refs and control deletion/update/force-push behavior: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets
- Fast-forward-only reference updates are officially supported: https://docs.github.com/en/rest/git/refs

Assessment: STRONG EVIDENCE / OFFICIALLY SUPPORTED architecture. The exact future ruleset and validator remain UNKNOWN until provisioned and independently exercised.

## 5. Retained original TCW-047 packet byte custody

### Live result

VERIFIED FACT / OBSERVED AND REPRODUCIBLE:

Historical workflow run: 35488171554  
Historical job: 106018254992  
Artifact: 10598497668  
Artifact name: tcw-synced-original-readiness-35488171554-1  
Artifact size: 8,150 bytes  
Artifact expired flag: false  
Artifact expiry: 2026-10-04T04:03:59Z  
GitHub-reported artifact archive digest: sha256:6b28875a0fef1e655da33d692f13692066e4ec8674844fdbcd3e3326e0ac7833

The artifact ZIP was downloaded during TCW-059. The independently computed SHA-256 of the downloaded 8,150-byte ZIP is exactly:

6b28875a0fef1e655da33d692f13692066e4ec8674844fdbcd3e3326e0ac7833

That matches GitHub’s live artifact digest.

The ZIP contains original-packet.json. Its raw stored-file SHA-256 is:

d4189773aae9e40a5ac7729390c45c74f7f630d51b2a6b3ee56b0183e6a5b932

The historical packet field is:

f6d59762e3696f91696408e5312013481fb1dc5e9dd24d1ee469b1f590f96894

This is not the raw pretty-printed file hash. The historical helper scripts/workflow-audit-readiness.js computes the packet digest by JSON-stringifying the packet before adding the sha256 field. Recomputing that canonical pre-hash JSON during TCW-059 produces exactly f6d59762e3696f91696408e5312013481fb1dc5e9dd24d1ee469b1f590f96894.

The ZIP’s verified-original-packet.json independently records the same f6d59762... historical packet digest, exact source 17e5f413..., historical creation 7ca29530..., effective baseline e0fe6309..., exact four paths, PASS, readyForManagerFreeze=true, originalHelperOnly=true, and newAutomationInstalled=false.

### Custody conclusion

The actual historical artifact bytes are still retrievable and verifiable today. The prior TCW-053 source-custody hold was truthful because its bounded observer could not fetch/authenticate the bytes; TCW-059’s external research access now establishes that the retained bytes currently exist.

However, GitHub Actions artifacts are retention-bound. GitHub documents configurable retention and digest validation, and this exact artifact currently has an October 4, 2026 expiry. Artifact retention is therefore not a durable long-term ledger/archive.

Before expiry, a separately authorized custody action should:

1. download the exact artifact 10598497668 again from GitHub;
2. verify GitHub metadata and archive digest 6b28875a...;
3. verify the internal canonical packet digest f6d59762...;
4. publish the unmodified ZIP bytes as an immutable-release asset after repository release immutability is enabled, or place the exact bytes in an independently protected WORM/object-lock archive;
5. record both the ZIP archive hash and internal packet digest;
6. retain at least two independently administered copies if this artifact is intended to remain release authority.

GitHub immutable releases are a strong GitHub-native option because assets and the release tag become immutable after publication and GitHub automatically generates a release attestation. They are not a substitute for an independent backup against repository/owner loss or deliberate release deletion. If the historical Actions artifact expires before exact bytes are archived, different reconstructed bytes MUST be labeled a reconstruction and MUST NOT be represented as the historical artifact.

Primary documentation:

- https://docs.github.com/en/rest/actions/artifacts
- https://docs.github.com/en/actions/tutorials/store-and-share-data
- https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository
- https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases
- https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/establish-provenance-and-integrity/prevent-release-changes

## 6. Two separate Owner approvals

The durable proof must represent two human decisions, not two machine-generated strings.

### Owner decision A — prestage creation capability

There is a sequencing problem that must be solved explicitly: before a stage PR exists, its PR number cannot be known, but the accepted final authority.plan evidence requires exact S and the actual stage PR number.

Feasible solution without weakening the contract:

1. Manager deterministically builds candidate S locally from frozen M and the exact four frozen A blobs. No GitHub stage ref or PR is created.
2. Owner, through the Owner Approval App user-to-server flow, publishes an immutable prestage capability C0 on an off-master Owner evidence ref. C0 binds repository, nonce, frozen M, intended stage branch, precomputed exact S/tree/file tuples, rollback operator, expiry, and a one-shot permission to create exactly one PR whose head must equal S and base must equal M.
3. The short-lived Owner user access token is explicitly authorized to perform only one automatic sealing action during the same attempt lifetime.
4. Manager creates the exact preauthorized branch at S and opens the stage PR.
5. Owner Approval App automatically publishes derived sealing receipt C1 only if live GitHub shows the exact expected branch, base M, head S, and unchanged source tuples. C1 binds the actual stage PR number and the C0 digest. It creates no new human discretion and cannot widen C0.
6. The final authority.plan record points to C1, while C1 proves that the human Owner decision C0 predated stage creation.

If the one-shot token expires, the branch/PR differs, or the stage PR cannot be sealed exactly, the attempt is ABORTED and requires a new nonce and new human Owner decision A.

### Owner decision B — exact-S installation authorization

Only after exact-S FULL CI, exact synthetic M/S preview, exact-S independent Auditor PASS, rollback proof, and complete live protection verification does the human Owner issue a separate installation record C2 through the Owner Approval App.

C2 binds at minimum:

- repository ID/full name;
- attempt ID/nonce;
- frozen M;
- stage PR and branch;
- exact S and S tree;
- source A and exact four file blobs;
- exact Auditor evidence commit/blob/ref/PR and PASS;
- exact required test run/job/check/app;
- ruleset ID/digest;
- rollback operator/plan commit;
- expiry;
- digest of C0/C1;
- explicit installation authorization.

C2 must be a distinct commit/blob/ref/PR from C1. The future live observer verifies the PR/resource publisher’s durable Owner user ID and the Owner Approval App association rather than trusting Git author text.

PR reviews or comments alone are insufficient durable authority because GitHub allows write/admin users to dismiss reviews and comments are mutable. They may be human-readable mirrors but not the machine-consumed source of truth.

GitHub basis:

- user-to-server requests are limited by both user and App permissions and are attributed to user + App: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-with-a-github-app-on-behalf-of-a-user
- pull-request reviews can be dismissed by admins/write users: https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/dismissing-a-pull-request-review

Assessment: INFERENCE built from OFFICIALLY SUPPORTED primitives. Requires future implementation and one real synthetic end-to-end exercise before production authority.

## 7. Exact-S independent Auditor publication off master

The accepted evidenceShape requires the audit evidence to stay in Ryan42062001/the-chip-winner, on a full off-master branch ref, with immutable commit/tree/blob/path and its own PR.

Recommended publication:

1. Auditor App reads M, S, complete S tree, exact four source blobs, stage PR, exact-S required CI/check provenance, ruleset, Owner plan seal, and rollback plan using read-only calls.
2. Auditor produces a whole-tree report whose payload binds S and S.tree but does not contain its own future evidence commit SHA.
3. Auditor App publishes only the report/handoff on an Auditor-owned off-master branch and opens an Auditor evidence PR. Do not target or modify master and do not touch S.
4. After the evidence commit E exists, the composite release attestation stores E, E.tree, report blob, ref, path, and PR externally. This avoids a self-referential SHA.
5. Freeze the Auditor ref operationally. Immediately before release the Manager independently GETs E, E.tree, the report blob, the full ref, PR head, publisher actor/app identity, and report target/verdict. If the ref moved or any identity/target differs, abort.
6. For longer-term custody, the exact audit report may additionally be copied into an immutable release after the attempt, but the accepted premerge authority remains the same-repository commit/ref/blob/PR.

Because same-repository App Contents write is not path-scoped, future setup should add off-master role-ref protections and stage-ref protections so the Auditor App cannot become a Manager publisher. Even without those additional rules, any mutation of stage S changes the exact head/ref and fails the immediate premerge checks; branch rulesets are recommended to enforce least privilege rather than relying only on detection.

Result: exact-S audit evidence does not advance protected master, so S does not become stale merely because the audit is published.

Assessment: STRONG EVIDENCE / OFFICIALLY SUPPORTED Git objects and PRs; role-ref ruleset details remain future setup.

## 8. Rollback and incident authority

### Required proof before merge

Record a rollback operator whose durable actor ID is not the Auditor actor. Recommended operator: the Manager GitHub App or a separately designated Manager-operated principal.

Verify immediately before release:

- actor/app ID;
- current installation and repository access;
- Contents write and Pull requests write capability;
- Workflows write if the rollback changes .github/workflows;
- no master bypass;
- ability to read required status/check provenance;
- exact rollback plan commit;
- expiry and incident contact/custody;
- a synthetic non-production rehearsal showing the operator can create a protected rollback PR without bypass.

### No-force rollback model

Master currently blocks non-fast-forward/force-push style repair and requires PR + strict test. Therefore rollback is a forward protected revert:

1. leave the unexpected G intact as incident evidence;
2. do not mark the nonce RELEASED;
3. transition the attempt to terminal ABORTED;
4. create a new rollback branch from live master;
5. revert G or construct the exact tree-restoration commit;
6. open a rollback PR;
7. run the normal required test from integration 15368;
8. merge through normal protected PR flow;
9. verify resulting master/tree and master-push CI.

GitHub officially supports reverting a merged PR by creating another PR; write permission is required.

If actual G has anything other than exactly two ordered parents, parent 1=M, parent 2=S, G.tree=S.tree, and live master=G, the release contract fails. Do not infer safety from the merge API response alone. The merge endpoint supports an explicit expected head SHA and explicit merge_method=merge; use both, then independently inspect actual G.

Expected GitHub merge topology is INFERENCE until the actual protected merge is observed. The postmerge predicate is the authority.

Documentation:

- https://docs.github.com/en/rest/pulls/pulls
- https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests
- https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/reverting-a-pull-request

## 9. Current ruleset compatibility

### What GitHub currently enforces

Protect Master #22309639 currently enforces:

- active default-branch protection;
- PR required;
- strict up-to-date required status;
- exact required status context test;
- expected integration ID 15368;
- no bypass actors;
- current user bypass=never;
- deletion/non-fast-forward protection.

The pull-request rule currently permits all three repository merge methods: merge, squash, rebase.

### What the dormant contract requires

The accepted TCW-053 contract is stricter procedurally:

- stage.mergeMethod must equal merge;
- ruleset mergeMethod record must equal merge;
- live ruleset must permit merge;
- postmerge observer must verify observed method=merge;
- actual G must be distinct and have exactly [M,S] ordered parents;
- G.tree must equal S.tree;
- live master must equal G.

The implementation’s current live protection validator checks that merge is permitted; it does not require GitHub’s ruleset to forbid squash and rebase globally.

### Required future release procedure

Manager should use the merge endpoint with both:

- sha=S, which makes a head mismatch fail;
- merge_method=merge.

After the API succeeds, immediately fetch master and G and apply the exact parent/tree predicates before writing RELEASED.

### Is a master-ruleset change mandatory?

No. It is not mandatory for the accepted TCW-053 contract because the current ruleset permits merge and the accepted contract independently verifies the requested and actual merge method/topology. A squash/rebase mistake must fail closed and trigger ABORTED + protected rollback.

A future ruleset change to allow only merge would be optional defense in depth that reduces operator error. It is not required to establish protocol feasibility and TCW-059 does not authorize it.

GitHub officially supports selecting allowed merge methods in rulesets and explicitly selecting merge/squash/rebase in the merge API.

Documentation:

- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets
- https://docs.github.com/en/rest/pulls/pulls

## 10. Attestations and immutable releases — useful secondary evidence, not the ledger

GitHub artifact attestations use Sigstore. For public repositories, a copy of the bundle is written to the public Sigstore transparency log. This is useful independent provenance evidence.

However, GitHub also provides attestation deletion APIs. Therefore a repository attestation alone should not be the mutable state store for nonce consumption.

Immutable releases are stronger for retained byte custody because published release assets and their associated Git tag are locked; an immutable release automatically creates a release attestation. GitHub still permits deleting the release itself, so a second independently administered archival copy is appropriate for release-authority evidence with long retention requirements.

Documentation:

- https://docs.github.com/en/actions/concepts/security/artifact-attestations
- https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/manage-attestations
- https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases

## 11. Unresolved external setup requirements

Every item below remains unperformed and unauthorized:

1. Owner decides whether to approve this architecture for implementation/setup.
2. Archive artifact 10598497668 exact bytes before 2026-10-04T04:03:59Z under a separately authorized custody action.
3. Enable immutable releases if GitHub Releases will be used for retained custody; immutability applies only to future releases.
4. Create Owner Approval, Manager, and Auditor GitHub Apps or select genuinely distinct human principals.
5. Pin durable numeric actor/app/installation IDs in an independently reviewed authority policy.
6. Configure least-privilege App permissions and selected-repository installation.
7. Provision private-key vaulting, rotation, revocation, and incident procedure.
8. Provision off-master Owner approval evidence refs and same-repository Auditor evidence refs.
9. Provision the protected same-repository release ledger branch and its dedicated ruleset.
10. Provision an independent expected-source ledger validator with no ledger Contents write.
11. Provision stage-ref/role-ref protections sufficient to make same-repository write permissions least-privilege in practice.
12. Implement authenticated read-only observation of Owner/Manager/Auditor identities, permission/publication provenance, exact evidence commit/tree/blob/ref/PR, protected ledger before/after state, rollback operator, and artifact bytes.
13. Replace the current hardcoded originalPacketBytesVerified=false hold only with an authenticated byte/digest observer; do not remove the gate.
14. Implement authenticated postmerge observation of merge method, G parent order/tree, live master, required master CI, and terminal ledger receipt.
15. Independently audit the exact activation implementation and ruleset/identity design.
16. Exercise the complete mechanism on a synthetic non-TCW-047 attempt, including concurrency race, stale S, replay, ABORTED, credential revocation, moved evidence ref, wrong publisher, wrong merge method, and rollback PR.
17. Freeze and independently verify the successful synthetic evidence before any Owner decision A for TCW-047.

## 12. Exact Manager decision required next

Manager should decide whether to authorize a separate protected-release external-evidence setup/activation task based on this architecture.

If accepted, that next task must remain non-release work and should be split so no role self-authorizes:

- Owner authorizes setup, not TCW-047 staging.
- Manager provisions policy/rulesets/role registrations only within separately granted scope.
- implementation role adds authenticated evidence observers without weakening the existing fail-closed predicates.
- Auditor independently audits the exact setup/implementation.
- only after the audited synthetic end-to-end PASS does Manager return to the product owner for Owner decision A on one real TCW-047 staged-source attempt.

TCW-047 remains WAITING_EXTERNAL_EVIDENCE and Builder PR #162 remains DRAFT / OPEN / UNMERGED at 17e5f413f2afd3d743fd28d401f0df421825df2a.

## 13. Research boundaries confirmed

TCW-059 performed read-only GitHub refresh/research plus authorized R&D documentation only.

NO TCW-047 stage branch or PR was created.  
NO Builder PR #162 change occurred.  
NO R&D branch synchronization/rebase/merge to current master occurred.  
NO GitHub account/App/credential/token was created.  
NO ledger or approval record was written.  
NO branch protection/ruleset was changed.  
NO TCW-047 workflow was installed or dispatched.  
NO PR was merged.  
NO product/ESPN/trade source was modified.  
NO staging/install/release authority is claimed.
