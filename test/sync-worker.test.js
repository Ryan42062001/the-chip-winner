import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/src/index.js";

class MemoryKv {
  constructor() { this.values = new Map(); }
  async get(key, type) { const value = this.values.get(key); return type === "json" && value ? JSON.parse(value) : value || null; }
  async put(key, value) { this.values.set(key, value); }
  async delete(key) { this.values.delete(key); }
}

const origin = "https://ryan42062001.github.io";
const channelId = "abcdefghijklmnopqrstuvwx";
const token = "abcdefghijklmnopqrstuvwxyzABCDEF";
const envelope = { schemaVersion: 1, algorithm: "AES-256-GCM", channelId, iv: "iv", ciphertext: "encrypted", createdAt: "2026-08-27T00:00:00Z" };
const env = () => ({ SYNC_CHANNELS: new MemoryKv(), ALLOWED_ORIGINS: `${origin},http://localhost:4173`, CHANNEL_TTL_SECONDS: "2592000" });
const request = (method, options = {}) => new Request(`https://sync.example/v1/channels/${channelId}`, { method, headers: { Origin: origin, ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}), ...(options.body ? { "Content-Type": "application/json" } : {}) }, body: options.body ? JSON.stringify(options.body) : undefined });

test("worker publishes, reads, updates, and revokes encrypted envelopes", async () => {
  const bindings = env();
  assert.equal((await worker.fetch(request("PUT", { token, body: envelope }), bindings)).status, 201);
  const read = await worker.fetch(request("GET"), bindings);
  assert.equal(read.status, 200);
  assert.deepEqual(await read.json(), envelope);
  assert.equal((await worker.fetch(request("PUT", { token, body: { ...envelope, ciphertext: "new" } }), bindings)).status, 200);
  assert.equal((await worker.fetch(request("DELETE", { token }), bindings)).status, 204);
  assert.equal((await worker.fetch(request("GET"), bindings)).status, 404);
});

test("worker rejects a different writer and malformed envelopes", async () => {
  const bindings = env();
  await worker.fetch(request("PUT", { token, body: envelope }), bindings);
  const otherToken = "12345678901234567890123456789012";
  assert.equal((await worker.fetch(request("PUT", { token: otherToken, body: envelope }), bindings)).status, 403);
  assert.equal((await worker.fetch(request("PUT", { token, body: { ...envelope, channelId: "wrong" } }), bindings)).status, 400);
});

test("worker restricts browser origins and preflight", async () => {
  const bindings = env();
  const denied = new Request(`https://sync.example/v1/channels/${channelId}`, { headers: { Origin: "https://evil.example" } });
  assert.equal((await worker.fetch(denied, bindings)).status, 403);
  assert.equal((await worker.fetch(request("OPTIONS"), bindings)).status, 204);
});

