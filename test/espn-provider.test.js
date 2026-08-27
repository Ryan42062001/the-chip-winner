import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { EspnSnapshotProvider } from "../src/providers/espn/espn-provider.js";

const sample = JSON.parse(await readFile(new URL("../src/data/sample-espn-snapshot.json", import.meta.url), "utf8"));
const memoryStorage = () => {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
};

test("import validates and caches without mutating the input", () => {
  const storage = memoryStorage();
  const provider = new EspnSnapshotProvider({ storage });
  const raw = JSON.stringify(sample);
  const imported = provider.importSnapshot(raw);
  assert.equal(sample.meta.importedAt, undefined);
  assert.ok(imported.meta.importedAt);
  assert.deepEqual(provider.readCache(), imported);
});

test("corrupt cache is discarded", () => {
  const storage = memoryStorage();
  storage.setItem("chip-winner:espn-snapshot:v1", "not-json");
  const provider = new EspnSnapshotProvider({ storage });
  assert.equal(provider.readCache(), null);
});

test("validated live snapshots can be saved directly", () => {
  const storage = memoryStorage();
  const provider = new EspnSnapshotProvider({ storage });
  assert.equal(provider.saveSnapshot(sample), sample);
  assert.deepEqual(provider.readCache(), sample);
});

test("saving a changed snapshot preserves exactly one previous valid snapshot", () => {
  const storage = memoryStorage();
  const provider = new EspnSnapshotProvider({ storage });
  const updated = structuredClone(sample);
  updated.meta.capturedAt = "2026-09-01T13:00:00Z";
  provider.saveSnapshot(sample);
  provider.saveSnapshot(updated);
  assert.deepEqual(provider.readPreviousSnapshot(), sample);
  assert.deepEqual(provider.readCache(), updated);
  provider.saveSnapshot(updated);
  assert.deepEqual(provider.readPreviousSnapshot(), updated);
  provider.clearCache();
  assert.equal(provider.readCache(), null);
  assert.equal(provider.readPreviousSnapshot(), null);
});
