import { buildRosterAwareWaiverIdeas } from "./waiver-engine.js";
import { validateRecommendation } from "./recommendation-contract.js";
import { createRecommendation } from "./recommendation-factory.js";
import { optimizeLineup } from "./lineup-optimizer.js";
import { indexFutureProjections } from "../providers/projections/future-projection-provider.js";

function projectionCoverage(playerIds, week, espnToProvider, projectionIndex) {
  const unmappedPlayerIds = playerIds.filter((id) => !espnToProvider.has(id));
  const missingProjectionPlayerIds = playerIds.filter((id) => espnToProvider.has(id) && !projectionIndex.has(`${espnToProvider.get(id)}:${week}`));
  return Object.freeze({
    mappedProjectionCount: playerIds.length - unmappedPlayerIds.length - missingProjectionPlayerIds.length,
    completeCoverage: !unmappedPlayerIds.length && !missingProjectionPlayerIds.length,
    unmappedPlayerIds: Object.freeze(unmappedPlayerIds),
    missingProjectionPlayerIds: Object.freeze(missingProjectionPlayerIds)
  });
}

function scenarioKind(scenario) {
  if (scenario?.kind === "ir-assisted-add" || scenario?.irPlayerId) return "ir-assisted-add";
  if (!scenario?.kind || scenario.kind === "add-drop") return "add-drop";
  return null;
}

function currentIrScenario(waiverResult, scenario) {
  return (waiverResult.items || []).find((item) =>
    item.kind === "ir-assisted-add"
    && item.add?.id === scenario.addPlayerId
    && item.irMove?.player?.id === scenario.irPlayerId
  );
}

function currentAddDropScenario(waiverResult, scenario) {
  return (waiverResult.items || []).find((item) =>
    item.kind === "add-drop"
    && item.add?.id === scenario.addPlayerId
    && item.drop?.id === scenario.dropPlayerId
  );
}

function buildScenarioSnapshot(snapshot, teamId, scenario, roster, players, waiverResult, now) {
  const kind = scenarioKind(scenario);
  if (!kind) return { rejection: `Scenario kind ${String(scenario?.kind || "unknown")} is unsupported.` };
  const addPlayer = players.get(scenario.addPlayerId);
  if (!addPlayer) return { rejection: "Scenario references a player outside the current snapshot." };

  if (kind === "ir-assisted-add") {
    const irEntry = roster.entries.find((entry) => entry.playerId === scenario.irPlayerId);
    const irPlayer = players.get(scenario.irPlayerId);
    if (!irEntry || !irPlayer) return { rejection: "IR-assisted scenario references a player outside the current roster." };
    if (irEntry.lineupSlot !== "BE") return { rejection: "Only a bench player can be moved into IR by the multiweek scenario planner." };
    const kickoff = Date.parse(irPlayer.gameTime);
    const locked = irEntry.locked === true || irPlayer.locked === true || (Number.isFinite(kickoff) && kickoff <= now);
    if (locked) return { rejection: "The proposed IR-move player is locked." };
    if (!snapshot.availablePlayers?.includes(addPlayer.id)) return { rejection: "The proposed add is not explicitly available in ESPN data." };
    if (!currentIrScenario(waiverResult, scenario)) {
      return { rejection: "The IR-assisted path is not a currently validated ESPN waiver recommendation." };
    }
    const simulated = {
      ...snapshot,
      rosters: snapshot.rosters.map((item) => item.teamId !== teamId ? item : {
        ...item,
        entries: [
          ...item.entries.map((entry) => entry.playerId === scenario.irPlayerId ? { ...entry, lineupSlot: "IR" } : entry),
          { playerId: scenario.addPlayerId, lineupSlot: "BE" }
        ]
      })
    };
    return { kind, simulated, addPlayer, dropPlayer: null, irPlayer };
  }

  const dropEntry = roster.entries.find((entry) => entry.playerId === scenario.dropPlayerId);
  const dropPlayer = players.get(scenario.dropPlayerId);
  if (!dropEntry || !dropPlayer) return { rejection: "Scenario references a player outside the current snapshot." };
  if (dropEntry.lineupSlot !== "BE") return { rejection: "Only bench players can be dropped by the scenario planner." };
  const kickoff = Date.parse(dropPlayer.gameTime);
  const locked = dropEntry.locked === true || dropPlayer.locked === true || (Number.isFinite(kickoff) && kickoff <= now);
  if (locked) return { rejection: "The proposed drop player is locked." };
  if (!snapshot.availablePlayers?.includes(addPlayer.id)) return { rejection: "The proposed add is not explicitly available in ESPN data." };
  if (!currentAddDropScenario(waiverResult, scenario)) {
    return { rejection: "The add/drop path is not a currently validated ESPN waiver recommendation." };
  }
  const simulated = {
    ...snapshot,
    rosters: snapshot.rosters.map((item) => item.teamId !== teamId ? item : {
      ...item,
      entries: item.entries.map((entry) => entry.playerId === scenario.dropPlayerId ? { ...entry, playerId: scenario.addPlayerId } : entry)
    })
  };
  return { kind, simulated, addPlayer, dropPlayer, irPlayer: null };
}

