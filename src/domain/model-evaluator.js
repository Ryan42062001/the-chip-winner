import { validateRecommendation } from "./recommendation-contract.js";
import { isStarter } from "./model.js";

export function evaluateRecommendationBatch(recommendations, snapshot, { teamId = null } = {}) {
  const playerIds = new Set((snapshot?.players || []).map((player) => player.id));
  const availableIds = new Set(snapshot?.availablePlayers || []);
  const selectedRoster = teamId ? (snapshot?.rosters || []).find((roster) => roster.teamId === teamId) : null;
  const results = (recommendations || []).map((recommendation) => {
    const errors = [...validateRecommendation(recommendation).errors];
    if (recommendation?.status !== "unavailable" && !recommendation?.inputs?.some((item) => typeof item === "string" && item.trim())) errors.push("Actionable or review recommendations require at least one named input.");
    if (recommendation?.sourceCapturedAt && snapshot?.meta?.capturedAt && recommendation.sourceCapturedAt !== snapshot.meta.capturedAt) errors.push("Recommendation sourceCapturedAt does not match the active ESPN snapshot.");
    const referencedIds = [recommendation?.payload?.playerId, recommendation?.payload?.addPlayerId, recommendation?.payload?.dropPlayerId].filter(Boolean);
    for (const id of referencedIds) if (!playerIds.has(id)) errors.push(`Unknown player reference: ${id}.`);
    if (recommendation?.kind === "waiver" || recommendation?.kind === "scenario") {
      const addId = recommendation?.payload?.addPlayerId;
      if (addId && !availableIds.has(addId)) errors.push(`Player ${addId} is not explicitly available in ESPN data.`);
      const dropId = recommendation?.payload?.dropPlayerId;
      if (dropId && teamId) {
        const entry = selectedRoster?.entries?.find((item) => item.playerId === dropId);
        if (!entry) errors.push(`Drop player ${dropId} is not on selected team ${teamId}.`);
        else if (isStarter(entry.lineupSlot) || entry.lineupSlot === "IR" || entry.locked) errors.push(`Drop player ${dropId} is not an unlocked bench player.`);
      }
    }
    return Object.freeze({ id: recommendation?.id || null, valid: errors.length === 0, errors: Object.freeze(errors) });
  });
  return Object.freeze({ valid: results.every((item) => item.valid), passed: results.filter((item) => item.valid).length, failed: results.filter((item) => !item.valid).length, results: Object.freeze(results) });
}

export function evaluateExplanation(explanation, recommendation) {
  const errors = [];
  if (!explanation || typeof explanation !== "object" || Array.isArray(explanation)) return Object.freeze({ valid: false, errors: Object.freeze(["Explanation must be an object."]) });
  if (explanation.recommendationId !== recommendation?.id) errors.push("Explanation recommendationId does not match the evaluated recommendation.");
  if (typeof explanation.provider !== "string" || !explanation.provider.trim()) errors.push("Explanation provider is required.");
  if (typeof explanation.text !== "string" || !explanation.text.trim()) errors.push("Explanation text is required.");
  const text = String(explanation.text || "").toLowerCase();
  const namedInputs = (recommendation?.inputs || []).filter((item) => typeof item === "string" && item.trim());
  if (namedInputs.length && !namedInputs.some((item) => text.includes(item.toLowerCase()))) errors.push("Explanation must name at least one recommendation input.");
  for (const limitation of recommendation?.limitations || []) if (typeof limitation === "string" && limitation.trim() && !text.includes(limitation.toLowerCase())) errors.push(`Explanation omits limitation: ${limitation}`);
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}
