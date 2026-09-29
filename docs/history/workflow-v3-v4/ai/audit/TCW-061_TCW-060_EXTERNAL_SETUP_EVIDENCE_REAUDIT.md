# TCW-061 — Fresh Independent TCW-060 External Setup Evidence Re-Audit

Task-ID: TCW-061  
Workflow: V3.2  
Role: Independent Auditor / QA  
Execution: WORK_MODE / FAST_REFRESH  
Audit target: TCW-060 Manager PR #212 at immutable head `a28f7054435cd9eb1db2526f92e1b0ae2aa003bf`, tree `f12be2dcb609d4d50cde99d79301069eba2045c7`  
Formal bounded verdict: **PASS WITH CONTINUING OPERATIONAL RELEASE HOLDS**  

This verdict is limited to the independently observable TCW-060 external-setup evidence. It is not Manager acceptance of TCW-060, not a TCW-047 release approval, and not proof of an operational protected-release lifecycle. Historical F01 is closed by fresh first-party authenticated installation evidence. F02 remains MEDIUM / OPERATIONAL RELEASE HOLD. F03 remains LOW / CUSTODY-ASSURANCE LIMITATION.

## 1. Authority, canonical state and Auditor branch custody

Manager comment `5770351122` on PR #214 separately authorized this fresh formal audit, the two exact Auditor-owned files, and one distinct draft/unmerged TCW-061 evidence PR. It did not accept TCW-060 or authorize release activity.

Canonical master was independently refreshed at `f420ba26d67ef6d698e1e0209f9ece00e2e27d1f`, tree `7f780365c460d2d71963a0d1f3f885eabcf74636`. Manager control-plane head `18209184e51bc541f3d757afc50945aa48f15882` was integrated by that merge. Exact-head control-plane run `35677543330` / required test `106587129021` and post-merge master run `35677692663` / required test `106587546785` were independently read as SUCCESS with FULL validation and skipped deployment/production verification.

The assigned branch `auditor/tcw-061-external-setup-evidence-reaudit` was independently read at original creation/checkpoint `3c9d83796f9dc7e55c94ab599772dc97a2dc7946`. Current master was exactly 9 commits ahead and 0 behind that checkpoint. The cumulative checkpoint-to-master change set was exactly five Manager control-plane paths: `.ai/manager/HANDOFF.md`, `.ai/manager/INTEGRATION_QUEUE.md`, `.ai/manager/tasks/TCW-060.md`, `.ai/manager/tasks/TCW-061.md`, and `.ai/shared/ACTIVE_TASKS.json`. No TCW-060 setup target source, protected-release implementation or product file changed. Before publication the empty Auditor branch was reconciled by making the new two-file Auditor commit a descendant of current canonical master; immutable PR #212 remained the audit target.

Canonical registry/task state at intake remained TCW-061 `WAITING_EXTERNAL_EVIDENCE`, `pr:null`, and TCW-060 `WAITING_EXTERNAL_EVIDENCE`. This audit does not edit the registry or self-promote either task.

## 2. Frozen Manager setup and historical audit preservation

Manager PR #212 was independently refreshed DRAFT / OPEN / UNMERGED on branch `manager/tcw-060-external-evidence-setup`, exact head `a28f7054435cd9eb1db2526f92e1b0ae2aa003bf`, native tree `f12be2dcb609d4d50cde99d79301069eba2045c7`. Its complete cumulative diff remained exactly:

- `.ai/manager/HANDOFF.md`
- `.ai/manager/INTEGRATION_QUEUE.md`
- `.ai/manager/evidence/TCW-060_PROTECTED_RELEASE_EXTERNAL_EVIDENCE_SETUP.md`

Source run `35675003586` / required test `106579544837` completed SUCCESS. Direct job logs classified the PR `DOCS_ONLY` because every cumulative change matched the documentation allowlist. Dependency, full test/contract, smoke, readiness, performance and security stages were skipped under that classification; deploy `106579581933` and verify-production `106579582437` were skipped. Green docs-only CI is source-governance evidence, not App permission or operational release evidence.

