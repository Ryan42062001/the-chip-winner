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
      rosterRules: { size: 5, positionLimits: [] },
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

test("multiweek planner retains the injured player in IR while adding the no-drop waiver target", () => {
  const value = snapshot();
  const before = structuredClone(value);
  const { identityMap, projectionSet } = futureInputs(value);
  const result = buildScenarioPlan(value, "mine", {
    weeks: [2],
    identityMap,
    projectionSet,
    now: 0,
    scenarios: [{
      id: "ir-path",
      kind: "ir-assisted-add",
      addPlayerId: "add",
      irPlayerId: "out"
    }]
  });

  assert.equal(result.status, "ready");
  assert.equal(result.scenarios.length, 1);
  assert.equal(result.scenarios[0].kind, "ir-assisted-add");
  assert.equal(result.scenarios[0].addPlayerId, "add");
  assert.equal(result.scenarios[0].dropPlayerId, null);
  assert.equal(result.scenarios[0].irPlayerId, "out");
  assert.equal(result.scenarios[0].weekly[0].rosterPlayerCount, 5);
  assert.equal(result.scenarios[0].weekly[0].mappedProjectionCount, 5);
  assert.equal(result.scenarios[0].weekly[0].completeCoverage, true);
  assert.deepEqual(result.scenarios[0].weekly[0].excludedIrPlayerIds, ["out"]);
  assert.equal(result.scenarios[0].weekly[0].delta, 5);
  assert.equal(result.scenarios[0].horizonDelta, 5);
  assert.deepEqual(value, before);
});

test("multiweek IR-assisted delta is withheld when the active baseline lacks a player-week projection", () => {
  const value = snapshot();
  const { identityMap, projectionSet } = futureInputs(value, { omit: ["out"] });
  const result = buildScenarioPlan(value, "mine", {
    weeks: [2],
    identityMap,
    projectionSet,
    now: 0,
    scenarios: [{ kind: "ir-assisted-add", addPlayerId: "add", irPlayerId: "out" }]
  });

  assert.equal(result.weeklyBaseline[0].completeCoverage, false);
  assert.deepEqual(result.weeklyBaseline[0].missingProjectionPlayerIds, ["out"]);
  assert.equal(result.scenarios[0].weekly[0].completeCoverage, true);
  assert.deepEqual(result.scenarios[0].weekly[0].missingProjectionPlayerIds, []);
  assert.deepEqual(result.scenarios[0].weekly[0].excludedIrPlayerIds, ["out"]);
  assert.equal(result.scenarios[0].weekly[0].delta, null);
  assert.equal(result.scenarios[0].horizonDelta, null);
  assert.match(result.scenarios[0].weekly[0].deltaUnavailableReason, /Baseline roster projection coverage is incomplete/);
});

test("multiweek planner rejects an IR path that ESPN no longer validates", () => {
  const value = snapshot();
  value.players.find((item) => item.id === "out").injury = { status: "QUESTIONABLE" };
  const { identityMap, projectionSet } = futureInputs(value);
  const result = buildScenarioPlan(value, "mine", {
    weeks: [2],
    identityMap,
    projectionSet,
    now: 0,
    scenarios: [{ kind: "ir-assisted-add", addPlayerId: "add", irPlayerId: "out" }]
  });

  assert.equal(result.scenarios.length, 0);
  assert.equal(result.rejectedScenarios.length, 1);
  assert.match(result.rejectedScenarios[0].reason, /not a currently validated ESPN waiver recommendation/);
});
