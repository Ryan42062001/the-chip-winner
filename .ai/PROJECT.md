# The Chip Winner — Project Context

The Chip Winner is a read-only in-season fantasy football decision companion centered on normalized ESPN league state, source-separated projections/rankings, and deterministic recommendation logic.

Current product baseline:
- Release 1.0 read-only foundation is substantially implemented and remains in field validation.
- ESPN source facts remain authoritative for league state.
- External rankings/projections remain overlays and never silently overwrite ESPN facts.
- The Chrome companion is read-only; no ESPN lineup or transaction write path is authorized.
- The deployed GitHub Pages site remains the production surface.
- Production deployment is now a separate explicit manual action under Speed Workflow V2.1.

Current development direction:
- Speed Workflow V2.1 is the canonical workflow.
- Historical Workflow V3/V4 manager/builder/auditor/control-plane material is preserved under `docs/history/workflow-v3-v4/` and is not active governance.
- Historical Trade Winner source work remains preserved in PR #147 at `22838ac515152db32789e97850f25e1e4576cb82`; it is input evidence, not the branch to merge directly.
- The next coherent product phase is TCW-P01 — Trade Winner Engine Stabilization & Integration.

Canonical product planning remains in `docs/roadmap.md`.
