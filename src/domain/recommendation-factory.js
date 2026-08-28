import { validateRecommendation } from "./recommendation-contract.js";

export function createRecommendation(fields) {
  const value = Object.freeze({ id: fields.id, kind: fields.kind, status: fields.status, confidence: fields.confidence, inputs: Object.freeze([...(fields.inputs || [])]), limitations: Object.freeze([...(fields.limitations || [])]), sourceCapturedAt: fields.sourceCapturedAt ?? null, payload: Object.freeze({ ...(fields.payload || {}) }) });
  const validation = validateRecommendation(value);
  if (!validation.valid) throw new Error(`Invalid recommendation: ${validation.errors.join(" ")}`);
  return value;
}
