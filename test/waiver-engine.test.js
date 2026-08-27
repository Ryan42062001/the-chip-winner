import test from "node:test";
import assert from "node:assert/strict";
import { buildRosterAwareWaiverIdeas } from "../src/domain/waiver-engine.js";

function snapshot() {
  return {
    currentWeek: 1,
    league: { waiver: { acquisitionLimit: -1 } },
    players: [
      { id: "qb", name: "Quarterback", position: "QB", projection: 20 },
      { id: "rb", name: "Starter Back", position: "RB", projection: 10 },
      { id: "bench-qb", name: "Bench Quarterback", position: "QB", projection: 8 },
      { id: "bench-rb", name: "Bench Back", position: "RB", projection: 6 },
      { id: "add-wr", name: "Available Receiver", position: "WR", projection: 16 },
      { id: "add-rb", name: "Available Back", position: "RB", projection: 14 }
    ],
    rosters: [{ teamId: "mine", entries: [
      { playerId: "qb", lineupSlot: "QB" }, { playerId: "rb", lineupSlot: "FLEX" },
      { playerId: "bench-qb", lineupSlot: "BE" }, { playerId: "bench-rb", lineupSlot: "BE" }
    ] }],
    availablePlayers: ["add-wr", "add-rb"]
  };
}

test("waiver engine evaluates full legal lineup impact across positions", () => {
  const result = buildRosterAwareWaiverIdeas(snapshot(), "mine", 0);
  assert.equal(result.status, "ready");
  assert.equal(result.baselineTotal, 30);
  assert.equal(result.items[0].add.id, "add-wr");
  assert.equal(result.items[0].lineupGain, 6);
  assert.equal(result.items[0].drop.id, "bench-qb");
  assert.match(result.items[0].reason, /30.0 to 36.0/);
});

test("waiver engine never drops starters, IR, or locked bench players", () => {
  const value = snapshot();
  value.rosters[0].entries.find((entry) => entry.playerId === "bench-qb").locked = true;
  value.rosters[0].entries.find((entry) => entry.playerId === "bench-rb").lineupSlot = "IR";
  const result = buildRosterAwareWaiverIdeas(value, "mine", 0);
  assert.equal(result.items.length, 0);
});

test("waiver engine reports missing availability and incomplete lineups honestly", () => {
  const missing = snapshot(); delete missing.availablePlayers;
  assert.equal(buildRosterAwareWaiverIdeas(missing, "mine").status, "missing-availability");
  const incomplete = snapshot(); incomplete.rosters[0].entries = [{ playerId: "qb", lineupSlot: "RB" }];
  assert.equal(buildRosterAwareWaiverIdeas(incomplete, "mine", 0).status, "incomplete-lineup");
});
