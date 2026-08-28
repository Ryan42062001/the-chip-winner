import test from "node:test";
import assert from "node:assert/strict";
import snapshot from "../src/data/sample-espn-snapshot.json" with { type: "json" };
import { GuardedModelService } from "../src/models/guarded-model-service.js";

const base = { id: "valid", kind: "alert", status: "review", confidence: "medium", inputs: ["ESPN injury"], limitations: ["Verify status."] };

test("guarded model service sends only evaluated recommendations to adapter", async () => {
  const calls = []; const adapter = { explain: async (context, recommendation) => { calls.push({ context, recommendation }); return { provider: "fixture", recommendationId: recommendation.id, text: "ESPN injury. Verify status." }; } };
  const invalid = { ...base, id: "invalid", kind: "waiver", payload: { addPlayerId: "invented" } };
  const result = await new GuardedModelService({ adapter }).explainRecommendations(snapshot, snapshot.teams[0].id, [base, invalid]);
  assert.equal(result.status, "partial"); assert.equal(calls.length, 1); assert.equal(calls[0].recommendation.id, "valid");
});

test("guarded model service excludes explanations that omit evidence or limitations", async () => {
  const adapter = { explain: async (context, recommendation) => ({ provider: "fixture", recommendationId: recommendation.id, text: "Trust me." }) };
  const result = await new GuardedModelService({ adapter }).explainRecommendations(snapshot, snapshot.teams[0].id, [base]);
  assert.equal(result.status, "partial");
  assert.equal(result.explanations.length, 0);
  assert.equal(result.explanationEvaluations[0].valid, false);
  assert.match(result.errors.join(" "), /omits limitation/);
});

test("guarded model service requires a configured adapter", () => {
  assert.throws(() => new GuardedModelService({}), /adapter/);
});

test("guarded model service reports adapter failures without leaking recommendation contents", async () => {
  const adapter = { explain: async () => { throw new Error("provider timeout"); } };
  const result = await new GuardedModelService({ adapter }).explainRecommendations(snapshot, snapshot.teams[0].id, [{ ...base, id: "sensitive-id" }]);
  assert.equal(result.status, "partial");
  assert.equal(result.report.issueCounts["adapter-failure"], 1);
  assert.deepEqual(result.report.explanations, { attempted: 1, accepted: 0, rejected: 1 });
  assert.doesNotMatch(JSON.stringify(result.report), /sensitive-id|provider timeout/);
});

test("guarded model service treats an absent recommendation batch as an empty run", async () => {
  const adapter = { explain: async () => { throw new Error("adapter should not run"); } };
  const result = await new GuardedModelService({ adapter }).explainRecommendations(snapshot, snapshot.teams[0].id);
  assert.equal(result.status, "ready");
  assert.deepEqual(result.report.recommendations, { submitted: 0, accepted: 0, rejected: 0 });
  assert.deepEqual(result.report.explanations, { attempted: 0, accepted: 0, rejected: 0 });
});
