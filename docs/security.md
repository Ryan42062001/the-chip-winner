# Security model

The Chip Winner is a static, read-only companion. Its public page does not receive ESPN credentials. The Chrome companion performs authenticated ESPN requests inside the user's existing browser session and returns only normalized league data through the scoped page bridge.

## Trust boundaries

- ESPN cookies remain inside Chrome's ESPN request context.
- Imported snapshots, rankings, projections, identity maps, alert preferences, and connection settings are browser-local.
- Mobile sync encrypts the payload client-side before transport. The decryption key remains in the private URL fragment and is not sent to the sync service.
- Model context exports contain the selected team's normalized fields and validated recommendations, not browser storage or credentials.
- Model adapters are downstream of deterministic evaluation and are advisory only.

## Browser controls

The site Content Security Policy restricts scripts and assets to the application, permits the configured font hosts, and limits network connections to the deployed encrypted-sync service plus the reviewed public projection-source hosts. Objects and form submissions are disabled.

The ESPN companion is deliberately narrower than the page:

- Manifest V3 with no general Chrome permissions;
- host access limited to the reviewed ESPN read endpoints;
- the content bridge runs only on the deployed Chip Winner origin and the reviewed localhost development origin;
- same-window and same-origin page messages are required;
- companion v0.2.2 also rejects runtime messages that were not sent by the extension itself;
- the message operation set and ESPN league-view set are fixed allowlists;
- league and season path inputs are digit-only before URL construction;
- ESPN authentication uses the existing browser request context, while cookie APIs, extension persistence, runtime logging, and dynamic code execution remain outside the companion boundary;
- the companion contains no ESPN mutation methods.

## Recovery and deletion

League Setup provides a complete local-data deletion action. It clears ESPN snapshots and history, external data imports, mappings, alert preferences, saved league settings, weekly projection-update state, and mobile-link credentials. When possible, it revokes the remote encrypted snapshot first; if revocation fails, the interface reports that fact and the encrypted record remains subject to automatic expiry.

Mobile-sync deletion uses authenticated `DELETE`. A remote 404 is treated as already absent; other authorization or service failures are surfaced. Write tokens are sent in the Authorization header, not in channel URLs.

## Automated release controls

- The companion manifest and source pass a least-privilege threat audit for exact site origins, exact ESPN read hosts, same-origin/same-extension messaging, fixed message types, fixed ESPN views, digit-only URL inputs, and absence of mutation verbs, cookie APIs, persistent browser storage, runtime logging, or dynamic code.
- The extension declares no general Chrome permissions; companion v0.2.2 is the minimum supported version after the same-extension sender hardening.
- The deployment workflow fails on high/critical npm advisories and runs tracked-file secret scanning, CSP/static smoke checks, real-browser smoke checks, automated WCAG checks, responsive/reflow checks, extension threat audit, and performance audit.
- The production-readiness reflow gate covers every primary section at 720 CSS pixels (a deterministic 1440px-at-200%-zoom equivalent) and at a 390px phone width.
- Lifecycle tests prove invalid refresh replacement cannot overwrite a valid ESPN cache, corrupt caches fail closed, local connection/data deletion clears the intended stores, and mobile-sync revoke failures are not reported as success.
- Dependabot checks npm and GitHub Actions dependencies weekly; updates still require the complete release gate before deployment.

See `docs/production-readiness.md` for the full automated-versus-field validation boundary.

## Remaining review work

- Independent manual security and assistive-technology review before a broader public release.
- Real authenticated field observation across materially different ESPN league states and live failure/recovery flows.
- Chrome Web Store packaging and distribution review if the companion moves beyond local unpacked installation.

The tracked-file secret scan rejects ESPN session cookies, private keys, OpenAI-style API keys, and embedded mobile write tokens.
