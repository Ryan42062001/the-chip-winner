# The Chip Winner — Canonical Roadmap

Last reconciled: 2026-09-08
Manager task: TCW-001

## Current milestone

### M1 — Release 1.0 trustworthy read-only companion

Status: ACTIVE — FIELD VALIDATION

The deterministic implementation baseline for the reviewed Release 1.0 scope is substantially complete. The primary remaining milestone work is evidence-backed field validation and final release gating, not broad feature expansion.

### Remaining Release 1.0 blockers

Pending field checks from `config/field-validation.json`:

1. FV-A11Y-02 — screen-reader critical workflow.
2. FV-ESPN-02 — authenticated custom FLEX/OP league.
3. FV-ESPN-04 — authenticated IR edge states.
4. FV-ESPN-05 — authenticated lock/availability transitions.
5. FV-SEASON-01 — real playoff and bye intelligence states.
6. FV-RECOVERY-01 — live ESPN/session/network failure and reconnect.
7. FV-WAIVER-01 — real waiver candidate volume and timing.

### Ongoing seasonal evidence work

- Accumulate real weekly projection publications through the guarded one-click workflow.
- Preserve explicit provider IDs, source provenance, scoring compatibility, and complete-coverage gates.
- Use real authenticated ESPN states to validate already-complete waiver and season behavior.
- Convert reproducible defects into sanitized regression coverage where practical.

## Release 1.0 exit gate

Release 1.0 may be declared only when:

- every field-validation item is passed with privacy-safe evidence;
- no unresolved high-severity accessibility, privacy, security, ESPN-normalization, waiver-legality, or season-planning defect remains;
- the exact final release PR head passes the protected test job;
- after merge, `master` passes test, deploy, and production verification;
- the product remains read-only.

## Post-1.0 roadmap discovery

No successor milestone is automatically authorized by completion of Release 1.0.

After the field gate closes, Manager must perform Roadmap Discovery using current capabilities, open findings, product vision, R&D evidence, Strategy evidence where appropriate, and operational reliability. A valid conclusion is:

`NO SUCCESSOR MILESTONE CURRENTLY JUSTIFIED.`

If a successor is justified, it must be explicitly scoped and approved before implementation begins.

## Gated candidate areas

These are not active requirements:

- trade analysis;
- external injury/news and notifications;
- future-only IR-assisted stash discovery;
- playoff qualification/championship probability modeling;
- server-side model integrations;
- ESPN write actions.

Each requires its own reviewed requirements, evidence, safety boundaries, and acceptance criteria before authorization.

## Immediate dependency order

1. TCW-001 — bootstrap canonical `.ai` workflow and reconcile verified repository state.
2. Complete/coordinate the remaining Release 1.0 field gate.
3. Reproduce and route any field-discovered defects; do not preemptively reopen complete engines.
4. Run final Release 1.0 merge/production gate when all field checks pass.
5. Perform Roadmap Discovery before authorizing a new milestone.
