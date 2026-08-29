import { optimizeLineup } from "./lineup-optimizer.js";
const MIN_WAIVER_LINEUP_GAIN = 0.5;
function isLocked(entry, player, now) {
if (entry.locked === true || player?.locked === true) return true;
const kickoff = Date.parse(player?.gameTime);
return Number.isFinite(kickoff) && kickoff <= now;
}
function swappedSnapshot(snapshot, teamId, dropEntry, addPlayerId) {
return {
...snapshot,
rosters: snapshot.rosters.map((roster) => roster.teamId !== teamId ? roster : {
...roster,
entries: roster.entries.map((entry) => entry === dropEntry ? { playerId: addPlayerId, lineupSlot: "BE" } : entry)
})
};
}
export function evaluateAcquisitionCapacity(snapshot, teamId) {
const team = snapshot?.teams?.find((item) => item.id === teamId);
if (!team) return Object.freeze({ status: "missing-team", seasonRemaining: null, matchupRemaining: null, reason: "Selected team acquisition data is unavailable." });
const settings = snapshot?.league?.waiver || {}; const usage = team.acquisition || {};
const remaining = (limit, used) => Number.isInteger(limit) && limit >= 0 && Number.isInteger(used) ? Math.max(0, limit - used) : null;
const seasonRemaining = remaining(settings.acquisitionLimit, usage.seasonAcquisitions);
const matchupRemaining = remaining(settings.matchupAcquisitionLimit, usage.matchupAcquisitions);
const exhausted = seasonRemaining === 0 || matchupRemaining === 0;
const seasonVerified = settings.acquisitionLimit === -1 || seasonRemaining != null;
const matchupVerified = settings.matchupAcquisitionLimit === -1 || matchupRemaining != null;
const reason = seasonRemaining === 0 ? "ESPN reports that the season acquisition limit is exhausted." : matchupRemaining === 0 ? `ESPN reports that the Week ${snapshot.currentWeek} acquisition limit is exhausted.` : null;
return Object.freeze({ status: exhausted ? "exhausted" : seasonVerified && matchupVerified ? "available" : "unverified", seasonRemaining, matchupRemaining, reason });
}
export function buildRosterAwareWaiverIdeas(snapshot, teamId, now = Date.now(), limit = 8) {
if (!Array.isArray(snapshot.availablePlayers)) return { status: "missing-availability", items: [], limitations: [] };
const roster = snapshot.rosters.find((item) => item.teamId === teamId);
if (!roster) return { status: "missing-roster", items: [], limitations: [] };
const capacity = evaluateAcquisitionCapacity(snapshot, teamId);
if (capacity.status === "exhausted") return { status: "acquisition-limit-reached", items: [], limitations: [capacity.reason], capacity };
const players = new Map(snapshot.players.map((player) => [player.id, player]));
const baseline = optimizeLineup(snapshot, teamId, now);
if (!baseline.assignments?.length) return { status: "incomplete-lineup", items: [], limitations: [baseline.reason] };
const dropEntries = roster.entries.filter((entry) => entry.lineupSlot === "BE" && !isLocked(entry, players.get(entry.playerId), now));
const available = snapshot.availablePlayers.map((playerId) => players.get(playerId)).filter((player) => player?.projection != null && !isLocked({}, player, now));
const candidates = [];
for (const add of available) {
for (const dropEntry of dropEntries) {
const drop = players.get(dropEntry.playerId);
if (!drop) continue;
const result = optimizeLineup(swappedSnapshot(snapshot, teamId, dropEntry, add.id), teamId, now);
if (!result.assignments?.length) continue;
const lineupGain = +(result.projectedTotal - baseline.projectedTotal).toFixed(1);
if (lineupGain < MIN_WAIVER_LINEUP_GAIN) continue;
candidates.push(Object.freeze({
add, drop, lineupGain,
projectedTotal: result.projectedTotal,
changes: result.recommendedChanges,
reason: `Raises the strongest known legal lineup from ${baseline.projectedTotal.toFixed(1)} to ${result.projectedTotal.toFixed(1)} projected points.`,
horizon: "current-week"
}));
}
}
candidates.sort((left, right) => right.lineupGain - left.lineupGain || right.add.projection - left.add.projection);
const usedAdds = new Set(); const usedDrops = new Set();
const items = candidates.filter((item) => {
if (usedAdds.has(item.add.id) || usedDrops.has(item.drop.id)) return false;
usedAdds.add(item.add.id); usedDrops.add(item.drop.id); return true;
}).slice(0, limit);
const team = snapshot.teams?.find((item) => item.id === teamId); const limitations = ["ESPN availability is authoritative at the latest refresh."];
limitations.push(capacity.status === "available" ? "Known ESPN acquisition limits and usage were checked before evaluating moves." : "ESPN acquisition usage or limits are incomplete, so remaining moves cannot be verified.");
limitations.push(team?.acquisition?.waiverRank == null ? "ESPN waiver priority is unavailable; no claim outcome is predicted." : `ESPN waiver priority is ${team.acquisition.waiverRank}; claim outcomes are not predicted.`);
if (baseline.status === "best-known") limitations.push("Some roster projections are missing, so gains use the strongest complete lineup among known projections.");
return { status: "ready", baselineTotal: baseline.projectedTotal, items, limitations, capacity };
}
