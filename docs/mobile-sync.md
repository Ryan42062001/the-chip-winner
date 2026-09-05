# Secure mobile synchronization

## Goal

Allow the desktop Chrome companion to refresh ESPN data while a phone reads the latest normalized snapshot. ESPN cookies and FantasyPros source files must never be sent to the sync service.

## Security model

The desktop creates three random values:

- `channelId`: an unguessable lookup identifier;
- `encryptionKey`: a 256-bit AES-GCM key shared with the phone through the URL fragment;
- `writeToken`: a separate capability retained by the desktop for publishing and deletion.

The browser encrypts `{ snapshot, previousSnapshot, rankingSet, selectedTeamId }` before transport. `selectedTeamId` is UI context only: it tells the phone which ESPN team was selected on the desktop and must match a team already present in the validated snapshot. `previousSnapshot` is optional and is included only when it is a valid capture from the same ESPN league and season; it lets the phone render the same source-derived **What Changed** comparison without inventing history. The service stores only the channel ID, encrypted envelope, expiry, and a one-way hash of the write token.

The encryption key is placed after `#mobile-sync=` in the mobile link, so browsers do not send it in HTTP requests. The phone decrypts locally and restores the encrypted selected-team context after validating it against the synced snapshot. Internal navigation on the synced viewer keeps this private fragment intact; changing sections must never replace it with a normal `#overview`, `#waivers`, or similar route because a later reload would otherwise lose the read credentials.

This design protects content from an honest-but-curious storage service. Anyone possessing the mobile link can read the synced league data, so the interface must treat that link like a password. Revocation deletes the channel. Only the desktop that owns the separate write token can refresh or revoke the channel.

## Mobile viewer scope

The synced phone is intentionally a read-only viewer. It receives:

- the current normalized ESPN snapshot;
- the matching previous ESPN capture when one is available;
- the compatible ROS ranking set, when imported on desktop;
- the desktop-selected fantasy team.

Desktop-only connection controls and source-import tools remain on the desktop. Future-projection catalogs, projection identity-map files, and their import controls are not silently copied to the phone; surfaces that require those optional local inputs must continue to report missing coverage honestly rather than fabricate values. League Setup on a synced phone therefore shows status/provenance instead of offering another ESPN connection or nested mobile-sync channel.

## HTTP contract

Base path: `/v1/channels`

### Publish

`PUT /v1/channels/{channelId}`

- Header: `Authorization: Bearer {writeToken}`
- Body: encrypted envelope only
- Enforce a small maximum body size.
- On first write, store a password hash of the write token.
- On later writes, require the same token.
- Refresh a short expiry, initially 30 days.

### Read

`GET /v1/channels/{channelId}`

- Return the encrypted envelope or `404`.
- Apply rate limits.
- Never log response bodies or full channel identifiers.

### Revoke

`DELETE /v1/channels/{channelId}`

- Require the write token.
- Delete the envelope and token hash.

## Client implementation

- `src/sync/crypto.js`: credentials, AES-GCM envelopes, strict mobile-fragment parsing, and malformed-link rejection.
- `src/sync/sync-provider.js`: provider interface and bounded HTTP implementation.
- `src/sync/sync-session.js`: validates current/prior ESPN state and selected-team context before publishing and after decrypting.
- `src/ui/section-renderer.js`: restores the encrypted desktop-selected team and prior capture, preserves the private fragment during navigation, and presents a read-only sync-specific League Setup surface.
- `scripts/audit-mobile.js`: deployment-blocking browser audit for synced-phone routing, reload safety, responsive layouts, all seven primary sections, player detail, selected-team restoration, prior-state change detection, and revoked/malformed links.

## Production deployment

The sync service is deployed at `https://the-chip-winner-sync.yc6syr6bkd.workers.dev`. The GitHub Pages app encrypts league data and selected-team context before upload; Cloudflare receives only an opaque encrypted envelope. The decryption key remains in the private mobile URL fragment and is not transmitted in HTTP requests.

## Cloudflare implementation

`worker/src/index.js` implements the service contract using Workers KV. `worker/wrangler.toml` restricts browser origins to the public GitHub Pages site and the local development server and sets a 30-day maximum channel lifetime. The Worker validates envelope structure but cannot decrypt its contents.

Deployment checklist:

1. Cloudflare Worker and KV namespace are provisioned on the Workers Free plan.
2. The production `workers.dev` URL is configured in the website.
3. CORS is limited to The Chip Winner and the local development origin.
4. Channel bodies are capped at 2 MB and expire after 30 days.
5. Publish/read/decrypt/revoke has been verified against the deployed endpoint.
6. The deployment-blocking mobile browser audit passes at small portrait, representative portrait, and phone-landscape dimensions.

Cloudflare account-level rate limiting remains an optional hardening step before a wider public launch. The unguessable 144-bit channel identifier, write-token authentication, body limit, and expiry are enforced in the Worker.
