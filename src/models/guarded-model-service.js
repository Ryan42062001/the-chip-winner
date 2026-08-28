import { evaluateRecommendationBatch } from "../domain/model-evaluator.js";
import { buildModelContext } from "../domain/model-context.js";

export class GuardedModelService {
  constructor({ adapter }) { if (!adapter?.explain) throw new Error("A model adapter is required."); this.adapter = adapter; }
  async explainRecommendations(snapshot, teamId, recommendations) {
    const evaluation = evaluateRecommendationBatch(recommendations, snapshot);
    const acceptedIds = new Set(evaluation.results.filter((item) => item.valid).map((item) => item.id));
    const accepted = recommendations.filter((item) => acceptedIds.has(item.id));
    const contextResult = buildModelContext(snapshot, teamId, accepted);
    if (!contextResult.packet) return Object.freeze({ status: "blocked", explanations: [], evaluation, errors: contextResult.errors });
    const explanations = [];
    for (const recommendation of accepted) explanations.push(await this.adapter.explain(contextResult.packet, recommendation));
    return Object.freeze({ status: evaluation.failed ? "partial" : "ready", explanations: Object.freeze(explanations), evaluation, errors: Object.freeze([]) });
  }
}
