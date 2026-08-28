# Security model

The Chip Winner is a static, read-only companion. Its public page does not receive ESPN credentials. The Chrome companion performs authenticated ESPN requests inside the user's existing browser session and returns only normalized league data through the scoped page bridge.

## Trust boundaries

- ESPN cookies remain inside Chrome's ESPN request context.
- Imported snapshots, rankings, projections, identity maps, alert preferences, and connection settings are browser-local.
- Mobile sync encrypts the payload client-side before transport. The decryption key remains in the private URL fragment and is not sent to the sync service.
- Model context exports contain the selected team's normalized fields and validated recommendations, not browser storage or credentials.
- Model adapters are downstream of deterministic evaluation and are advisory only.

## Browser controls

The site Content Security Policy restricts scripts and assets to the application, permits the configured font hosts, and limits network connections to the deployed encrypted-sync service. Objects and form submissions are disabled.

## Recovery and deletion

League Setup provides a complete local-data deletion action. It clears ESPN snapshots and history, external data imports, mappings, alert preferences, saved league settings, and mobile-link credentials. When possible, it revokes the remote encrypted snapshot first; if revocation fails, the interface reports that fact and the encrypted record remains subject to automatic expiry.

## Remaining review work

- Formal Chrome-extension permission audit.
- Dependency and secret scanning in CI.
- Automated CSP/browser smoke coverage.
- Independent accessibility and security review before a broader public release.
