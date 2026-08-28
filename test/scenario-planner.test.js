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
});