Historical Auditor PR #213 remained CLOSED / UNMERGED at immutable head `22e8c677d6e550d049cfe64a3f2fe2f3b06384b0`, tree `314b0571d02f60867dc8a235bc2cff62842c8340`. The report blob `ec6297e04dd51dfb61695e456085f54795d27493` and handoff blob `0fd068b32ab48c30441fcadf974de8333fe5d736` were read at that exact head. Its verdict remains **FAIL — INDEPENDENT EXACT-SETUP VERIFICATION INCOMPLETE**. Historical run `35675826603` / required test `106582034906` remains FAILURE; direct logs record `ERROR TCW-060: same-task open PRs require exactly one current survivor; found 2`. Manager administrative closure comment `5770098819` did not merge, rewrite, supersede or convert the verdict or CI result.

## 3. Original readiness packet and custody evidence

The live GitHub Actions artifact record for run `35488171554` independently returned artifact `10598497668`, name `tcw-synced-original-readiness-35488171554-1`, size 8150 bytes, nonexpired, with server digest `sha256:6b28875a0fef1e655da33d692f13692066e4ec8674844fdbcd3e3326e0ac7833` and expiry `2026-10-04T04:03:59Z`.

This fresh audit downloaded the current artifact bytes through the authenticated GitHub connector and independently computed:

- ZIP SHA-256: `6b28875a0fef1e655da33d692f13692066e4ec8674844fdbcd3e3326e0ac7833`
- raw `original-packet.json`: 635 bytes
- raw packet SHA-256: `d4189773aae9e40a5ac7729390c45c74f7f630d51b2a6b3ee56b0183e6a5b932`
- canonical pre-hash JSON digest: `f6d59762e3696f91696408e5312013481fb1dc5e9dd24d1ee469b1f590f96894`, matching the embedded packet digest

The packet schema is `TCW_AUDIT_READINESS_V1`, task `TCW-047`, PR `162`, branch `builder/tcw-047-automated-audit-readiness`, head `17e5f413f2afd3d743fd28d401f0df421825df2a`, assignment master `e0fe6309dc0aaa184bbeef35861f7d49256385b7`, `auditRequired=true`, empty blockers and `readyForManagerFreeze=true`, with the original four changed paths.

Connected Drive metadata independently returned file ID `1XCxazBEIse_yx2XUuOlT8Mjbpq-6gnO8`, name `tcw-synced-original-readiness-35488171554-1.zip`, MIME `application/zip`, size 8150, not trashed, one owner-only permission, and parent `1s0D7Ha96PrRxXAY6bA4AyfsnyquAe-MO`. The environment declined a fresh raw private-Drive download because the file was not independently classifiable as credential-free. No bypass was attempted. The immutable historical #213 audit had independently downloaded that same Drive object and matched it byte-for-byte to the same GitHub artifact digest. Current GitHub bytes plus current restricted Drive metadata and preserved historical cross-domain byte verification support packet custody without accessing private-key archives.

Packet readiness remains historical mechanical evidence only. It does not establish current protected release authority.

## 4. Fresh authenticated four-App verification

Evidence classification: **INDEPENDENT AUTHENTICATED FIRST-PARTY GITHUB BROWSER OBSERVATION**, not raw GitHub installation API responses and not Owner screenshots. The formal audit personally reopened `https://github.com/settings/installations` in an authenticated GitHub browser session. The page identified the personal account as `Ryan (Ryan42062001)` and displayed all four original Apps with their Configure routes. Each installation page identified `Ryan42062001` as developer, showed the expected App name and permission summary, checked `Only select repositories`, left `All repositories` unchecked, displayed `Selected 1 repository`, and listed only `Ryan42062001/the-chip-winner`. Corresponding first-party App settings pages identified App owner `Ryan42062001` and the numeric App ID.

