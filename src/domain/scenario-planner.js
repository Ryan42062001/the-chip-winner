import { buildRosterAwareWaiverIdeas, evaluateAcquisitionCapacity } from "./waiver-engine.js";
import { evaluateTeamIrState } from "./ir-eligibility.js";
import { validateRecommendation } from "./recommendation-contract.js";
import { createRecommendation } from "./recommendation-factory.js";
import { createLineupOptimizer } from "./lineup-optimizer.js";
import { indexFutureProjections } from "../providers/projections/future-projection-provider.js";

// Future projection sets do not provide authoritative future-week kickoff times.
// Current ESPN transaction legality is checked with the caller's `now` before
// scenario simulation. Future utility therefore ignores kickoff-derived locks
// from the current snapshot while still honoring explicit ESPN `locked` flags.
const FUTURE_LINEUP_EVALUATION_TIME = 0;

function projectionCoverage(playerIds, week, espnToProvider, projectionIndex) {
  const unmappedPlayerIds = [];
  const missingProjectionPlayerIds = [];
  for (const id of playerIds) {
    const providerId = espnToProvider.get(id);
    if (!providerId) unmappedPlayerIds.push(id);
    else if (!projectionIndex.has(`${providerId}:${week}`)) missingProjectionPlayerIds.push(id);
  }
  return Object.freeze({
    mappedProjectionCount: playerIds.length - unmappedPlayerIds.length - missingProjectionPlayerIds.length,
    completeCoverage: !unmappedPlayerIds.length && !missingProjectionPlayerIds.length,
    unmappedPlayerIds: Object.freeze(unmappedPlayerIds),
    missingProjectionPlayerIds: Object.freeze(missingProjectionPlayerIds)
  });
}

function projectionCoverageForEntries(entries, week, espnToProvider, projectionIndex) {
  const activeEntries = (entries || []).filter((entry) => entry.lineupSlot !== "IR");
  const excludedIrPlayerIds = (entries || []).filter((entry) => entry.lineupSlot === "IR").map((entry) => entry.playerId).sort();
  const coverage = projectionCoverage(activeEntries.map((entry) => entry.playerId), week, espnToProvider, projectionIndex);
  return Object.freeze({
    ...coverage,
    rosterPlayerCount: activeEntries.length,
    excludedIrPlayerIds: Object.freeze(excludedIrPlayerIds)
  });
}

function scenarioKind(scenario) {
  if (scenario?.kind === "ir-assisted-add" || scenario?.irPlayerId) return "ir-assisted-add";
  if (!scenario?.kind || scenario.kind === "add-drop") return "add-drop";
  return null;
}

function isLocked(entry, player, now) {
  if (entry?.locked === true || player?.locked === true) return true;
  const kickoff = Date.parse(player?.gameTime);
  return Number.isFinite(kickoff) && kickoff <= now;
}

function rosterRuleViolation(rules, entries, players) {
  if (!rules) return null;
  let activeCount = 0;
  const counts = new Map();
  for (const entry of entries) {
    if (entry.lineupSlot !== "IR") activeCount += 1;
    const position = players.get(entry.playerId)?.position;
    if (position) counts.set(position, (counts.get(position) || 0) + 1);
  }
  if (rules.size != null && activeCount > rules.size) {
    return `ESPN roster size limit is ${rules.size}, but the simulated active roster would contain ${activeCount} players outside IR.`;
  }
  const exceeded = (rules.positionLimits || []).find((rule) => rule.limit >= 0 && (counts.get(rule.position) || 0) > rule.limit);
  return exceeded ? `ESPN ${exceeded.position} roster limit is ${exceeded.limit}.` : null;
}

function currentIrScenario(waiverResult, scenario) {
  return (waiverResult?.items || []).find((item) =>
    item.kind === "ir-assisted-add"
    && item.add?.id === scenario.addPlayerId
    && item.irMove?.player?.id === scenario.irPlayerId
  );
}

