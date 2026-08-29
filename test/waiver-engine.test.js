import test from "node:test";
import assert from "node:assert/strict";
import { buildRosterAwareWaiverIdeas, evaluateAcquisitionCapacity } from "../src/domain/waiver-engine.js";

function snapshot() {
  return {
    currentWeek: 1,
    league: { waiver: { acquisitionLimit: -1, matchupAcquisitionLimit: null } },
    teams: [{ id: "mine", acquisition: { waiverRank: null, seasonAcquisitions: null, matchupAcquisitions: null, budgetSpent: null } }],
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
  assert.deepEqual(result.items[0].replacement, { status: "unavailable", playerId: null, projection: null, pointsAbove: null });
});

test("waiver replacement value uses the next ESPN-available same-position projection", () => {
  const value = snapshot(); value.players.push({ id: "add-wr-2", name: "Other Receiver", position: "WR", projection: 12 }); value.availablePlayers.push("add-wr-2");
  const result = buildRosterAwareWaiverIdeas(value, "mine", 0); const receiver = result.items.find((item) => item.add.id === "add-wr");
  assert.deepEqual(receiver.replacement, { status: "ready", playerId: "add-wr-2", projection: 12, pointsAbove: 4 });
  assert.match(result.limitations.join(" "), /Replacement value/);
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

test("waiver engine suppresses moves only when ESPN proves an acquisition limit is exhausted", () => {
  const value = snapshot(); value.league.waiver = { acquisitionLimit: 5, matchupAcquisitionLimit: 2 }; value.teams[0].acquisition = { seasonAcquisitions: 3, matchupAcquisitions: 2 };
  const capacity = evaluateAcquisitionCapacity(value, "mine");
  assert.deepEqual(capacity, { status: "exhausted", seasonRemaining: 2, matchupRemaining: 0, reason: "ESPN reports that the Week 1 acquisition limit is exhausted." });
  const result = buildRosterAwareWaiverIdeas(value, "mine", 0);
  assert.equal(result.status, "acquisition-limit-reached"); assert.equal(result.items.length, 0);
  value.teams[0].acquisition.matchupAcquisitions = null;
  assert.equal(evaluateAcquisitionCapacity(value, "mine").status, "unverified");
  value.league.waiver.matchupAcquisitionLimit = -1;
  assert.equal(evaluateAcquisitionCapacity(value, "mine").status, "available");
});

test("waiver engine enforces only explicit ESPN roster and position limits", () => {
  const value = snapshot(); value.league.rosterRules = { size: 4, positionLimits: [{ position: "RB", limit: 1 }] };
  const result = buildRosterAwareWaiverIdeas(value, "mine", 0);
  assert.equal(result.items.some((item) => item.add.id === "add-rb"), false);
  assert.match(result.limitations.join(" "), /RB roster limit is 1/);
  value.league.rosterRules.size = 3;
  const mismatch = buildRosterAwareWaiverIdeas(value, "mine", 0);
  assert.equal(mismatch.items.length, 0); assert.match(mismatch.limitations.join(" "), /roster size limit is 3/);
  delete value.league.rosterRules;
  assert.match(buildRosterAwareWaiverIdeas(value, "mine", 0).limitations.join(" "), /no rule is inferred/);
});
