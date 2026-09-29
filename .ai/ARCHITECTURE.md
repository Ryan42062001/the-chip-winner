# Architecture

The Chip Winner is a browser-first static application deployed to GitHub Pages.

Current boundaries:
- `src/providers/espn/` acquires and normalizes ESPN league state.
- `extensions/espn-companion/` is a least-privilege read-only bridge for private ESPN leagues.
- Projection/ranking providers remain source-separated from ESPN state.
- Domain modules derive lineup, waiver, season-plan, and trade recommendations without mutating source snapshots.
- Browser-local storage holds league/profile/projection state; optional mobile sync transports only encrypted envelopes.
- Stable provider/player IDs are preferred; ambiguous identity mapping fails visibly.
- Missing coverage, malformed inputs, unsupported league states, and uncertain legality must fail closed rather than fabricate confidence.

Workflow/release boundaries:
- Speed Workflow V2.1 is repository governance.
- Product phase merge does not itself authorize production deployment.
- GitHub Pages deployment is manual and validates canonical `master` before publish.
- ESPN write actions remain out of scope unless a later explicit high-risk phase authorizes them.
