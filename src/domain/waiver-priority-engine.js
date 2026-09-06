import { buildRosterAwareWaiverIdeas } from "./waiver-engine.js";
import { buildScenarioPlan } from "./scenario-planner.js";
import { createLineupOptimizer } from "./lineup-optimizer.js";
import { indexFutureProjections } from "../providers/projections/future-projection-provider.js";

const MIN_CURRENT_WEEK_ACTION_GAIN = 0.5;
const PRIORITY_METRICS = Object.freeze([
  "currentWeekGain",
  "futureHorizonGain",
  "futurePositiveWeekRate",
  "replacementPointsAbove",
  "preservesRosteredPlayer"
]);

function scenarioInput(item, id) {
  if (item.kind === "ir-assisted-add" && item.irMove?.player?.id) {
    return Object.freeze({ id, kind: "ir-assisted-add", addPlayerId: item.add.id, irPlayerId: item.irMove.player.id });
  }
  if (item.kind === "add-drop" && item.drop?.id) {
    return Object.freeze({ id, kind: "add-drop", addPlayerId: item.add.id, dropPlayerId: item.drop.id });
  }
  return null;
}

function metricValue(item, metric) {
  return item?.factors?.[metric] ?? null;
}

function dominates(left, right) {
  let strictlyBetter = false;
  for (const metric of PRIORITY_METRICS) {
    const leftValue = metricValue(left, metric);
    const rightValue = metricValue(right, metric);
    const leftMissing = leftValue == null;
    const rightMissing = rightValue == null;
    if (leftMissing !== rightMissing) return false;
    if (leftMissing && rightMissing) continue;
    if (leftValue < rightValue) return false;
    if (leftValue > rightValue) strictlyBetter = true;
  }
  return strictlyBetter;
}

export function assignWaiverPriorityBands(items = []) {
  const remaining = items.map((item, index) => ({ item, index }));
  const bands = new Map();
  let band = 1;

  while (remaining.length) {
    const front = remaining.filter((candidate) => !remaining.some((other) =>
      other !== candidate && dominates(other.item, candidate.item)
    ));
    const selected = front.length ? front : [remaining[0]];
    for (const candidate of selected) bands.set(candidate.index, band);
    const selectedSet = new Set(selected);
    for (let index = remaining.length - 1; index >= 0; index -= 1) {
      if (selectedSet.has(remaining[index])) remaining.splice(index, 1);
    }
    band += 1;
  }

  return Object.freeze(items.map((item, index) => Object.freeze({ ...item, priorityBand: bands.get(index) || 1 })));
}

function futureEvidence(plan, scenario) {
  if (!scenario) {
    return Object.freeze({
      status: plan?.status === "ready" ? "unavailable" : "missing-inputs",
      horizonGain: null,
      positiveWeeks: null,
      totalWeeks: null,
      positiveWeekRate: null,
      reason: plan?.status === "ready" ? "No matching future scenario was evaluated." : "Compatible future projections and explicit identity mappings are required."
    });
  }
  if (scenario.horizonDelta == null) {
    return Object.freeze({
      status: "blocked",
      horizonGain: null,
      positiveWeeks: null,
      totalWeeks: scenario.weekly?.length ?? null,
      positiveWeekRate: null,
      reason: scenario.horizonUnavailableReason || "Future impact is blocked by incomplete baseline or scenario coverage."
    });
  }
  const weekly = scenario.weekly || [];
  const positiveWeeks = weekly.reduce((count, item) => count + Number(item.delta > 0), 0);
  const totalWeeks = weekly.length;
  return Object.freeze({
    status: "ready",
    horizonGain: scenario.horizonDelta,
    positiveWeeks,
    totalWeeks,
    positiveWeekRate: totalWeeks ? +(positiveWeeks / totalWeeks).toFixed(3) : null,
    reason: null
  });
}

function isLocked(entry, player, now) {
  if (entry?.locked === true || player?.locked === true) return true;
  const kickoff = Date.parse(player?.gameTime);
  return Number.isFinite(kickoff) && kickoff <= now;
}

