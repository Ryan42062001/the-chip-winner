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