export function buildScenarioPlan(snapshot, teamId, options = {}) {
  const roster = snapshot?.rosters?.find((item) => item.teamId === teamId);
  const weeks = Array.isArray(options.weeks) ? options.weeks.filter(Number.isInteger) : [];
  if (!roster) return Object.freeze({ status: "missing-roster", weeks: [], limitations: ["Roster data is unavailable."] });

  const now = options.now ?? Date.now();
  const waiverResult = buildRosterAwareWaiverIdeas(snapshot, teamId, now);
  const currentWeekScenarios = (waiverResult.items || []).map((item, index) => {
    const recommendation = createRecommendation({
      id: `waiver-${teamId}-${index}`,
      kind: "scenario",
      status: "review",
      confidence: "medium",
      inputs: ["ESPN availability", "ESPN current-week projections", "ESPN lineup rules"],
      limitations: waiverResult.limitations || [],
      sourceCapturedAt: snapshot.meta?.capturedAt || null,
      payload: item
    });
    const validation = validateRecommendation(recommendation);
    return validation.valid ? Object.freeze(recommendation) : null;
  }).filter(Boolean);

  const weeklyBaseline = [];
  const scenarioResults = [];
  const rejectedScenarios = [];
  const candidateCoverage = [];

  if (options.projectionSet && options.identityMap instanceof Map) {
    const projectionIndex = indexFutureProjections(options.projectionSet);
    const espnToProvider = new Map([...options.identityMap].map(([providerId, espnId]) => [espnId, providerId]));
    const players = new Map(snapshot.players.map((player) => [player.id, player]));

    for (const week of weeks) {
      const weeklySnapshot = {
        ...snapshot,
        currentWeek: week,
        players: snapshot.players.map((player) => ({
          ...player,
          projection: projectionIndex.get(`${espnToProvider.get(player.id)}:${week}`) ?? null
        }))
      };
      const result = optimizeLineup(weeklySnapshot, teamId);
      const rosterPlayerIds = roster.entries.map((entry) => entry.playerId);
      const weekCoverage = projectionCoverage(rosterPlayerIds, week, espnToProvider, projectionIndex);
      const starters = weekCoverage.completeCoverage
        ? (result.assignments || []).map((item) => Object.freeze({ playerId: item.player.id, slot: item.slot, points: item.player.projection ?? null }))
        : [];
      weeklyBaseline.push(Object.freeze({
        week,
        status: result.status,
        projectedTotal: result.projectedTotal ?? null,
        starters: Object.freeze(starters),
        mappedProjectionCount: weekCoverage.mappedProjectionCount,
        rosterPlayerCount: rosterPlayerIds.length,
        completeCoverage: weekCoverage.completeCoverage,
        unmappedPlayerIds: weekCoverage.unmappedPlayerIds,
        missingProjectionPlayerIds: weekCoverage.missingProjectionPlayerIds,
        reason: result.reason
      }));
    }

    const candidatePlayerIds = [...new Set(currentWeekScenarios.slice(0, 3).map((item) => item.payload?.add?.id).filter(Boolean))];
    for (const playerId of candidatePlayerIds) {
      const unmapped = [];
      const missingWeeks = [];
      for (const week of weeks) {
        const coverage = projectionCoverage([playerId], week, espnToProvider, projectionIndex);
        if (coverage.unmappedPlayerIds.length) unmapped.push(week);
        else if (coverage.missingProjectionPlayerIds.length) missingWeeks.push(week);
      }
      candidateCoverage.push(Object.freeze({
        playerId,
        unmappedWeeks: Object.freeze(unmapped),
        missingProjectionWeeks: Object.freeze(missingWeeks)
      }));
    }

    for (const scenario of options.scenarios || []) {
      const built = buildScenarioSnapshot(snapshot, teamId, scenario, roster, players, waiverResult, now);
      if (built.rejection) {
        rejectedScenarios.push(Object.freeze({ id: scenario.id || "unknown", reason: built.rejection }));
        continue;
      }

      const weekly = weeks.map((week) => {
        const weeklyPlayers = snapshot.players.map((player) => ({
          ...player,
          projection: projectionIndex.get(`${espnToProvider.get(player.id)}:${week}`) ?? null
        }));
        const scenarioSnapshot = { ...built.simulated, currentWeek: week, players: weeklyPlayers };
        const result = optimizeLineup(scenarioSnapshot, teamId);
        const baselineEntry = weeklyBaseline.find((item) => item.week === week);
        const baseline = baselineEntry?.projectedTotal;
        const scenarioRosterIds = scenarioSnapshot.rosters.find((item) => item.teamId === teamId).entries.map((entry) => entry.playerId);
        const weekCoverage = projectionCoverage(scenarioRosterIds, week, espnToProvider, projectionIndex);
        const deltaReady = result.projectedTotal != null && baseline != null && baselineEntry.completeCoverage && weekCoverage.completeCoverage;
        const deltaUnavailableReason = deltaReady
          ? null
          : !baselineEntry?.completeCoverage
            ? "Baseline roster projection coverage is incomplete."
            : !weekCoverage.completeCoverage
              ? "Scenario roster projection coverage is incomplete."
              : "A complete legal lineup total is unavailable.";
        return Object.freeze({
          week,
          projectedTotal: result.projectedTotal ?? null,
          delta: deltaReady ? +(result.projectedTotal - baseline).toFixed(1) : null,
          deltaUnavailableReason,
          status: result.status,
          mappedProjectionCount: weekCoverage.mappedProjectionCount,
          rosterPlayerCount: scenarioRosterIds.length,
          completeCoverage: weekCoverage.completeCoverage,
          unmappedPlayerIds: weekCoverage.unmappedPlayerIds,
          missingProjectionPlayerIds: weekCoverage.missingProjectionPlayerIds
        });
      });

      const completeHorizon = weekly.length === weeks.length && weekly.every((item) => item.delta != null);
      scenarioResults.push(Object.freeze({
        id: scenario.id || (built.kind === "ir-assisted-add" ? `${scenario.addPlayerId}-after-${scenario.irPlayerId}-to-ir` : `${scenario.addPlayerId}-for-${scenario.dropPlayerId}`),
        kind: built.kind,
        addPlayerId: scenario.addPlayerId,
        dropPlayerId: built.kind === "add-drop" ? scenario.dropPlayerId : null,
        irPlayerId: built.kind === "ir-assisted-add" ? scenario.irPlayerId : null,
        horizonDelta: completeHorizon ? +weekly.reduce((sum, item) => sum + item.delta, 0).toFixed(1) : null,
        horizonUnavailableReason: completeHorizon ? null : "At least one selected week lacks complete baseline or scenario roster coverage.",
        weekly: Object.freeze(weekly)
      }));
    }
  }

  const status = weeks.length && weeklyBaseline.length ? "ready" : "missing-future-inputs";
  const requiredProjectionCells = weeklyBaseline.reduce((total, item) => total + item.rosterPlayerCount, 0);
  const mappedProjectionCells = weeklyBaseline.reduce((total, item) => total + item.mappedProjectionCount, 0);
  const unmappedPlayerCells = weeklyBaseline.reduce((total, item) => total + item.unmappedPlayerIds.length, 0);
  const missingProjectionCells = weeklyBaseline.reduce((total, item) => total + item.missingProjectionPlayerIds.length, 0);
  const readyWeeks = weeklyBaseline.filter((item) => item.completeCoverage).map((item) => item.week);
  const blockedWeeks = weeklyBaseline.filter((item) => !item.completeCoverage).map((item) => item.week);
  const readiness = !weeklyBaseline.length ? "unavailable" : blockedWeeks.length === 0 ? "complete" : readyWeeks.length ? "mixed" : "blocked";
  const baselineHorizonTotal = weeklyBaseline.length === weeks.length && weeklyBaseline.every((item) => item.completeCoverage && item.projectedTotal != null)
    ? +weeklyBaseline.reduce((sum, item) => sum + item.projectedTotal, 0).toFixed(1)
    : null;
  const coverage = Object.freeze({
    readiness,
    completeWeeks: readyWeeks.length,
    totalWeeks: weeklyBaseline.length,
    readyWeeks: Object.freeze(readyWeeks),
    blockedWeeks: Object.freeze(blockedWeeks),
    mappedProjectionCells,
    requiredProjectionCells,
    unmappedPlayerCells,
    missingProjectionCells,
    percentage: requiredProjectionCells ? Math.round((mappedProjectionCells / requiredProjectionCells) * 100) : 0
  });
  const source = options.projectionSet ? Object.freeze({
    provider: options.projectionSet.provider || null,
    scoringFormat: options.projectionSet.scoringFormat || null,
    capturedAt: options.projectionSet.capturedAt || null,
    projectionCount: options.projectionSet.projections?.length || 0,
    identityMappingCount: options.identityMap instanceof Map ? options.identityMap.size : 0
  }) : null;

  return Object.freeze({
    status,
    weeks: Object.freeze(weeks),
    source,
    coverage,
    baselineHorizonTotal,
    scenarios: Object.freeze(scenarioResults),
    rejectedScenarios: Object.freeze(rejectedScenarios),
    weeklyBaseline: Object.freeze(weeklyBaseline),
    candidateProjectionCoverage: Object.freeze(candidateCoverage),
    currentWeekScenarios: Object.freeze(currentWeekScenarios),
    limitations: Object.freeze(status === "ready" ? [
      "Weekly totals and starter coverage use only explicitly mapped provider projections.",
      "Horizon totals are withheld unless every selected week is complete.",
      "Scenario deltas rerun the legal lineup optimizer against an isolated roster copy.",
      "IR-assisted scenarios retain the injured player in IR and require complete player-week coverage for that retained player as well as every active roster player.",
      "Only currently validated ESPN waiver recommendations are evaluated; stale add/drop and IR-assisted paths fail closed after availability, lock, acquisition-limit, roster-rule, or projected-gain changes.",
      "This planner is read-only and does not modify ESPN league state."
    ] : [
      "Future-week projections and an explicit identity map were not both supplied.",
      "Current-week scenarios remain available when ESPN availability and projections are present.",
      "No future fantasy points or scenario winner are inferred."
    ])
  });
}

