# v0.9.79 — Mobile sync team selection

## Field finding

A deployed v0.9.78 encrypted mobile-sync retest loaded the correct ESPN league on the phone but opened a different fantasy team than the one selected on the desktop.

The snapshot itself was correct. The defect was in app context: mobile sync encrypted the league snapshot and rankings but did not carry the desktop `selectedTeamId`. The application reducer intentionally initializes a newly loaded snapshot to its first team, and the normal desktop ESPN flow then re-selects the locally configured team. The mobile-sync load path had no equivalent team context, so it remained on the first team.

## Fix

v0.9.79:

- carries `selectedTeamId` inside the existing AES-256-GCM encrypted sync payload;
- validates that a supplied selected team exists in the exact synced ESPN snapshot before publish and after decrypt;
- restores that selected team immediately after the phone loads the synced snapshot;
- keeps the selected team out of the plaintext mobile URL and out of the Cloudflare-readable envelope metadata;
- continues to accept older encrypted payloads that do not contain selected-team context;
- allows an existing v0.9.78 channel to gain the correct team context on the next **Refresh mobile data** publish.

No ESPN write capability, league normalization, player identity, projection, ranking, waiver, IR, or recommendation semantics changed.

## Regression coverage

Permanent tests now cover:

- encrypted selected-team round-trip;
- invalid selected-team publish rejection;
- invalid selected-team read rejection;
- backward-compatible reads of older payloads without `selectedTeamId`;
- the mobile renderer restoring the exact desktop-selected team instead of leaving the first league team selected.

## Field gate

`FV-SYNC-01` remains pending until the deployed release is retested end to end. After deployment, refresh the existing mobile channel from the intended desktop team, copy/open the link on the phone, confirm the same team is selected, then revoke the link and confirm the revoked link no longer loads.
