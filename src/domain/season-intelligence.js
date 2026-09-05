import { isStarter } from "./model.js";
import { canFillSlot } from "./recommendations.js";
import { selectTeamSchedule } from "./selectors.js";

function normalizedWeeks(weeks = []) {
  return [...new Set((Array.isArray(weeks) ? weeks : []).filter((week) => Number.isInteger(week) && week >= 1 && week <= 18))].sort((a, b) => a - b);
}

function configuredStarterSlots(snapshot, roster) {
  const configured = (snapshot?.league?.lineupSlots || []).filter((item) => isStarter(item.slot) && Number.isInteger(item.count) && item.count > 0);
  if (configured.length) {
    return configured.flatMap((item) => Array.from({ length: item.count }, (_, index) => Object.freeze({ id: `${item.slot}:${index}`, slot: item.slot })));
  }
  return (roster?.entries || []).filter((entry) => isStarter(entry.lineupSlot)).map((entry, index) => Object.freeze({ id: `${entry.lineupSlot}:${index}`, slot: entry.lineupSlot }));
}

function maximumFilledSlotCount(players, slots) {
  const sortedPlayers = [...players].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const sortedSlots = [...slots].sort((left, right) => {
    const leftCount = sortedPlayers.filter((player) => canFillSlot(player, left.slot)).length;
    const rightCount = sortedPlayers.filter((player) => canFillSlot(player, right.slot)).length;
    return leftCount - rightCount || left.slot.localeCompare(right.slot) || left.id.localeCompare(right.id);
  });
  const playerAssignments = new Map();

  function assign(slot, seenPlayerIds) {
    for (const player of sortedPlayers) {
      if (!canFillSlot(player, slot.slot) || seenPlayerIds.has(player.id)) continue;
      seenPlayerIds.add(player.id);
      const previousSlot = playerAssignments.get(player.id);
      if (!previousSlot || assign(previousSlot, seenPlayerIds)) {
        playerAssignments.set(player.id, slot);
        return true;
      }
    }
    return false;
  }

  for (const slot of sortedSlots) assign(slot, new Set());
  return playerAssignments.size;
}

function possibleUncoveredSlotLabels(players, slots, maximumFilled) {
  if (maximumFilled >= slots.length) return [];
  const labels = slots
    .filter((slot) => maximumFilledSlotCount(players, slots.filter((candidate) => candidate.id !== slot.id)) === maximumFilled)
    .map((slot) => slot.slot);
  return [...new Set(labels)].sort();
}

export function buildByeWeekCoverage(snapshot, teamId) {
  const roster = snapshot?.rosters?.find((item) => item.teamId === teamId);
  if (!roster) return Object.freeze({ status: "missing-roster", weeks: Object.freeze([]), unknownByePlayerIds: Object.freeze([]), gapWeeks: Object.freeze([]) });
  const players = new Map((snapshot.players || []).map((player) => [player.id, player]));
  const activeEntries = roster.entries.filter((entry) => entry.lineupSlot !== "IR" && players.has(entry.playerId));
  const activePlayers = activeEntries.map((entry) => players.get(entry.playerId));
  const unknownByePlayerIds = activePlayers.filter((player) => !Number.isInteger(player.byeWeek) || player.byeWeek < 1 || player.byeWeek > 18).map((player) => player.id);
  const weeks = normalizedWeeks(activePlayers.map((player) => player.byeWeek)).filter((week) => !Number.isInteger(snapshot.currentWeek) || week >= snapshot.currentWeek);
  const requiredSlots = configuredStarterSlots(snapshot, roster);

  const rows = weeks.map((week) => {
    const byePlayerIds = new Set(activePlayers.filter((player) => player.byeWeek === week).map((player) => player.id));
    const availablePlayers = activePlayers.filter((player) => !byePlayerIds.has(player.id));
    const filledStarterSlots = maximumFilledSlotCount(availablePlayers, requiredSlots);
    const uncoveredSlotCount = Math.max(0, requiredSlots.length - filledStarterSlots);
    const uncoveredSlotCandidates = possibleUncoveredSlotLabels(availablePlayers, requiredSlots, filledStarterSlots);
    const affectedStarterPlayerIds = activeEntries.filter((entry) => isStarter(entry.lineupSlot) && byePlayerIds.has(entry.playerId)).map((entry) => entry.playerId);
    const status = uncoveredSlotCount ? "gap" : unknownByePlayerIds.length ? "partial" : "covered";
    return Object.freeze({
      week,
      status,
      byePlayerIds: Object.freeze([...byePlayerIds].sort()),
      affectedStarterPlayerIds: Object.freeze(affectedStarterPlayerIds.sort()),
      uncoveredSlotCount,
      uncoveredSlotCandidates: Object.freeze(uncoveredSlotCandidates),
      requiredStarterSlots: requiredSlots.length
    });
  });
  const gapWeeks = rows.filter((row) => row.uncoveredSlotCount > 0).map((row) => row.week);
  const status = gapWeeks.length ? "gap" : unknownByePlayerIds.length ? "partial" : "ready";
  return Object.freeze({
    status,
    weeks: Object.freeze(rows),
    unknownByePlayerIds: Object.freeze(unknownByePlayerIds.sort()),
    gapWeeks: Object.freeze(gapWeeks),
    methodology: "Bye coverage uses ESPN-reported roster slots, listed NFL positions, and explicit bye weeks. It checks the maximum number of configured starter slots the current non-IR roster can legally fill after known bye players are removed. When multiple equally valid slot assignments exist, it reports the gap count plus every slot type that could be affected instead of pretending one arbitrary assignment is uniquely correct. Unknown bye weeks remain uncertainty rather than being treated as available facts."
  });
}

