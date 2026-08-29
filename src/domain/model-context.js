import { evaluateRecommendationBatch } from "./model-evaluator.js";
import { buildModelContextPacket } from "./model-context-packet.js";
export function buildModelContext(snapshot, teamId, recommendations = []) {
const evaluation = evaluateRecommendationBatch(recommendations, snapshot, { teamId });
const acceptedIds = new Set(evaluation.results.filter((item) => item.valid).map((item) => item.id));
const result = buildModelContextPacket(snapshot, teamId, recommendations.filter((item) => acceptedIds.has(item.id)));
return result.packet ? Object.freeze({ ...result, status: evaluation.failed ? "partial" : "ready", errors: Object.freeze(evaluation.results.flatMap((item) => item.errors)) }) : result;
}
