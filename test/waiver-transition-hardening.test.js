import test from "node:test";
import assert from "node:assert/strict";
import { buildScenarioPlan } from "../src/domain/scenario-planner.js";

function player(id, name, position, projection, gameTime = null) {
  return { id, name, position, projection, injury: { status: "ACTIVE" }, gameTime };
}

function snapshot() {
  return {
    currentWeek: 1,
    meta: { capturedAt: "2026-09-05T12:00:00.000Z" },
    league: {
      id: "league",
      lineupSlots: [
        { slot: "QB", count: 1 },
        { slot: "RB", count: 1 },
        { slot: "FLEX", count: 1 },
        { slot: "BE", count: 1 }
      ],
      rosterRules: { size: 4, positionLimits: [] },
      waiver: { acquisitionLimit: -1, matchupAcquisitionLimit: -1 }
    },
    teams: [{ id: "mine", acquisition: { waiverRank: 3, seasonAcquisitions: 0, matchupAcquisitions: 0 } }],
    players: [
      player("qb", "Quarterback", "QB", 20),
      player("rb", "Starter Back", "RB", 12),
      player("flex", "Flex Receiver", "WR", 10),
      player("bench", "Bench Back", "RB", 6),
      player("add", "Available Receiver", "WR", 15)
    ],
    rosters: [{
      teamId: "mine",
      entries: [
        { playerId: "qb", lineupSlot: "QB" },
        { playerId: "rb", lineupSlot: "RB" },
        { playerId: "flex", lineupSlot: "FLEX" },
        { playerId: "bench", lineupSlot: "BE" }
      ]
    }],
    availablePlayers: ["add"]
  };
}

function futureInputs(value) {
  return {
    identityMap: new Map(value.players.map((item) => [`provider-${item.id}`, item.id])),
    projectionSet: {
      provider: "fixture",
      scoringFormat: "PPR",
      projections: value.players.map((item) => ({
        providerPlayerId: `provider-${item.id}`,
        week: 2,
        points: item.projection
      }))
    }
  };
}

function plan(value, scenario, now = 0) {
  const { identityMap, projectionSet } = futureInputs(value);
  return buildScenarioPlan(value, "mine", {
    weeks: [2],
    identityMap,
    projectionSet,
    now,
    scenarios: [scenario]
  });
}

test("multiweek add/drop accepts a path that is still a current waiver recommendation", () => {
  const result = plan(snapshot(), { id: "move", kind: "add-drop", addPlayerId: "add", dropPlayerId: "bench" });
  assert.equal(result.rejectedScenarios.length, 0);
  assert.equal(result.scenarios.length, 1);
  assert.equal(result.scenarios[0].kind, "add-drop");
  assert.equal(result.scenarios[0].addPlayerId, "add");
  assert.equal(result.scenarios[0].dropPlayerId, "bench");
});

test("multiweek add/drop rejects a stale path after ESPN acquisition capacity is exhausted", () => {
  const value = snapshot();
  value.league.waiver.acquisitionLimit = 1;
  value.teams[0].acquisition.seasonAcquisitions = 1;
  const result = plan(value, { id: "stale-limit", kind: "add-drop", addPlayerId: "add", dropPlayerId: "bench" });
  assert.equal(result.scenarios.length, 0);
  assert.equal(result.rejectedScenarios.length, 1);
  assert.match(result.rejectedScenarios[0].reason, /currently validated ESPN waiver recommendation/);
});

test("multiweek add/drop rejects a stale path after an ESPN position limit changes", () => {
  const value = snapshot();
  value.league.rosterRules.positionLimits = [{ position: "WR", limit: 1 }];
  const result = plan(value, { id: "stale-position", kind: "add-drop", addPlayerId: "add", dropPlayerId: "bench" });
  assert.equal(result.scenarios.length, 0);
  assert.equal(result.rejectedScenarios.length, 1);
  assert.match(result.rejectedScenarios[0].reason, /currently validated ESPN waiver recommendation/);
});

test("scenario planning uses one explicit evaluation time for waiver and lock validation", () => {
  const value = snapshot();
  value.players.find((item) => item.id === "bench").gameTime = "2000-01-01T00:00:00.000Z";
  const result = plan(value, { id: "replay", kind: "add-drop", addPlayerId: "add", dropPlayerId: "bench" }, 0);
  assert.equal(result.rejectedScenarios.length, 0);
  assert.equal(result.scenarios.length, 1);
});

test("multiweek scenario kinds fail closed instead of treating an unknown kind as add/drop", () => {
  const result = plan(snapshot(), { id: "unknown", kind: "future-transaction-kind", addPlayerId: "add", dropPlayerId: "bench" });
  assert.equal(result.scenarios.length, 0);
  assert.equal(result.rejectedScenarios.length, 1);
  assert.match(result.rejectedScenarios[0].reason, /unsupported/i);
});
