# v0.9.81 — Automatic mobile sync refresh

## Why this release exists

The encrypted mobile viewer was reliable in v0.9.80, but keeping it current still required two manual actions on the desktop: refresh ESPN, then refresh mobile data. The phone also needed a page reload to discover a newer encrypted snapshot.

v0.9.81 removes those routine sync steps without moving ESPN authentication or mobile write authority onto the phone.

## Desktop auto-publish

Once a private mobile link exists, relevant desktop state changes automatically republish the encrypted channel. The publisher reacts to successful cached ESPN loads, ROS ranking changes, and selected-team changes, then coalesces a burst of related state updates into a single publish using the final current state.

The automatic publisher only runs for desktop `cache` state and only when the locally stored credentials include the write token. Synced phone state, sample state, and read-only credentials cannot publish.

The existing manual publish action remains available in League Setup as **Publish mobile data now** for troubleshooting or an explicit retry.

## Phone update checks

The phone still never connects to ESPN. It reads only the encrypted sync channel using the channel ID and AES decryption key contained in the private URL fragment; the desktop write token remains absent.

After the private link loads, the phone checks for a newer encrypted publish when the page returns to the foreground or regains focus. Duplicate foreground checks are throttled. If the channel's encrypted envelope has a newer publish timestamp, the app reloads the same private URL so the normal validated sync-loading path hydrates the new snapshot, prior snapshot, selected team, and rankings together.

League Setup on the synced phone also provides a read-only **Check for updates** button for an immediate check. If the channel is already current, the app says so without reloading.

## Failure behavior

- A revoked or expired channel discovered by an already-open phone reloads into the existing fail-closed revoked-link state rather than continuing to present stale league data.
- A temporary network or sync-service error leaves the last successfully loaded encrypted snapshot visible and reports that the update check failed.
- Malformed links continue to fail closed.
- The phone still has no ESPN credentials and no sync write token.

## Scope boundary

This release improves delivery of the same encrypted mobile payload. It does not add direct ESPN access on the phone, background ESPN polling, ESPN write capability, or a server-side ESPN session. A new ESPN snapshot still originates from a desktop **Refresh ESPN** action; after that successful refresh, publishing to an active mobile channel is automatic.

No recommendation thresholds, waiver legality rules, IR policy, projection identity rules, or player identity rules changed in this release.
