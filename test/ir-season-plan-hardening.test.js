import test from "node:test";
import assert from "node:assert/strict";
import { buildScenarioPlan } from "../src/domain/scenario-planner.js";

function player(id, name, position, projection, status = "ACTIVE") {
  return { id, name, position, projection, injury: status ? { status } : null, gameTime: null };
}

function snapshot() {
  return {
    currentWeek: 1,
    meta: { capturedAt: "2026-09-05T11:00:00.000Z" },
    league: {
      id: "league",
      lineupSlots: [
        { slot: "QB", count: 1 },
        { slot: "RB", count: 1 },
        { slot: "FLEX", count: 1 },
        { slot: "BE", count: 2 },
        { slot: "IR", count: 1 }
      ],
      rosterRules: { size: 6, positionLimits: [] },
      waiver: { acquisitionLimit: -1, matchupAcquisitionLimit: -1 }
    },
    teams: [{ id: "mine", acquisition: { waiverRank: 3, seasonAcquisitions: 0, matchupAcquisitions: 0 } }],
    players: [
      player("qb", "Quarterback", "QB", 20),
      player("rb", "Starter Back", "RB", 12),
      player("flex", "Flex Receiver", "WR", 10),
      player("out", "Injured Bench Back", "RB", 4, "OUT"),
      player("bench", "Healthy Bench Receiver", "WR", 6),
      player("add", "Available Receiver", "WR", 15)
    ],
    rosters: [{
      teamId: "mine",
      entries: [
        { playerId: "qb", lineupSlot: "QB" },
        { playerId: "rb", lineupSlot: "RB" },
        { playerId: "flex", lineupSlot: "FLEX" },
        { playerId: "out", lineupSlot: "BE" },
        { playerId: "bench", lineupSlot: "BE" }
      ]
    }],
    availablePlayers: ["add"]
  };
}

function futureInputs(value, { omit = [] } = {}) {
  const identityMap = new Map(value.players.map((item) => [`provider-${item.id}`, item.id]));
  const projections = value.players
    .filter((item) => !omit.includes(item.id))
    .map((item) => ({
      providerPlayerId: `provider-${item.id}`,
      week: 2,
      points: item.id === "add" ? 15 : item.projection,
      capturedAt: "2026-09-05T12:00:00.000Z"
    }));
  return { identityMap, projectionSet: { provider: "fixture", scoringFormat: "PPR", projections } };
}

function irScenario() {
  return { id: "ir-path", kind: "ir-assisted-add", addPlayerId: "add", irPlayerId: "out" };
}

test("Season Plan withholds an IR-assisted delta when only the added player's future projection is missing", () => {
  const value = snapshot();
  const { identityMap, projectionSet } = futureInputs(value, { omit: ["add"] });
  const result = buildScenarioPlan(value, "mine", {
    weeks: [2], identityMap, projectionSet, now: 0, scenarios: [irScenario()]
  });

  assert.equal(result.weeklyBaseline[0].completeCoverage, true);
  assert.equal(result.scenarios.length, 1);
  assert.equal(result.scenarios[0].weekly[0].completeCoverage, false);
  assert.deepEqual(result.scenarios[0].weekly[0].missingProjectionPlayerIds, ["add"]);
  assert.equal(result.scenarios[0].weekly[0].delta, null);
  assert.equal(result.scenarios[0].horizonDelta, null);
  assert.match(result.scenarios[0].weekly[0].deltaUnavailableReason, /Scenario active-roster projection coverage is incomplete/);
});

test("Season Plan rejects an IR-assisted scenario after the eligible bench player becomes locked", () => {
  const value = snapshot();
  value.rosters[0].entries.find((entry) => entry.playerId === "out").locked = true;
  const { identityMap, projectionSet } = futureInputs(value);
  const result = buildScenarioPlan(value, "mine", {
    weeks: [2], identityMap, projectionSet, now: 0, scenarios: [irScenario()]
  });

  assert.equal(result.scenarios.length, 0);
  assert.equal(result.rejectedScenarios.length, 1);
  assert.match(result.rejectedScenarios[0].reason, /locked/);
});

test("Season Plan rejects an IR-assisted scenario when the add is no longer ESPN-available", () => {
  const value = snapshot();
  value.availablePlayers = [];
  const { identityMap, projectionSet } = futureInputs(value);
  const result = buildScenarioPlan(value, "mine", {
    weeks: [2], identityMap, projectionSet, now: 0, scenarios: [irScenario()]
  });

  assert.equal(result.scenarios.length, 0);
  assert.equal(result.rejectedScenarios.length, 1);
  assert.match(result.rejectedScenarios[0].reason, /not explicitly available/);
});

test("Season Plan rejects an IR-assisted scenario when ESPN IR capacity is already full", () => {
  const value = snapshot();
  value.players.push(player("stash", "Existing IR Stash", "WR", 2, "OUT"));
  value.rosters[0].entries.push({ playerId: "stash", lineupSlot: "IR" });
  value.league.rosterRules.size = 7;
  const { identityMap, projectionSet } = futureInputs(value);
  const result = buildScenarioPlan(value, "mine", {
    weeks: [2], identityMap, projectionSet, now: 0, scenarios: [irScenario()]
  });

  assert.equal(result.scenarios.length, 0);
  assert.equal(result.rejectedScenarios.length, 1);
  assert.match(result.rejectedScenarios[0].reason, /not a currently validated ESPN waiver recommendation/);
});
