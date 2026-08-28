import { buildLineupSuggestions } from "./recommendations.js";

export function diffLineupRecommendations(previousSnapshot, currentSnapshot, teamId) {
  const previous = buildLineupSuggestions(previousSnapshot, teamId); const current = buildLineupSuggestions(currentSnapshot, teamId);
  const key = (item) => `${item.slot}:${item.sit.id}`; const before = new Map(previous.map((item) => [key(item), item])); const after = new Map(current.map((item) => [key(item), item])); const changes = [];
  for (const [id, item] of after) {
    const prior = before.get(id);
    if (!prior) changes.push(Object.freeze({ kind: "recommendation", change: "new", title: `Start ${item.start.name}`, detail: `New ${item.slot} suggestion over ${item.sit.name} after the latest source changes.`, playerId: item.start.id }));
    else if (prior.start.id !== item.start.id) changes.push(Object.freeze({ kind: "recommendation", change: "changed", title: `Suggestion changed to ${item.start.name}`, detail: `${prior.start.name} was previously preferred over ${item.sit.name}; the latest known projections now favor ${item.start.name}.`, playerId: item.start.id }));
  }
  for (const [id, item] of before) if (!after.has(id)) changes.push(Object.freeze({ kind: "recommendation", change: "cleared", title: `Suggestion cleared for ${item.sit.name}`, detail: `Starting ${item.start.name} is no longer recommended by the current projection threshold.`, playerId: item.sit.id }));
  return Object.freeze(changes);
}
