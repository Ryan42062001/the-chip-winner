import { buildRosterAwareWaiverIdeas } from "./waiver-engine.js";
import { buildScenarioPlan } from "./scenario-planner.js";

const PRIORITY_METRICS = Object.freeze([
  "currentWeekGain",
  "futureHorizonGain",
  "futurePositiveWeekRate",
  "replacementPointsAbove",
  "preservesRosteredPlayer"
]);

function scenarioInput(item, index) {
  if (item.kind === "ir-assisted-add" && item.irMove?.player?.id) {
    return Object.freeze({
      id: `priority-${index + 1}`,
      kind: "ir-assisted-add",
      addPlayerId: item.add.id,
      irPlayerId: item.irMove.player.id
    });
  }
  if (item.kind === "add-drop" && item.drop?.id) {
    return Object.freeze({
      id: `priority-${index + 1}`,
      kind: "add-drop",
      addPlayerId: item.add.id,
      dropPlayerId: item.drop.id
    });
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

    // Missing evidence is never converted to zero or used as an advantage.
    // If only one candidate has evidence for a factor, neither can dominate the other.
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

    // Defensive fallback for malformed/non-transitive custom factor data.
    const selected = front.length ? front : [remaining[0]];
    for (const candidate of selected) bands.set(candidate.index, band);
    for (const candidate of selected) {
      const position = remaining.indexOf(candidate);
      if (position >= 0) remaining.splice(position, 1);
    }
    band += 1;
  }

  return Object.freeze(items.map((item, index) => Object.freeze({
    ...item,
    priorityBand: bands.get(index) || 1
  })));
}

function positionDepth(snapshot, teamId, position) {
  const roster = snapshot?.rosters?.find((item) => item.teamId === teamId);
  if (!roster) return null;
  const players = new Map((snapshot.players || []).map((player) => [player.id, player]));
  return roster.entries.reduce((count, entry) => count + Number(players.get(entry.playerId)?.position === position), 0);
}

function futureEvidence(plan, scenario) {
  if (!scenario) {
    return Object.freeze({
      status: plan?.status === "ready" ? "unavailable" : "missing-inputs",
      horizonGain: null,
      positiveWeeks: null,
      totalWeeks: null,
      positiveWeekRate: null,
      reason: plan?.status === "ready"
        ? "No matching future scenario was evaluated."
        : "Compatible future projections and explicit identity mappings are required."
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
  const positiveWeeks = weekly.filter((item) => item.delta > 0).length;
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

function priorityReason(item) {
  if (item.priorityBand === 1) {
    return item.future.status === "ready"
      ? "Top non-dominated priority band across the known current-week, future, replacement-value, and roster-preservation signals."
      : "Top non-dominated priority band across the available signals; incomplete future evidence prevents a fully comparable season-horizon claim.";
  }
  return `Priority band ${item.priorityBand}: at least one higher-band move is no worse across every fully comparable known signal and better on at least one.`;
}

export function buildWaiverPriorityBoard(snapshot, teamId, options = {}) {
  const now = options.now ?? Date.now();
  const limit = Number.isInteger(options.limit) && options.limit > 0 ? options.limit : 8;
  const current = buildRosterAwareWaiverIdeas(snapshot, teamId, now, limit);

  if (current.status !== "ready") {
    return Object.freeze({
      status: current.status,
      items: Object.freeze([]),
      current,
      futurePlan: null,
      limitations: Object.freeze(current.limitations || [])
    });
  }

  if (!current.items.length) {
    return Object.freeze({
      status: "ready",
      items: Object.freeze([]),
      current,
      futurePlan: null,
      limitations: Object.freeze([
        "No current-week ESPN-legal waiver recommendation cleared the existing 0.5-point action threshold, so there is nothing to prioritize in this release."
      ])
    });
  }

  const inputs = current.items.map(scenarioInput).filter(Boolean);
  const futurePlan = buildScenarioPlan(snapshot, teamId, {
    weeks: Array.isArray(options.weeks) ? options.weeks : [],
    projectionSet: options.projectionSet || null,
    identityMap: options.identityMap || null,
    scenarios: inputs,
    now
  });
  const scenarioById = new Map((futurePlan.scenarios || []).map((scenario) => [scenario.id, scenario]));

  const rawItems = current.items.map((item, index) => {
    const input = inputs[index];
    const scenario = input ? scenarioById.get(input.id) : null;
    const future = futureEvidence(futurePlan, scenario);
    const replacementPointsAbove = item.replacement?.status === "ready"
      ? item.replacement.pointsAbove
      : null;
    const preservesRosteredPlayer = item.kind === "ir-assisted-add" ? 1 : 0;
    const depth = positionDepth(snapshot, teamId, item.add.position);

    return Object.freeze({
      id: input?.id || `priority-${index + 1}`,
      kind: item.kind,
      add: item.add,
      drop: item.drop || null,
      irMove: item.irMove || null,
      currentWeek: Object.freeze({
        lineupGain: item.lineupGain,
        projectedTotal: item.projectedTotal
      }),
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
  });

  const banded = assignWaiverPriorityBands(rawItems)
    .sort((left, right) =>
      left.priorityBand - right.priorityBand
      || (right.factors.futureHorizonGain ?? -Infinity) - (left.factors.futureHorizonGain ?? -Infinity)
      || right.factors.currentWeekGain - left.factors.currentWeekGain
      || right.factors.preservesRosteredPlayer - left.factors.preservesRosteredPlayer
      || (right.factors.replacementPointsAbove ?? -Infinity) - (left.factors.replacementPointsAbove ?? -Infinity)
    )
    .map((item) => Object.freeze({ ...item, priorityReason: priorityReason(item) }));

  return Object.freeze({
    status: "ready",
    items: Object.freeze(banded),
    current,
    futurePlan,
    limitations: Object.freeze([
      "Priority bands use Pareto dominance, not a hidden weighted score: a move only outranks another when it is no worse on every fully comparable known factor and better on at least one.",
      "Missing future or replacement-value evidence is preserved as missing and cannot be converted to zero or used as an advantage.",
      "Roster fit uses exact same-position depth as context plus the number of completely projected future weeks with a positive lineup delta; no universal positional-need threshold is invented.",
      "IR-assisted no-drop preservation is a separate factor. It breaks a true all-else-equal comparison but never receives an arbitrary point bonus.",
      "Only moves already emitted by the current-week ESPN-legal waiver engine are prioritized in v0.9.67; broader future-only candidate discovery remains a separate follow-up."
    ])
  });
}