function buildReplacementBenchmarks(snapshot, players) {
  const byPosition = new Map();
  for (const playerId of snapshot.availablePlayers || []) {
    const player = players.get(playerId);
    if (!player || player.projection == null) continue;
    if (!byPosition.has(player.position)) byPosition.set(player.position, []);
    byPosition.get(player.position).push(player);
  }
  for (const list of byPosition.values()) list.sort((left, right) => right.projection - left.projection);
  const cache = new Map();
  return (add) => {
    if (!add?.id || add.projection == null) return Object.freeze({ status: "unavailable", playerId: null, projection: null, pointsAbove: null });
    if (cache.has(add.id)) return cache.get(add.id);
    const benchmark = (byPosition.get(add.position) || []).find((player) => player.id !== add.id) || null;
    const result = Object.freeze(benchmark ? {
      status: "ready",
      playerId: benchmark.id,
      projection: benchmark.projection,
      pointsAbove: +(add.projection - benchmark.projection).toFixed(1)
    } : { status: "unavailable", playerId: null, projection: null, pointsAbove: null });
    cache.set(add.id, result);
    return result;
  };
}

function createBoardContext(snapshot, teamId, now) {
  const players = new Map((snapshot.players || []).map((player) => [player.id, player]));
  const roster = snapshot?.rosters?.find((item) => item.teamId === teamId) || null;
  const depthByPosition = new Map();
  for (const entry of roster?.entries || []) {
    const position = players.get(entry.playerId)?.position;
    if (position) depthByPosition.set(position, (depthByPosition.get(position) || 0) + 1);
  }
  const optimizer = createLineupOptimizer(players, now);
  const baseline = roster ? optimizer.optimize(roster.entries) : null;
  return Object.freeze({
    players,
    roster,
    rosterIds: new Set((roster?.entries || []).map((entry) => entry.playerId)),
    depthByPosition,
    optimizer,
    baseline,
    replacementBenchmark: buildReplacementBenchmarks(snapshot, players)
  });
}

function currentWeekImpact(context, add, drop) {
  if (add?.projection == null) return Object.freeze({ status: "missing-projection", lineupGain: null, projectedTotal: null });
  const baseline = context.baseline;
  if (!baseline?.assignments?.length || baseline.projectedTotal == null || !context.roster) {
    return Object.freeze({ status: "unavailable", lineupGain: null, projectedTotal: null });
  }
  const entries = context.roster.entries.map((entry) => entry.playerId === drop.id ? { ...entry, playerId: add.id } : entry);
  const result = context.optimizer.optimize(entries);
  if (!result.assignments?.length || result.projectedTotal == null) {
    return Object.freeze({ status: "unavailable", lineupGain: null, projectedTotal: null });
  }
  return Object.freeze({
    status: result.status === "best-known" || baseline.status === "best-known" ? "best-known" : "ready",
    lineupGain: +(result.projectedTotal - baseline.projectedTotal).toFixed(1),
    projectedTotal: result.projectedTotal
  });
}

function completeProjectionForPlayer(playerId, weeks, espnToProvider, projectionIndex) {
  const providerId = espnToProvider.get(playerId);
  return Boolean(providerId) && weeks.every((week) => projectionIndex.has(`${providerId}:${week}`));
}

