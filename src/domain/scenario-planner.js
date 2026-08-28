/**
 * Build a read-only scenario planning result from explicitly supplied future inputs.
 * ESPN league state is never mutated and missing projections remain unavailable.
 */
export function buildScenarioPlan(snapshot, teamId, options = {}) {
  const roster = snapshot?.rosters?.find((item) => item.teamId === teamId);
  const weeks = Array.isArray(options.weeks) ? options.weeks.filter(Number.isInteger) : [];
  if (!roster) return Object.freeze({ status: "missing-roster", weeks: [], limitations: ["Roster data is unavailable."] });
  const waiverResult = buildRosterAwareWaiverIdeas(snapshot, teamId);
  const currentWeekScenarios = (waiverResult.items || []).map((item, index) => {
    const recommendation = { id: `waiver-${teamId}-${index}`, kind: "scenario", status: "review", confidence: "medium", inputs: ["ESPN availability", "ESPN current-week projections", "ESPN lineup rules"], limitations: waiverResult.limitations || [], payload: item };
    const validation = validateRecommendation(recommendation);
    return validation.valid ? Object.freeze(recommendation) : null;
  }).filter(Boolean);
  const status = weeks.length ? "ready" : "missing-future-inputs";
  return Object.freeze({ status, weeks: Object.freeze(weeks), scenarios: Object.freeze([]), currentWeekScenarios: Object.freeze(currentWeekScenarios), limitations: Object.freeze(weeks.length ? ["Future scenario calculations require week-by-week player projections.", "This planner is read-only and does not modify ESPN league state."] : ["Future-week projections were not supplied by the connected sources.", "Current-week scenarios remain available when ESPN availability and projections are present.", "No future fantasy points or scenario winner are inferred."]) });
}
import { buildRosterAwareWaiverIdeas } from "./waiver-engine.js";
import { validateRecommendation } from "./recommendation-contract.js";
