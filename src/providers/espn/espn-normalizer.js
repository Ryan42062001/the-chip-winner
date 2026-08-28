import { validateLeagueSnapshot } from "../../domain/model.js";

export const ESPN_LINEUP_SLOTS = Object.freeze({
  0: "QB", 2: "RB", 4: "WR", 6: "TE", 7: "OP", 16: "D/ST", 17: "K", 20: "BE", 21: "IR", 23: "FLEX"
});

export const ESPN_PRO_POSITIONS = Object.freeze({
  1: "QB", 2: "RB", 3: "WR", 4: "TE", 5: "K", 16: "D/ST"
});

export const ESPN_PRO_TEAMS = Object.freeze({
  1: "ATL", 2: "BUF", 3: "CHI", 4: "CIN", 5: "CLE", 6: "DAL", 7: "DEN", 8: "DET", 9: "GB", 10: "TEN",
  11: "IND", 12: "KC", 13: "LV", 14: "LAR", 15: "MIA", 16: "MIN", 17: "NE", 18: "NO", 19: "NYG", 20: "NYJ",
  21: "PHI", 22: "ARI", 23: "PIT", 24: "LAC", 25: "SF", 26: "SEA", 27: "TB", 28: "WAS", 29: "CAR", 30: "JAX",
  33: "BAL", 34: "HOU"
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
  if (status === "NORMAL") return { status: "ACTIVE", detail: detail || null };
  if (status === "INJURY_RESERVE") return { status: "INJURED_RESERVE", detail: detail || null };
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

export function normalizeEspnLeagueResponse(response, captureMeta = {}, supplemental = {}) {
  if (!response?.settings || !Array.isArray(response.teams)) throw new Error("ESPN response is missing settings or teams.");
  const currentWeek = response.scoringPeriodId;
  if (!Number.isInteger(currentWeek)) throw new Error("ESPN response is missing scoringPeriodId.");
  const playerMap = new Map();
  const rosters = response.teams.map((team) => {
    const entries = (team.roster?.entries || []).map((entry) => {
      const rawPlayer = entry.playerPoolEntry?.player;
      if (!rawPlayer?.id || !rawPlayer?.fullName) throw new Error(`Team ${team.id} contains a roster entry without a stable ESPN player identity.`);
      const id = String(rawPlayer.id);
      if (!playerMap.has(id)) playerMap.set(id, normalizeRosterPlayer(rawPlayer, currentWeek, supplemental.nflScoreboard));
      return { playerId: id, lineupSlot: normalizeEspnLineupSlot(entry.lineupSlotId) };
    });
    return { teamId: String(team.id), entries };
  });
  const matchups = (response.schedule || [])
    .filter((item) => Number.isInteger(item.matchupPeriodId) && item.home?.teamId && item.away?.teamId)
    .map((item) => ({
      week: item.matchupPeriodId,
      homeTeamId: String(item.home.teamId),
      awayTeamId: String(item.away.teamId),
      homeScore: item.home.totalPoints ?? null,
      awayScore: item.away.totalPoints ?? null,
      status: item.winner && item.winner !== "UNDECIDED" ? "final" : item.matchupPeriodId === currentWeek ? "current" : item.matchupPeriodId > currentWeek ? "upcoming" : "unreported"
    }));
  const availableEntries = (supplemental.availablePlayers || []).filter((entry) => (entry.player || entry)?.id && (entry.player || entry)?.fullName);
  const availablePlayers = availableEntries.map((entry) => entry.player || entry);
  for (const entry of availableEntries) {
    const player = entry.player || entry;
    const id = String(player.id);
    if (!playerMap.has(id)) playerMap.set(id, { ...normalizeRosterPlayer(player, currentWeek, supplemental.nflScoreboard), availabilityStatus: entry.status || "AVAILABLE" });
  }
  const snapshot = {
    schemaVersion: 1,
    provider: "espn",
    meta: {
      kind: "live-companion",
      capturedAt: captureMeta.capturedAt || null,
      projectionsSource: "espn",
      sourceViews: captureMeta.views || []
    },
    league: {
      id: String(response.id),
      name: response.settings.name,
      season: response.seasonId,
      scoringPeriod: currentWeek,
      teamCount: response.teams.length,
      scoringType: response.settings.scoringSettings?.scoringType || null,
      lineupSlots: normalizeLineupSlotCounts(response.settings.rosterSettings?.lineupSlotCounts),
      waiver: normalizeWaiverSettings(response.settings.acquisitionSettings)
    },
    currentWeek,
    teams: response.teams.map(normalizeTeam),
    players: [...playerMap.values()],
    rosters,
    matchups
  };
  if (Array.isArray(supplemental.availablePlayers)) snapshot.availablePlayers = availablePlayers.map((player) => String(player.id));
  const errors = validateLeagueSnapshot(snapshot);
  if (errors.length) throw new Error(`Normalized ESPN response is invalid: ${errors.join(" ")}`);
  return snapshot;
}

function normalizeLineupSlotCounts(counts = {}) {
  return Object.entries(counts)
    .filter(([, count]) => Number(count) > 0)
    .map(([slotId, count]) => ({ slot: ESPN_LINEUP_SLOTS[slotId] || `ESPN_SLOT_${slotId}`, count: Number(count), espnSlotId: Number(slotId) }));
}

function normalizeWaiverSettings(settings = {}) {
  return {
    acquisitionLimit: Number.isFinite(settings.acquisitionLimit) ? settings.acquisitionLimit : null,
    waiverProcessDays: Number.isFinite(settings.waiverProcessDays) ? settings.waiverProcessDays : null,
    budget: Number.isFinite(settings.acquisitionBudget) ? settings.acquisitionBudget : null
  };
}

function normalizeTeam(team) {
  const overall = team.record?.overall || {};
  const explicitName = [team.location, team.nickname].filter(Boolean).join(" ").trim();
  return {
    id: String(team.id),
    name: explicitName || team.name || team.abbrev || `Team ${team.id}`,
    abbreviation: team.abbrev || `T${team.id}`,
    record: { wins: overall.wins ?? null, losses: overall.losses ?? null, ties: overall.ties ?? null },
    pointsFor: overall.pointsFor ?? null
  };
}

function normalizeRosterPlayer(player, currentWeek, nflScoreboard) {
  const projectionStat = (player.stats || []).find((stat) => stat.scoringPeriodId === currentWeek && stat.statSourceId === 1 && stat.statSplitTypeId === 1);
  const schedule = selectNflSchedule(player.proTeamId, nflScoreboard);
  return {
    id: String(player.id),
    name: player.fullName,
    position: normalizeEspnPosition(player.defaultPositionId),
    proTeam: ESPN_PRO_TEAMS[player.proTeamId] || null,
    opponent: schedule.opponent,
    gameTime: schedule.gameTime,
    projection: Number.isFinite(projectionStat?.appliedTotal) ? projectionStat.appliedTotal : null,
    seasonAverage: null,
    byeWeek: schedule.isBye ? currentWeek : null,
    injury: normalizeEspnInjury(player.injuryStatus)
  };
}

function selectNflSchedule(proTeamId, scoreboard) {
  if (!proTeamId || !Array.isArray(scoreboard?.events) || scoreboard.events.length === 0) return { opponent: null, gameTime: null, isBye: false };
  for (const event of scoreboard.events) {
    const competitors = event.competitions?.[0]?.competitors || [];
    const current = competitors.find((item) => Number(item.team?.id) === Number(proTeamId));
    if (!current) continue;
    const opponent = competitors.find((item) => item !== current);
    return { opponent: opponent ? ESPN_PRO_TEAMS[Number(opponent.team?.id)] || opponent.team?.abbreviation || null : null, gameTime: event.date || null, isBye: false };
  }
  return { opponent: null, gameTime: null, isBye: true };
}
