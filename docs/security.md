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

## Automated release controls

- The companion manifest and source pass a least-privilege audit for fixed site origins, fixed ESPN read hosts, fixed message types, fixed ESPN views, and absence of mutation verbs or sensitive Chrome APIs.
- The extension declares no general Chrome permissions; its unused `storage` permission was removed in version 0.2.1.
- The deployment workflow fails on high/critical npm advisories and runs tracked-file secret scanning, CSP/static smoke checks, real-browser smoke checks, and automated WCAG checks.
- Dependabot checks npm and GitHub Actions dependencies weekly; updates still require the complete release gate before deployment.

## Remaining review work

- Independent manual security and assistive-technology review before a broader public release.
- Chrome Web Store packaging and distribution review if the companion moves beyond local unpacked installation.

The tracked-file secret scan rejects ESPN session cookies, private keys, OpenAI-style API keys, and embedded mobile write tokens.
