import { buildRosterAwareWaiverIdeas } from "./waiver-engine.js";
import { validateRecommendation } from "./recommendation-contract.js";
import { createRecommendation } from "./recommendation-factory.js";
import { optimizeLineup } from "./lineup-optimizer.js";
import { indexFutureProjections } from "../providers/projections/future-projection-provider.js";
function projectionCoverage(playerIds, week, espnToProvider, projectionIndex) {
const unmappedPlayerIds = playerIds.filter((id) => !espnToProvider.has(id));
const missingProjectionPlayerIds = playerIds.filter((id) => espnToProvider.has(id) && !projectionIndex.has(`${espnToProvider.get(id)}:${week}`));
return Object.freeze({
mappedProjectionCount: playerIds.length - unmappedPlayerIds.length - missingProjectionPlayerIds.length,
completeCoverage: !unmappedPlayerIds.length && !missingProjectionPlayerIds.length,
unmappedPlayerIds: Object.freeze(unmappedPlayerIds),
missingProjectionPlayerIds: Object.freeze(missingProjectionPlayerIds)
});
}
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
const recommendation = createRecommendation({ id: `waiver-${teamId}-${index}`, kind: "scenario", status: "review", confidence: "medium", inputs: ["ESPN availability", "ESPN current-week projections", "ESPN lineup rules"], limitations: waiverResult.limitations || [], sourceCapturedAt: snapshot.meta?.capturedAt || null, payload: item });
const validation = validateRecommendation(recommendation);
return validation.valid ? Object.freeze(recommendation) : null;
}).filter(Boolean);
const weeklyBaseline = [];
const scenarioResults = [];
const rejectedScenarios = [];
if (options.projectionSet && options.identityMap instanceof Map) {
const projectionIndex = indexFutureProjections(options.projectionSet);
const espnToProvider = new Map([...options.identityMap].map(([providerId, espnId]) => [espnId, providerId]));
for (const week of weeks) {
const weeklySnapshot = { ...snapshot, currentWeek: week, players: snapshot.players.map((player) => ({ ...player, projection: projectionIndex.get(`${espnToProvider.get(player.id)}:${week}`) ?? null })) };
const result = optimizeLineup(weeklySnapshot, teamId);
const rosterPlayerIds = roster.entries.map((entry) => entry.playerId);
const weekCoverage = projectionCoverage(rosterPlayerIds, week, espnToProvider, projectionIndex);
weeklyBaseline.push(Object.freeze({ week, status: result.status, projectedTotal: result.projectedTotal ?? null, knownAssignments: result.assignments?.length || 0, mappedProjectionCount: weekCoverage.mappedProjectionCount, rosterPlayerCount: rosterPlayerIds.length, completeCoverage: weekCoverage.completeCoverage, unmappedPlayerIds: weekCoverage.unmappedPlayerIds, missingProjectionPlayerIds: weekCoverage.missingProjectionPlayerIds, reason: result.reason }));
}
for (const scenario of options.scenarios || []) {
const dropEntry = roster.entries.find((entry) => entry.playerId === scenario.dropPlayerId);
const addPlayer = snapshot.players.find((player) => player.id === scenario.addPlayerId);
const dropPlayer = snapshot.players.find((player) => player.id === scenario.dropPlayerId);
const kickoff = Date.parse(dropPlayer?.gameTime); const locked = dropEntry?.locked === true || dropPlayer?.locked === true || (Number.isFinite(kickoff) && kickoff <= (options.now ?? Date.now()));
let rejection = null;
if (!dropEntry || !addPlayer) rejection = "Scenario references a player outside the current snapshot.";
else if (dropEntry.lineupSlot !== "BE") rejection = "Only bench players can be dropped by the scenario planner.";
else if (locked) rejection = "The proposed drop player is locked.";
else if (!snapshot.availablePlayers?.includes(addPlayer.id)) rejection = "The proposed add is not explicitly available in ESPN data.";
if (rejection) { rejectedScenarios.push(Object.freeze({ id: scenario.id || "unknown", reason: rejection })); continue; }
const weekly = weeks.map((week) => {
const weeklyPlayers = snapshot.players.map((player) => ({ ...player, projection: projectionIndex.get(`${espnToProvider.get(player.id)}:${week}`) ?? null }));
const scenarioSnapshot = { ...snapshot, currentWeek: week, players: weeklyPlayers, rosters: snapshot.rosters.map((item) => item.teamId !== teamId ? item : { ...item, entries: item.entries.map((entry) => entry.playerId === scenario.dropPlayerId ? { ...entry, playerId: scenario.addPlayerId } : entry) }) };
const result = optimizeLineup(scenarioSnapshot, teamId);
const baselineEntry = weeklyBaseline.find((item) => item.week === week); const baseline = baselineEntry?.projectedTotal;
const scenarioRosterIds = scenarioSnapshot.rosters.find((item) => item.teamId === teamId).entries.map((entry) => entry.playerId);
const weekCoverage = projectionCoverage(scenarioRosterIds, week, espnToProvider, projectionIndex);
const deltaReady = result.projectedTotal != null && baseline != null && baselineEntry.completeCoverage && weekCoverage.completeCoverage;
const deltaUnavailableReason = deltaReady ? null : !baselineEntry?.completeCoverage ? "Baseline roster projection coverage is incomplete." : !weekCoverage.completeCoverage ? "Scenario roster projection coverage is incomplete." : "A complete legal lineup total is unavailable.";
return Object.freeze({ week, projectedTotal: result.projectedTotal ?? null, delta: deltaReady ? +(result.projectedTotal - baseline).toFixed(1) : null, deltaUnavailableReason, status: result.status, mappedProjectionCount: weekCoverage.mappedProjectionCount, rosterPlayerCount: scenarioRosterIds.length, completeCoverage: weekCoverage.completeCoverage, unmappedPlayerIds: weekCoverage.unmappedPlayerIds, missingProjectionPlayerIds: weekCoverage.missingProjectionPlayerIds });
});
scenarioResults.push(Object.freeze({ id: scenario.id || `${scenario.addPlayerId}-for-${scenario.dropPlayerId}`, addPlayerId: scenario.addPlayerId, dropPlayerId: scenario.dropPlayerId, weekly: Object.freeze(weekly) }));
}
}
const status = weeks.length && weeklyBaseline.length ? "ready" : "missing-future-inputs";
const requiredProjectionCells = weeklyBaseline.reduce((total, item) => total + item.rosterPlayerCount, 0);
const mappedProjectionCells = weeklyBaseline.reduce((total, item) => total + item.mappedProjectionCount, 0);
const unmappedPlayerCells = weeklyBaseline.reduce((total, item) => total + item.unmappedPlayerIds.length, 0);
const missingProjectionCells = weeklyBaseline.reduce((total, item) => total + item.missingProjectionPlayerIds.length, 0);
const readyWeeks = weeklyBaseline.filter((item) => item.completeCoverage).map((item) => item.week);
const blockedWeeks = weeklyBaseline.filter((item) => !item.completeCoverage).map((item) => item.week);
const readiness = !weeklyBaseline.length ? "unavailable" : blockedWeeks.length === 0 ? "complete" : readyWeeks.length ? "mixed" : "blocked";
const coverage = Object.freeze({ readiness, completeWeeks: readyWeeks.length, totalWeeks: weeklyBaseline.length, readyWeeks: Object.freeze(readyWeeks), blockedWeeks: Object.freeze(blockedWeeks), mappedProjectionCells, requiredProjectionCells, unmappedPlayerCells, missingProjectionCells, percentage: requiredProjectionCells ? Math.round((mappedProjectionCells / requiredProjectionCells) * 100) : 0 });
const source = options.projectionSet ? Object.freeze({ provider: options.projectionSet.provider || null, scoringFormat: options.projectionSet.scoringFormat || null, capturedAt: options.projectionSet.capturedAt || null, projectionCount: options.projectionSet.projections?.length || 0, identityMappingCount: options.identityMap instanceof Map ? options.identityMap.size : 0 }) : null;
return Object.freeze({ status, weeks: Object.freeze(weeks), source, coverage, scenarios: Object.freeze(scenarioResults), rejectedScenarios: Object.freeze(rejectedScenarios), weeklyBaseline: Object.freeze(weeklyBaseline), currentWeekScenarios: Object.freeze(currentWeekScenarios), limitations: Object.freeze(status === "ready" ? ["Weekly totals use only explicitly mapped provider projections.", "Scenario deltas rerun the legal lineup optimizer against an isolated roster copy.", "Only ESPN-available adds and unlocked bench drops are evaluated.", "This planner is read-only and does not modify ESPN league state."] : ["Future-week projections and an explicit identity map were not both supplied.", "Current-week scenarios remain available when ESPN availability and projections are present.", "No future fantasy points or scenario winner are inferred."]) });
}
export function buildProjectionGapReport(snapshot, plan, identityMap) {
if (!Array.isArray(plan?.weeklyBaseline) || !plan.weeklyBaseline.length) return Object.freeze({ status: "unavailable", records: Object.freeze([]), limitation: "No evaluated future weeks are available." });
const players = new Map((snapshot?.players || []).map((player) => [player.id, player]));
const espnToProvider = identityMap instanceof Map ? new Map([...identityMap].map(([providerId, espnId]) => [espnId, providerId])) : new Map();
const records = plan.weeklyBaseline.flatMap((week) => [
...week.unmappedPlayerIds.map((playerId) => ({ week: week.week, playerId, gapType: "missing-identity-map", providerPlayerId: null })),
...week.missingProjectionPlayerIds.map((playerId) => ({ week: week.week, playerId, gapType: "missing-week-projection", providerPlayerId: espnToProvider.get(playerId) || null }))
]).map((record) => {
const player = players.get(record.playerId);
return Object.freeze({ week: record.week, espnPlayerId: record.playerId, playerName: player?.name || null, proTeam: player?.proTeam || null, position: player?.position || null, gapType: record.gapType, providerPlayerId: record.providerPlayerId });
});
return Object.freeze({ status: records.length ? "gaps" : "complete", records: Object.freeze(records), limitation: records.length ? "Player names are included for human review only; provider joins still require explicit IDs." : null });
}
