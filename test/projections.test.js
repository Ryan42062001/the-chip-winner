import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyProjectionSet, ProjectionProvider } from "../src/providers/projections/projection-provider.js";

const sample = JSON.parse(await readFile(new URL("../src/data/sample-espn-snapshot.json", import.meta.url), "utf8"));

test("projection sets overlay values without mutating ESPN league state", () => {
  const result = applyProjectionSet(sample, { source: "future-provider", updatedAt: "2026-10-09T00:00:00Z", players: [{ playerId: "p1", projection: 25 }, { playerId: "unknown", projection: 10 }] });
  assert.equal(result.snapshot.players[0].projection, 25);
  assert.equal(sample.players[0].projection, 23.4);
  assert.deepEqual(result.unresolved, ["unknown"]);
  assert.equal(result.snapshot.meta.projectionsSource, "future-provider");
  assert.equal(result.snapshot.league, sample.league);
});

test("projection sets reject invalid numeric values", () => {
  assert.throws(() => applyProjectionSet(sample, { source: "bad", players: [{ playerId: "p1", projection: -1 }] }), /Invalid projection/);
});

test("base projection provider fails explicitly when not implemented", async () => {
  const provider = new ProjectionProvider("test");
  await assert.rejects(() => provider.getProjections(), /does not implement/);
});
