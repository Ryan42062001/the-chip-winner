# Release 1.0 field validation

The Chip Winner's automated production-readiness engineering is complete through v0.9.71. Release 1.0 still requires targeted human and real-world validation that cannot be honestly replaced by synthetic fixtures or headless browser checks.

This document defines that remaining work as a finite evidence-backed checklist. The machine-readable source of truth is [`config/field-validation.json`](../config/field-validation.json).

## Status model

Each field check has one of four states:

- `pending` — not yet completed with acceptable evidence;
- `passed` — completed and supported by recorded evidence;
- `blocked` — cannot currently be exercised because the required real state/device/service condition is unavailable;
- `failed` — exercised and a reproducible defect or unacceptable result was observed.

A check cannot be marked `passed` or `failed` without at least one evidence entry. A blocked check must remain visible rather than being silently treated as passed.

Run:

```text
npm run field:status
```

to print the current registry. Run:

```text
npm run field:status -- --require-complete
```

when evaluating the Release 1.0 exit gate. That stricter form fails unless every registered check is `passed` and also fails if any check is `failed`.

## Evidence rules

Evidence should be concise and privacy-safe. Do not commit ESPN cookies, credentials, private league snapshots, member names, email addresses, private mobile-sync URLs/tokens, or raw authenticated payloads.

Acceptable evidence examples include:

- a sanitized note naming browser/device/assistive-technology versions and the observed result;
- a sanitized fixture added after a newly observed ESPN response shape;
- a regression test or PR/commit that fixes a reproduced defect;
- a screenshot only when it contains no private league/member data;
- a short manual test record containing date, environment, field-check ID, and result;
- release/CI identifiers when they are relevant to the observation.

If an observation exposes a new provider shape or deterministic defect, add a sanitized permanent regression fixture before closing the corresponding check when practical.

## Field checklist

### Accessibility and physical-device checks

- **FV-A11Y-01 — Keyboard-only critical workflow.** Complete onboarding/sample or ESPN connection, primary navigation, player detail, lineup comparison, waiver review, Season Plan, League Setup, disconnect, and destructive-action confirmation without a pointing device.
- **FV-A11Y-02 — Screen-reader critical workflow.** Exercise the same critical workflow with NVDA, VoiceOver, or equivalent assistive technology. Record browser and assistive-technology versions.
- **FV-A11Y-03 — Real browser 200% zoom.** Spot-check all primary sections using actual browser zoom. This complements, rather than replaces, the deployment-blocking 720 CSS-pixel reflow audit.
- **FV-MOBILE-01 — Representative physical phone workflow.** Exercise navigation, player detail, waiver review, Season Plan, and League Setup on a physical phone/browser.

### Authenticated ESPN state checks

These checks validate already-reviewed deterministic behavior against real ESPN states. They must not manufacture or infer league rules merely to satisfy the checklist.

- **FV-ESPN-01 — Authenticated standard ESPN league.** Validate connect, refresh, roster, matchup, lineup, waivers, What Changed, and Season Plan against a real standard-format league.
- **FV-ESPN-02 — Authenticated custom FLEX or OP league.** Validate real flexible/superflex-style slot eligibility and rendering.
- **FV-ESPN-03 — Authenticated acquisition and position limits.** Confirm waiver legality against ESPN-reported acquisition caps, roster size, and provider-position limits.
- **FV-ESPN-04 — Authenticated IR edge states.** Observe supported eligible, grandfathered, filled, invalid, and/or unverified IR states as real opportunities arise. Do not weaken the policy to force completion.
- **FV-ESPN-05 — Authenticated lock and availability transitions.** Observe at least one real lock or availability transition across refreshes and verify prior recommendations are revalidated, obsoleted, or withheld correctly.

### Season and playoff intelligence

- **FV-SEASON-01 — Real playoff and bye intelligence states.** Validate ESPN playoff-week boundaries or labeled local fallback, fantasy playoff opponents, bye coverage, and partial/full future projection behavior against real league state. FantasyPros SOS remains an independent imported overlay.

### Failure and lifecycle checks

- **FV-RECOVERY-01 — Live ESPN session/network failure and reconnect.** Observe an actual session, companion, ESPN-service, or network failure and verify the last valid snapshot remains usable without being mislabeled as live.
- **FV-SYNC-01 — Live deployed sync revoke/delete.** Exercise encrypted mobile sync against the deployed worker, including remote revoke/delete, and verify the UI reflects actual success or failure rather than assuming it.

### Real waiver scale observation

- **FV-WAIVER-01 — Real waiver candidate volume and timing.** As multiweek projection coverage grows, record `consideredAdds`, `completeAdds`, `scenarioCount`, `qualifiedAdds`, and user-visible responsiveness. Exhaustive enumeration remains the rule unless real evidence justifies a separately reviewed visible shortlist policy.

## Release 1.0 exit rule

The Chip Winner may be labeled **1.0 — production-grade read-only companion** when all of the following are true:

1. every item in `config/field-validation.json` is `passed` with privacy-safe evidence;
2. there are no unresolved high-severity accessibility, privacy, security, ESPN-normalization, waiver-legality, or season-planning defects;
3. any newly observed deterministic provider shape or reproduced defect has an appropriate regression fixture/test where practical;
4. the exact final Release 1.0 PR head passes the full protected test job;
5. after merge, protected `master` passes `test`, GitHub Pages `deploy`, and `verify-production` including `npm run smoke:production`;
6. the product remains read-only and no ESPN write capability is pulled forward to satisfy the milestone.

## What does not block 1.0

The following remain separate future product work and should not be disguised as Release 1.0 validation gaps:

- trade analysis;
- external notifications;
- playoff qualification or championship probability modeling;
- future-only IR-assisted stash discovery;
- server-side model integration;
- Chrome Web Store distribution (unless the companion is intentionally moved beyond unpacked/local installation before 1.0);
- ESPN lineup, waiver, add/drop, or trade write actions.

## Updating the registry

When a field check is completed:

1. update only that item's `status` and add privacy-safe evidence in `config/field-validation.json`;
2. if a defect is found, leave the item `failed` until the fix and regression coverage are merged and the field behavior is retested;
3. run `npm run field:status` and the normal repository verification suite;
4. update this document only when the checklist definition or evidence policy changes, not for routine status changes.
