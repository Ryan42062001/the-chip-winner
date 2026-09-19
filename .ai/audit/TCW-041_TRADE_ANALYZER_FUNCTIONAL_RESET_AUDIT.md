# TCW-041 — Trade Analyzer Functional Reset Independent Audit

Target task: `TCW-031 — Trade Analyzer Functional Reset + UAT Contract`  
Source PR: `#129`  
Exact Builder final head: `350eea0d45fb7eb54df6082c169a0440366210f4`  
Exact frozen integrated/deployed product target: `79b41042b9f556aa4f1368603bcda81df796a6fa`  
Current canonical master verified at audit start: `0894f1acc09c67b59166a0af3eaf7c715c4c4cd9`  
Role: Independent Auditor / QA  
Verdict: **FAIL — REMEDIATION REQUIRED**

## Independence and target discipline

This was a fresh independent audit lane.

Builder claims, Manager acceptance, prior Trade Analyzer audit conclusions, green CI, deployment success, and product-owner expectations were treated as evidence rather than proof.

The audit remained pinned to exact product target:

`79b41042b9f556aa4f1368603bcda81df796a6fa`

Current master is exactly one Manager control-plane/audit-routing commit beyond that target. The advancement contains no product source/config change and was not substituted into the audit target.

The assigned Auditor branch was independently verified to begin exactly at current master `0894f1acc09c67b59166a0af3eaf7c715c4c4cd9`.

## Source scope independently verified

PR #129 is merged with:
- exact final Builder head `350eea0d45fb7eb54df6082c169a0440366210f4`;
- merge/deployed target `79b41042b9f556aa4f1368603bcda81df796a6fa`;
- exactly nine changed files:
  - `.ai/builder/HANDOFF.md`
  - `scripts/smoke-trade-analyzer.js`
  - `src/domain/trade-analyzer.js`
  - `src/ui/trade-analyzer.js`
  - `test/trade-analyzer-audit-remediation.test.js`
  - `test/trade-analyzer-contract-edges.test.js`
  - `test/trade-analyzer-functional-reset.test.js`
  - `test/trade-analyzer-ui.test.js`
  - `test/trade-analyzer.test.js`

No `config/field-validation.json`, Strategy/R&D artifact, ESPN write path, or TCW-032+ implementation was added.

## Finding

### TCW-041-F01 — HIGH — ambiguous outgoing ownership does not fail closed

**Severity:** HIGH

**Violated requirement**

TCW-041 explicitly requires:
- outgoing players belong to the selected user's current roster;
- ambiguous ownership fails closed;
- UI filtering and domain validation independently protect the ownership boundary.

TCW-031's product objective is to prevent structurally invalid pseudo-trades.

**Exact evidence**

The domain creates an ownership map across all rosters, but applies exclusivity only to **incoming** players:

```js
const owners = new Map();
for (const item of snapshot.rosters || []) {
  for (const entry of item.entries || []) {
    const ids = owners.get(entry.playerId) || new Set();
    ids.add(item.teamId);
    owners.set(entry.playerId, ids);
  }
}

if (incoming.some((id) =>
  (owners.get(id)?.size || 0) !== 1 ||
  !owners.get(id).has(partnerId)
)) {
  return { error: "Every incoming player must belong exclusively ..." };
}
```

Outgoing validation is only:

```js
if (outgoing.some((id) => !rosterIds.has(id)))
  return { error: "Every outgoing player must be on the connected user's current roster." };
```

Therefore an outgoing player is accepted when present on the user's roster even if the same player is also present on another team's roster.

The UI has the same gap. It constructs `ownerTeams` and uses exclusivity filtering for `incomingChoices`, but `outgoingChoices` is built directly from the user's selected roster without checking `ownerTeams.get(player.id)?.size === 1`. The `mutate()` guard likewise permits an outgoing player solely when `outgoingIds.has(id)`.

The upstream snapshot validator does not eliminate this counterexample. `validateLeagueSnapshot()` rejects duplicate player IDs within a **single** roster, but does not reject one player ID appearing across multiple team rosters.

Deterministic counterexample using the existing TCW-031 fixture shape:

1. selected user roster contains player `a`;
2. opposing/third roster also contains player `a`;
3. selected trade partner remains a valid distinct team;
4. proposal sends `a` and receives a uniquely partner-owned player `x`.

