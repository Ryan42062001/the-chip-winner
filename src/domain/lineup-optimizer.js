import { canFillSlot } from "./recommendations.js";
import { isStarter } from "./model.js";

function isLocked(entry, player, now) {
  if (entry.locked === true || player.locked === true) return true;
  const kickoff = Date.parse(player.gameTime);
  return Number.isFinite(kickoff) && kickoff <= now;
}

export function optimizeLineup(snapshot, teamId, now = Date.now()) {
  const roster = snapshot.rosters.find((item) => item.teamId === teamId);
  if (!roster) return { status: "invalid", reason: "Selected roster is unavailable." };
  const players = new Map(snapshot.players.map((player) => [player.id, player]));
  const starterEntries = roster.entries.filter((entry) => isStarter(entry.lineupSlot));
  if (!starterEntries.length) return { status: "invalid", reason: "No supported starting slots were found." };

  const slots = starterEntries.map((entry, index) => ({ id: `${entry.lineupSlot}:${index}`, slot: entry.lineupSlot, currentPlayerId: entry.playerId }));
  const rosterPlayers = roster.entries.filter((entry) => entry.lineupSlot !== "IR").map((entry) => ({ entry, player: players.get(entry.playerId) })).filter((item) => item.player);
  const locked = new Map();
  for (const slot of slots) {
    const item = rosterPlayers.find((candidate) => candidate.player.id === slot.currentPlayerId);
    if (item && isLocked(item.entry, item.player, now)) locked.set(slot.id, item.player.id);
  }
  const missing = rosterPlayers.filter((item) => item.player.projection == null).map((item) => item.player.id);
  const eligible = rosterPlayers.filter((item) => item.player.projection != null);
  let best = null;

  function search(slotIndex, used, assignment, total) {
    if (slotIndex === slots.length) {
      if (!best || total > best.total) best = { total, assignment: [...assignment] };
      return;
    }
    const slot = slots[slotIndex];
    const lockedPlayerId = locked.get(slot.id);
    const candidates = eligible.filter((item) => !used.has(item.player.id) && canFillSlot(item.player, slot.slot) && (!lockedPlayerId || item.player.id === lockedPlayerId));
    for (const item of candidates) {
      used.add(item.player.id);
      assignment.push({ slot: slot.slot, slotId: slot.id, player: item.player, previousPlayerId: slot.currentPlayerId, locked: Boolean(lockedPlayerId) });
      search(slotIndex + 1, used, assignment, total + item.player.projection);
      assignment.pop(); used.delete(item.player.id);
    }
  }
  search(0, new Set(), [], 0);
  if (!best) return { status: "incomplete", reason: "Known projections cannot fill every supported starting slot.", missingPlayerIds: missing, assignments: [] };
  const currentTotal = starterEntries.reduce((sum, entry) => sum + (players.get(entry.playerId)?.projection || 0), 0);
  const changes = best.assignment.filter((item) => item.player.id !== item.previousPlayerId);
  const gain = +(best.total - currentTotal).toFixed(1);
  const actionable = gain >= 1;
  const completenessReason = missing.length ? "One or more roster projections are missing, so this is the strongest complete lineup among known projections." : "Highest complete lineup using available projections and supported ESPN slots.";
  return Object.freeze({
    status: missing.length ? "best-known" : "optimal",
    reason: !actionable && changes.length ? `${completenessReason} The ${gain.toFixed(1)}-point edge is below the 1-point action threshold, so no change is recommended.` : completenessReason,
    projectedTotal: +best.total.toFixed(1),
    currentTotal: +currentTotal.toFixed(1),
    gain,
    actionable,
    assignments: Object.freeze(best.assignment),
    changes: Object.freeze(changes),
    recommendedChanges: Object.freeze(actionable ? changes : []),
    missingPlayerIds: Object.freeze(missing)
  });
}
