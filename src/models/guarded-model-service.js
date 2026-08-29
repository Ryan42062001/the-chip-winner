import { buildModelEvaluationReport, evaluateExplanation, evaluateRecommendationBatch } from "../domain/model-evaluator.js";
import { buildModelContext } from "../domain/model-context.js";
export class GuardedModelService {
constructor({ adapter }) { if (!adapter?.explain) throw new Error("A model adapter is required."); this.adapter = adapter; }
async explainRecommendations(snapshot, teamId, recommendations) {
const submitted = Array.isArray(recommendations) ? recommendations : [];
const evaluation = evaluateRecommendationBatch(submitted, snapshot, { teamId });
const acceptedIds = new Set(evaluation.results.filter((item) => item.valid).map((item) => item.id));
const accepted = submitted.filter((item) => acceptedIds.has(item.id));
const contextResult = buildModelContext(snapshot, teamId, accepted);
if (!contextResult.packet) return Object.freeze({ status: "blocked", explanations: [], explanationEvaluations: [], evaluation, report: buildModelEvaluationReport(evaluation, [], submitted.length), errors: contextResult.errors });
const explanations = []; const explanationEvaluations = []; const errors = [];
for (const recommendation of accepted) {
try {
const explanation = await this.adapter.explain(contextResult.packet, recommendation);
const explanationEvaluation = evaluateExplanation(explanation, recommendation);
explanationEvaluations.push(Object.freeze({ recommendationId: recommendation.id, ...explanationEvaluation }));
if (explanationEvaluation.valid) explanations.push(explanation);
else errors.push(...explanationEvaluation.errors.map((error) => `${recommendation.id}: ${error}`));
} catch (error) { const message = error instanceof Error ? error.message : "Unknown adapter error."; explanationEvaluations.push(Object.freeze({ recommendationId: recommendation.id, valid: false, errors: Object.freeze([message]), issues: Object.freeze([Object.freeze({ code: "adapter-failure", message })]) })); errors.push(`${recommendation.id}: adapter failed: ${message}`); }
}
const partial = evaluation.failed || explanationEvaluations.some((item) => !item.valid);
return Object.freeze({ status: partial ? "partial" : "ready", explanations: Object.freeze(explanations), explanationEvaluations: Object.freeze(explanationEvaluations), evaluation, report: buildModelEvaluationReport(evaluation, explanationEvaluations, submitted.length), errors: Object.freeze(errors) });
}
}
