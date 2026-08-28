# The Chip Winner agent guide

## Product boundary

The Chip Winner is an ESPN-only, read-only in-season fantasy football companion. ESPN owns league state. External rankings and projections are independent inputs. Derived recommendations never modify source snapshots.

## Required invariants

- Never invent player identities, rankings, projections, injuries, availability, kickoff times, or league rules.
- Preserve `null` as missing data; do not coerce it to zero.
- Use provider-owned IDs and explicit identity maps. Do not join providers by display name in new code.
- Respect ESPN lineup eligibility, bench/IR status, availability, and game locks.
- Keep browser credentials and ESPN cookies out of snapshots, sync payloads, model context, logs, and tests.
- Model output is advisory. Pass recommendations through the contract and offline evaluator before an adapter receives them.
- Multiweek deltas require complete mapped projection coverage for both baseline and simulated rosters.

## Architecture

- `src/providers/espn`: ESPN acquisition and normalization.
- `src/providers/rankings`: FantasyPros ROS ranking import and reconciliation.
- `src/providers/projections`: provider-neutral weekly projections and identity maps.
- `src/domain`: deterministic selectors, optimizers, recommendations, scenarios, contracts, and evaluation.
- `src/models`: provider-neutral model boundary; no provider credentials belong in the browser bundle.
- `src/sync` and `worker`: client-side encrypted mobile snapshot transport.
- `schema`: machine-readable external contracts.
- `test/fixtures`: deterministic regression and safety cases.

## Verification

Use the repository's configured Node runtime and run:

```text
npm test
npm run eval:model
npm run check
git diff --check
```

Every pushed change must keep the GitHub Pages workflow passing. Add tests for domain behavior and missing-data states. Update the documented test count only after verifying the complete suite.

## Current priorities

1. Expand model safety fixtures, explanation evaluation, and observability.
2. Connect a trustworthy future-week projection export without weakening identity requirements.
3. Improve multiweek scenario UX and source/coverage explanations.
4. Replace hard-coded league configuration with local onboarding.
5. Add a server-side model integration only after provider choice, privacy, cost, and secret storage are explicitly approved.