| App | App ID | Installation | Fresh UTC observation | Repository scope and complete inventory | Current displayed permissions | Result |
| --- | ---: | ---: | --- | --- | --- | --- |
| TCW Owner Approval | `5025170` | `163636367` | installation `2026-09-22T02:32:34.253Z`; App `2026-09-22T02:32:35.781Z` | Only select repositories; selected 1; `Ryan42062001/the-chip-winner` only | Metadata read; code/Contents and pull requests read/write | MATCH |
| TCW Release Manager | `5025352` | `163636443` | installation `2026-09-22T02:33:04.143Z`; App `2026-09-22T02:33:05.523Z` | Only select repositories; selected 1; `Ryan42062001/the-chip-winner` only | Actions, Checks and Metadata read; code/Contents and pull requests read/write | MATCH |
| TCW Protected Release Auditor | `5025359` | `163636491` | installation `2026-09-22T02:33:15.484Z`; App `2026-09-22T02:33:16.941Z` | Only select repositories; selected 1; `Ryan42062001/the-chip-winner` only | Actions, Checks and Metadata read; code/Contents and pull requests read/write | MATCH |
| TCW Release Ledger Validator | `5025364` | `163636540` | installation `2026-09-22T02:33:21.670Z`; App `2026-09-22T02:33:23.065Z` | Only select repositories; selected 1; `Ryan42062001/the-chip-winner` only | Actions, code/Contents, Metadata and pull requests read; Checks read/write | MATCH — NO Contents write |

The installation IDs are independently bound by the authenticated installation-list Configure links and resulting GitHub routes; GitHub does not separately print them as form fields. No raw original-App JWT/API installation object was retrieved. This UI provenance limitation is explicit, but the owner-approved live first-party session directly exposes every acceptance field and the complete one-repository inventory. No setting was saved or changed and no key, token, cookie or credential was requested or exposed.

## 5. Protected refs, rulesets and neutral Validator boundary

The four original protected refs were independently fetched and all still pointed to setup checkpoint `3c9d83796f9dc7e55c94ab599772dc97a2dc7946`:

- `refs/heads/owner/protected-release-approvals`
- `refs/heads/auditor/protected-release-audits`
- `refs/heads/manager/protected-release-evidence`
- `refs/heads/manager/protected-release-ledger`

No independent evidence record or ledger transition commit was present.

Ruleset `23797129`, `TCW Protected Release Evidence Refs`, was active and targeted exactly the first three full refs with no exclusions. It prohibited deletion and non-fast-forward changes, required a pull request, allowed only merge commits, required zero approvals, had empty bypass actors, and reported `current_user_can_bypass=never`. It had no required status check. `require_extra_approval_for_unattributed_changes=true` was present, but this does not authenticate the intended role-specific publisher.

Ruleset `23797924`, `TCW Protected Release Ledger`, was active and targeted exactly the ledger ref. It prohibited deletion/non-fast-forward updates, required a PR, allowed only merge commits, required zero approvals, had no bypass actors/current-user bypass, and required strict up-to-date check `tcw-release-ledger-validator` pinned to integration/App ID `5025364`; checks apply on creation.

Neutral check `106576817728` on setup checkpoint `3c9d83796f9dc7e55c94ab599772dc97a2dc7946` independently returned App `5025364`, slug `tcw-release-ledger-validator`, permissions Actions read, Checks write, Contents read, Metadata read and Pull requests read. Its conclusion was `neutral`; title `TCW-060 SETUP REGISTRATION ONLY - NO RELEASE AUTHORITY`; summary expressly disclaimed ledger validation and TCW-047 authority. It registered the expected check source only and is not an operational transition receipt.

## 6. Fresh findings

### TCW-061-F01 — CLOSED FOR EXACT SETUP EVIDENCE

The historical evidence gap is resolved. A fresh independently controlled first-party authenticated GitHub session verified all four original App IDs, installation routes, account/App owner, selected-only policy, complete sole-repository inventory and exact current permission matrices. The Validator has Checks write and Contents read only, with no Contents write. No unexpected permission or repository was observed.

