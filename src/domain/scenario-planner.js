import { buildRosterAwareWaiverIdeas } from "./waiver-engine.js";
import { validateRecommendation } from "./recommendation-contract.js";
import { optimizeLineup } from "./lineup-optimizer.js";
import { indexFutureProjections } from "../providers/projections/future-projection-provider.js";

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
  const weeklyBaseline = [];
  if (options.projectionSet && options.identityMap instanceof Map) {
    const projectionIndex = indexFutureProjections(options.projectionSet);
    const espnToProvider = new Map([...options.identityMap].map(([providerId, espnId]) => [espnId, providerId]));
    for (const week of weeks) {
      const weeklySnapshot = { ...snapshot, currentWeek: week, players: snapshot.players.map((player) => ({ ...player, projection: projectionIndex.get(`${espnToProvider.get(player.id)}:${week}`) ?? null })) };
      const result = optimizeLineup(weeklySnapshot, teamId);
      weeklyBaseline.push(Object.freeze({ week, status: result.status, projectedTotal: result.projectedTotal ?? null, knownAssignments: result.assignments?.length || 0, reason: result.reason }));
    }
  }
  const status = weeks.length && weeklyBaseline.length ? "ready" : "missing-future-inputs";
  return Object.freeze({ status, weeks: Object.freeze(weeks), scenarios: Object.freeze([]), weeklyBaseline: Object.freeze(weeklyBaseline), currentWeekScenarios: Object.freeze(currentWeekScenarios), limitations: Object.freeze(status === "ready" ? ["Weekly totals use only explicitly mapped provider projections.", "This planner is read-only and does not modify ESPN league state."] : ["Future-week projections and an explicit identity map were not both supplied.", "Current-week scenarios remain available when ESPN availability and projections are present.", "No future fantasy points or scenario winner are inferred."]) });
}
