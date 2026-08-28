import test from "node:test";
import assert from "node:assert/strict";
import snapshot from "../src/data/sample-espn-snapshot.json" with { type: "json" };
import { evaluateRecommendationBatch } from "../src/domain/model-evaluator.js";

const base = { id: "r-1", kind: "scenario", status: "review", confidence: "medium", inputs: ["ESPN"], limitations: ["Review before acting."] };

test("model evaluator accepts traceable recommendations with known available players", () => {
  const addPlayerId = snapshot.availablePlayers[0]; const dropPlayerId = snapshot.rosters[0].entries.at(-1).playerId;
  const result = evaluateRecommendationBatch([{ ...base, payload: { addPlayerId, dropPlayerId } }], snapshot);
  assert.equal(result.valid, true); assert.equal(result.passed, 1);
});

test("model evaluator rejects invented identities and unsupported availability", () => {
  const result = evaluateRecommendationBatch([{ ...base, payload: { addPlayerId: "invented", dropPlayerId: "missing" } }], snapshot);
  assert.equal(result.valid, false); assert.match(result.results[0].errors.join(" "), /Unknown player/); assert.match(result.results[0].errors.join(" "), /not explicitly available/);
});
