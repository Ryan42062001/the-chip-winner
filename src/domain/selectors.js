import { indexSnapshot, isStarter } from "./model.js";

export function selectTeamContext(snapshot, teamId) {
  const index = indexSnapshot(snapshot);
  const team = index.teams.get(teamId) || null;
  const roster = index.rosters.get(teamId)?.entries || [];
  const matchup = snapshot.matchups.find((item) => item.week === snapshot.currentWeek && [item.homeTeamId, item.awayTeamId].includes(teamId)) || null;
  const opponentId = matchup ? (matchup.homeTeamId === teamId ? matchup.awayTeamId : matchup.homeTeamId) : null;
  return {
    index,
    team,
    roster,
    starters: roster.filter((entry) => isStarter(entry.lineupSlot)),
    bench: roster.filter((entry) => entry.lineupSlot === "BE"),
    reserve: roster.filter((entry) => entry.lineupSlot === "IR"),
    matchup,
    opponent: opponentId ? index.teams.get(opponentId) || null : null
  };
}

export function selectProjectedTotal(entries, playerIndex) {
  const projections = entries.map((entry) => playerIndex.get(entry.playerId)?.projection);
  return {
    total: projections.reduce((sum, value) => sum + (value ?? 0), 0),
    complete: projections.length > 0 && projections.every((value) => value != null),
    knownCount: projections.filter((value) => value != null).length,
    totalCount: projections.length
  };
}

export function selectSnapshotFreshness(snapshot, now = Date.now()) {
  const capturedAt = snapshot.meta?.capturedAt;
  if (!capturedAt) return { status: "unknown", capturedAt: null, ageMs: null };
  const timestamp = Date.parse(capturedAt);
  if (!Number.isFinite(timestamp)) return { status: "unknown", capturedAt, ageMs: null };
  const ageMs = Math.max(0, now - timestamp);
  const status = ageMs <= 15 * 60_000 ? "fresh" : ageMs <= 6 * 60 * 60_000 ? "aging" : "stale";
  return { status, capturedAt, ageMs };
}

export function selectDataCoverage(snapshot, teamId) {
  const { index, roster } = selectTeamContext(snapshot, teamId);
  const players = roster.map((entry) => index.players.get(entry.playerId)).filter(Boolean);
  const count = players.length;
  const ratio = (predicate) => count ? players.filter(predicate).length / count : 0;
  return {
    rosterPlayers: count,
    projections: ratio((player) => player.projection != null),
    injuries: ratio((player) => player.injury?.status != null),
    opponents: ratio((player) => player.opponent != null),
    availability: Array.isArray(snapshot.availablePlayers)
  };
}

export function selectPlayerDetail(snapshot, teamId, playerId) {
  const { index, roster } = selectTeamContext(snapshot, teamId);
  const player = index.players.get(playerId) || null;
  if (!player) return null;
  const rosterEntry = roster.find((entry) => entry.playerId === playerId) || null;
  return {
    player,
    rosterEntry,
    isRostered: Boolean(rosterEntry),
    isAvailable: Array.isArray(snapshot.availablePlayers) ? snapshot.availablePlayers.includes(playerId) : null,
    source: {
      leagueProvider: snapshot.provider,
      projections: snapshot.meta?.projectionsSource || null,
      capturedAt: snapshot.meta?.capturedAt || null
    }
  };
}
