export const SLOT_GROUPS = Object.freeze({
  starter: new Set(["QB", "RB", "WR", "TE", "FLEX", "OP", "K", "D/ST"]),
  bench: new Set(["BE"]),
  reserve: new Set(["IR"])
});

export const SUPPORTED_LINEUP_SLOTS = Object.freeze(new Set([...SLOT_GROUPS.starter, ...SLOT_GROUPS.bench, ...SLOT_GROUPS.reserve]));
export const SUPPORTED_POSITIONS = Object.freeze(new Set(["QB", "RB", "WR", "TE", "K", "D/ST"]));

export function isStarter(slot) {
  return SLOT_GROUPS.starter.has(slot);
}

export function validateLeagueSnapshot(snapshot) {
  const errors = [];
  if (!snapshot || typeof snapshot !== "object") return ["Snapshot must be a JSON object."];
  if (snapshot.schemaVersion !== 1) errors.push("Unsupported or missing schemaVersion; expected 1.");
  if (snapshot.provider !== "espn") errors.push("provider must be espn.");
  if (!snapshot.league?.id || !snapshot.league?.name) errors.push("League id and name are required.");
  if (!Number.isInteger(snapshot.currentWeek)) errors.push("currentWeek must be an integer.");
  if (!Array.isArray(snapshot.teams) || snapshot.teams.length === 0) errors.push("At least one team is required.");
  if (!Array.isArray(snapshot.players)) errors.push("players must be an array.");
  if (!Array.isArray(snapshot.rosters)) errors.push("rosters must be an array.");
  if (!Array.isArray(snapshot.matchups)) errors.push("matchups must be an array.");

  const players = snapshot.players || [];
  const teams = snapshot.teams || [];
  const playerIds = new Set(players.map((player) => player.id));
  const teamIds = new Set(teams.map((team) => team.id));
  if (playerIds.size !== players.length) errors.push("Player ids must be unique.");
  if (teamIds.size !== teams.length) errors.push("Team ids must be unique.");
  for (const player of players) {
    if (!player.id || !player.name) errors.push("Every player requires an id and name.");
    if (!SUPPORTED_POSITIONS.has(player.position)) errors.push(`Player ${player.id || "unknown"} has unsupported position ${player.position || "missing"}.`);
    if (player.projection != null && (!Number.isFinite(player.projection) || player.projection < 0)) errors.push(`Player ${player.id || "unknown"} has an invalid projection.`);
  }
  for (const roster of snapshot.rosters || []) {
    if (!roster.teamId) errors.push("Every roster requires a teamId.");
    if (roster.teamId && !teamIds.has(roster.teamId)) errors.push(`Roster references unknown team ${roster.teamId}.`);
    const rosterPlayerIds = new Set();
    for (const entry of roster.entries || []) {
      if (!playerIds.has(entry.playerId)) errors.push(`Roster references unknown player ${entry.playerId}.`);
      if (!entry.lineupSlot) errors.push(`Roster entry ${entry.playerId || "unknown"} is missing a lineupSlot.`);
      if (entry.lineupSlot && !SUPPORTED_LINEUP_SLOTS.has(entry.lineupSlot)) errors.push(`Roster entry ${entry.playerId || "unknown"} has unsupported lineupSlot ${entry.lineupSlot}.`);
      if (rosterPlayerIds.has(entry.playerId)) errors.push(`Team ${roster.teamId || "unknown"} lists player ${entry.playerId} more than once.`);
      rosterPlayerIds.add(entry.playerId);
    }
  }
  for (const matchup of snapshot.matchups || []) {
    if (!Number.isInteger(matchup.week)) errors.push("Every matchup requires an integer week.");
    if (!teamIds.has(matchup.homeTeamId)) errors.push(`Matchup references unknown home team ${matchup.homeTeamId}.`);
    if (!teamIds.has(matchup.awayTeamId)) errors.push(`Matchup references unknown away team ${matchup.awayTeamId}.`);
  }
  for (const playerId of snapshot.availablePlayers || []) {
    if (!playerIds.has(playerId)) errors.push(`availablePlayers references unknown player ${playerId}.`);
  }
  return errors;
}

export function indexSnapshot(snapshot) {
  return {
    players: new Map(snapshot.players.map((player) => [player.id, player])),
    teams: new Map(snapshot.teams.map((team) => [team.id, team])),
    rosters: new Map(snapshot.rosters.map((roster) => [roster.teamId, roster]))
  };
}