function futureDiscoveryInputs(snapshot, options, currentAddIds, now, context) {
  const weeks = Array.isArray(options.weeks) ? options.weeks.filter(Number.isInteger) : [];
  if (!weeks.length || !options.projectionSet || !(options.identityMap instanceof Map)) {
    return Object.freeze({
      status: "missing-inputs",
      inputs: Object.freeze([]),
      consideredAdds: 0,
      completeAdds: 0,
      scenarioCount: 0,
      reason: "Future-only waiver discovery requires selected future weeks, a compatible future projection set, and an explicit identity map."
    });
  }
  if (!context.roster || !Array.isArray(snapshot?.availablePlayers)) {
    return Object.freeze({ status: "unavailable", inputs: Object.freeze([]), consideredAdds: 0, completeAdds: 0, scenarioCount: 0, reason: "Roster or ESPN availability data is unavailable." });
  }

  const projectionIndex = indexFutureProjections(options.projectionSet);
  const espnToProvider = new Map([...options.identityMap].map(([providerId, espnId]) => [espnId, providerId]));
  const activeRosterPlayerIds = context.roster.entries.filter((entry) => entry.lineupSlot !== "IR").map((entry) => entry.playerId);
  if (!activeRosterPlayerIds.every((playerId) => completeProjectionForPlayer(playerId, weeks, espnToProvider, projectionIndex))) {
    return Object.freeze({
      status: "blocked-baseline",
      inputs: Object.freeze([]),
      consideredAdds: 0,
      completeAdds: 0,
      scenarioCount: 0,
      reason: "Future-only waiver discovery is blocked until every current active roster player has complete projection coverage for every selected week. Current ESPN IR occupants are excluded until ESPN returns them to an active slot."
    });
  }

  const dropEntries = context.roster.entries.filter((entry) => {
    const player = context.players.get(entry.playerId);
    return entry.lineupSlot === "BE" && player && !isLocked(entry, player, now);
  });
  if (!dropEntries.length) {
    return Object.freeze({ status: "no-legal-drops", inputs: Object.freeze([]), consideredAdds: 0, completeAdds: 0, scenarioCount: 0, reason: "No unlocked ESPN bench player is available for a future-only add/drop scenario." });
  }

  const considered = snapshot.availablePlayers
    .map((playerId) => context.players.get(playerId))
    .filter((player) => player && !context.rosterIds.has(player.id) && !currentAddIds.has(player.id) && !isLocked({}, player, now) && player.projection != null);
  const completeAdds = considered.filter((player) => completeProjectionForPlayer(player.id, weeks, espnToProvider, projectionIndex));
  const inputs = [];
  let index = 0;
  for (const add of completeAdds) {
    for (const dropEntry of dropEntries) {
      inputs.push(Object.freeze({ id: `future-only-${++index}`, kind: "add-drop", addPlayerId: add.id, dropPlayerId: dropEntry.playerId }));
    }
  }

  return Object.freeze({
    status: "ready",
    inputs: Object.freeze(inputs),
    consideredAdds: considered.length,
    completeAdds: completeAdds.length,
    scenarioCount: inputs.length,
    reason: null
  });
}

function currentPriorityItem(context, item, input, scenario, futurePlan) {
  const future = futureEvidence(futurePlan, scenario);
  const replacementPointsAbove = item.replacement?.status === "ready" ? item.replacement.pointsAbove : null;
  const preservesRosteredPlayer = item.kind === "ir-assisted-add" ? 1 : 0;
  const depth = context.depthByPosition.get(item.add.position) ?? 0;
  return Object.freeze({
    id: input?.id || `current-${item.add.id}`,
    candidateType: "current-week",
    kind: item.kind,
    add: item.add,
    drop: item.drop || null,
    irMove: item.irMove || null,
    currentWeek: Object.freeze({ status: "ready", lineupGain: item.lineupGain, projectedTotal: item.projectedTotal }),
    future,
    replacement: item.replacement,
    rosterFit: Object.freeze({
      position: item.add.position,
      positionDepthBefore: depth,
      positiveFutureWeeks: future.positiveWeeks,
      evaluatedFutureWeeks: future.totalWeeks,
      note: "Exact same-position roster depth is context only. No universal positional-need threshold is inferred."
    }),
    preservation: Object.freeze({
      status: preservesRosteredPlayer ? "no-drop" : "drop-required",
      preservesRosteredPlayer: Boolean(preservesRosteredPlayer),
      droppedPlayerId: item.drop?.id || null,
      irPlayerId: item.irMove?.player?.id || null
    }),
    factors: Object.freeze({
      currentWeekGain: item.lineupGain,
      futureHorizonGain: future.horizonGain,
      futurePositiveWeekRate: future.positiveWeekRate,
      replacementPointsAbove,
      preservesRosteredPlayer
    }),
    sourceItem: item
  });
}

