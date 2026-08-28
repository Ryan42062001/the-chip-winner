import test from "node:test";
import assert from "node:assert/strict";
import snapshot from "../src/data/sample-espn-snapshot.json" with { type: "json" };
import { GuardedModelService } from "../src/models/guarded-model-service.js";

const base = { id: "valid", kind: "alert", status: "review", confidence: "medium", inputs: ["ESPN injury"], limitations: ["Verify status."] };

test("guarded model service sends only evaluated recommendations to adapter", async () => {
  const calls = []; const adapter = { explain: async (context, recommendation) => { calls.push({ context, recommendation }); return { recommendationId: recommendation.id, text: "ok" }; } };
  const invalid = { ...base, id: "invalid", kind: "waiver", payload: { addPlayerId: "invented" } };
  const result = await new GuardedModelService({ adapter }).explainRecommendations(snapshot, snapshot.teams[0].id, [base, invalid]);
  assert.equal(result.status, "partial"); assert.equal(calls.length, 1); assert.equal(calls[0].recommendation.id, "valid");
});

test("guarded model service requires a configured adapter", () => {
  assert.throws(() => new GuardedModelService({}), /adapter/);
});
