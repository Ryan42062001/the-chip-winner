import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { EspnSnapshotProvider } from "../src/providers/espn/espn-provider.js";
import { EspnConnectionPreferences, ESPN_CONNECTION_CACHE_KEY, ESPN_CONNECTION_PROFILES_KEY } from "../src/providers/espn/connection-preferences.js";
import { LocalDataManager } from "../src/application/local-data-manager.js";
import { HttpSyncProvider } from "../src/sync/sync-provider.js";

const sample = JSON.parse(await readFile(new URL("../src/data/sample-espn-snapshot.json", import.meta.url), "utf8"));

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    has: (key) => values.has(key),
    entries: () => [...values.entries()],
  };
}

test("failed replacement snapshot validation preserves the last valid ESPN cache", () => {
  const storage = memoryStorage();
  const provider = new EspnSnapshotProvider({ storage });
  provider.saveSnapshot(sample);
  const invalid = structuredClone(sample);
  invalid.league.id = "";
  assert.throws(() => provider.saveSnapshot(invalid), /Snapshot validation failed/);
  assert.deepEqual(provider.readCache(), sample);
  assert.equal(provider.readPreviousSnapshot(), null);
});

test("corrupt current ESPN cache is discarded without destroying the previous valid snapshot", () => {
  const previous = structuredClone(sample);
  previous.meta.capturedAt = "2026-09-04T12:00:00.000Z";
  const storage = memoryStorage({
    "chip-winner:espn-snapshot:v1": "{broken-json",
    "chip-winner:espn-snapshot:previous:v1": JSON.stringify(previous),
  });
  const provider = new EspnSnapshotProvider({ storage });
  assert.equal(provider.readCache(), null);
  assert.deepEqual(provider.readPreviousSnapshot(), previous);
  assert.equal(storage.has("chip-winner:espn-snapshot:v1"), false);
});

test("provider load recovers from corrupt cache with a validated sample fallback", async () => {
  const storage = memoryStorage({ "chip-winner:espn-snapshot:v1": "not-json" });
  const sampleUrl = `data:application/json,${encodeURIComponent(JSON.stringify(sample))}`;
  const provider = new EspnSnapshotProvider({ storage, sampleUrl });
  const loaded = await provider.load();
  assert.equal(loaded.source, "sample");
  assert.deepEqual(loaded.snapshot, sample);
  assert.equal(storage.has("chip-winner:espn-snapshot:v1"), false);
});

test("clearing saved ESPN connections removes both active and profile records", () => {
  const storage = memoryStorage();
  const preferences = new EspnConnectionPreferences({ storage });
  preferences.save({ leagueId: "123", seasonId: "2026", teamId: "2" });
  preferences.save({ leagueId: "456", seasonId: "2026", teamId: "3" });
  assert.ok(storage.has(ESPN_CONNECTION_CACHE_KEY));
  assert.ok(storage.has(ESPN_CONNECTION_PROFILES_KEY));
  preferences.clear();
  assert.equal(storage.has(ESPN_CONNECTION_CACHE_KEY), false);
  assert.equal(storage.has(ESPN_CONNECTION_PROFILES_KEY), false);
  assert.deepEqual(preferences.list(), []);
});

test("local data manager clears every provider plus lifecycle-only browser keys", () => {
  const storage = memoryStorage({
    "chip-winner:weekly-projection-updates:v1": "updates",
    "the-chip-winner:sync-credentials:v1": "credentials",
  });
  const calls = [];
  const manager = new LocalDataManager({
    storage,
    providers: [
      { clearCache: () => calls.push("espn") },
      { clearCache: () => calls.push("rankings") },
      { clearCache: () => calls.push("planning") },
    ],
    extraKeys: ["the-chip-winner:sync-credentials:v1"],
  });
  manager.clearAll();
  assert.deepEqual(calls, ["espn", "rankings", "planning"]);
  assert.equal(storage.has("chip-winner:weekly-projection-updates:v1"), false);
  assert.equal(storage.has("the-chip-winner:sync-credentials:v1"), false);
});

test("mobile sync revocation sends DELETE with the write token and accepts an absent channel", async () => {
  const requests = [];
  const provider = new HttpSyncProvider({
    baseUrl: "https://sync.example.test",
    fetchImpl: async (url, options = {}) => {
      requests.push({ url, options });
      return new Response(null, { status: 404 });
    },
  });
  await provider.remove("channel_123", "write_token_123");
  assert.equal(requests.length, 1);
  assert.equal(requests[0].options.method, "DELETE");
  assert.equal(requests[0].options.headers.Authorization, "Bearer write_token_123");
  assert.match(requests[0].url, /\/v1\/channels\/channel_123$/);
});

test("mobile sync revocation surfaces authorization or service failures instead of claiming success", async () => {
  const provider = new HttpSyncProvider({
    baseUrl: "https://sync.example.test",
    fetchImpl: async () => new Response(null, { status: 403 }),
  });
  await assert.rejects(() => provider.remove("channel_123", "wrong_token"), /Sync removal failed \(403\)/);
});

test("mobile sync transport never places the write token in the channel URL", async () => {
  let request;
  const provider = new HttpSyncProvider({
    baseUrl: "https://sync.example.test",
    fetchImpl: async (url, options = {}) => {
      request = { url, options };
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    },
  });
  await provider.publish({ channelId: "channel_123", schemaVersion: 1, algorithm: "AES-256-GCM", iv: "iv", ciphertext: "cipher" }, "secret_write_token");
  assert.equal(request.url.includes("secret_write_token"), false);
  assert.equal(request.options.headers.Authorization, "Bearer secret_write_token");
});