function buildScenarioEntries(snapshot, scenario, roster, context, now) {
  const { players, availablePlayerIds, waiverResult, irState, capacity } = context;
  const kind = scenarioKind(scenario);
  if (!kind) return { rejection: `Scenario kind ${String(scenario?.kind || "unknown")} is unsupported.` };
  const addPlayer = players.get(scenario.addPlayerId);
  if (!addPlayer) return { rejection: "Scenario references a player outside the current snapshot." };

  if (kind === "ir-assisted-add") {
    const irEntry = roster.entries.find((entry) => entry.playerId === scenario.irPlayerId);
    const irPlayer = players.get(scenario.irPlayerId);
    if (!irEntry || !irPlayer) return { rejection: "IR-assisted scenario references a player outside the current roster." };
    if (irEntry.lineupSlot !== "BE") return { rejection: "Only a bench player can be moved into IR by the multiweek scenario planner." };
    if (isLocked(irEntry, irPlayer, now)) return { rejection: "The proposed IR-move player is locked." };
    if (!availablePlayerIds?.has(addPlayer.id)) return { rejection: "The proposed add is not explicitly available in ESPN data." };
    if (!currentIrScenario(waiverResult, scenario)) return { rejection: "The IR-assisted path is not a currently validated ESPN waiver recommendation." };
    const entries = [
      ...roster.entries.map((entry) => entry.playerId === scenario.irPlayerId ? { ...entry, lineupSlot: "IR" } : entry),
      { playerId: scenario.addPlayerId, lineupSlot: "BE" }
    ];
    return { kind, entries, addPlayer, dropPlayer: null, irPlayer };
  }

  const dropEntry = roster.entries.find((entry) => entry.playerId === scenario.dropPlayerId);
  const dropPlayer = players.get(scenario.dropPlayerId);
  if (!dropEntry || !dropPlayer) return { rejection: "Scenario references a player outside the current snapshot." };
  if (dropEntry.lineupSlot !== "BE") return { rejection: "Only bench players can be dropped by the scenario planner." };
  if (isLocked(dropEntry, dropPlayer, now)) return { rejection: "The proposed drop player is locked." };
  if (isLocked({}, addPlayer, now)) return { rejection: "The proposed add player is locked." };
  if (!availablePlayerIds?.has(addPlayer.id)) return { rejection: "The proposed add is not explicitly available in ESPN data." };
  if (context.rosterPlayerIds.has(addPlayer.id)) return { rejection: "The proposed add is already on the selected ESPN roster." };
  if (irState.status === "invalid" || irState.status === "unverified") return { rejection: irState.reason };
  if (capacity.status === "exhausted") return { rejection: capacity.reason };

  const entries = roster.entries.map((entry) => entry.playerId === scenario.dropPlayerId
    ? { ...entry, playerId: scenario.addPlayerId }
    : entry);
  const rosterViolation = rosterRuleViolation(snapshot.league?.rosterRules, entries, players);
  if (rosterViolation) return { rejection: rosterViolation };
  return { kind, entries, addPlayer, dropPlayer, irPlayer: null };
}

