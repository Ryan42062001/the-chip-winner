import test from "node:test";
import assert from "node:assert/strict";
import { buildRosterPlan } from "../src/domain/roster-planning.js";

const snapshot = { players: [
  { id: "a", name: "Alpha", position: "RB", byeWeek: 7, projection: 12 }, { id: "b", name: "Beta", position: "RB", byeWeek: 7, projection: 8 }, { id: "c", name: "Gamma", position: "WR", byeWeek: 9, projection: 10 }
], rosters: [{ teamId: "mine", entries: [{ playerId: "a", lineupSlot: "RB" }, { playerId: "b", lineupSlot: "FLEX" }, { playerId: "c", lineupSlot: "WR" }] }] };

test("roster plan reports positional depth and starter bye conflicts", () => {
  const plan = buildRosterPlan(snapshot, "mine");
  assert.equal(plan.status, "ready");
  assert.equal(plan.positions.find((group) => group.position === "RB").depth, 2);
  assert.equal(plan.byeConflicts.length, 1);
  assert.equal(plan.byeConflicts[0].week, 7);
});

test("roster plan includes only explicit playoff schedule strength", () => {
  const plan = buildRosterPlan(snapshot, "mine", { byPlayerId: { a: { rank: 20, playoffScheduleStrength: 4 }, c: { rank: 10, playoffScheduleStrength: 2 } } });
  assert.deepEqual(plan.playoff.map((item) => [item.player.id, item.strength]), [["c", 2], ["a", 4]]);
  assert.equal(buildRosterPlan(snapshot, "missing").status, "missing-roster");
});
