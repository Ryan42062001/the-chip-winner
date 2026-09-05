# v0.9.72 — Roadmap + Field Validation

v0.9.72 does not add another recommendation engine. It converts the remaining Release 1.0 real-world validation work into an explicit, evidence-backed process and aligns every roadmap/handoff document with the actual v0.9.71 production-readiness baseline.

## What changed

- Added `config/field-validation.json` with 13 explicit Release 1.0 checks across accessibility, physical mobile use, authenticated ESPN states, season/playoff behavior, live recovery, deployed sync revocation, and real waiver scale.
- Added `npm run field:status` and a strict `--require-complete` mode for the eventual Release 1.0 gate.
- Added permanent regression coverage for the field-validation registry contract.
- Defined privacy-safe evidence rules and a finite Release 1.0 exit rule in `docs/field-validation.md`.
- Updated `docs/production-readiness.md` to distinguish v0.9.71 automated guarantees from v0.9.72 real-world field validation.
- Updated the main and advanced roadmaps, `AGENTS.md`, and `docs/next-codex-task.md` so completed Waiver Engine v2, Season/Playoff Intelligence, and automated production-readiness work are no longer described as unfinished.
- Bumped the application/cache markers to v0.9.72.

## Release 1.0 rule

A field item may be `pending`, `passed`, `blocked`, or `failed`. `passed` and `failed` require evidence; `blocked` remains incomplete. Release 1.0 requires every registered item to pass with privacy-safe evidence, no unresolved high-severity field defect, a green exact-head protected PR gate, and successful post-merge `master` test/deploy/production verification.

The product remains read-only. Trade analysis, notifications, playoff probability, future-only IR-assisted stash discovery, server-side models, and ESPN write actions remain separately gated.
