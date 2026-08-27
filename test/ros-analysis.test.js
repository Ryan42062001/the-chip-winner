import test from "node:test";
import assert from "node:assert/strict";
import { buildRosWaiverIdeas, selectRosterRosCoverage } from "../src/domain/ros-analysis.js";

const snapshot = {
  players: [
    { id: "roster-rb", name: "Roster RB", position: "RB" },
    { id: "free-rb", name: "Free RB", position: "RB" },
    { id: "free-wr", name: "Free WR", position: "WR" }
  ],
  rosters: [{ teamId: "mine", entries: [{ playerId: "roster-rb", lineupSlot: "BE" }] }],
  availablePlayers: ["free-rb", "free-wr"]
};
const reconciliation = { byPlayerId: { "roster-rb": { rank: 90 }, "free-rb": { rank: 50 }, "free-wr": { rank: 20 } } };

test("ROS coverage reports only explicitly reconciled roster players", () => {
  assert.deepEqual(selectRosterRosCoverage(snapshot, "mine", reconciliation), { matched: 1, total: 1, ratio: 1 });
});

test("ROS waiver ideas compare same-position ranks without inventing points", () => {
  const result = buildRosWaiverIdeas(snapshot, "mine", reconciliation);
  assert.equal(result.status, "ready");
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].add.id, "free-rb");
  assert.equal(result.items[0].drop.id, "roster-rb");
  assert.equal(result.items[0].rankImprovement, 40);
  assert.equal(result.items[0].projection, undefined);
});

test("ROS waiver analysis reports missing source inputs", () => {
  assert.equal(buildRosWaiverIdeas({ ...snapshot, availablePlayers: undefined }, "mine", reconciliation).status, "missing-availability");
  assert.equal(buildRosWaiverIdeas(snapshot, "mine", null).status, "missing-rankings");
});

