import test from "node:test";
import assert from "node:assert/strict";
import { ProjectionIdentityMapProvider, parseProjectionIdentityMapCsv } from "../src/providers/projections/projection-identity-map.js";

test("projection identity map imports explicit provider and ESPN ids", () => {
  const values = new Map(); const storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
  const provider = new ProjectionIdentityMapProvider({ storage });
  const map = provider.importCsv("provider_player_id,espn_player_id\nsource-1,espn-1");
  assert.equal(map.get("source-1"), "espn-1");
  assert.equal(provider.readCache().get("source-1"), "espn-1");
});

test("projection identity map rejects ambiguous duplicate mappings", () => {
  assert.throws(() => parseProjectionIdentityMapCsv("provider_player_id,espn_player_id\na,1\na,2"), /duplicate provider/);
  assert.throws(() => parseProjectionIdentityMapCsv("provider_player_id,espn_player_id\na,1\nb,1"), /duplicate ESPN/);
});

test("projection identity map merges retain prior explicit mappings", () => {
  const values = new Map(); const storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
  const provider = new ProjectionIdentityMapProvider({ storage }); provider.importCsv("provider_player_id,espn_player_id\na,1");
  const map = provider.mergeCsv("provider_player_id,espn_player_id\nb,2");
  assert.deepEqual([...map], [["a", "1"], ["b", "2"]]);
});

test("projection identity map merge rejects conflicts without changing cache", () => {
  const values = new Map(); const storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
  const provider = new ProjectionIdentityMapProvider({ storage }); provider.importCsv("provider_player_id,espn_player_id\na,1");
  assert.throws(() => provider.mergeCsv("provider_player_id,espn_player_id\na,2"), /conflicts/);
  assert.deepEqual([...provider.readCache()], [["a", "1"]]);
});
