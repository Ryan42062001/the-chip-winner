import test from "node:test";
import assert from "node:assert/strict";
import { optimizeLineup } from "../src/domain/lineup-optimizer.js";

function snapshot(players, entries) {
  return { players, rosters: [{ teamId: "mine", entries }] };
}

test("optimizer finds the best combined legal FLEX assignment", () => {
  const result = optimizeLineup(snapshot([
    { id: "rb1", position: "RB", projection: 10 }, { id: "wr1", position: "WR", projection: 9 },
    { id: "rb2", position: "RB", projection: 20 }, { id: "wr2", position: "WR", projection: 19 }
  ], [
    { playerId: "rb1", lineupSlot: "RB" }, { playerId: "wr1", lineupSlot: "FLEX" },
    { playerId: "rb2", lineupSlot: "BE" }, { playerId: "wr2", lineupSlot: "BE" }
  ]), "mine");
  assert.equal(result.status, "optimal");
  assert.equal(result.projectedTotal, 39);
  assert.equal(new Set(result.assignments.map((item) => item.player.id)).size, 2);
});

test("optimizer respects explicit locks", () => {
  const result = optimizeLineup(snapshot([
    { id: "low", position: "RB", projection: 5 }, { id: "high", position: "RB", projection: 20 }
  ], [{ playerId: "low", lineupSlot: "RB", locked: true }, { playerId: "high", lineupSlot: "BE" }]), "mine");
  assert.equal(result.assignments[0].player.id, "low");
  assert.equal(result.gain, 0);
});

test("optimizer labels results when projections are missing", () => {
  const result = optimizeLineup(snapshot([
    { id: "starter", position: "WR", projection: 10 }, { id: "unknown", position: "WR", projection: null }
  ], [{ playerId: "starter", lineupSlot: "WR" }, { playerId: "unknown", lineupSlot: "BE" }]), "mine");
  assert.equal(result.status, "best-known");
  assert.deepEqual(result.missingPlayerIds, ["unknown"]);
});

test("optimizer reports an incomplete lineup when known inputs cannot fill it", () => {
  const result = optimizeLineup(snapshot([{ id: "qb", position: "QB", projection: 20 }], [{ playerId: "qb", lineupSlot: "RB" }]), "mine");
  assert.equal(result.status, "incomplete");
});