function explicitStars(value) {
  return Number.isInteger(value) && value >= 1 && value <= 5 ? value : null;
}

function starBand(value) {
  if (value == null) return null;
  if (value >= 4) return "favorable";
  if (value === 3) return "neutral";
  return "difficult";
}

export function buildScheduleStrengthOutlook(snapshot, teamId, reconciliation = null) {
  const roster = snapshot?.rosters?.find((item) => item.teamId === teamId);
  if (!roster) return Object.freeze({ status: "missing-roster", items: Object.freeze([]) });
  const players = new Map((snapshot.players || []).map((player) => [player.id, player]));
  const items = roster.entries.map((entry) => {
    const player = players.get(entry.playerId);
    if (!player) return null;
    const ranking = reconciliation?.byPlayerId?.[entry.playerId] || null;
    const seasonStars = explicitStars(ranking?.seasonScheduleStrength);
    const playoffStars = explicitStars(ranking?.playoffScheduleStrength);
    return Object.freeze({
      playerId: player.id,
      playerName: player.name,
      position: player.position,
      proTeam: player.proTeam || null,
      lineupSlot: entry.lineupSlot,
      starter: isStarter(entry.lineupSlot),
      seasonStars,
      playoffStars,
      seasonBand: starBand(seasonStars),
      playoffBand: starBand(playoffStars)
    });
  }).filter(Boolean).sort((left, right) => Number(right.starter) - Number(left.starter) || left.position.localeCompare(right.position) || left.playerName.localeCompare(right.playerName));

  const ratedItems = items.filter((item) => item.seasonStars != null || item.playoffStars != null);
  const starterRatings = items.filter((item) => item.starter && item.playoffStars != null);
  const starterSummary = Object.freeze({
    favorable: starterRatings.filter((item) => item.playoffBand === "favorable").length,
    neutral: starterRatings.filter((item) => item.playoffBand === "neutral").length,
    difficult: starterRatings.filter((item) => item.playoffBand === "difficult").length,
    rated: starterRatings.length,
    total: items.filter((item) => item.starter).length
  });
  const status = !reconciliation || !ratedItems.length ? "unavailable" : ratedItems.length === items.length ? "ready" : "partial";
  return Object.freeze({
    status,
    items: Object.freeze(items),
    ratedRosterPlayers: ratedItems.length,
    totalRosterPlayers: items.length,
    starterSummary,
    source: reconciliation ? Object.freeze({ provider: "FantasyPros", input: "user-imported rest-of-season CSV", fields: Object.freeze(["SOS SEASON", "SOS PLAYOFFS"]) }) : null,
    methodology: "The Chip Winner displays only explicit FantasyPros SOS stars supplied by the imported ROS CSV. It does not recompute, average, or convert those source ratings into a hidden score. The CSV does not encode the exact week range behind SOS PLAYOFFS, so that field is source-defined context and is not claimed to match this league's configured playoff weeks."
  });
}