function recommendationScenarios(snapshot, teamId, waiverResult) {
  return (waiverResult?.items || []).map((item, index) => {
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
}

function buildWeeklyContext(snapshot, roster, week, espnToProvider, projectionIndex) {
  const weeklyPlayers = new Map();
  for (const player of snapshot.players) {
    weeklyPlayers.set(player.id, {
      ...player,
      projection: projectionIndex.get(`${espnToProvider.get(player.id)}:${week}`) ?? null
    });
  }
  const optimizer = createLineupOptimizer(weeklyPlayers, FUTURE_LINEUP_EVALUATION_TIME);
  const baselineResult = optimizer.optimize(roster.entries);
  const coverage = projectionCoverageForEntries(roster.entries, week, espnToProvider, projectionIndex);
  const starters = coverage.completeCoverage
    ? (baselineResult.assignments || []).map((item) => Object.freeze({ playerId: item.player.id, slot: item.slot, points: item.player.projection ?? null }))
    : [];
  const baseline = Object.freeze({
    week,
    status: baselineResult.status,
    projectedTotal: baselineResult.projectedTotal ?? null,
    starters: Object.freeze(starters),
    mappedProjectionCount: coverage.mappedProjectionCount,
    rosterPlayerCount: coverage.rosterPlayerCount,
    completeCoverage: coverage.completeCoverage,
    unmappedPlayerIds: coverage.unmappedPlayerIds,
    missingProjectionPlayerIds: coverage.missingProjectionPlayerIds,
    excludedIrPlayerIds: coverage.excludedIrPlayerIds,
    reason: baselineResult.reason
  });
  return Object.freeze({ week, optimizer, baseline });
}

export function buildScenarioPlan(snapshot, teamId, options = {}) {
  const roster = snapshot?.rosters?.find((item) => item.teamId === teamId);
  const weeks = Array.isArray(options.weeks) ? options.weeks.filter(Number.isInteger) : [];
  if (!roster) return Object.freeze({ status: "missing-roster", weeks: [], limitations: ["Roster data is unavailable."] });

  const now = options.now ?? Date.now();
  const requestedScenarios = Array.isArray(options.scenarios) ? options.scenarios : [];
  const includeCurrentWeekScenarios = options.includeCurrentWeekScenarios !== false;
  const needsIrValidation = requestedScenarios.some((scenario) => scenarioKind(scenario) === "ir-assisted-add");
  const waiverResult = options.waiverResult
    || (includeCurrentWeekScenarios || needsIrValidation ? buildRosterAwareWaiverIdeas(snapshot, teamId, now) : null);
  const currentWeekScenarios = includeCurrentWeekScenarios
    ? recommendationScenarios(snapshot, teamId, waiverResult)
    : [];

  const weeklyBaseline = [];
  const scenarioResults = [];
  const rejectedScenarios = [];
  const candidateCoverage = [];

  if (options.projectionSet && options.identityMap instanceof Map) {
    const projectionIndex = indexFutureProjections(options.projectionSet);
    const espnToProvider = new Map([...options.identityMap].map(([providerId, espnId]) => [espnId, providerId]));
    const players = new Map(snapshot.players.map((player) => [player.id, player]));
    const availablePlayerIds = Array.isArray(snapshot.availablePlayers) ? new Set(snapshot.availablePlayers) : null;
    const context = Object.freeze({
      players,
      availablePlayerIds,
      rosterPlayerIds: new Set(roster.entries.map((entry) => entry.playerId)),
      waiverResult,
      irState: evaluateTeamIrState(snapshot, teamId, players),
      capacity: evaluateAcquisitionCapacity(snapshot, teamId)
    });

    const weekContexts = new Map();
    for (const week of weeks) {
      const weekContext = buildWeeklyContext(snapshot, roster, week, espnToProvider, projectionIndex);
      weekContexts.set(week, weekContext);
      weeklyBaseline.push(weekContext.baseline);
    }
    const baselineByWeek = new Map(weeklyBaseline.map((item) => [item.week, item]));

    const candidatePlayerIds = [...new Set(currentWeekScenarios.slice(0, 3).map((item) => item.payload?.add?.id).filter(Boolean))];
    for (const playerId of candidatePlayerIds) {
      const unmapped = [];
      const missingWeeks = [];
      const providerId = espnToProvider.get(playerId);
      for (const week of weeks) {
        if (!providerId) unmapped.push(week);
        else if (!projectionIndex.has(`${providerId}:${week}`)) missingWeeks.push(week);
      }
      candidateCoverage.push(Object.freeze({
        playerId,
        unmappedWeeks: Object.freeze(unmapped),
        missingProjectionWeeks: Object.freeze(missingWeeks)
      }));
    }

    for (const scenario of requestedScenarios) {
      const built = buildScenarioEntries(snapshot, scenario, roster, context, now);
      if (built.rejection) {
        rejectedScenarios.push(Object.freeze({ id: scenario.id || "unknown", reason: built.rejection }));
        continue;
      }

      const weekly = weeks.map((week) => {
        const weekContext = weekContexts.get(week);
        const result = weekContext.optimizer.optimize(built.entries);
        const baselineEntry = baselineByWeek.get(week);
        const baseline = baselineEntry?.projectedTotal;
        const weekCoverage = projectionCoverageForEntries(built.entries, week, espnToProvider, projectionIndex);
        const deltaReady = result.projectedTotal != null && baseline != null && baselineEntry.completeCoverage && weekCoverage.completeCoverage;
        const deltaUnavailableReason = deltaReady
          ? null
          : !baselineEntry?.completeCoverage
            ? "Baseline active-roster projection coverage is incomplete."
            : !weekCoverage.completeCoverage
              ? "Scenario active-roster projection coverage is incomplete."
              : "A complete legal lineup total is unavailable.";
        return Object.freeze({
          week,
          projectedTotal: result.projectedTotal ?? null,
          delta: deltaReady ? +(result.projectedTotal - baseline).toFixed(1) : null,
          deltaUnavailableReason,
          status: result.status,
          mappedProjectionCount: weekCoverage.mappedProjectionCount,
          rosterPlayerCount: weekCoverage.rosterPlayerCount,
          completeCoverage: weekCoverage.completeCoverage,
          unmappedPlayerIds: weekCoverage.unmappedPlayerIds,
          missingProjectionPlayerIds: weekCoverage.missingProjectionPlayerIds,
          excludedIrPlayerIds: weekCoverage.excludedIrPlayerIds
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
        horizonUnavailableReason: completeHorizon ? null : "At least one selected week lacks complete baseline or scenario active-roster coverage.",
        weekly: Object.freeze(weekly)
      }));
    }
  }

  const status = weeks.length && weeklyBaseline.length ? "ready" : "missing-future-inputs";
  const requiredProjectionCells = weeklyBaseline.reduce((total, item) => total + item.rosterPlayerCount, 0);
  const mappedProjectionCells = weeklyBaseline.reduce((total, item) => total + item.mappedProjectionCount, 0);
  const unmappedPlayerCells = weeklyBaseline.reduce((total, item) => total + item.unmappedPlayerIds.length, 0);
  const missingProjectionCells = weeklyBaseline.reduce((total, item) => total + item.missingProjectionPlayerIds.length, 0);
  const excludedIrPlayerCells = weeklyBaseline.reduce((total, item) => total + (item.excludedIrPlayerIds?.length || 0), 0);
  const excludedIrPlayerIds = [...new Set(weeklyBaseline.flatMap((item) => item.excludedIrPlayerIds || []))].sort();
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
    excludedIrPlayerCells,
    excludedIrPlayerIds: Object.freeze(excludedIrPlayerIds),
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
      "Weekly totals and starter coverage use only explicitly mapped provider projections for players in current non-IR ESPN roster slots.",
      "Players already occupying ESPN IR are excluded from projection-coverage requirements and lineup utility while they remain in IR. No zero-point projection or return date is invented; if ESPN moves a player back to an active slot, that player immediately re-enters coverage requirements.",
      "Horizon totals are withheld unless every selected week has complete active-roster coverage.",
      "Scenario deltas rerun the legal lineup optimizer against an isolated roster copy.",
      "Future-week lineup utility does not reuse current-week kickoff timestamps as future locks; current ESPN transaction legality is checked separately at the supplied evaluation time and explicit ESPN locked flags remain enforced.",
      "Add/drop scenarios require current ESPN availability, unlocked add/drop players, no proven acquisition exhaustion, a supported IR roster state, and compliance with explicit roster/position limits; future value does not require a current-week gain.",
      "IR-assisted scenarios still require a currently validated ESPN no-drop waiver recommendation; once the moved player occupies IR in the simulated roster, that player is excluded from active projection coverage until ESPN reports an active slot again.",
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
    limitation: records.length ? "Active-roster gaps precede top ESPN-available candidate gaps. Current ESPN IR occupants are excluded. Names are for human review only; joins require explicit IDs." : null
  });
}

export function buildProjectionCoverageMatrix(snapshot, teamId, { weeks = [], projectionSet = null, identityMap = null, candidatePlayerIds = [] } = {}) {
  const roster = snapshot?.rosters?.find((item) => item.teamId === teamId);
  if (!roster) return Object.freeze({ status: "missing-roster", rows: Object.freeze([]), weeks: Object.freeze([]), excludedIrPlayerIds: Object.freeze([]) });
  const activeRosterIds = roster.entries.filter((item) => item.lineupSlot !== "IR").map((item) => item.playerId);
  const excludedIrPlayerIds = roster.entries.filter((item) => item.lineupSlot === "IR").map((item) => item.playerId).sort();
  const rosterSet = new Set(activeRosterIds);
  const availableIds = new Set(snapshot.availablePlayers || []);
  const candidateSet = new Set(candidatePlayerIds.filter((id) => availableIds.has(id)));
  const ids = [...new Set([...activeRosterIds, ...candidateSet])];
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
    rows: Object.freeze(rows),
    excludedIrPlayerIds: Object.freeze(excludedIrPlayerIds)
  });
}
