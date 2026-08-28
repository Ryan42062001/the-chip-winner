import test from "node:test";
import assert from "node:assert/strict";
import { buildScenarioPlan } from "../src/domain/scenario-planner.js";
import sampleSnapshot from "../src/data/sample-espn-snapshot.json" with { type: "json" };

test("scenario planner reports missing future inputs honestly", () => {
  const result = buildScenarioPlan(sampleSnapshot, sampleSnapshot.teams[0].id);
  assert.equal(result.status, "missing-future-inputs");
  assert.equal(result.weeks.length, 0);
});

test("scenario planner requires projection data and identity mapping for future weeks", () => {
  const result = buildScenarioPlan(sampleSnapshot, sampleSnapshot.teams[0].id, { weeks: [15, 16] });
  assert.equal(result.status, "missing-future-inputs");
  assert.deepEqual(result.weeks, [15, 16]);
  assert.equal(result.scenarios.length, 0);
});

test("scenario planner calculates a weekly baseline from explicitly mapped projections", () => {
  const teamId = sampleSnapshot.teams[0].id;
  const roster = sampleSnapshot.rosters.find((item) => item.teamId === teamId);
  const identityMap = new Map(roster.entries.map((entry) => [`provider-${entry.playerId}`, entry.playerId]));
  const projectionSet = { projections: roster.entries.map((entry, index) => ({ providerPlayerId: `provider-${entry.playerId}`, week: 15, points: 10 + index })) };
  const result = buildScenarioPlan(sampleSnapshot, teamId, { weeks: [15], identityMap, projectionSet });
  assert.equal(result.status, "ready");
  assert.equal(result.weeklyBaseline.length, 1);
  assert.equal(result.weeklyBaseline[0].week, 15);
  assert.equal(result.weeklyBaseline[0].projectedTotal > 0, true);
  assert.equal(result.weeklyBaseline[0].completeCoverage, true);
  assert.equal(result.weeklyBaseline[0].mappedProjectionCount, roster.entries.length);
});

test("scenario planner compares an isolated add drop move without mutating ESPN state", () => {
  const teamId = sampleSnapshot.teams[0].id;
  const roster = sampleSnapshot.rosters.find((item) => item.teamId === teamId);
  const dropPlayerId = roster.entries.at(-1).playerId;
  const addPlayer = sampleSnapshot.players.find((player) => !roster.entries.some((entry) => entry.playerId === player.id));
  const identityMap = new Map(sampleSnapshot.players.map((player) => [`provider-${player.id}`, player.id]));
  const projectionSet = { projections: sampleSnapshot.players.map((player) => ({ providerPlayerId: `provider-${player.id}`, week: 15, points: player.id === addPlayer.id ? 30 : 10 })) };
  const before = JSON.stringify(sampleSnapshot);
  const result = buildScenarioPlan(sampleSnapshot, teamId, { weeks: [15], identityMap, projectionSet, scenarios: [{ id: "move-1", addPlayerId: addPlayer.id, dropPlayerId }] });
  assert.equal(result.scenarios.length, 1);
  assert.equal(result.scenarios[0].weekly[0].delta != null, true);
  assert.equal(JSON.stringify(sampleSnapshot), before);
});

test("scenario planner labels partial roster projection coverage", () => {
  const teamId = sampleSnapshot.teams[0].id; const roster = sampleSnapshot.rosters.find((item) => item.teamId === teamId); const playerId = roster.entries[0].playerId;
  const result = buildScenarioPlan(sampleSnapshot, teamId, { weeks: [15], identityMap: new Map([["provider-one", playerId]]), projectionSet: { projections: [{ providerPlayerId: "provider-one", week: 15, points: 20 }] } });
  assert.equal(result.weeklyBaseline[0].mappedProjectionCount, 1);
  assert.equal(result.weeklyBaseline[0].completeCoverage, false);
});

test("scenario planner rejects starter drops and unavailable adds", () => {
  const teamId = sampleSnapshot.teams[0].id; const roster = sampleSnapshot.rosters.find((item) => item.teamId === teamId); const starter = roster.entries.find((entry) => entry.lineupSlot !== "BE" && entry.lineupSlot !== "IR");
  const identityMap = new Map(sampleSnapshot.players.map((player) => [`p-${player.id}`, player.id])); const projectionSet = { projections: sampleSnapshot.players.map((player) => ({ providerPlayerId: `p-${player.id}`, week: 15, points: 10 })) };
  const result = buildScenarioPlan(sampleSnapshot, teamId, { weeks: [15], identityMap, projectionSet, scenarios: [{ id: "illegal", addPlayerId: sampleSnapshot.players[0].id, dropPlayerId: starter.playerId }], now: 0 });
  assert.equal(result.scenarios.length, 0);
  assert.match(result.rejectedScenarios[0].reason, /bench/);
});
