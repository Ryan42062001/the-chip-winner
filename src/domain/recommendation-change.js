import { buildLineupSuggestions } from "./recommendations.js";
import { buildRosterAwareWaiverIdeas, revalidateWaiverRecommendation } from "./waiver-engine.js";
function snapshotTime(snapshot, fallback) {
const captured = Date.parse(snapshot?.meta?.capturedAt);
return Number.isFinite(captured) ? captured : fallback;
}
export function diffWaiverRecommendations(previousSnapshot, currentSnapshot, teamId, now = snapshotTime(currentSnapshot, Date.now())) {
if (!previousSnapshot || !currentSnapshot || previousSnapshot.league?.id !== currentSnapshot.league?.id) return Object.freeze([]);
const previous = buildRosterAwareWaiverIdeas(previousSnapshot, teamId, snapshotTime(previousSnapshot, now));
if (previous.status !== "ready" || !previous.items.length) return Object.freeze([]);
const changes = [];
for (const item of previous.items) {
const review = revalidateWaiverRecommendation(currentSnapshot, teamId, item, now);
if (review.status === "current") continue;
const statusLabel = review.status === "obsolete" ? "obsolete" : "needs revalidation";
changes.push(Object.freeze({
kind: "waiver-recommendation",
change: review.status,
teamId,
playerId: item.add.id,
add: item.add,
drop: item.drop,
previousLineupGain: item.lineupGain,
currentLineupGain: review.lineupGain,
title: `Prior waiver move ${statusLabel}: ${item.add.name}`,
detail: `Add ${item.add.name} for ${item.drop.name} was a +${item.lineupGain.toFixed(1)} current-week lineup recommendation at the prior capture. ${review.reason}`,
reason: review.reason,
previousCapturedAt: previousSnapshot.meta?.capturedAt || null,
observedAt: currentSnapshot.meta?.capturedAt || null
}));
}
return Object.freeze(changes);
}
export function diffLineupRecommendations(previousSnapshot, currentSnapshot, teamId) {
const previous = buildLineupSuggestions(previousSnapshot, teamId); const current = buildLineupSuggestions(currentSnapshot, teamId);
const key = (item) => `${item.slot}:${item.sit.id}`; const before = new Map(previous.map((item) => [key(item), item])); const after = new Map(current.map((item) => [key(item), item])); const changes = [];
for (const [id, item] of after) {
const prior = before.get(id);
if (!prior) changes.push(Object.freeze({ kind: "recommendation", change: "new", title: `Start ${item.start.name}`, detail: `New ${item.slot} suggestion over ${item.sit.name} after the latest source changes.`, playerId: item.start.id }));
else if (prior.start.id !== item.start.id) changes.push(Object.freeze({ kind: "recommendation", change: "changed", title: `Suggestion changed to ${item.start.name}`, detail: `${prior.start.name} was previously preferred over ${item.sit.name}; the latest known projections now favor ${item.start.name}.`, playerId: item.start.id }));
}
for (const [id, item] of before) if (!after.has(id)) changes.push(Object.freeze({ kind: "recommendation", change: "cleared", title: `Suggestion cleared for ${item.sit.name}`, detail: `Starting ${item.start.name} is no longer recommended by the current projection threshold.`, playerId: item.sit.id }));
changes.push(...diffWaiverRecommendations(previousSnapshot, currentSnapshot, teamId));
return Object.freeze(changes);
}
