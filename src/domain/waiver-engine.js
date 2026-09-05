import { optimizeLineup } from "./lineup-optimizer.js";
import { evaluateTeamIrState } from "./ir-eligibility.js";
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
function rosterRuleViolation(snapshot, roster, dropEntry, add) {
const rules = snapshot.league?.rosterRules; if (!rules) return null;
if (rules.size != null && roster.entries.length > rules.size) return `ESPN roster size limit is ${rules.size}, but the selected roster contains ${roster.entries.length} players.`;
const players = new Map(snapshot.players.map((player) => [player.id, player])); const counts = new Map();
for (const entry of roster.entries) { const position = entry === dropEntry ? add.position : players.get(entry.playerId)?.position; if (position) counts.set(position, (counts.get(position) || 0) + 1); }
const exceeded = (rules.positionLimits || []).find((rule) => rule.limit >= 0 && (counts.get(rule.position) || 0) > rule.limit);
return exceeded ? `ESPN ${exceeded.position} roster limit is ${exceeded.limit}.` : null;
}
function review(status, reason, lineupGain = null, capacity = null) {
return Object.freeze({ status, reason, lineupGain, capacity });
}
function describeIrLimitations(irState) {
const limitations = [];
if (!irState) return limitations;
if (irState.status === "settings-unavailable") limitations.push("ESPN IR slot settings are unavailable; open IR capacity is not inferred.");
if (irState.status === "disabled") limitations.push("ESPN reports no configured IR slots for this league.");
if (irState.grandfatheredEntries?.length) limitations.push(irState.reason);
if (irState.openSlots > 0 && irState.benchPlaceableEntries?.length) {
const candidates = irState.benchPlaceableEntries.slice(0, irState.openSlots).map((item) => item.player.name).join(", ");
limitations.push(`${irState.openSlots} ESPN IR slot${irState.openSlots === 1 ? " is" : "s are"} open. ${candidates} ${irState.benchPlaceableEntries.length === 1 ? "is" : "are"} currently eligible to move from the bench to IR based on an ESPN OUT/IR designation, which can free active-roster space.`);
}
return limitations;
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
const irState = evaluateTeamIrState(snapshot, teamId);
if (irState.status === "invalid") return { status: "incomplete-lineup", items: [], limitations: [irState.reason], irState };
if (irState.status === "unverified") return { status: "incomplete-lineup", items: [], limitations: [irState.reason], irState };
const capacity = evaluateAcquisitionCapacity(snapshot, teamId);
if (capacity.status === "exhausted") return { status: "acquisition-limit-reached", items: [], limitations: [capacity.reason], capacity, irState };
const players = new Map(snapshot.players.map((player) => [player.id, player]));
const baseline = optimizeLineup(snapshot, teamId, now);
if (!baseline.assignments?.length) return { status: "incomplete-lineup", items: [], limitations: [baseline.reason], irState };
const dropEntries = roster.entries.filter((entry) => entry.lineupSlot === "BE" && !isLocked(entry, players.get(entry.playerId), now));
const available = snapshot.availablePlayers.map((playerId) => players.get(playerId)).filter((player) => player?.projection != null && !isLocked({}, player, now));
const candidates = []; const rosterRuleBlocks = new Set();
for (const add of available) {
for (const dropEntry of dropEntries) {
const drop = players.get(dropEntry.playerId);
if (!drop) continue;
const rosterViolation = rosterRuleViolation(snapshot, roster, dropEntry, add); if (rosterViolation) { rosterRuleBlocks.add(rosterViolation); continue; }
const result = optimizeLineup(swappedSnapshot(snapshot, teamId, dropEntry, add.id), teamId, now);
if (!result.assignments?.length) continue;
const lineupGain = +(result.projectedTotal - baseline.projectedTotal).toFixed(1);
if (lineupGain < MIN_WAIVER_LINEUP_GAIN) continue;
candidates.push(Object.freeze({
add, drop, lineupGain,
projectedTotal: result.projectedTotal,
changes: result.recommendedChanges,
replacement: (() => { const benchmark = available.filter((player) => player.id !== add.id && player.position === add.position).sort((a, b) => b.projection - a.projection)[0]; return Object.freeze(benchmark ? { status: "ready", playerId: benchmark.id, projection: benchmark.projection, pointsAbove: +(add.projection - benchmark.projection).toFixed(1) } : { status: "unavailable", playerId: null, projection: null, pointsAbove: null }); })(),
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
limitations.push("Replacement value is the add player's current-week projection minus the highest projected other ESPN-available player at the same position; unavailable benchmarks stay missing.");
limitations.push(snapshot.league?.rosterRules ? "ESPN-reported roster size and position limits were enforced." : "ESPN roster and position limits are unavailable; no rule is inferred.");
limitations.push(...rosterRuleBlocks);
limitations.push(...describeIrLimitations(irState));
limitations.push(capacity.status === "available" ? "Known ESPN acquisition limits and usage were checked before evaluating moves." : "ESPN acquisition usage or limits are incomplete, so remaining moves cannot be verified.");
limitations.push(team?.acquisition?.waiverRank == null ? "ESPN waiver priority is unavailable; no claim outcome is predicted." : `ESPN waiver priority is ${team.acquisition.waiverRank}; claim outcomes are not predicted.`);
if (baseline.status === "best-known") limitations.push("Some roster projections are missing, so gains use the strongest complete lineup among known projections.");
return { status: "ready", baselineTotal: baseline.projectedTotal, items, limitations, capacity, irState };
}
export function revalidateWaiverRecommendation(snapshot, teamId, recommendation, now = Date.now()) {
const addId = recommendation?.add?.id ?? recommendation?.addPlayerId;
const dropId = recommendation?.drop?.id ?? recommendation?.dropPlayerId;
if (!addId || !dropId) return review("unverified", "Prior waiver recommendation player identities are incomplete.");
if (!Array.isArray(snapshot?.availablePlayers)) return review("unverified", "Latest ESPN availability is missing, so the prior waiver recommendation cannot be revalidated.");
const roster = snapshot?.rosters?.find((item) => item.teamId === teamId);
if (!roster) return review("unverified", "The selected roster is missing from the latest ESPN snapshot.");
const irState = evaluateTeamIrState(snapshot, teamId);
if (irState.status === "invalid") return review("obsolete", irState.reason);
if (irState.status === "unverified") return review("unverified", irState.reason);
const capacity = evaluateAcquisitionCapacity(snapshot, teamId);
if (capacity.status === "missing-team") return review("unverified", capacity.reason, null, capacity);
if (capacity.status === "exhausted") return review("obsolete", capacity.reason, null, capacity);
const players = new Map((snapshot.players || []).map((player) => [player.id, player]));
const add = players.get(addId); const drop = players.get(dropId);
if (!add || !drop) return review("unverified", "A player identity from the prior waiver recommendation is missing from the latest ESPN snapshot.", null, capacity);
if (!snapshot.availablePlayers.includes(addId)) return review("obsolete", `ESPN no longer reports ${add.name} available.`, null, capacity);
const dropEntry = (roster.entries || []).find((entry) => entry.playerId === dropId);
if (!dropEntry) return review("obsolete", `${drop.name} is no longer on the selected ESPN roster.`, null, capacity);
if (dropEntry.lineupSlot !== "BE") return review("obsolete", `${drop.name} is now assigned to ${dropEntry.lineupSlot}, so the prior unlocked-bench drop is no longer valid.`, null, capacity);
if (isLocked(dropEntry, drop, now)) return review("obsolete", `${drop.name} is now locked and cannot be used as the prior bench drop.`, null, capacity);
if (isLocked({}, add, now)) return review("obsolete", `${add.name} is now locked by the reported player state or kickoff time.`, null, capacity);
if (add.projection == null) return review("unverified", `${add.name} no longer has a current-week projection, so the prior projected gain cannot be revalidated.`, null, capacity);
const baseline = optimizeLineup(snapshot, teamId, now);
if (!baseline.assignments?.length) return review("unverified", "The latest ESPN lineup state cannot produce a supported baseline for waiver revalidation.", null, capacity);
const rosterViolation = rosterRuleViolation(snapshot, roster, dropEntry, add);
if (rosterViolation) return review("obsolete", rosterViolation, null, capacity);
const result = optimizeLineup(swappedSnapshot(snapshot, teamId, dropEntry, add.id), teamId, now);
if (!result.assignments?.length) return review("unverified", "The latest ESPN lineup state cannot produce a supported lineup after the prior move.", null, capacity);
const lineupGain = +(result.projectedTotal - baseline.projectedTotal).toFixed(1);
if (lineupGain < MIN_WAIVER_LINEUP_GAIN) return review("obsolete", `The latest projected lineup gain is ${lineupGain.toFixed(1)} points, below the ${MIN_WAIVER_LINEUP_GAIN.toFixed(1)}-point action threshold.`, lineupGain, capacity);
return review("current", `Revalidated against the latest ESPN availability, roster state, IR eligibility, locks, limits, and current-week projections at a ${lineupGain.toFixed(1)}-point lineup gain.`, lineupGain, capacity);
}
