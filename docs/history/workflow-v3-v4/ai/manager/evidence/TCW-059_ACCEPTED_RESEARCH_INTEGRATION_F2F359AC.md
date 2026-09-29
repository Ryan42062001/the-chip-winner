# TCW-059 — Manager Acceptance and Exact-Blob Research Integration

Recorded: 2026-09-21 America/New_York

## Manager decision

**ACCEPTED: PROTOCOL_FEASIBLE_WITH_SEPARATE_OWNER_ACTIONS**

This accepts TCW-059 as research/feasibility evidence only. It does not authorize TCW-047 staging, installation, release, external principal creation, credentials, ledger/ruleset setup or authenticated-observer implementation.

## Source custody

- R&D source PR #208: CLOSED / UNMERGED.
- Exact R&D source head: `98eb461a4b156fe156ca085b07fe99c7358ef8f0`.
- Exact-head original workflow: #822 / run `35637874013`.
- Original required test: `106459679806` — SUCCESS.
- Fresh exact-head rerun required test: `106465050241` — SUCCESS, GitHub Actions App ID 15368.
- #208 direct protected merge attempts: twice rejected HTTP 405, required status check `test` expected.
- No protection bypass or source rewrite occurred.

Exact source blobs:
- research: `b6f855351ac0501c88e833e03214cd2f80254ea0`
- handoff: `d182e811e0f8c7bcd43b43f36b2dc309411d442e`

Manager integration PR #209 copied exactly those two blobs from canonical master `63e87ece2eb38b5d150df25d83bf296f4783f3a1`.

- Integration SHA: `f2f359ac4ba012cfbf72a8818d94f48d750c71b7`.
- Genuine master PUSH #824/run: `35640077518`.
- Required post-integration test: `106466974510` — SUCCESS.
- Deploy: SKIPPED.
- Verify-production: SKIPPED.

## Independently verified artifact custody

Historical run `35488171554` / job `106018254992` is SUCCESS.

Artifact:
- ID: `10598497668`
- size: 8,150 bytes
- expired: false
- expires: `2026-10-04T04:03:59Z`
- GitHub digest: `sha256:6b28875a0fef1e655da33d692f13692066e4ec8674844fdbcd3e3326e0ac7833`

R&D additionally recorded independently downloaded ZIP and internal packet-byte verification. Manager accepts that research finding while treating durable archival as still unperformed setup work.

## Accepted architecture boundary

Accepted as feasible:
- human Owner plus dedicated Owner Approval GitHub App path;
- separate Manager and Auditor authenticated principals;
- protected off-master same-repository release ledger;
- immutable off-master exact-S Auditor evidence;
- two distinct Owner decisions;
- forward-only protected rollback;
- explicit merge-method request plus postmerge G topology verification.

Current Protect Master #22309639 remains compatible. Global master merge-only restriction is optional defense in depth, not a prerequisite.

## Next gate

TCW-060 is created as a setup-only gate and remains WAITING_EXTERNAL_EVIDENCE / USER_ACTION until the product owner explicitly authorizes external setup.

TCW-047 remains WAITING_EXTERNAL_EVIDENCE / RELEASE_HOLD and is serialized behind TCW-060. Builder PR #162 remains DRAFT / OPEN / UNMERGED at `17e5f413f2afd3d743fd28d401f0df421825df2a`.
