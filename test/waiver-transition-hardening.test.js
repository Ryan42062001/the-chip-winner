import test from "node:test";
import assert from "node:assert/strict";
import { buildScenarioPlan } from "../src/domain/scenario-planner.js";

function player(id, name, position, projection, gameTime = null, status = "ACTIVE") {
  return { id, name, position, projection, injury: { status }, gameTime };
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

function irSnapshot() {
  const value = snapshot();
  value.league.lineupSlots = [
    { slot: "QB", count: 1 },
    { slot: "RB", count: 1 },
    { slot: "FLEX", count: 1 },
    { slot: "BE", count: 2 },
    { slot: "IR", count: 1 }
  ];
  value.league.rosterRules.size = 6;
  value.players.push(player("out", "Injured Bench Back", "RB", 4, "2000-01-01T00:00:00.000Z", "OUT"));
  value.rosters[0].entries.push({ playerId: "out", lineupSlot: "BE" });
  return value;
}

function futureInputs(value, overrides = {}) {
  return {
    identityMap: new Map(value.players.map((item) => [`provider-${item.id}`, item.id])),
    projectionSet: {
      provider: "fixture",
      scoringFormat: "PPR",
      projections: value.players.map((item) => ({
        providerPlayerId: `provider-${item.id}`,
        week: 2,
        points: overrides[item.id] ?? item.projection
      }))
    }
  };
}

function plan(value, scenario, now = 0, overrides = {}) {
  const { identityMap, projectionSet } = futureInputs(value, overrides);
  return buildScenarioPlan(value, "mine", {
    weeks: [2],
    identityMap,
    projectionSet,
    now,
    scenarios: [scenario]
  });
}

test("multiweek add/drop accepts a currently legal future path without requiring a current-week gain", () => {
  const value = snapshot();
  value.players.find((item) => item.id === "add").projection = 10.2;
  const result = plan(value, { id: "move", kind: "add-drop", addPlayerId: "add", dropPlayerId: "bench" }, 0, { add: 20 });
  assert.equal(result.currentWeekScenarios.some((item) => item.payload?.add?.id === "add"), false);
  assert.equal(result.rejectedScenarios.length, 0);
  assert.equal(result.scenarios.length, 1);
  assert.equal(result.scenarios[0].kind, "add-drop");
  assert.equal(result.scenarios[0].addPlayerId, "add");
  assert.equal(result.scenarios[0].dropPlayerId, "bench");
  assert.equal(result.scenarios[0].horizonDelta > 0, true);
});

test("multiweek add/drop rejects a stale path after ESPN acquisition capacity is exhausted", () => {
  const value = snapshot();
  value.league.waiver.acquisitionLimit = 1;
  value.teams[0].acquisition.seasonAcquisitions = 1;
  const result = plan(value, { id: "stale-limit", kind: "add-drop", addPlayerId: "add", dropPlayerId: "bench" });
  assert.equal(result.scenarios.length, 0);
  assert.equal(result.rejectedScenarios.length, 1);
  assert.match(result.rejectedScenarios[0].reason, /season acquisition limit is exhausted/);
});

test("multiweek add/drop rejects a stale path after an ESPN position limit changes", () => {
  const value = snapshot();
  value.league.rosterRules.positionLimits = [{ position: "WR", limit: 1 }];
  const result = plan(value, { id: "stale-position", kind: "add-drop", addPlayerId: "add", dropPlayerId: "bench" });
  assert.equal(result.scenarios.length, 0);
  assert.equal(result.rejectedScenarios.length, 1);
  assert.match(result.rejectedScenarios[0].reason, /WR roster limit is 1/);
});

test("multiweek add/drop rejects a stale path when the reported roster already exceeds its explicit size limit", () => {
  const value = snapshot();
  value.league.rosterRules.size = 3;
  const result = plan(value, { id: "stale-size", kind: "add-drop", addPlayerId: "add", dropPlayerId: "bench" });
  assert.equal(result.scenarios.length, 0);
  assert.match(result.rejectedScenarios[0].reason, /roster size limit is 3/);
});

test("multiweek add/drop rejects a newly locked ESPN add", () => {
  const value = snapshot();
  value.players.find((item) => item.id === "add").locked = true;
  const result = plan(value, { id: "locked-add", kind: "add-drop", addPlayerId: "add", dropPlayerId: "bench" });
  assert.equal(result.scenarios.length, 0);
  assert.match(result.rejectedScenarios[0].reason, /add player is locked/);
});

test("multiweek add/drop rejects acquisitions while ESPN reports a known-invalid IR occupant", () => {
  const value = irSnapshot();
  const out = value.players.find((item) => item.id === "out");
  out.injury = { status: "ACTIVE" };
  out.gameTime = null;
  value.rosters[0].entries.find((entry) => entry.playerId === "out").lineupSlot = "IR";
  const result = plan(value, { id: "invalid-ir", kind: "add-drop", addPlayerId: "add", dropPlayerId: "bench" });
  assert.equal(result.scenarios.length, 0);
  assert.match(result.rejectedScenarios[0].reason, /in IR without a currently valid ESPN IR designation/);
});

test("scenario planning uses one explicit evaluation time for current waiver derivation and lock validation", () => {
  const value = irSnapshot();
  const { identityMap, projectionSet } = futureInputs(value);
  const result = buildScenarioPlan(value, "mine", { weeks: [2], identityMap, projectionSet, now: 0 });
  assert.equal(result.currentWeekScenarios.length > 0, true);
  assert.equal(result.currentWeekScenarios[0].payload.kind, "ir-assisted-add");
  assert.equal(result.currentWeekScenarios[0].payload.irMove.player.id, "out");
});

test("multiweek scenario kinds fail closed instead of treating an unknown kind as add/drop", () => {
  const result = plan(snapshot(), { id: "unknown", kind: "future-transaction-kind", addPlayerId: "add", dropPlayerId: "bench" });
  assert.equal(result.scenarios.length, 0);
  assert.equal(result.rejectedScenarios.length, 1);
  assert.match(result.rejectedScenarios[0].reason, /unsupported/i);
});
