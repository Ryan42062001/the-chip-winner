import test from "node:test";
import assert from "node:assert/strict";
import { ProjectionIdentityMapProvider, parseProjectionIdentityMapCsv } from "../src/providers/projections/projection-identity-map.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key),
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  };
}

test("projection identity map imports explicit provider and ESPN ids", () => {
  const provider = new ProjectionIdentityMapProvider({ storage: memoryStorage() });
  const map = provider.importCsv("provider_player_id,espn_player_id\nsource-1,espn-1");
  assert.equal(map.get("source-1"), "espn-1");
  assert.equal(provider.readCache().get("source-1"), "espn-1");
});

test("projection identity map rejects ambiguous duplicate mappings", () => {
  assert.throws(() => parseProjectionIdentityMapCsv("provider_player_id,espn_player_id\na,1\na,2"), /duplicate provider/);
  assert.throws(() => parseProjectionIdentityMapCsv("provider_player_id,espn_player_id\na,1\nb,1"), /ambiguous duplicate ESPN/);
});

test("projection identity map parses an explicit provider ID supersession chain", () => {
  const entries = parseProjectionIdentityMapCsv([
    "provider_player_id,espn_player_id,supersedes_provider_player_id",
    "old,1,",
    "new,1,old",
    "newer,1,new"
  ].join("\n"));
  assert.deepEqual(entries, [
    { providerPlayerId: "old", espnPlayerId: "1" },
    { providerPlayerId: "new", espnPlayerId: "1", supersedesProviderPlayerId: "old" },
    { providerPlayerId: "newer", espnPlayerId: "1", supersedesProviderPlayerId: "new" }
  ]);
  assert.throws(() => parseProjectionIdentityMapCsv([
    "provider_player_id,espn_player_id,supersedes_provider_player_id",
    "old,1,",
    "new,1,missing"
  ].join("\n")), /ambiguous duplicate ESPN/);
  assert.throws(() => parseProjectionIdentityMapCsv([
    "provider_player_id,espn_player_id,supersedes_provider_player_id",
    "old,1,new",
    "new,1,old"
  ].join("\n")), /ambiguous duplicate ESPN|supersession cycle/);
});

test("projection identity map merges retain prior explicit mappings", () => {
  const provider = new ProjectionIdentityMapProvider({ storage: memoryStorage() });
  provider.importCsv("provider_player_id,espn_player_id\na,1");
  const map = provider.mergeCsv("provider_player_id,espn_player_id\nb,2");
  assert.deepEqual([...map], [["a", "1"], ["b", "2"]]);
});

test("projection identity map merge accepts only an explicit supersession for an occupied ESPN identity", () => {
  const provider = new ProjectionIdentityMapProvider({ storage: memoryStorage() });
  provider.importCsv("provider_player_id,espn_player_id\n26160,4431492");
  const merged = provider.mergeCsv([
    "provider_player_id,espn_player_id,supersedes_provider_player_id",
    "28896,4431492,26160"
  ].join("\n"));
  assert.deepEqual([...merged], [["26160", "4431492"], ["28896", "4431492"]]);
  assert.deepEqual([...provider.readCache()], [["26160", "4431492"], ["28896", "4431492"]]);

  assert.throws(() => provider.mergeCsv([
    "provider_player_id,espn_player_id,supersedes_provider_player_id",
    "30000,4431492,99999"
  ].join("\n")), /conflicts with an existing provider mapping/);
  assert.deepEqual([...provider.readCache()], [["26160", "4431492"], ["28896", "4431492"]]);
});

test("projection identity map can import a current superseding ID without requiring historical cache state", () => {
  const provider = new ProjectionIdentityMapProvider({ storage: memoryStorage() });
  const map = provider.importCsv([
    "provider_player_id,espn_player_id,supersedes_provider_player_id",
    "28896,4431492,26160"
  ].join("\n"));
  assert.deepEqual([...map], [["28896", "4431492"]]);
});

test("projection identity map merge rejects conflicts without changing cache", () => {
  const provider = new ProjectionIdentityMapProvider({ storage: memoryStorage() });
  provider.importCsv("provider_player_id,espn_player_id\na,1");
  assert.throws(() => provider.mergeCsv("provider_player_id,espn_player_id\na,2"), /conflicts/);
  assert.throws(() => provider.mergeCsv("provider_player_id,espn_player_id\nb,1"), /conflicts/);
  assert.deepEqual([...provider.readCache()], [["a", "1"]]);
});
