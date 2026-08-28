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
