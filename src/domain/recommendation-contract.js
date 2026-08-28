const KINDS = new Set(["lineup", "waiver", "alert", "scenario"]);
const STATUSES = new Set(["actionable", "review", "unavailable"]);
const CONFIDENCE = new Set(["high", "medium", "low", "none"]);

export function validateRecommendation(value) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return { valid: false, errors: ["Recommendation must be an object."] };
  if (typeof value.id !== "string" || !value.id.trim()) errors.push("id is required.");
  if (!KINDS.has(value.kind)) errors.push("kind must be lineup, waiver, alert, or scenario.");
  if (!STATUSES.has(value.status)) errors.push("status is invalid.");
  if (!CONFIDENCE.has(value.confidence)) errors.push("confidence is invalid.");
  if (!Array.isArray(value.inputs) || value.inputs.some((item) => typeof item !== "string")) errors.push("inputs must be an array of strings.");
  if (!Array.isArray(value.limitations) || value.limitations.some((item) => typeof item !== "string")) errors.push("limitations must be an array of strings.");
  if (value.status === "unavailable" && (!value.limitations?.length)) errors.push("unavailable recommendations require a limitation.");
  return { valid: errors.length === 0, errors };
}