The target:
- presents `a` as an outgoing UI choice;
- permits adding it through the UI ownership guard;
- passes the domain outgoing-membership check;
- does not apply the ownership map to `a`;
- proceeds to consequence analysis instead of returning `INVALID_PROPOSAL`.

By contrast, the focused ambiguous-ownership regression only duplicates an **incoming** player across opposing rosters, so the outgoing-side gap is not covered.

**Impact**

A schema-valid but ownership-inconsistent snapshot can produce a structurally invalid hypothetical trade and present its consequence analysis as current. This undermines the central TCW-031 ownership-integrity reset and can mislead the user about a package whose outgoing asset does not have unambiguous team ownership.

The analyzer remains read-only, so this does not execute an ESPN transaction. The defect is nevertheless blocking because TCW-031 specifically requires ambiguous ownership to fail closed at both UI and domain boundaries.

**Remediation direction**

Use one shared/consistent ownership rule for both proposal sides.

At minimum:
- domain outgoing assets must have exactly one owner and that owner must be the selected user team;
- UI outgoing choices must exclude any player whose ownership is not uniquely the selected user team;
- the UI mutation guard must independently reject a tampered/stale outgoing ID whose ownership is ambiguous;
- preserve existing incoming exclusivity behavior.

Do not broaden into new trade valuation policy.

**Required validation**

Add deterministic regressions proving:
1. a player duplicated between the selected user roster and any other roster is rejected as outgoing by the domain;
2. that player is absent from UI outgoing choices;
3. tampered UI addition of that ambiguous outgoing ID fails closed;
4. normal uniquely user-owned outgoing players remain supported;
5. existing incoming ambiguous/free-agent/mixed-opponent cases remain rejected;
6. legitimate 1-for-1, 2-for-1, and 1-for-2 flows remain green.

Run exact-head FULL CI, integrate only the bounded ownership fix, run master deployment/production smoke, and return the exact repaired target for fresh Independent Auditor re-audit.

**Confidence:** HIGH

## Requirement-by-requirement audit result

| Requirement | Result | Evidence |
| --- | --- | --- |
| Exactly one explicit opposing ESPN team required | PASS | Domain requires `partnerTeamId`, rejects blank/self, requires a known team and exactly one partner roster; UI requires partner selection before incoming options |
| Self-team counterparty fails closed | PASS | Domain rejects `partnerId === teamId`; UI excludes selected user team from opponent list |
| Outgoing player belongs to selected user's roster | PASS for ordinary ownership / **FAIL for ambiguous ownership** | Membership check exists, but TCW-041-F01 shows exclusivity gap |
| Incoming exclusively selected partner-owned | PASS | Domain ownership map requires exactly one owner equal to partner; UI independently filters partner roster by exclusive owner |
| Free-agent/unrostered incoming | PASS | No owner fails domain exclusivity; UI does not surface unrostered players |
| Mixed-opponent package | PASS | Any incoming asset not exclusively partner-owned invalidates proposal |
| Ambiguous ownership | **FAIL** | Incoming ambiguity fails; outgoing ambiguity survives UI and domain (TCW-041-F01) |
| Missing/unavailable partner roster | PASS | Domain requires known partner team and exactly one roster with entries array; UI only lists supported opponents |
| UI/domain independent ownership boundary | **FAIL on ambiguous outgoing** | Both independently protect incoming side, neither enforces outgoing exclusivity |
| 1-for-1 / multi-player packages | PASS | Deterministic 1-for-1, 2-for-1, 1-for-2 fixtures remain supported |
| Explicit follow-up removals | PASS | Roster-action-required flow remains explicit; no silent drop/add |
| Partner change stale-state reset | PASS | Incoming/drop/result cleared on partner change |
| User-team / snapshot stale-state reset | PASS | View binds snapshot object and selected team; app load replaces snapshot; render resets proposal/result when either changes |
| Add/remove/reset/re-analysis stale result | PASS | Mutations/objective/reset clear result; analysis re-renders current state |
| Unexpected analysis failure | PASS | Catch path explicitly clears prior result and renders truthful error |
| Valid/invalid/incomplete visibility | PASS | Result rendering exposes explicit states/reasons; no silent click success path observed |
| Evaluated parties/package/source context | PASS | User/partner/send/receive/drop metadata is carried; source/freshness remains inspectable for completed evidence and global snapshot status remains present |
| ESPN read-only / no mutation | PASS | `readOnly: true`, empty `transactionActions`; no propose/send/accept/reject/veto path introduced |
| TCW-025/030 F01-F04 repaired behavior | PASS | Related replacement/fragility/lock-neutral code is unchanged by PR #129; historical regression suite remains green |
| Current lock / future lock-neutral behavior | PASS | No lineup-optimizer change in TCW-031; historical lock regressions pass in 476-test suite |
| Source separation / missing-data honesty | PASS | Trade Analyzer projection evaluation code unchanged outside ownership/result metadata; existing tests remain green |
| Roster legality / FLEX/OP / replacement context | PASS | Existing code paths unchanged by reset except partner validation/result metadata; historical tests remain green |
| Field-validation / FV-SEASON-01 | PASS | `config/field-validation.json` blob remains `0b96e27e693ad778089f2967e486bc9a307b9747`; FV-SEASON-01 remains pending |
| No TCW-032+ functionality | PASS | No winner/fairness/suggested-trade/counteroffer implementation introduced |

