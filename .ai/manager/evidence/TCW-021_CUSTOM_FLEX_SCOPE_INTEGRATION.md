# TCW-021 — Custom FLEX / OP Field-Scope Integration

## Product-owner direction

On 2026-09-14 the product owner stated that they do not care about the Superflex field-validation requirement.

Manager interpreted that direction narrowly as authorization to remove the dedicated `FV-ESPN-02 — Authenticated custom FLEX or OP league` field-certification requirement from Release 1.0.

## Scope disposition

- `FV-ESPN-02` is removed from `config/field-validation.json`.
- It is **not** marked passed.
- No custom OP/Superflex field evidence is fabricated or inferred.
- Existing standard ESPN/FLEX support remains in product scope.
- Existing lineup-slot normalization, eligibility enforcement, fail-closed handling, and automated regression coverage remain unchanged.
- Previously observed standard-league evidence already includes a normal FLEX slot and remains preserved.

## Release effect

The Release 1.0 field registry now contains **10 passed / 1 pending**.

Sole remaining pending field item:
- `FV-SEASON-01 — Real playoff and bye intelligence states`.

## Verified integration

- Manager integration PR #102 exact head: `11a0679bd0513a7ed5b555a1c7ff3dcb3e27176d`.
- Exact-head workflow #530: full test/audit/security gate PASS.
- PR #102 merged at `fd845bfbc1c28a746ef7cb455c6abe80e6ac945e`.
- Master workflow #531: full test gate PASS.
- GitHub Pages deployment: PASS.
- Production smoke / `verify-production`: PASS.

This decision changes release certification scope only. It does not claim custom OP/Superflex behavior has been field-validated and does not alter recommendation logic or ESPN acquisition behavior.

## Final disposition

TCW-021 is complete. `FV-ESPN-02` is outside Release 1.0 scope under durable decision TCW-D013. Ordinary FLEX support and the existing normalized/fail-closed slot behavior remain protected.
