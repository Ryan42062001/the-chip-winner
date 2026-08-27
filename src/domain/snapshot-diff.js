function changed(left, right) {
  return left !== right && !(left == null && right == null);
}

function playerLabel(players, playerId) {
  return players.get(playerId)?.name || `Player ${playerId}`;
}

function rosterEntries(snapshot) {
  const result = new Map();
  for (const roster of snapshot?.rosters || []) {
    for (const entry of roster.entries || []) result.set(`${roster.teamId}:${entry.playerId}`, { ...entry, teamId: roster.teamId });
  }
  return result;
}

function availability(snapshot) {
  return new Set(snapshot?.availablePlayers || []);
}

export function diffSnapshots(previous, current) {
  if (!previous || !current || previous.league?.id !== current.league?.id) return [];
  const observedAt = current.meta?.capturedAt || new Date().toISOString();
  const players = new Map([...(previous.players || []), ...(current.players || [])].map((player) => [player.id, player]));
  const beforePlayers = new Map((previous.players || []).map((player) => [player.id, player]));
  const afterPlayers = new Map((current.players || []).map((player) => [player.id, player]));
  const changes = [];
  const add = (change) => changes.push(Object.freeze({ observedAt, ...change }));

  const beforeRoster = rosterEntries(previous);
  const afterRoster = rosterEntries(current);
  for (const [key, entry] of afterRoster) {
    const old = beforeRoster.get(key);
    if (!old) add({ kind: "roster-add", teamId: entry.teamId, playerId: entry.playerId, title: `${playerLabel(players, entry.playerId)} joined the roster`, detail: `Now assigned to ${entry.lineupSlot}.` });
    else if (old.lineupSlot !== entry.lineupSlot) add({ kind: "lineup", teamId: entry.teamId, playerId: entry.playerId, title: `${playerLabel(players, entry.playerId)} moved`, detail: `${old.lineupSlot} → ${entry.lineupSlot}.` });
  }
  for (const [key, entry] of beforeRoster) if (!afterRoster.has(key)) add({ kind: "roster-drop", teamId: entry.teamId, playerId: entry.playerId, title: `${playerLabel(players, entry.playerId)} left the roster`, detail: `Previously assigned to ${entry.lineupSlot}.` });

  for (const [playerId, player] of afterPlayers) {
    const old = beforePlayers.get(playerId);
    if (!old) continue;
    const oldStatus = old.injury?.status ?? null;
    const newStatus = player.injury?.status ?? null;
    if (changed(oldStatus, newStatus)) add({ kind: "injury", playerId, title: `${player.name} injury status changed`, detail: `${oldStatus || "Unavailable"} → ${newStatus || "Unavailable"}.` });
    if (changed(old.projection, player.projection)) add({ kind: "projection", playerId, title: `${player.name} projection changed`, detail: `${old.projection == null ? "Unavailable" : old.projection.toFixed(1)} → ${player.projection == null ? "Unavailable" : player.projection.toFixed(1)} points.` });
  }

  const beforeAvailable = availability(previous);
  const afterAvailable = availability(current);
  for (const playerId of new Set([...beforeAvailable, ...afterAvailable])) {
    if (beforeAvailable.has(playerId) !== afterAvailable.has(playerId)) add({ kind: "availability", playerId, title: `${playerLabel(players, playerId)} availability changed`, detail: afterAvailable.has(playerId) ? "Now reported available by ESPN." : "No longer reported available by ESPN." });
  }

  const beforeMatchups = new Map((previous.matchups || []).map((matchup) => [`${matchup.week}:${matchup.homeTeamId}:${matchup.awayTeamId}`, matchup]));
  for (const matchup of current.matchups || []) {
    const old = beforeMatchups.get(`${matchup.week}:${matchup.homeTeamId}:${matchup.awayTeamId}`);
    if (!old) continue;
    if (changed(old.homeScore, matchup.homeScore) || changed(old.awayScore, matchup.awayScore)) add({ kind: "matchup", week: matchup.week, teamIds: [matchup.homeTeamId, matchup.awayTeamId], title: `Week ${matchup.week} matchup score changed`, detail: `${old.homeScore ?? "—"}–${old.awayScore ?? "—"} → ${matchup.homeScore ?? "—"}–${matchup.awayScore ?? "—"}.` });
  }

  const priority = { injury: 0, lineup: 1, "roster-add": 2, "roster-drop": 2, availability: 3, projection: 4, matchup: 5 };
  return changes.sort((left, right) => (priority[left.kind] ?? 9) - (priority[right.kind] ?? 9) || left.title.localeCompare(right.title));
}

export function changesForTeam(changes, snapshot, teamId) {
  const rosterIds = new Set(snapshot.rosters.find((roster) => roster.teamId === teamId)?.entries.map((entry) => entry.playerId) || []);
  return changes.filter((change) => change.teamId === teamId || change.teamIds?.includes(teamId) || (change.playerId && rosterIds.has(change.playerId)));
}
