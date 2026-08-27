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

export function buildRosterAwareWaiverIdeas(snapshot, teamId, now = Date.now(), limit = 8) {
  if (!Array.isArray(snapshot.availablePlayers)) return { status: "missing-availability", items: [], limitations: [] };
  const roster = snapshot.rosters.find((item) => item.teamId === teamId);
  if (!roster) return { status: "missing-roster", items: [], limitations: [] };
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
  const limitations = ["ESPN availability is authoritative at the latest refresh.", "Acquisition limits and waiver priority are displayed but cannot be proven from the current snapshot."];
  if (baseline.status === "best-known") limitations.push("Some roster projections are missing, so gains use the strongest complete lineup among known projections.");
  return { status: "ready", baselineTotal: baseline.projectedTotal, items, limitations };
}
