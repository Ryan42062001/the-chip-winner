import { isStarter } from "./model.js";
export function buildRosterPlan(snapshot, teamId, reconciliation = null) {
const roster = snapshot.rosters.find((item) => item.teamId === teamId);
if (!roster) return { status: "missing-roster", positions: [], byeConflicts: [], playoff: [] };
const players = new Map(snapshot.players.map((player) => [player.id, player]));
const positionMap = new Map();
const byeMap = new Map();
for (const entry of roster.entries) {
const player = players.get(entry.playerId);
if (!player || entry.lineupSlot === "IR") continue;
if (!positionMap.has(player.position)) positionMap.set(player.position, { position: player.position, players: [] });
positionMap.get(player.position).players.push({ player, lineupSlot: entry.lineupSlot, starter: isStarter(entry.lineupSlot) });
if (isStarter(entry.lineupSlot) && Number.isInteger(player.byeWeek)) {
if (!byeMap.has(player.byeWeek)) byeMap.set(player.byeWeek, []);
byeMap.get(player.byeWeek).push(player);
}
}
const positions = [...positionMap.values()].map((group) => {
group.players.sort((a, b) => Number(b.starter) - Number(a.starter) || (b.player.projection ?? -1) - (a.player.projection ?? -1));
return Object.freeze({ ...group, players: Object.freeze(group.players), depth: group.players.length, starterCount: group.players.filter((item) => item.starter).length, benchCount: group.players.filter((item) => !item.starter).length, totalCount: group.players.length, knownProjectionCount: group.players.filter((item) => item.player.projection != null).length });
}).sort((a, b) => a.position.localeCompare(b.position));
const byeConflicts = [...byeMap.entries()].filter(([, playersForBye]) => playersForBye.length > 1).map(([week, playersForBye]) => Object.freeze({ week, players: Object.freeze(playersForBye), count: playersForBye.length }));
const playoff = roster.entries.map((entry) => {
const player = players.get(entry.playerId); const ranking = reconciliation?.byPlayerId?.[entry.playerId];
return ranking?.playoffScheduleStrength != null ? { player, lineupSlot: entry.lineupSlot, rank: ranking.rank, strength: ranking.playoffScheduleStrength } : null;
}).filter(Boolean).sort((a, b) => a.strength - b.strength || a.rank - b.rank).slice(0, 8);
const futureWeeks = Array.isArray(snapshot.futureWeeks) ? snapshot.futureWeeks : [];
return Object.freeze({ status: "ready", positions: Object.freeze(positions), byeConflicts: Object.freeze(byeConflicts), playoff: Object.freeze(playoff), horizon: Object.freeze({ status: futureWeeks.length ? "available" : "missing", weeks: Object.freeze(futureWeeks) }), limitations: Object.freeze(["Depth counts rostered players by listed NFL position; FLEX/OP eligibility can cover multiple positions.", "Playoff schedule strength is shown only when supplied by the imported FantasyPros file.", "No future fantasy points are inferred."]) });
}
