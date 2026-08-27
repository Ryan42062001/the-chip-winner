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
  assert.match(result.locks[0].reason, /ESPN reported/);
});

test("optimizer locks starters after an explicit ISO kickoff time", () => {
  const result = optimizeLineup(snapshot([
    { id: "started", position: "RB", projection: 5, gameTime: "2026-09-01T17:00:00Z" },
    { id: "bench", position: "RB", projection: 20, gameTime: "2026-09-02T17:00:00Z" }
  ], [{ playerId: "started", lineupSlot: "RB" }, { playerId: "bench", lineupSlot: "BE" }]), "mine", Date.parse("2026-09-01T18:00:00Z"));
  assert.equal(result.assignments[0].player.id, "started");
  assert.match(result.locks[0].reason, /kickoff time has passed/);
});

test("optimizer does not infer a lock from an unparseable display time", () => {
  const result = optimizeLineup(snapshot([
    { id: "starter", position: "RB", projection: 5, gameTime: "Sun 1:00 PM" },
    { id: "bench", position: "RB", projection: 20, gameTime: "Sun 4:00 PM" }
  ], [{ playerId: "starter", lineupSlot: "RB" }, { playerId: "bench", lineupSlot: "BE" }]), "mine", Date.parse("2026-09-01T18:00:00Z"));
  assert.equal(result.assignments[0].player.id, "bench");
  assert.equal(result.locks.length, 0);
});

test("optimizer cannot promote a bench player after that player's kickoff", () => {
  const result = optimizeLineup(snapshot([
    { id: "starter", position: "RB", projection: 5, gameTime: "2026-09-02T17:00:00Z" },
    { id: "started-bench", position: "RB", projection: 20, gameTime: "2026-09-01T17:00:00Z" }
  ], [{ playerId: "starter", lineupSlot: "RB" }, { playerId: "started-bench", lineupSlot: "BE" }]), "mine", Date.parse("2026-09-01T18:00:00Z"));
  assert.equal(result.assignments[0].player.id, "starter");
  assert.equal(result.locks[0].slot, "BE");
});

test("optimizer labels results when projections are missing", () => {
  const result = optimizeLineup(snapshot([
    { id: "starter", position: "WR", projection: 10 }, { id: "unknown", position: "WR", projection: null }
  ], [{ playerId: "starter", lineupSlot: "WR" }, { playerId: "unknown", lineupSlot: "BE" }]), "mine");
  assert.equal(result.status, "best-known");
  assert.deepEqual(result.missingPlayerIds, ["unknown"]);
});

test("optimizer reports but does not recommend marginal churn", () => {
  const result = optimizeLineup(snapshot([
    { id: "starter", position: "WR", projection: 10 }, { id: "bench", position: "WR", projection: 10.2 }
  ], [{ playerId: "starter", lineupSlot: "WR" }, { playerId: "bench", lineupSlot: "BE" }]), "mine");
  assert.equal(result.gain, 0.2);
  assert.equal(result.actionable, false);
  assert.equal(result.changes.length, 1);
  assert.equal(result.recommendedChanges.length, 0);
  assert.match(result.reason, /below the 1-point action threshold/);
});

test("optimizer reports an incomplete lineup when known inputs cannot fill it", () => {
  const result = optimizeLineup(snapshot([{ id: "qb", position: "QB", projection: 20 }], [{ playerId: "qb", lineupSlot: "RB" }]), "mine");
  assert.equal(result.status, "incomplete");
});

test("optimizer supports ESPN OP superflex assignments", () => {
  const result = optimizeLineup(snapshot([
    { id: "qb1", position: "QB", projection: 18 }, { id: "qb2", position: "QB", projection: 24 }, { id: "rb", position: "RB", projection: 15 }
  ], [{ playerId: "qb1", lineupSlot: "QB" }, { playerId: "rb", lineupSlot: "OP" }, { playerId: "qb2", lineupSlot: "BE" }]), "mine");
  assert.equal(result.status, "optimal");
  assert.equal(result.projectedTotal, 42);
  assert.equal(result.assignments.find((item) => item.slot === "OP").player.id, "qb2");
});
