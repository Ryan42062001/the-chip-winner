# TCW-042 — Trade Analyzer Player Input UAT Feedback

Date: 2026-09-19
Source: real deployed product-owner observation plus supplied screen recording
Related target: TCW-031 deployed baseline

## Functional observation

Product owner reported the baseline "seems like it worked." This is useful positive UAT evidence, but it is **not** recorded as final ACCEPT because a concrete usability issue remains and TCW-041 also found a blocking ownership defect.

## Usability finding

The proposal-entry controls are visually awkward on desktop:
- the current generic form grid makes **Add outgoing** very wide;
- Add outgoing is visually far from **Add incoming**;
- outgoing and incoming flows do not read as two matched halves of one trade;
- the player selectors and their actions are not tightly associated.

## Requested UI direction

Use two balanced trade-side sections:
- SEND: selector + compact Add action together;
- RECEIVE: selector + compact Add action together;
- selected chips directly under their side;
- compact matched Add actions;
- responsive vertical stacking on mobile.

This is a product-owner usability requirement for the next repaired target.


## Renewed deployed UAT gate — repaired target

Exact target:
`5362e2bff143a5aef050e160ccb0706a7060fb3d`

Automated deployment/production verification is complete, but it does not replace product-owner judgment.

The product owner must re-open the deployed app with the genuine connected ESPN league and return privacy-safe observations only.

Required checks:
- compact Add controls are immediately associated with SEND/RECEIVE selectors;
- two sides read as balanced halves on desktop;
- selected chips remain under the correct side;
- Team Objective is separate and understandable;
- mobile/narrow view stacks cleanly without clipping/overflow;
- a real 1-for-1 proposal can still be built and analyzed;
- explicit final `ACCEPT` or `REJECT`.

Do not record private league/member IDs, cookies, tokens, authenticated URLs, or raw ESPN snapshots.


## Product-owner deployed follow-up — ACCEPTED

Date: 2026-09-19
Exact deployed target: `5362e2bff143a5aef050e160ccb0706a7060fb3d`

Product-owner verdict for this stage: **UAT ACCEPT**

Privacy-safe observations:
- the compact Send/Receive Add-button layout is accepted;
- the deployed Trade Analyzer successfully rendered a real connected-ESPN hypothetical package/result in the supplied recording;
- the result remained visibly read-only and exposed roster/short-term/long-term evidence plus limitations;
- no product-owner usability defect remains in the player-entry button placement for TCW-042.

The product owner also observed that the current result still does not directly say who wins the trade or provide a winner/value score. This is **not a TCW-031/TCW-042 rejection**.

That capability is intentionally deferred to the approved V2 roadmap:
- TCW-032 — Trade Value + Team Needs Strategy Contract;
- TCW-034 — Trade Winner Engine.

Current-stage UAT acceptance must not be interpreted as acceptance of future winner/fairness scoring, because that scoring has not been implemented yet.
