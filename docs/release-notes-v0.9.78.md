# v0.9.78 — Mobile sync responsiveness

## Field finding

Real mobile-sync validation found that **Refresh mobile data** and **Copy mobile link** could appear to remain busy after a successful action. The shared click handler disabled the button before running but only restored it on error; successful refresh/copy actions left the existing button disabled until the section was rendered again. Sync transport requests also had no explicit timeout, so a stalled network request could leave the control waiting indefinitely.

## Fix

- Restore sync action controls after both success and failure when the control remains mounted.
- Show an explicit temporary action label while refresh/copy/revoke work is in progress.
- Keep create/revoke render transitions safe when the original button is replaced.
- Add an 8-second timeout to mobile-sync HTTP publish/read/delete requests with a clear timeout error instead of an unbounded wait.
- Preserve the existing encrypted payload, ESPN read-only boundary, and private-link security model.

## Validation

- Unit coverage verifies HTTP method/auth behavior and timeout failure.
- Browser smoke covers create, refresh, and copy mobile-link controls and requires refresh/copy buttons to return to an enabled state after success.
- Existing automated accessibility, readiness, extension, performance, security, and model-safety gates remain required.

No ESPN cookies, credentials, or write operations are added by this release.