## Validation evidence independently verified

### Level 1 — static/adversarial

**FAIL**

Most TCW-031 ownership/reset logic is coherent, but TCW-041-F01 is a deterministic ownership-boundary defect in the exact deployed target.

### Level 2 — automated tests / CI

**PASS as evidence, but insufficient to override F01**

PR #129 FULL run #609 / `35425116406`:
- test job `105849597088`: PASS;
- effective mode FULL;
- 476/476 tests PASS;
- Trade Analyzer browser smoke PASS;
- accessibility/readiness/mobile/extension/performance/security PASS;
- durable CI artifact `tcw-ci-evidence-35425116406-1` / artifact `10578009328`.

PR exact-head run #610 / `35425234360`:
- exact head `350eea0d45fb7eb54df6082c169a0440366210f4`;
- test job `105849903111`: PASS;
- DOCS_ONLY with verified same-PR immediate predecessor continuity to successful FULL #609;
- durable CI artifact `tcw-ci-evidence-35425234360-1` / artifact `10578427562`.

Integrated/deployed master run #611 / `35442118898`:
- exact target `79b41042b9f556aa4f1368603bcda81df796a6fa`;
- test job `105894620506`: PASS;
- deploy job `105894809702`: PASS;
- production verification job `105894845601`: PASS;
- 476/476 tests PASS;
- Trade Analyzer browser smoke PASS;
- Pages deployment / production smoke PASS;
- durable CI artifact `tcw-ci-evidence-35442118898-1` / artifact `10584053255`.

The green suite does not contain the outgoing-ambiguity counterexample.

### Level 3 — controlled deterministic in-season scenarios

**FAIL on one required adversarial scenario**

Existing deterministic fixtures successfully cover:
- explicit partner requirement;
- self-team rejection;
- missing partner;
- valid 1-for-1;
- 2-for-1;
- explicit-drop 1-for-2;
- free-agent rejection;
- mixed-opponent/stale incoming rejection;
- incoming ambiguity;
- outgoing non-membership;
- duplicates/cross-side identity;
- incomplete projection;
- visible party metadata.

The required ambiguous-ownership space is incomplete: only incoming ambiguity is tested. The outgoing cross-roster ambiguity described in TCW-041-F01 deterministically survives the implementation.

### Level 4 — genuine authenticated/private ESPN UAT

**NOT CLAIMED / SEPARATE GATE**

No private ESPN state, transaction, credential, token, URL, league/member identifier, or raw snapshot was manufactured or preserved.

Real connected-ESPN product-owner UAT remains a separate Manager/product-owner gate and cannot cure the deterministic F01 defect.

## Final verdict

**FAIL — REMEDIATION REQUIRED**

TCW-031 substantially repairs the baseline Trade Analyzer workflow, but its ownership boundary is not fully fail-closed. Because ambiguous outgoing ownership can still produce a structurally invalid pseudo-trade in both UI and domain paths, the exact frozen target does not satisfy TCW-041's required ownership-integrity contract.

Manager should keep TCW-031 open, route a bounded ownership-exclusivity remediation, and require a fresh independent re-audit of the exact repaired product target before treating the independent-audit gate as passed.
