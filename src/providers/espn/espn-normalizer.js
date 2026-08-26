import { validateLeagueSnapshot } from "../../domain/model.js";

export const ESPN_LINEUP_SLOTS = Object.freeze({
  0: "QB", 2: "RB", 4: "WR", 6: "TE", 16: "D/ST", 17: "K", 20: "BE", 21: "IR", 23: "FLEX"
});

export const ESPN_PRO_POSITIONS = Object.freeze({
  1: "QB", 2: "RB", 3: "WR", 4: "TE", 5: "K", 16: "D/ST"
});

export function normalizeEspnLineupSlot(slotId) {
  const slot = ESPN_LINEUP_SLOTS[slotId];
  if (!slot) throw new Error(`Unsupported ESPN lineup slot id ${slotId}.`);
  return slot;
}

export function normalizeEspnPosition(positionId) {
  const position = ESPN_PRO_POSITIONS[positionId];
  if (!position) throw new Error(`Unsupported ESPN position id ${positionId}.`);
  return position;
}

export function normalizeEspnInjury(injuryStatus, detail = null) {
  if (!injuryStatus) return null;
  const status = String(injuryStatus).toUpperCase().replaceAll(" ", "_");
  const supported = new Set(["ACTIVE", "QUESTIONABLE", "DOUBTFUL", "OUT", "INJURED_RESERVE", "PHYSICALLY_UNABLE_TO_PERFORM", "SUSPENSION"]);
  return supported.has(status) ? { status, detail: detail || null } : { status: "UNKNOWN", detail: detail || null, sourceStatus: String(injuryStatus) };
}

// Converts a deliberately small, documented capture contract into the stable
// application snapshot. Fetching/authentication stays outside this module.
export function normalizeEspnCapture(capture) {
  if (!capture || typeof capture !== "object") throw new Error("ESPN capture must be an object.");
  const players = (capture.players || []).map((player) => ({
    id: String(player.id),
    name: player.name,
    position: normalizeEspnPosition(player.positionId),
    proTeam: player.proTeam || null,
    opponent: player.opponent || null,
    gameTime: player.gameTime || null,
    projection: player.projection ?? null,
    seasonAverage: player.seasonAverage ?? null,
    byeWeek: player.byeWeek ?? null,
    injury: normalizeEspnInjury(player.injuryStatus, player.injuryDetail)
  }));
  const snapshot = {
    schemaVersion: 1,
    provider: "espn",
    meta: {
      kind: capture.meta?.kind || "capture",
      capturedAt: capture.meta?.capturedAt || null,
      projectionsSource: capture.meta?.projectionsSource || null
    },
    league: {
      id: String(capture.league.id),
      name: capture.league.name,
      season: capture.league.season ?? null,
      scoringPeriod: capture.currentWeek,
      teamCount: capture.teams?.length || 0,
      scoringType: capture.league.scoringType || null
    },
    currentWeek: capture.currentWeek,
    teams: (capture.teams || []).map((team) => ({ ...team, id: String(team.id) })),
    players,
    rosters: (capture.rosters || []).map((roster) => ({
      teamId: String(roster.teamId),
      entries: roster.entries.map((entry) => ({ playerId: String(entry.playerId), lineupSlot: normalizeEspnLineupSlot(entry.lineupSlotId) }))
    })),
    matchups: (capture.matchups || []).map((matchup) => ({ ...matchup, homeTeamId: String(matchup.homeTeamId), awayTeamId: String(matchup.awayTeamId) }))
  };
  if (Array.isArray(capture.availablePlayerIds)) snapshot.availablePlayers = capture.availablePlayerIds.map(String);
  const errors = validateLeagueSnapshot(snapshot);
  if (errors.length) throw new Error(`Normalized ESPN capture is invalid: ${errors.join(" ")}`);
  return snapshot;
}
