/**
 * Build a read-only scenario planning result from explicitly supplied future inputs.
 * ESPN league state is never mutated and missing projections remain unavailable.
 */
export function buildScenarioPlan(snapshot, teamId, options = {}) {
  const roster = snapshot?.rosters?.find((item) => item.teamId === teamId);
  const weeks = Array.isArray(options.weeks) ? options.weeks.filter(Number.isInteger) : [];
  if (!roster) return Object.freeze({ status: "missing-roster", weeks: [], limitations: ["Roster data is unavailable."] });
  if (!weeks.length) return Object.freeze({ status: "missing-future-inputs", weeks: [], limitations: ["Future-week projections were not supplied by the connected sources.", "No future fantasy points or scenario winner are inferred."] });
  return Object.freeze({ status: "ready", weeks: Object.freeze(weeks), scenarios: Object.freeze([]), limitations: Object.freeze(["Scenario calculations require week-by-week player projections.", "This planner is read-only and does not modify ESPN league state."]) });
}
