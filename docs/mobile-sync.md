# Secure mobile synchronization

## Goal

Allow the desktop Chrome companion to refresh ESPN data while a phone reads the latest normalized snapshot. ESPN cookies and FantasyPros source files must never be sent to the sync service.

## Security model

The desktop creates three random values:

- `channelId`: an unguessable lookup identifier;
- `encryptionKey`: a 256-bit AES-GCM key shared with the phone through the URL fragment;
- `writeToken`: a separate capability retained by the desktop for publishing and deletion.

The browser encrypts `{ snapshot, rankingSet }` before transport. The service stores only the channel ID, encrypted envelope, expiry, and a one-way hash of the write token. The encryption key is placed after `#mobile-sync=` in the mobile link, so browsers do not send it in HTTP requests. The phone decrypts locally.

This design protects content from an honest-but-curious storage service. Anyone possessing the mobile link can read the synced league data, so the interface must treat that link like a password. Revocation deletes the channel and creates new credentials.

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

- `src/sync/crypto.js`: credentials, AES-GCM envelopes, and mobile fragment parsing.
- `src/sync/sync-provider.js`: provider interface and HTTP implementation.
- `src/sync/sync-session.js`: validates ESPN state before publishing and after decrypting.

## Remaining deployment decision

The static GitHub Pages site cannot implement these endpoints. A small serverless service is required. Cloudflare Workers + KV/D1 or Supabase Edge Functions are suitable options, but provisioning either requires an account, service configuration, and an explicit choice about operational ownership.

No production mobile link should be generated until the service has rate limiting, expiry, deletion, CORS restricted to The Chip Winner origins, and log redaction.

## Cloudflare implementation

`worker/src/index.js` implements the service contract using Workers KV. `worker/wrangler.toml` restricts browser origins to the public GitHub Pages site and the local development server, sets a 30-day maximum channel lifetime, and contains a placeholder for the KV namespace ID. The Worker validates envelope structure but cannot decrypt its contents.

Before deployment:

1. create or connect a Cloudflare account on the Workers Free plan;
2. create a KV namespace and replace `REPLACE_AFTER_KV_CREATION`;
3. deploy the Worker and record its `workers.dev` URL;
4. add that URL to the website configuration;
5. configure Cloudflare rate limiting and verify logs do not include bodies, authorization headers, or full channel IDs;
6. run publish/read/revoke tests against the deployed endpoint.