Remaining provenance boundary: these are authenticated GitHub browser observations, not raw original-App installation API responses. Installation IDs are bound by authenticated Configure links/routes rather than a separate displayed field. Under the Manager-authorized acceptance channel, this is sufficient to close F01 for the frozen setup. Confidence HIGH.

### TCW-061-F02 — MEDIUM / OPERATIONAL RELEASE HOLD — OPEN

Role-specific authenticated publisher attribution is not independently established. The evidence-ref ruleset has zero required approvals and no App-specific expected-source check. Owner, Manager and Auditor Apps each have repository-wide Contents write permission. Namesake refs, branch prefixes, Git author data and protection against force/deletion do not prove which intended role published a record. No unauthorized publication was observed, but no role-attributed publication enforcement or controlled publication proof exists.

Required future remediation remains separate: independently audited identity-aware observer/validator enforcement or separately authorized native policy, followed by a synthetic non-TCW-047 end-to-end exercise. Confidence HIGH.

### TCW-061-F03 — LOW / CUSTODY-ASSURANCE LIMITATION — OPEN

Current restricted Drive metadata supports private owner-only custody, and current original packet bytes/digests were independently verified from GitHub. The historical audit preserved a valid cross-domain byte match. This audit did not inspect private-key archives or independently prove AES strength, password independence, recovery success, plaintext deletion, key rotation/revocation or compromise/ABORT drills. No secret exposure was observed. Confidence HIGH in the evidence limitation, with no finding of compromise.

## 7. Formal bounded verdict and validation levels

**PASS WITH CONTINUING OPERATIONAL RELEASE HOLDS.** The frozen TCW-060 external setup claims for packet custody, four original App identities/installations/repository scope/least-privilege matrices, protected refs, rulesets and neutral Validator registration are supported by independent evidence. Historical F01 is closed. F02 and F03 remain explicitly open and prevent this verdict from becoming protected-release authority.

- L1: PASS for frozen setup source, artifact bytes/digests, live App UI configuration, refs, rulesets and neutral check identity.
- L2: setup-source PR required test SUCCESS in genuine DOCS_ONLY mode; no production implementation validation is inferred. This TCW-061 evidence PR requires its own exact-head required test result after publication.
- L3: NOT EXECUTED — no controlled synthetic non-TCW-047 protected-release lifecycle.
- L4: NOT ESTABLISHED — no installed first-party TCW-047 workflow, role-attributed publication, protected nonce/consumption transition, actual S/G, exact-S audit, Owner Decisions A/B, rollback or production release.

Manager alone may accept or reject this audit and decide TCW-060 disposition. No downstream activation follows automatically.

## 8. Continuing TCW-047 release hold

TCW-047 remains `WAITING_EXTERNAL_EVIDENCE / RELEASE_HOLD`. Builder PR #162 was independently refreshed DRAFT / OPEN / UNMERGED at frozen head `17e5f413f2afd3d743fd28d401f0df421825df2a`.

Still required under separate authorization: production observer/validator implementation and independent audit, role-attributed publication, synthetic non-TCW-047 exercise, Owner Decisions A/B, real stage S and protected merge G, independent exact-S audit, real nonce and durable consumption transition, workflow installation/dispatch, rollback evidence and installed first-party Actions L4. This audit performed no App/key/permission/ruleset mutation, protected-ref write, stage, ledger transition, workflow action, merge, deployment or release.

## 9. Publication boundary

Only this report and `.ai/auditor/TCW-061_HANDOFF.md` are authorized on the dedicated Auditor branch. The evidence PR must remain DRAFT / OPEN / UNMERGED for separate Manager review. Final publication head/tree, complete two-file diff and exact-head required CI are verified from live GitHub and returned in the external Manager handoff; this report does not self-embed a future commit SHA.
