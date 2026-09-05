import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createMobileSyncFragment, createSyncCredentials, decryptSyncPayload, encryptSyncPayload, parseMobileSyncFragment } from "../src/sync/crypto.js";
import { HttpSyncProvider, SyncProvider } from "../src/sync/sync-provider.js";
import { publishSyncState, readSyncState } from "../src/sync/sync-session.js";

const sample = JSON.parse(await readFile(new URL("../src/data/sample-espn-snapshot.json", import.meta.url), "utf8"));

test("sync payload round-trips with the client-held encryption key", async () => {
  const credentials = await createSyncCredentials();
  const envelope = await encryptSyncPayload({ snapshot: sample }, credentials, "2026-08-27T12:00:00Z");
  assert.equal(envelope.ciphertext.includes(sample.league.name), false);
  const decoded = await decryptSyncPayload(envelope, credentials);
  assert.equal(decoded.payload.snapshot.league.name, sample.league.name);
});

test("sync encryption rejects tampering and the wrong key", async () => {
  const first = await createSyncCredentials();
  const second = await createSyncCredentials();
  const envelope = await encryptSyncPayload({ snapshot: sample }, first);
  await assert.rejects(() => decryptSyncPayload(envelope, { ...second, channelId: first.channelId }), /could not be decrypted/);
  const alteredCiphertext = `${envelope.ciphertext[0] === "A" ? "B" : "A"}${envelope.ciphertext.slice(1)}`;
  await assert.rejects(() => decryptSyncPayload({ ...envelope, ciphertext: alteredCiphertext }, first), /could not be decrypted/);
});

test("mobile fragment contains read credentials but not the write token", async () => {
  const credentials = await createSyncCredentials();
  const fragment = createMobileSyncFragment(credentials);
  assert.equal(fragment.includes(credentials.writeToken), false);
  assert.deepEqual(parseMobileSyncFragment(fragment), { channelId: credentials.channelId, encryptionKey: credentials.encryptionKey });
});

test("sync session publishes only an encrypted envelope", async () => {
  const credentials = await createSyncCredentials();
  let stored = null;
  const provider = { publish: async (envelope, token) => { stored = envelope; assert.equal(token, credentials.writeToken); }, read: async () => stored };
  await publishSyncState(provider, credentials, sample, { source: "fantasypros", rankings: [] });
  assert.equal(JSON.stringify(stored).includes(sample.league.name), false);
  const decoded = await readSyncState(provider, credentials);
  assert.equal(decoded.payload.snapshot.league.id, sample.league.id);
});

test("provider contracts fail explicitly and HTTP transport uses scoped methods", async () => {
  await assert.rejects(() => new SyncProvider().publish(), /does not implement/);
  const calls = [];
  const fetchImpl = async (url, options = {}) => { calls.push({ url, options }); return { ok: true, status: 200, json: async () => ({ ok: true }) }; };
  const provider = new HttpSyncProvider({ baseUrl: "https://sync.example/", fetchImpl });
  await provider.publish({ channelId: "channel" }, "writer");
  await provider.read("channel");
  await provider.remove("channel", "writer");
  assert.deepEqual(calls.map((call) => call.options.method || "GET"), ["PUT", "GET", "DELETE"]);
  assert.equal(calls[0].options.headers.Authorization, "Bearer writer");
  assert.equal(calls.every((call) => call.options.signal instanceof AbortSignal), true);
});

test("HTTP sync transport bounds stalled requests", async () => {
  const fetchImpl = async (_url, options = {}) => new Promise((resolve, reject) => {
    options.signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
  });
  const provider = new HttpSyncProvider({ baseUrl: "https://sync.example", fetchImpl, timeoutMs: 20 });
  await assert.rejects(() => provider.read("stalled-channel"), /Sync service timed out after 1 seconds\./);
  assert.throws(() => new HttpSyncProvider({ baseUrl: "https://sync.example", timeoutMs: 0 }), /positive number/);
});
