import test from "node:test";
import assert from "node:assert/strict";
import { validateRecommendation } from "../src/domain/recommendation-contract.js";

test("recommendation contract accepts traceable output", () => {
  assert.equal(validateRecommendation({ id: "lineup-1", kind: "lineup", status: "review", confidence: "medium", inputs: ["espn.projection"], limitations: ["Late news may change this."] }).valid, true);
});

test("recommendation contract rejects unavailable output without limitations", () => {
  const result = validateRecommendation({ id: "x", kind: "scenario", status: "unavailable", confidence: "none", inputs: [], limitations: [] });
  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /limitation/);
});

test("recommendation contract rejects malformed timestamps and unexpected fields", () => {
  const result = validateRecommendation({ id: "x", kind: "alert", status: "review", confidence: "low", inputs: [], limitations: ["test"], sourceCapturedAt: "not-a-date", inventedRank: 1 });
  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /sourceCapturedAt/);
  assert.match(result.errors.join(" "), /Unexpected/);
});