export function buildProjectionGapReport(snapshot, plan, identityMap) {
  if (!Array.isArray(plan?.weeklyBaseline) || !plan.weeklyBaseline.length) {
    return Object.freeze({ status: "unavailable", records: Object.freeze([]), limitation: "No evaluated future weeks are available." });
  }
  const players = new Map((snapshot?.players || []).map((player) => [player.id, player]));
  const espnToProvider = identityMap instanceof Map ? new Map([...identityMap].map(([providerId, espnId]) => [espnId, providerId])) : new Map();
  const rosterGaps = plan.weeklyBaseline.flatMap((week) => [
    ...week.unmappedPlayerIds.map((playerId) => ({ week: week.week, playerId, scope: "roster", gapType: "missing-identity-map", providerPlayerId: null })),
    ...week.missingProjectionPlayerIds.map((playerId) => ({ week: week.week, playerId, scope: "roster", gapType: "missing-week-projection", providerPlayerId: espnToProvider.get(playerId) || null }))
  ]);
  const candidateGaps = (plan.candidateProjectionCoverage || []).flatMap((item) => [
    ...item.unmappedWeeks.map((week) => ({ week, playerId: item.playerId, scope: "candidate", gapType: "candidate-missing-identity-map", providerPlayerId: null })),
    ...item.missingProjectionWeeks.map((week) => ({ week, playerId: item.playerId, scope: "candidate", gapType: "candidate-missing-week-projection", providerPlayerId: espnToProvider.get(item.playerId) || null }))
  ]);
  const records = [...rosterGaps, ...candidateGaps].map((record) => {
    const player = players.get(record.playerId);
    return Object.freeze({
      week: record.week,
      scope: record.scope,
      espnPlayerId: record.playerId,
      playerName: player?.name || null,
      proTeam: player?.proTeam || null,
      position: player?.position || null,
      gapType: record.gapType,
      providerPlayerId: record.providerPlayerId
    });
  });
  return Object.freeze({
    status: records.length ? "gaps" : "complete",
    records: Object.freeze(records),
    limitation: records.length ? "Roster gaps precede top ESPN-available candidate gaps. Names are for human review only; joins require explicit IDs." : null
  });
}

