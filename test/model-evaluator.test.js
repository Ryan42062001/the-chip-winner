import test from "node:test";
import assert from "node:assert/strict";
import snapshot from "../src/data/sample-espn-snapshot.json" with { type: "json" };
import { buildModelEvaluationReport, evaluateExplanation, evaluateRecommendationBatch } from "../src/domain/model-evaluator.js";

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

test("model evaluator protects starters and players outside the selected roster from drops", () => {
  const addPlayerId = snapshot.availablePlayers[0];
  const starterId = snapshot.rosters[0].entries.find((entry) => entry.lineupSlot === "QB").playerId;
  const opponentId = snapshot.rosters[1].entries[0].playerId;
  const result = evaluateRecommendationBatch([
    { ...base, id: "starter", payload: { addPlayerId, dropPlayerId: starterId } },
    { ...base, id: "opponent", payload: { addPlayerId, dropPlayerId: opponentId } },
  ], snapshot, { teamId: snapshot.teams[0].id });
  assert.equal(result.valid, false);
  assert.match(result.results[0].errors.join(" "), /unlocked bench/);
  assert.match(result.results[1].errors.join(" "), /not on selected team/);
});

test("model evaluator rejects stale provenance and untraceable review output", () => {
  const stale = { ...base, sourceCapturedAt: "2026-01-01T00:00:00Z" };
  const untraceable = { ...base, id: "r-2", inputs: [] };
  const result = evaluateRecommendationBatch([stale, untraceable], snapshot);
  assert.match(result.results[0].errors.join(" "), /does not match/);
  assert.match(result.results[1].errors.join(" "), /named input/);
});

test("explanation evaluation requires provenance and every stated limitation", () => {
  const valid = evaluateExplanation({ provider: "fixture", recommendationId: base.id, text: "ESPN supports this review. Review before acting." }, base);
  const invalid = evaluateExplanation({ provider: "fixture", recommendationId: "wrong", text: "Looks good." }, base);
  assert.equal(valid.valid, true);
  assert.equal(invalid.valid, false);
  assert.match(invalid.errors.join(" "), /recommendationId/);
  assert.match(invalid.errors.join(" "), /input/);
  assert.match(invalid.errors.join(" "), /omits limitation/);
});

test("model evaluator exposes stable aggregate issue codes", () => {
  const result = evaluateRecommendationBatch([{ ...base, inputs: [], payload: { addPlayerId: "invented" } }], snapshot);
  assert.equal(result.issueCounts["named-input-missing"], 1);
  assert.equal(result.issueCounts["unknown-player"], 1);
  assert.equal(result.issueCounts["add-unavailable"], 1);
  assert.deepEqual(result.results[0].issues.map((item) => item.code), ["named-input-missing", "unknown-player", "add-unavailable"]);
});

test("explanation evaluator exposes stable source and limitation issue codes", () => {
  const result = evaluateExplanation({ recommendationId: "wrong", provider: "", text: "Unsupported conclusion." }, base);
  assert.deepEqual(result.issues.map((item) => item.code), ["recommendation-id-mismatch", "provider-missing", "input-not-cited", "limitation-omitted"]);
});

test("model evaluation report contains aggregate counts but no recommendation or player identities", () => {
  const recommendationEvaluation = evaluateRecommendationBatch([{ ...base, id: "private-recommendation", payload: { playerId: "private-player" } }], snapshot);
  const explanationEvaluation = evaluateExplanation({ provider: "fixture", recommendationId: "wrong", text: "No source." }, base);
  const report = buildModelEvaluationReport(recommendationEvaluation, [{ recommendationId: base.id, ...explanationEvaluation }], 1);
  assert.deepEqual(report.recommendations, { submitted: 1, accepted: 0, rejected: 1 });
  assert.deepEqual(report.explanations, { attempted: 1, accepted: 0, rejected: 1 });
  assert.equal(report.issueCounts["unknown-player"], 1);
  assert.doesNotMatch(JSON.stringify(report), /private-recommendation|private-player/);
});
