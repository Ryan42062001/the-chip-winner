# TCW-PW-001 — Release 1.0 Evidence Wave

Status: AUTHORIZED AFTER TCW-001 CLOSEOUT MERGES
Manager: Manager / Architect
Dependency classification: INDEPENDENT assignments within wave

## Objective

Advance the active Release 1.0 field-validation milestone without reopening completed product behavior by running two independent evidence-focused assignments in parallel.

## Assignments

- TCW-002 — Independent Release 1.0 baseline audit — Auditor / QA
- TCW-003 — ESPN field-validation feasibility research — R&D

## Parallelism rationale

TCW-002 independently audits repository/canonical state and release-gate claims. TCW-003 researches current ESPN behavior and practical evidence-safe validation opportunities for pending ESPN-heavy field checks. Neither assignment changes production code, neither depends on the other's result to begin, and both can inform Manager's next routing decision.

## Non-goals

- No production implementation.
- No field check may be marked passed without the evidence required by `docs/field-validation.md` and `config/field-validation.json`.
- No completed recommendation engine or season-planning scope is reopened absent reproduced evidence.
- No ESPN write behavior.

## Wave completion

The wave closes when both specialist handoffs exist and Manager has evaluated their findings, reconciled canonical state as needed, and routed any justified next work.
