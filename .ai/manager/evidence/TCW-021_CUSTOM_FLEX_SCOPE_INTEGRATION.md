# TCW-021 — Custom FLEX / OP Field-Scope Integration

## Product-owner direction

On 2026-09-14 the product owner stated that they do not care about the Superflex field-validation requirement.

Manager interprets that direction narrowly as authorization to remove the dedicated `FV-ESPN-02 — Authenticated custom FLEX or OP league` field-certification requirement from Release 1.0.

## Scope disposition

- `FV-ESPN-02` is removed from `config/field-validation.json`.
- It is **not** marked passed.
- No custom OP/Superflex field evidence is fabricated or inferred.
- Existing standard ESPN/FLEX support remains in product scope.
- Existing lineup-slot normalization, eligibility enforcement, fail-closed handling, and automated regression coverage remain unchanged.
- Previously observed standard-league evidence already includes a normal FLEX slot and remains preserved.

## Release effect

After this scope change, the Release 1.0 field registry contains 10 passed items and 1 pending item.

Sole remaining pending field item:
- `FV-SEASON-01 — Real playoff and bye intelligence states`.

## Verification requirement

Because the authoritative field registry and README are deployable repository state, TCW-021 requires exact-head CI plus post-merge `master` test, GitHub Pages deployment, and production smoke before closeout.

This decision changes release certification scope only. It does not claim custom OP/Superflex behavior has been field-validated and does not alter recommendation logic or ESPN acquisition behavior.
