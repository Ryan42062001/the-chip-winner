import { validateRecommendation } from "./recommendation-contract.js";

export function evaluateRecommendationBatch(recommendations, snapshot) {
  const playerIds = new Set((snapshot?.players || []).map((player) => player.id));
  const availableIds = new Set(snapshot?.availablePlayers || []);
  const results = (recommendations || []).map((recommendation) => {
    const errors = [...validateRecommendation(recommendation).errors];
    const referencedIds = [recommendation?.payload?.playerId, recommendation?.payload?.addPlayerId, recommendation?.payload?.dropPlayerId].filter(Boolean);
    for (const id of referencedIds) if (!playerIds.has(id)) errors.push(`Unknown player reference: ${id}.`);
    if (recommendation?.kind === "waiver" || recommendation?.kind === "scenario") {
      const addId = recommendation?.payload?.addPlayerId;
      if (addId && !availableIds.has(addId)) errors.push(`Player ${addId} is not explicitly available in ESPN data.`);
    }
    return Object.freeze({ id: recommendation?.id || null, valid: errors.length === 0, errors: Object.freeze(errors) });
  });
  return Object.freeze({ valid: results.every((item) => item.valid), passed: results.filter((item) => item.valid).length, failed: results.filter((item) => !item.valid).length, results: Object.freeze(results) });
}
