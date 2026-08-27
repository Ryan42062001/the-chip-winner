import test from "node:test";
import assert from "node:assert/strict";
import { buildScenarioPlan } from "../src/domain/scenario-planner.js";
import sampleSnapshot from "../src/data/sample-espn-snapshot.json" with { type: "json" };

test("scenario planner reports missing future inputs honestly", () => {
  const result = buildScenarioPlan(sampleSnapshot, sampleSnapshot.teams[0].id);
  assert.equal(result.status, "missing-future-inputs");
  assert.equal(result.weeks.length, 0);
});

test("scenario planner accepts explicit future week inputs without inventing scenarios", () => {
  const result = buildScenarioPlan(sampleSnapshot, sampleSnapshot.teams[0].id, { weeks: [15, 16] });
  assert.equal(result.status, "ready");
  assert.deepEqual(result.weeks, [15, 16]);
  assert.equal(result.scenarios.length, 0);
});