function futureOnlyPriorityItems(discovery, futurePlan, context) {
  if (discovery.status !== "ready") return [];
  const scenarios = new Map((futurePlan.scenarios || []).map((scenario) => [scenario.id, scenario]));
  const byAdd = new Map();

  for (const input of discovery.inputs) {
    const scenario = scenarios.get(input.id);
    if (!scenario || scenario.horizonDelta == null || scenario.horizonDelta <= 0) continue;
    const add = context.players.get(input.addPlayerId);
    const drop = context.players.get(input.dropPlayerId);
    if (!add || !drop) continue;
    const impact = currentWeekImpact(context, add, drop);
    if (impact.lineupGain == null || impact.lineupGain >= MIN_CURRENT_WEEK_ACTION_GAIN) continue;
    const future = futureEvidence(futurePlan, scenario);
    const replacement = context.replacementBenchmark(add);
    const replacementPointsAbove = replacement.status === "ready" ? replacement.pointsAbove : null;
    const depth = context.depthByPosition.get(add.position) ?? 0;
    const candidate = Object.freeze({
      id: input.id,
      candidateType: "future-only",
      kind: "add-drop",
      add,
      drop,
      irMove: null,
      currentWeek: impact,
      future,
      replacement,
      rosterFit: Object.freeze({
        position: add.position,
        positionDepthBefore: depth,
        positiveFutureWeeks: future.positiveWeeks,
        evaluatedFutureWeeks: future.totalWeeks,
        note: "Exact same-position roster depth is context only. No universal positional-need threshold is inferred."
      }),
      preservation: Object.freeze({ status: "drop-required", preservesRosteredPlayer: false, droppedPlayerId: drop.id, irPlayerId: null }),
      factors: Object.freeze({
        currentWeekGain: impact.lineupGain,
        futureHorizonGain: future.horizonGain,
        futurePositiveWeekRate: future.positiveWeekRate,
        replacementPointsAbove,
        preservesRosteredPlayer: 0
      }),
      sourceItem: null
    });

    const currentBest = byAdd.get(add.id);
    const shouldReplace = !currentBest
      || candidate.future.horizonGain > currentBest.future.horizonGain
      || (candidate.future.horizonGain === currentBest.future.horizonGain && candidate.future.positiveWeekRate > currentBest.future.positiveWeekRate)
      || (candidate.future.horizonGain === currentBest.future.horizonGain && candidate.future.positiveWeekRate === currentBest.future.positiveWeekRate && candidate.currentWeek.lineupGain > currentBest.currentWeek.lineupGain)
      || (candidate.future.horizonGain === currentBest.future.horizonGain && candidate.future.positiveWeekRate === currentBest.future.positiveWeekRate && candidate.currentWeek.lineupGain === currentBest.currentWeek.lineupGain && candidate.drop.id < currentBest.drop.id);
    if (shouldReplace) byAdd.set(add.id, candidate);
  }
  return [...byAdd.values()];
}

function priorityReason(item) {
  if (item.priorityBand === 1) {
    if (item.candidateType === "future-only") {
      return "Future-only stash in the top non-dominated band: it stays below the current-week action threshold but has a positive, fully covered selected-week lineup impact.";
    }
    return item.future.status === "ready"
      ? "Top non-dominated priority band across the known current-week, future, replacement-value, and roster-preservation signals."
      : "Top non-dominated priority band across the available signals; incomplete future evidence prevents a fully comparable season-horizon claim.";
  }
  return `Priority band ${item.priorityBand}: at least one higher-band move is no worse across every fully comparable known signal and better on at least one.`;
}

