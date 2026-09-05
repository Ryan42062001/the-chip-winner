import { canFillSlot } from "./recommendations.js";
import { isStarter } from "./model.js";

export function getLineupLockReason(entry, player, now = Date.now()) {
  if (entry?.locked === true || player?.locked === true) return "ESPN reported this player locked.";
  const kickoff = Date.parse(player?.gameTime);
  if (Number.isFinite(kickoff) && kickoff <= now) return "The reported NFL kickoff time has passed.";
  return null;
}

function optimizeEntries(playerIndex, entries, now) {
  const starterEntries = (entries || []).filter((entry) => isStarter(entry.lineupSlot));
  if (!starterEntries.length) return { status: "invalid", reason: "No supported starting slots were found." };

  const slots = starterEntries.map((entry, index) => ({
    id: `${entry.lineupSlot}:${index}`,
    slot: entry.lineupSlot,
    currentPlayerId: entry.playerId
  }));
  const rosterPlayers = (entries || [])
    .filter((entry) => entry.lineupSlot !== "IR")
    .map((entry) => ({ entry, player: playerIndex.get(entry.playerId) }))
    .filter((item) => item.player);
  const rosterByPlayerId = new Map(rosterPlayers.map((item) => [item.player.id, item]));

  const locks = rosterPlayers
    .map((item) => ({ item, reason: getLineupLockReason(item.entry, item.player, now) }))
    .filter(({ reason }) => reason)
    .map(({ item, reason }) => Object.freeze({ playerId: item.player.id, slot: item.entry.lineupSlot, reason }));
  const lockedPlayerIds = new Set(locks.map((lock) => lock.playerId));
  const lockedBySlotId = new Map();
  for (const slot of slots) {
    const item = rosterByPlayerId.get(slot.currentPlayerId);
    if (item && lockedPlayerIds.has(item.player.id)) lockedBySlotId.set(slot.id, item.player.id);
  }

  const missing = rosterPlayers.filter((item) => item.player.projection == null).map((item) => item.player.id);
  const eligible = rosterPlayers.filter((item) => item.player.projection != null);
  const candidateIndexesBySlot = slots.map((slot) => {
    const lockedPlayerId = lockedBySlotId.get(slot.id);
    const indexes = [];
    for (let index = 0; index < eligible.length; index += 1) {
      const item = eligible[index];
      if (!canFillSlot(item.player, slot.slot)) continue;
      if (lockedPlayerIds.has(item.player.id) && item.player.id !== lockedPlayerId) continue;
      if (lockedPlayerId && item.player.id !== lockedPlayerId) continue;
      indexes.push(index);
    }
    return indexes;
  });

  // Preserve the original slot and roster iteration order so equal-scoring
  // lineups keep the same deterministic tie behavior as the prior DFS. The
  // memoized bitmask search removes repeated candidate filtering and avoids
  // re-solving the same suffix assignment many times.
  const memo = Array.from({ length: slots.length }, () => new Map());
  function solve(slotIndex, usedMask) {
    if (slotIndex === slots.length) return Object.freeze({ total: 0, choice: null });
    const cached = memo[slotIndex].get(usedMask);
    if (cached !== undefined || memo[slotIndex].has(usedMask)) return cached;

    let best = null;
    for (const candidateIndex of candidateIndexesBySlot[slotIndex]) {
      const bit = 1n << BigInt(candidateIndex);
      if ((usedMask & bit) !== 0n) continue;
      const suffix = solve(slotIndex + 1, usedMask | bit);
      if (!suffix) continue;
      const total = eligible[candidateIndex].player.projection + suffix.total;
      if (!best || total > best.total) best = Object.freeze({ total, choice: candidateIndex });
    }
    memo[slotIndex].set(usedMask, best);
    return best;
  }

  const solved = solve(0, 0n);
  if (!solved) {
    return {
      status: "incomplete",
      reason: "Known projections cannot fill every supported starting slot.",
      missingPlayerIds: missing,
      assignments: []
    };
  }

  const assignment = [];
  let usedMask = 0n;
  for (let slotIndex = 0; slotIndex < slots.length; slotIndex += 1) {
    const decision = memo[slotIndex].get(usedMask);
    if (!decision || decision.choice == null) break;
    const candidateIndex = decision.choice;
    const item = eligible[candidateIndex];
    const slot = slots[slotIndex];
    const lockedPlayerId = lockedBySlotId.get(slot.id);
    assignment.push({
      slot: slot.slot,
      slotId: slot.id,
      player: item.player,
      previousPlayerId: slot.currentPlayerId,
      locked: Boolean(lockedPlayerId)
    });
    usedMask |= 1n << BigInt(candidateIndex);
  }

  if (assignment.length !== slots.length) {
    return {
      status: "incomplete",
      reason: "Known projections cannot fill every supported starting slot.",
      missingPlayerIds: missing,
      assignments: []
    };
  }

  const currentTotal = starterEntries.reduce((sum, entry) => sum + (playerIndex.get(entry.playerId)?.projection || 0), 0);
  const changes = assignment.filter((item) => item.player.id !== item.previousPlayerId);
  const gain = +(solved.total - currentTotal).toFixed(1);
  const actionable = gain >= 1;
  const completenessReason = missing.length
    ? "One or more roster projections are missing, so this is the strongest complete lineup among known projections."
    : "Highest complete lineup using available projections and supported ESPN slots.";

  return Object.freeze({
    status: missing.length ? "best-known" : "optimal",
    reason: !actionable && changes.length
      ? `${completenessReason} The ${gain.toFixed(1)}-point edge is below the 1-point action threshold, so no change is recommended.`
      : completenessReason,
    projectedTotal: +solved.total.toFixed(1),
    currentTotal: +currentTotal.toFixed(1),
    gain,
    actionable,
    assignments: Object.freeze(assignment),
    changes: Object.freeze(changes),
    recommendedChanges: Object.freeze(actionable ? changes : []),
    locks: Object.freeze(locks),
    missingPlayerIds: Object.freeze(missing)
  });
}

export function createLineupOptimizer(players, now = Date.now()) {
  const playerIndex = players instanceof Map
    ? players
    : new Map((players || []).map((player) => [player.id, player]));
  return Object.freeze({
    playerIndex,
    optimize(entries) {
      return optimizeEntries(playerIndex, entries, now);
    }
  });
}

export function optimizeLineup(snapshot, teamId, now = Date.now()) {
  const roster = snapshot?.rosters?.find((item) => item.teamId === teamId);
  if (!roster) return { status: "invalid", reason: "Selected roster is unavailable." };
  return createLineupOptimizer(snapshot.players, now).optimize(roster.entries);
}