export function buildPlayoffProjectionOutlook(snapshot, teamId, playoffWeeks = [], scenarioPlan = null) {
  const roster = snapshot?.rosters?.find((item) => item.teamId === teamId);
  if (!roster) return Object.freeze({ status: "missing-roster", weeks: Object.freeze([]), rows: Object.freeze([]) });
  const weeks = normalizedWeeks(playoffWeeks);
  if (!weeks.length) return Object.freeze({ status: "missing-playoff-weeks", weeks: Object.freeze([]), rows: Object.freeze([]), aggregate: null });
  const baselineByWeek = new Map((scenarioPlan?.weeklyBaseline || []).map((item) => [item.week, item]));
  const rows = weeks.map((week) => {
    const baseline = baselineByWeek.get(week);
    if (!baseline) return Object.freeze({ week, status: "unavailable", completeCoverage: false, projectedTotal: null, starters: Object.freeze([]), missingPlayerIds: Object.freeze([]) });
    const missingPlayerIds = [...new Set([...(baseline.unmappedPlayerIds || []), ...(baseline.missingProjectionPlayerIds || [])])].sort();
    const completeCoverage = Boolean(baseline.completeCoverage && baseline.projectedTotal != null);
    return Object.freeze({
      week,
      status: completeCoverage ? "ready" : "blocked",
      completeCoverage,
      projectedTotal: completeCoverage ? baseline.projectedTotal : null,
      starters: Object.freeze(completeCoverage ? [...(baseline.starters || [])] : []),
      mappedProjectionCount: baseline.mappedProjectionCount ?? 0,
      rosterPlayerCount: baseline.rosterPlayerCount ?? roster.entries.length,
      missingPlayerIds: Object.freeze(missingPlayerIds)
    });
  });
  const completeRows = rows.filter((row) => row.completeCoverage);
  const allComplete = completeRows.length === weeks.length;
  let aggregate = null;
  if (allComplete) {
    const totals = completeRows.map((row) => row.projectedTotal);
    const horizonTotal = +totals.reduce((sum, value) => sum + value, 0).toFixed(1);
    const lowest = completeRows.reduce((best, row) => !best || row.projectedTotal < best.projectedTotal ? row : best, null);
    const highest = completeRows.reduce((best, row) => !best || row.projectedTotal > best.projectedTotal ? row : best, null);
    const starterSets = completeRows.map((row) => new Set(row.starters.map((starter) => starter.playerId)));
    const stableStarterIds = starterSets.length ? [...starterSets[0]].filter((playerId) => starterSets.every((set) => set.has(playerId))).sort() : [];
    let starterTurnover = 0;
    for (let index = 1; index < starterSets.length; index += 1) {
      starterTurnover += [...starterSets[index]].filter((playerId) => !starterSets[index - 1].has(playerId)).length;
    }
    aggregate = Object.freeze({
      horizonTotal,
      average: +(horizonTotal / weeks.length).toFixed(1),
      lowestWeek: Object.freeze({ week: lowest.week, projectedTotal: lowest.projectedTotal }),
      highestWeek: Object.freeze({ week: highest.week, projectedTotal: highest.projectedTotal }),
      stableStarterIds: Object.freeze(stableStarterIds),
      starterTurnover
    });
  }
  const status = !scenarioPlan || !scenarioPlan.weeklyBaseline?.length ? "unavailable" : allComplete ? "ready" : completeRows.length ? "partial" : "blocked";
  return Object.freeze({
    status,
    weeks: Object.freeze(weeks),
    rows: Object.freeze(rows),
    completeWeeks: completeRows.length,
    blockedWeeks: Object.freeze(rows.filter((row) => !row.completeCoverage).map((row) => row.week)),
    aggregate,
    source: scenarioPlan?.source || null,
    methodology: "Each selected playoff week reruns the legal lineup optimizer with explicitly mapped weekly projections. A playoff-window total, average, high/low week, or starter-continuity summary is exposed only when every configured playoff week has complete baseline roster coverage; partial weeks are never summed as if missing values were zero."
  });
}

export function buildSeasonPlayoffIntelligence(snapshot, teamId, { playoffWeeks = [], scenarioPlan = null, rankingReconciliation = null } = {}) {
  const roster = snapshot?.rosters?.find((item) => item.teamId === teamId);
  if (!roster) return Object.freeze({ status: "missing-roster", playoffWeeks: Object.freeze([]) });
  const normalizedPlayoffWeeks = normalizedWeeks(playoffWeeks);
  const boundarySource = Array.isArray(snapshot?.league?.playoffWeeks) && snapshot.league.playoffWeeks.length ? "espn" : normalizedPlayoffWeeks.length ? "local" : "unconfigured";
  return Object.freeze({
    status: "ready",
    playoffWeeks: Object.freeze(normalizedPlayoffWeeks),
    playoffBoundarySource: boundarySource,
    byeCoverage: buildByeWeekCoverage(snapshot, teamId),
    fantasyPlayoffSchedule: selectTeamSchedule(snapshot, teamId, normalizedPlayoffWeeks),
    playoffProjection: buildPlayoffProjectionOutlook(snapshot, teamId, normalizedPlayoffWeeks, scenarioPlan),
    scheduleStrength: buildScheduleStrengthOutlook(snapshot, teamId, rankingReconciliation),
    limitations: Object.freeze([
      "ESPN owns roster state, fantasy-league matchups, and playoff-week configuration when it reports those fields.",
      "Future point outlook uses only explicitly mapped external weekly projections and withholds aggregate playoff claims when any selected week is incomplete.",
      "FantasyPros SOS stars remain an independent imported advisory overlay; they never change ESPN facts or projection totals, and SOS PLAYOFFS is not assumed to match this league's exact playoff window."
    ])
  });
}
