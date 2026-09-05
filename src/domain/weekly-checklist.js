import { isStarter } from "./model.js";
import { getLineupLockReason } from "./lineup-optimizer.js";
import { buildLineupVacancies, buildWarnings } from "./recommendations.js";
import { evaluateAcquisitionCapacity } from "./waiver-engine.js";
import { evaluateTeamIrState } from "./ir-eligibility.js";
const STATUS_WEIGHT = Object.freeze({ "needs-action": 4, "data-gap": 3, locked: 2, complete: 1 });
const URGENCY_WEIGHT = Object.freeze({ critical: 4, high: 3, medium: 2, unknown: 1, info: 0 });
function warningUrgency(warning, hoursToKickoff) {
if (warning.kind === "bye") return "high";
if (hoursToKickoff == null) return "unknown";
if (hoursToKickoff <= 24) return "critical";
if (hoursToKickoff <= 72) return "high";
return "medium";
}
const injuryLabel = (status) => status ? status.toLowerCase().replaceAll("_", " ") : "no injury designation";
export function buildWeeklyChecklist(snapshot, teamId, now = Date.now()) {
const roster = snapshot?.rosters?.find((item) => item.teamId === teamId);
if (!roster) return Object.freeze({ status: "unavailable", items: Object.freeze([]), needsActionCount: null, lockedCount: null, limitations: Object.freeze(["The selected roster is unavailable."]) });
const players = new Map((snapshot.players || []).map((player) => [player.id, player]));
const starters = (roster.entries || []).filter((entry) => isStarter(entry.lineupSlot)).map((entry) => ({ entry, player: players.get(entry.playerId) })).filter((item) => item.player);
const vacancies = buildLineupVacancies(snapshot, teamId);
const items = vacancies.items.map((item) => Object.freeze({
id: `vacancy:${item.slot}`,
kind: "vacancy",
status: "needs-action",
urgency: "critical",
playerId: null,
title: `${item.missingCount} empty ${item.slot} slot${item.missingCount === 1 ? "" : "s"}`,
detail: `ESPN requires ${item.requiredCount}; ${item.filledCount} currently filled.`,
destination: "#lineup"
}));
const acquisitionCapacity = evaluateAcquisitionCapacity(snapshot, teamId);
if (acquisitionCapacity.status === "exhausted") items.push(Object.freeze({ id: "acquisition-limit", kind: "acquisition-limit", status: "locked", urgency: "info", playerId: null, title: "Waiver moves blocked by ESPN limit", detail: acquisitionCapacity.reason, destination: "#waivers" }));
const irState = evaluateTeamIrState(snapshot, teamId);
for (const item of irState.invalidEntries || []) {
const player = item.player;
items.push(Object.freeze({
id: `ir-invalid:${item.entry.playerId}`,
kind: "ir-invalid",
status: "needs-action",
urgency: "critical",
playerId: player?.id || item.entry.playerId,
title: `${player?.name || item.entry.playerId} is no longer IR-eligible`,
detail: `${item.eligibility.reason} ESPN can block waiver and free-agent moves while an ineligible player remains in IR.`,
destination: "#waivers"
}));
}
for (const item of irState.unverifiedEntries || []) {
const player = item.player;
items.push(Object.freeze({
id: `ir-unverified:${item.entry.playerId}`,
kind: "ir-unverified",
status: "data-gap",
urgency: "unknown",
playerId: player?.id || item.entry.playerId,
title: `IR eligibility for ${player?.name || item.entry.playerId} is unverified`,
detail: item.eligibility.reason,
destination: "#waivers"
}));
}
if (irState.openSlots > 0) {
for (const item of (irState.benchPlaceableEntries || []).slice(0, irState.openSlots)) {
items.push(Object.freeze({
id: `ir-opportunity:${item.player.id}`,
kind: "ir-opportunity",
status: "needs-action",
urgency: "medium",
playerId: item.player.id,
title: `${item.player.name} can move to IR`,
detail: `ESPN reports ${injuryLabel(item.eligibility.injuryStatus)} and ${irState.openSlots} configured IR slot${irState.openSlots === 1 ? " is" : "s are"} open. Moving this bench player to IR can free active-roster space.`,
destination: "#waivers"
}));
}
}
const warningByPlayer = new Map(buildWarnings(snapshot, teamId).filter((warning) => isStarter(warning.lineupSlot)).map((warning) => [warning.player.id, warning]));
let unknownKickoffCount = 0;
for (const { entry, player } of starters) {
const kickoff = Date.parse(player.gameTime);
const hasKickoff = Number.isFinite(kickoff);
const hoursToKickoff = hasKickoff ? +((kickoff - now) / 36e5).toFixed(1) : null;
const lockReason = getLineupLockReason(entry, player, now);
const warning = warningByPlayer.get(player.id);
if (!hasKickoff && !lockReason) unknownKickoffCount += 1;
if (warning) {
const status = lockReason ? "locked" : "needs-action";
const timingDetail = hasKickoff ? `${Math.max(0, hoursToKickoff)} hours to reported kickoff.` : "Kickoff time unavailable; urgency is not inferred.";
items.push(Object.freeze({
id: `${warning.kind}:${player.id}`,
kind: warning.kind,
status,
urgency: lockReason ? "info" : warningUrgency(warning, hoursToKickoff),
playerId: player.id,
title: warning.kind === "bye" ? `${player.name} is on bye` : `${player.name} is ${player.injury.status.toLowerCase().replaceAll("_", " ")}`,
detail: lockReason || [warning.detail, timingDetail].filter(Boolean).join(" "),
destination: "#alerts"
}));
} else if (lockReason) {
items.push(Object.freeze({ id: `locked:${player.id}`, kind: "locked", status: "locked", urgency: "info", playerId: player.id, title: `${player.name} is locked`, detail: lockReason, destination: "#lineup" }));
}
if (player.projection == null) {
items.push(Object.freeze({ id: `projection:${player.id}`, kind: "projection", status: "data-gap", urgency: "unknown", playerId: player.id, title: `${player.name} has no projection`, detail: "No projection-based lineup claim is available for this starter.", destination: "#lineup" }));
}
}
const limitations = [];
if (vacancies.limitation) limitations.push(vacancies.limitation);
if (irState.status === "settings-unavailable") limitations.push(irState.reason);
if (unknownKickoffCount) limitations.push(`${unknownKickoffCount} starter kickoff time${unknownKickoffCount === 1 ? " is" : "s are"} unavailable; time-sensitive urgency is disabled for those players.`);
items.sort((a, b) => STATUS_WEIGHT[b.status] - STATUS_WEIGHT[a.status] || URGENCY_WEIGHT[b.urgency] - URGENCY_WEIGHT[a.urgency] || a.title.localeCompare(b.title));
return Object.freeze({
status: limitations.length ? "partial" : "ready",
items: Object.freeze(items),
needsActionCount: items.filter((item) => item.status === "needs-action").length,
lockedCount: items.filter((item) => item.status === "locked").length,
limitations: Object.freeze(limitations)
});
}
