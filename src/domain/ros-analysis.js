export function selectRosterRosCoverage(snapshot, teamId, reconciliation) {
  const entries = snapshot.rosters.find((roster) => roster.teamId === teamId)?.entries || [];
  const matched = entries.filter((entry) => reconciliation?.byPlayerId?.[entry.playerId]).length;
  return Object.freeze({ matched, total: entries.length, ratio: entries.length ? matched / entries.length : 0 });
}

export function buildRosWaiverIdeas(snapshot, teamId, reconciliation, limit = 5) {
  if (!Array.isArray(snapshot.availablePlayers)) return { status: "missing-availability", items: [] };
  if (!reconciliation) return { status: "missing-rankings", items: [] };
  const players = new Map(snapshot.players.map((player) => [player.id, player]));
  const roster = snapshot.rosters.find((item) => item.teamId === teamId)?.entries || [];
  const rostered = roster.map((entry) => ({ player: players.get(entry.playerId), ranking: reconciliation.byPlayerId[entry.playerId] })).filter((item) => item.player && item.ranking);
  const available = snapshot.availablePlayers.map((playerId) => ({ player: players.get(playerId), ranking: reconciliation.byPlayerId[playerId] })).filter((item) => item.player && item.ranking);

  const ideas = [];
  for (const candidate of available) {
    const drops = rostered.filter((item) => item.player.position === candidate.player.position && item.ranking.rank > candidate.ranking.rank);
    const drop = drops.sort((a, b) => b.ranking.rank - a.ranking.rank)[0];
    if (!drop) continue;
    ideas.push(Object.freeze({
      add: candidate.player,
      addRanking: candidate.ranking,
      drop: drop.player,
      dropRanking: drop.ranking,
      rankImprovement: drop.ranking.rank - candidate.ranking.rank
    }));
  }
  ideas.sort((a, b) => b.rankImprovement - a.rankImprovement || a.addRanking.rank - b.addRanking.rank);
  const usedAdds = new Set();
  const usedDrops = new Set();
  const compatible = ideas.filter((item) => {
    if (usedAdds.has(item.add.id) || usedDrops.has(item.drop.id)) return false;
    usedAdds.add(item.add.id); usedDrops.add(item.drop.id); return true;
  }).slice(0, limit);
  return { status: "ready", items: compatible };
}

