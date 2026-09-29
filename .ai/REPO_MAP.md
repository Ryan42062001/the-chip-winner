# Repository Map

- `.ai/`: minimal Speed Workflow V2.1 project context and active/most-recent phase contract.
- `.github/workflows/phase-ci.yml`: non-duplicative FAST CI and deliberate exact-head FULL PHASE CI.
- `.github/workflows/deploy-pages.yml`: explicit manual production deployment of canonical `master`.
- `.github/scripts/validate_phase_workflow.py`: state-aware V2.1 contract validator.
- `src/`: application, domain models, ESPN/projection/ranking providers, and UI.
- `extensions/espn-companion/`: read-only Chrome bridge for private ESPN leagues.
- `worker/`: encrypted mobile-sync transport.
- `schema/`: machine-readable external contracts.
- `scripts/`: active product, model, smoke, security, accessibility, performance, field-validation, and deployment verification tools.
- `test/`: active product/domain/browser/integration regression tests.
- `docs/roadmap.md`: canonical product roadmap.
- `docs/WORKFLOW.md`: canonical Speed Workflow V2.1 operating model.
- `docs/workflow/PHASE_TEMPLATE.md`: reusable active/CLOSED phase contract.
- `docs/history/workflow-v3-v4/`: preserved retired V3/V4 roles, task registry, audits, governance scripts/tests, and evidence.
- `docs/security.md`: security/trust-boundary reference.
- `docs/deployment.md`: deployment/rollback reference; workflow triggers are governed by current GitHub Actions.