export function buildProjectionCoverageMatrix(snapshot, teamId, { weeks = [], projectionSet = null, identityMap = null, candidatePlayerIds = [] } = {}) {
  const roster = snapshot?.rosters?.find((item) => item.teamId === teamId);
  if (!roster) return Object.freeze({ status: "missing-roster", rows: Object.freeze([]), weeks: Object.freeze([]) });
  const rosterIds = roster.entries.map((item) => item.playerId);
  const rosterSet = new Set(rosterIds);
  const candidateSet = new Set(candidatePlayerIds.filter((id) => snapshot.availablePlayers?.includes(id)));
  const ids = [...new Set([...rosterIds, ...candidateSet])];
  const players = new Map(snapshot.players.map((item) => [item.id, item]));
  const espnToProvider = identityMap instanceof Map ? new Map([...identityMap].map(([providerId, espnId]) => [espnId, providerId])) : new Map();
  const records = new Map((projectionSet?.projections || []).map((item) => [`${item.providerPlayerId}:${item.week}`, item]));
  const selectedWeeks = [...new Set(weeks.filter(Number.isInteger))].sort((a, b) => a - b);
  const rows = ids.map((espnPlayerId) => {
    const providerPlayerId = espnToProvider.get(espnPlayerId) || null;
    const cells = selectedWeeks.map((week) => {
      const record = providerPlayerId ? records.get(`${providerPlayerId}:${week}`) : null;
      return Object.freeze({
        week,
        status: !providerPlayerId ? "missing-mapping" : record ? "ready" : "missing-week",
        points: record?.points ?? null,
        capturedAt: record?.capturedAt || null
      });
    });
    const player = players.get(espnPlayerId);
    return Object.freeze({
      espnPlayerId,
      providerPlayerId,
      playerName: player?.name || null,
      proTeam: player?.proTeam || null,
      position: player?.position || null,
      scope: rosterSet.has(espnPlayerId) && candidateSet.has(espnPlayerId) ? "roster-candidate" : rosterSet.has(espnPlayerId) ? "roster" : "candidate",
      cells: Object.freeze(cells),
      complete: cells.length > 0 && cells.every((cell) => cell.status === "ready")
    });
  });
  return Object.freeze({
    status: rows.length && selectedWeeks.length ? (rows.every((row) => row.complete) ? "complete" : "gaps") : "unavailable",
    weeks: Object.freeze(selectedWeeks),
    rows: Object.freeze(rows)
  });
}