export function buildWaiverPriorityBoard(snapshot, teamId, options = {}) {
  const now = options.now ?? Date.now();
  const limit = Number.isInteger(options.limit) && options.limit > 0 ? options.limit : 8;
  const current = buildRosterAwareWaiverIdeas(snapshot, teamId, now, Number.MAX_SAFE_INTEGER);

  if (current.status !== "ready") {
    return Object.freeze({
      status: current.status,
      items: Object.freeze([]),
      current,
      futurePlan: null,
      futureDiscovery: null,
      limitations: Object.freeze(current.limitations || [])
    });
  }

  const context = createBoardContext(snapshot, teamId, now);
  const currentAddIds = new Set(current.items.map((item) => item.add?.id).filter(Boolean));
  const currentInputs = current.items.map((item, index) => scenarioInput(item, `current-${index + 1}`)).filter(Boolean);
  const discovery = futureDiscoveryInputs(snapshot, options, currentAddIds, now, context);
  const allInputs = [...currentInputs, ...discovery.inputs];
  const futurePlan = buildScenarioPlan(snapshot, teamId, {
    weeks: Array.isArray(options.weeks) ? options.weeks : [],
    projectionSet: options.projectionSet || null,
    identityMap: options.identityMap || null,
    scenarios: allInputs,
    waiverResult: current,
    includeCurrentWeekScenarios: false,
    now
  });
  const scenarioById = new Map((futurePlan.scenarios || []).map((scenario) => [scenario.id, scenario]));

  const rawCurrent = current.items.map((item, index) => {
    const input = currentInputs[index];
    return currentPriorityItem(context, item, input, input ? scenarioById.get(input.id) : null, futurePlan);
  });
  const rawFutureOnly = futureOnlyPriorityItems(discovery, futurePlan, context);
  const rawItems = [...rawCurrent, ...rawFutureOnly];

  const banded = [...assignWaiverPriorityBands(rawItems)]
    .sort((left, right) =>
      left.priorityBand - right.priorityBand
      || (right.factors.futureHorizonGain ?? -Infinity) - (left.factors.futureHorizonGain ?? -Infinity)
      || (right.factors.currentWeekGain ?? -Infinity) - (left.factors.currentWeekGain ?? -Infinity)
      || right.factors.preservesRosteredPlayer - left.factors.preservesRosteredPlayer
      || (right.factors.replacementPointsAbove ?? -Infinity) - (left.factors.replacementPointsAbove ?? -Infinity)
      || left.add.id.localeCompare(right.add.id)
    )
    .slice(0, limit)
    .map((item) => Object.freeze({ ...item, priorityReason: priorityReason(item) }));

  const futureOnlyCount = rawFutureOnly.length;
  const discoveryLimitation = discovery.status === "ready"
    ? `${discovery.completeAdds} ESPN-available non-current candidates had complete selected-week projection coverage; ${discovery.scenarioCount} unlocked-bench add/drop scenarios were legality-checked, producing ${futureOnlyCount} positive future-only stash candidate${futureOnlyCount === 1 ? "" : "s"}.`
    : discovery.reason;

  return Object.freeze({
    status: "ready",
    items: Object.freeze(banded),
    current,
    futurePlan,
    futureDiscovery: Object.freeze({ ...discovery, qualifiedAdds: futureOnlyCount }),
    limitations: Object.freeze([
      "Priority bands use Pareto dominance, not a hidden weighted score: a move only outranks another when it is no worse on every fully comparable known factor and better on at least one.",
      "Future-only add/drop discovery requires complete selected-week projection coverage for the current non-IR roster and the add/drop scenario before any future gain is admitted; missing active-player weeks never become zero. Players already occupying ESPN IR are excluded until ESPN returns them to an active slot.",
      "A future-only candidate must remain below the 0.5-point current-week action threshold and produce a positive complete selected-week horizon delta. Current ESPN availability, locks, acquisition capacity, IR roster validity, roster size, and position limits are revalidated by the scenario planner.",
      "Future-only discovery in v0.9.68 is limited to ordinary add/drop stashes. IR-assisted no-drop candidates continue to require the existing current-week ESPN-validated IR path and are not broadened by this release.",
      "Replacement value remains the current-week add projection versus the highest projected other ESPN-available player at the same position; unavailable benchmarks stay missing.",
      "Roster fit uses exact same-position depth as context plus the number of completely projected future weeks with a positive lineup delta; no universal positional-need threshold is invented.",
      "IR-assisted no-drop preservation is a separate factor. It breaks a true all-else-equal comparison but never receives an arbitrary point bonus.",
      discoveryLimitation
    ].filter(Boolean))
  });
}
