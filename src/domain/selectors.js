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
  const ratio = (predicate) => count ? players.reduce((total, player) => total + Number(predicate(player)), 0) / count : 0;
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

export function selectLeagueStandings(snapshot) {
  const teams = [...(snapshot?.teams || [])].sort((left, right) => {
    const leftKnown = Number.isInteger(left.record?.wins) && Number.isInteger(left.record?.losses);
    const rightKnown = Number.isInteger(right.record?.wins) && Number.isInteger(right.record?.losses);
    if (leftKnown !== rightKnown) return leftKnown ? -1 : 1;
    if (!leftKnown) return left.name.localeCompare(right.name);
    return right.record.wins - left.record.wins || left.record.losses - right.record.losses || (right.pointsFor ?? -1) - (left.pointsFor ?? -1) || left.name.localeCompare(right.name);
  });
  return Object.freeze({ teams: Object.freeze(teams), methodology: "Sorted locally by reported wins, then losses, then points for. This is not official ESPN playoff seeding or tiebreaking." });
}

export function selectLeagueMatchups(snapshot, week) {
  if (!Number.isInteger(week)) return Object.freeze([]);
  return Object.freeze((snapshot?.matchups || []).filter((matchup) => matchup.week === week));
}

export function selectTeamSchedule(snapshot, teamId, weeks = null) {
  const teamIndex = new Map((snapshot?.teams || []).map((team) => [team.id, team]));
  if (!teamIndex.has(teamId)) return Object.freeze({ status: "missing-team", rows: Object.freeze([]), coverage: Object.freeze({ status: "unavailable", requestedWeeks: 0, reportedWeeks: 0, missingWeeks: Object.freeze([]), ambiguousWeeks: Object.freeze([]), repeatedOpponents: Object.freeze([]) }), methodology: "No schedule was evaluated because the selected team is unavailable." });

  const teamMatchups = [];
  const matchupsByWeek = new Map();
  for (const matchup of snapshot?.matchups || []) {
    if (matchup.homeTeamId !== teamId && matchup.awayTeamId !== teamId) continue;
    teamMatchups.push(matchup);
    if (!matchupsByWeek.has(matchup.week)) matchupsByWeek.set(matchup.week, []);
    matchupsByWeek.get(matchup.week).push(matchup);
  }
  const requestedWeeks = Array.isArray(weeks)
    ? [...new Set(weeks.filter(Number.isInteger))].sort((a, b) => a - b)
    : [...new Set(teamMatchups.filter((matchup) => matchup.week >= snapshot.currentWeek).map((matchup) => matchup.week))].sort((a, b) => a - b);
  const missingWeeks = [];
  const ambiguousWeeks = [];
  const rows = [];
  for (const week of requestedWeeks) {
    const matches = matchupsByWeek.get(week) || [];
    if (!matches.length) missingWeeks.push(week);
    if (matches.length > 1) ambiguousWeeks.push(week);
    for (const matchup of matches) {
      const isHome = matchup.homeTeamId === teamId;
      const opponentId = isHome ? matchup.awayTeamId : matchup.homeTeamId;
      rows.push(Object.freeze({
        week,
        opponentId,
        opponentName: teamIndex.get(opponentId)?.name || null,
        homeAway: isHome ? "home" : "away",
        teamScore: isHome ? matchup.homeScore ?? null : matchup.awayScore ?? null,
        opponentScore: isHome ? matchup.awayScore ?? null : matchup.homeScore ?? null,
        status: matchup.status || null
      }));
    }
  }

  const reportedWeeks = requestedWeeks.length - missingWeeks.length;
  const opponentWeeks = new Map();
  for (const row of rows) {
    if (!opponentWeeks.has(row.opponentId)) opponentWeeks.set(row.opponentId, []);
    opponentWeeks.get(row.opponentId).push(row.week);
  }
  const repeatedOpponents = [...opponentWeeks.entries()]
    .filter(([, opponentWeekList]) => new Set(opponentWeekList).size > 1)
    .map(([opponentId, opponentWeekList]) => Object.freeze({ opponentId, opponentName: teamIndex.get(opponentId)?.name || null, weeks: Object.freeze([...new Set(opponentWeekList)].sort((a, b) => a - b)) }));
  const coverageStatus = !requestedWeeks.length ? "unavailable" : missingWeeks.length ? "partial" : ambiguousWeeks.length ? "ambiguous" : "complete";
  return Object.freeze({
    status: requestedWeeks.length ? "ready" : "unavailable",
    rows: Object.freeze(rows),
    coverage: Object.freeze({
      status: coverageStatus,
      requestedWeeks: requestedWeeks.length,
      reportedWeeks,
      missingWeeks: Object.freeze(missingWeeks),
      ambiguousWeeks: Object.freeze(ambiguousWeeks),
      repeatedOpponents: Object.freeze(repeatedOpponents)
    }),
    methodology: "Matchups, scores, and status are ESPN-reported league state. Repeated opponents are identified only by ESPN team ID. No playoff boundary, opponent strength, or win probability is inferred."
  });
}
