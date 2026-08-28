import test from "node:test";
import assert from "node:assert/strict";
import { createRecommendation } from "../src/domain/recommendation-factory.js";

test("recommendation factory creates immutable validated envelopes", () => {
  const value = createRecommendation({ id: "r", kind: "lineup", status: "review", confidence: "medium", inputs: ["ESPN"], limitations: ["Verify news"], payload: { playerId: "p1" } });
  assert.equal(Object.isFrozen(value), true); assert.equal(Object.isFrozen(value.inputs), true); assert.equal(value.payload.playerId, "p1");
});

test("recommendation factory rejects invalid envelopes", () => {
  assert.throws(() => createRecommendation({ id: "", kind: "guess", inputs: [], limitations: [] }), /Invalid recommendation/);
});
