import { validateRecommendation } from "./recommendation-contract.js";
import { isStarter } from "./model.js";

function issue(code, message) { return Object.freeze({ code, message }); }
const ALLOWED_EXPLANATION_KEYS = new Set(["provider", "model", "recommendationId", "text", "generatedAt"]);
const MAX_EXPLANATION_LENGTH = 4000;

function issueCounts(results) {
  const counts = {};
  for (const result of results) for (const item of result.issues || []) counts[item.code] = (counts[item.code] || 0) + 1;
  return Object.freeze(Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right))));
}

export function evaluateRecommendationBatch(recommendations, snapshot, { teamId = null } = {}) {
  const playerIds = new Set((snapshot?.players || []).map((player) => player.id));
  const availableIds = new Set(snapshot?.availablePlayers || []);
  const selectedRoster = teamId ? (snapshot?.rosters || []).find((roster) => roster.teamId === teamId) : null;
  const results = (recommendations || []).map((recommendation) => {
    const issues = validateRecommendation(recommendation).errors.map((message) => issue("contract-invalid", message));
    if (recommendation?.status !== "unavailable" && !recommendation?.inputs?.some((item) => typeof item === "string" && item.trim())) issues.push(issue("named-input-missing", "Actionable or review recommendations require at least one named input."));
    if (recommendation?.sourceCapturedAt && snapshot?.meta?.capturedAt && recommendation.sourceCapturedAt !== snapshot.meta.capturedAt) issues.push(issue("snapshot-timestamp-mismatch", "Recommendation sourceCapturedAt does not match the active ESPN snapshot."));
    const referencedIds = [recommendation?.payload?.playerId, recommendation?.payload?.addPlayerId, recommendation?.payload?.dropPlayerId].filter(Boolean);
    for (const id of referencedIds) if (!playerIds.has(id)) issues.push(issue("unknown-player", `Unknown player reference: ${id}.`));
    if (recommendation?.kind === "waiver" || recommendation?.kind === "scenario") {
      const addId = recommendation?.payload?.addPlayerId;
      if (addId && !availableIds.has(addId)) issues.push(issue("add-unavailable", `Player ${addId} is not explicitly available in ESPN data.`));
      const dropId = recommendation?.payload?.dropPlayerId;
      if (dropId && teamId) {
        const entry = selectedRoster?.entries?.find((item) => item.playerId === dropId);
        if (!entry) issues.push(issue("drop-not-on-team", `Drop player ${dropId} is not on selected team ${teamId}.`));
        else if (isStarter(entry.lineupSlot) || entry.lineupSlot === "IR" || entry.locked) issues.push(issue("illegal-drop", `Drop player ${dropId} is not an unlocked bench player.`));
      }
    }
    return Object.freeze({ id: recommendation?.id || null, valid: issues.length === 0, errors: Object.freeze(issues.map((item) => item.message)), issues: Object.freeze(issues) });
  });
  return Object.freeze({ valid: results.every((item) => item.valid), passed: results.filter((item) => item.valid).length, failed: results.filter((item) => !item.valid).length, issueCounts: issueCounts(results), results: Object.freeze(results) });
}

export function evaluateExplanation(explanation, recommendation) {
  const issues = [];
  if (!explanation || typeof explanation !== "object" || Array.isArray(explanation)) {
    const invalid = [issue("explanation-invalid", "Explanation must be an object.")];
    return Object.freeze({ valid: false, errors: Object.freeze(invalid.map((item) => item.message)), issues: Object.freeze(invalid) });
  }
  if (explanation.recommendationId !== recommendation?.id) issues.push(issue("recommendation-id-mismatch", "Explanation recommendationId does not match the evaluated recommendation."));
  if (typeof explanation.provider !== "string" || !explanation.provider.trim()) issues.push(issue("provider-missing", "Explanation provider is required."));
  if (typeof explanation.text !== "string" || !explanation.text.trim()) issues.push(issue("explanation-text-missing", "Explanation text is required."));
  if (typeof explanation.text === "string" && explanation.text.length > MAX_EXPLANATION_LENGTH) issues.push(issue("explanation-too-long", `Explanation text exceeds ${MAX_EXPLANATION_LENGTH} characters.`));
  if (explanation.model != null && (typeof explanation.model !== "string" || !explanation.model.trim())) issues.push(issue("model-invalid", "Explanation model must be a non-empty string or null."));
  if (explanation.generatedAt != null && !Number.isFinite(Date.parse(explanation.generatedAt))) issues.push(issue("explanation-timestamp-invalid", "Explanation generatedAt must be an ISO date-time or null."));
  for (const key of Object.keys(explanation)) if (!ALLOWED_EXPLANATION_KEYS.has(key)) issues.push(issue("explanation-field-unexpected", `Unexpected explanation field: ${key}.`));
  const text = String(explanation.text || "").toLowerCase();
  const namedInputs = (recommendation?.inputs || []).filter((item) => typeof item === "string" && item.trim());
  if (namedInputs.length && !namedInputs.some((item) => text.includes(item.toLowerCase()))) issues.push(issue("input-not-cited", "Explanation must name at least one recommendation input."));
  for (const limitation of recommendation?.limitations || []) if (typeof limitation === "string" && limitation.trim() && !text.includes(limitation.toLowerCase())) issues.push(issue("limitation-omitted", `Explanation omits limitation: ${limitation}`));
  return Object.freeze({ valid: issues.length === 0, errors: Object.freeze(issues.map((item) => item.message)), issues: Object.freeze(issues) });
}

export function buildModelEvaluationReport(evaluation, explanationEvaluations = [], submittedCount = null) {
  const explanationIssueCounts = issueCounts(explanationEvaluations);
  const combinedCounts = { ...(evaluation?.issueCounts || {}) };
  for (const [code, count] of Object.entries(explanationIssueCounts)) combinedCounts[code] = (combinedCounts[code] || 0) + count;
  const acceptedExplanations = explanationEvaluations.filter((item) => item.valid).length;
  return Object.freeze({
    schemaVersion: 1,
    recommendations: Object.freeze({ submitted: submittedCount ?? ((evaluation?.passed || 0) + (evaluation?.failed || 0)), accepted: evaluation?.passed || 0, rejected: evaluation?.failed || 0 }),
    explanations: Object.freeze({ attempted: explanationEvaluations.length, accepted: acceptedExplanations, rejected: explanationEvaluations.length - acceptedExplanations }),
    issueCounts: Object.freeze(Object.fromEntries(Object.entries(combinedCounts).sort(([left], [right]) => left.localeCompare(right))))
  });
}
