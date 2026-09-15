import { canFillSlot } from "./recommendations.js";
import { createLineupOptimizer, getLineupLockReason } from "./lineup-optimizer.js";
import { isStarter, SUPPORTED_LINEUP_SLOTS } from "./model.js";
import { buildByeWeekCoverage } from "./season-intelligence.js";
import { selectSnapshotFreshness } from "./selectors.js";
import { evaluateAcquisitionCapacity } from "./waiver-engine.js";
import { evaluateFutureProjectionCompatibility, selectMappedFutureProjection } from "../providers/projections/future-projection-provider.js";

const OBJECTIVES = new Set(["BALANCED", "CURRENT_WEEK_STABILITY", "FUTURE_UPSIDE"]);
const MATERIALITY = 1;
const WAIVER_MATERIALITY = 0.5;
const FUTURE_EVALUATION_TIME = 0;

function freezeList(items) { return Object.freeze(items); }
function round(value) { return Number.isFinite(value) ? +value.toFixed(1) : null; }
function direction(delta) {
  if (!Number.isFinite(delta)) return "UNKNOWN";
  if (delta >= MATERIALITY) return "UPGRADE";
  if (delta <= -MATERIALITY) return "DOWNGRADE";
  return "TOSSUP";
}
function unique(values) { return [...new Set(Array.isArray(values) ? values : [])]; }
function activeEntries(entries) { return (entries || []).filter((entry) => entry.lineupSlot !== "IR"); }
function withRoster(snapshot, teamId, entries) {
  return { ...snapshot, rosters: snapshot.rosters.map((roster) => roster.teamId === teamId ? { ...roster, entries } : roster) };
}
function freshnessFor(capturedAt, now) {
  return Object.freeze(selectSnapshotFreshness({ meta: { capturedAt: capturedAt || null } }, now));
}
function minimumFollowUpRemovals(violations) {
  const sizeExcess = Math.max(0, ...violations.filter((item) => item.kind === "ROSTER_SIZE").map((item) => item.excess || 0));
  const positionExcess = violations.filter((item) => item.kind === "POSITION_LIMIT").reduce((sum, item) => sum + (item.excess || 0), 0);
  return Math.max(sizeExcess, positionExcess);
}

function lineupConfiguration(snapshot, roster) {
  const reported = Array.isArray(snapshot?.league?.lineupSlots) ? snapshot.league.lineupSlots : [];
  const unsupported = reported.filter((item) => Number.isInteger(item?.count) && item.count > 0 && !SUPPORTED_LINEUP_SLOTS.has(item.slot));
  if (unsupported.length) {
    return Object.freeze({ status: "unsupported", items: freezeList([]), unsupported: freezeList(unsupported.map((item) => item.slot)), reason: `Unsupported ESPN lineup slots are present: ${unsupported.map((item) => item.slot).join(", ")}. Trade lineup analysis fails closed.` });
  }
  const configured = reported.filter((item) => isStarter(item.slot) && Number.isInteger(item.count) && item.count > 0);
  if (configured.length) return Object.freeze({ status: "ready", items: freezeList(configured.map((item) => Object.freeze({ slot: item.slot, count: item.count }))), unsupported: freezeList([]), reason: null });
  const counts = new Map();
  for (const entry of roster?.entries || []) if (isStarter(entry.lineupSlot)) counts.set(entry.lineupSlot, (counts.get(entry.lineupSlot) || 0) + 1);
  const items = [...counts].map(([slot, count]) => Object.freeze({ slot, count }));
  return Object.freeze({ status: items.length ? "derived-current-roster" : "missing", items: freezeList(items), unsupported: freezeList([]), reason: items.length ? "ESPN lineup-slot settings are unavailable; current roster starter slots are used as the supported fallback." : "No supported starter-slot configuration is available." });
}

function expandedSlots(config) {
  return config.items.flatMap((item) => Array.from({ length: item.count }, (_, index) => Object.freeze({ id: `${item.slot}:${index}`, slot: item.slot })));
}

function rosterRuleState(snapshot, entries, players) {
  const rules = snapshot?.league?.rosterRules;
  const active = activeEntries(entries);
  const positionCounts = new Map();
  for (const entry of active) {
    const position = players.get(entry.playerId)?.position;
    if (position) positionCounts.set(position, (positionCounts.get(position) || 0) + 1);
  }
  if (!rules) return Object.freeze({ status: "unverified", activeCount: active.length, rosterSizeLimit: null, rosterSpaceDelta: null, positionCounts: Object.freeze(Object.fromEntries(positionCounts)), violations: freezeList([]), reason: "ESPN roster-size and position-limit settings are unavailable." });
  const violations = [];
  const sizeLimit = Number.isInteger(rules.size) ? rules.size : null;
  if (sizeLimit != null && active.length > sizeLimit) violations.push(Object.freeze({ kind: "ROSTER_SIZE", limit: sizeLimit, count: active.length, excess: active.length - sizeLimit }));
  for (const rule of rules.positionLimits || []) {
    if (!Number.isInteger(rule.limit) || rule.limit < 0) continue;
    const count = positionCounts.get(rule.position) || 0;
    if (count > rule.limit) violations.push(Object.freeze({ kind: "POSITION_LIMIT", position: rule.position, limit: rule.limit, count, excess: count - rule.limit }));
  }
  return Object.freeze({
    status: violations.length ? "violation" : "verified",
    activeCount: active.length,
    rosterSizeLimit: sizeLimit,
    rosterSpaceDelta: sizeLimit == null ? null : sizeLimit - active.length,
    positionCounts: Object.freeze(Object.fromEntries(positionCounts)),
    violations: freezeList(violations),
    reason: violations.length ? "The hypothetical roster violates one or more known ESPN roster rules." : null
  });
}

function validateProposal(snapshot, teamId, proposal) {
  const roster = snapshot?.rosters?.find((item) => item.teamId === teamId);
  if (!roster) return { error: "The connected user's roster is unavailable." };
  const players = new Map((snapshot.players || []).map((player) => [player.id, player]));
  const rosterIds = new Set(roster.entries.map((entry) => entry.playerId));
  const outgoing = unique(proposal?.outgoingPlayerIds);
  const incoming = unique(proposal?.incomingPlayerIds);
  const drops = unique(proposal?.plannedFollowUpDropIds);
  const objective = OBJECTIVES.has(proposal?.teamObjective) ? proposal.teamObjective : "BALANCED";
  if (!Array.isArray(proposal?.outgoingPlayerIds) || outgoing.length !== proposal.outgoingPlayerIds.length) return { error: "Outgoing player IDs must be unique." };
  if (!Array.isArray(proposal?.incomingPlayerIds) || incoming.length !== proposal.incomingPlayerIds.length) return { error: "Incoming player IDs must be unique." };
  if (Array.isArray(proposal?.plannedFollowUpDropIds) && drops.length !== proposal.plannedFollowUpDropIds.length) return { error: "Follow-up drop IDs must be unique." };
  if (!outgoing.length || !incoming.length) return { error: "Choose at least one outgoing and one incoming player." };
  if (outgoing.some((id) => !rosterIds.has(id))) return { error: "Every outgoing player must be on the connected user's current roster." };
  if (incoming.some((id) => !players.has(id))) return { error: "Every incoming player must exist in the current ESPN snapshot." };
  if (incoming.some((id) => rosterIds.has(id))) return { error: "Incoming players cannot already be on the connected user's roster." };
  if (outgoing.some((id) => incoming.includes(id))) return { error: "A player cannot appear on both sides of the proposal." };
  return { roster, players, rosterIds, outgoing, incoming, drops, objective };
}

function originalEntryByPlayer(snapshot) {
  const result = new Map();
  for (const roster of snapshot.rosters || []) for (const entry of roster.entries || []) if (!result.has(entry.playerId)) result.set(entry.playerId, entry);
  return result;
}

function buildDirectEntries(snapshot, roster, outgoing, incoming) {
  const incomingSet = new Set(incoming);
  const originals = originalEntryByPlayer(snapshot);
  return [
    ...roster.entries.filter((entry) => !outgoing.includes(entry.playerId)).map((entry) => ({ ...entry })),
    ...incoming.map((playerId) => ({ playerId, lineupSlot: "BE", ...(originals.get(playerId)?.locked === true ? { locked: true } : {}) }))
  ].filter((entry, index, all) => !incomingSet.has(entry.playerId) || all.findIndex((candidate) => candidate.playerId === entry.playerId) === index);
}

function mapForEspn(snapshot) {
  return new Map((snapshot.players || []).map((player) => [player.id, Number.isFinite(player.projection) ? player.projection : null]));
}

function mappedExternalPoints(set, identityMap, playerIds, week) {
  const points = new Map();
  const missing = [];
  for (const id of playerIds) {
    const item = selectMappedFutureProjection(set, identityMap, id, week);
    if (item.status === "ready") points.set(id, item.points);
    else missing.push(Object.freeze({ playerId: id, status: item.status }));
  }
  return { points, missing };
}

function unionActiveIds(preEntries, postEntries) {
  return unique([...activeEntries(preEntries).map((entry) => entry.playerId), ...activeEntries(postEntries).map((entry) => entry.playerId)]);
}

function assignmentChanges(pre, post, incomingIds, outgoingIds, retainedIds) {
  const preBySlot = new Map((pre.assignments || []).map((item) => [item.slotId, item.player.id]));
  const postBySlot = new Map((post.assignments || []).map((item) => [item.slotId, item.player.id]));
  const allSlots = unique([...preBySlot.keys(), ...postBySlot.keys()]);
  const changes = allSlots.flatMap((slotId) => preBySlot.get(slotId) === postBySlot.get(slotId) ? [] : [Object.freeze({ slotId, beforePlayerId: preBySlot.get(slotId) || null, afterPlayerId: postBySlot.get(slotId) || null })]);
  const postStarters = new Set((post.assignments || []).map((item) => item.player.id));
  const preStarters = new Set((pre.assignments || []).map((item) => item.player.id));
  return Object.freeze({
    changes: freezeList(changes),
    incomingStarters: freezeList(incomingIds.filter((id) => postStarters.has(id))),
    incomingBenchDepth: freezeList(incomingIds.filter((id) => !postStarters.has(id))),
    outgoingStarters: freezeList(outgoingIds.filter((id) => preStarters.has(id))),
    promotedExisting: freezeList([...postStarters].filter((id) => retainedIds.has(id) && !preStarters.has(id))),
    displacedExisting: freezeList([...preStarters].filter((id) => retainedIds.has(id) && !postStarters.has(id)))
  });
}

function evaluateLineupSource(snapshot, preEntries, postEntries, config, sourceContext, points, now, incomingIds, outgoingIds) {
  const playerIds = unionActiveIds(preEntries, postEntries);
  const missing = playerIds.filter((id) => !Number.isFinite(points.get(id)));
  const sourceFields = { source: sourceContext.name, capturedAt: sourceContext.capturedAt || null, freshness: sourceContext.freshness || freshnessFor(sourceContext.capturedAt, now) };
  if (config.status === "unsupported" || config.status === "missing") return Object.freeze({ ...sourceFields, status: "UNKNOWN", direction: "UNKNOWN", preTotal: null, postTotal: null, delta: null, missingPlayerIds: freezeList(playerIds), reason: config.reason, assignments: null });
  if (missing.length) return Object.freeze({ ...sourceFields, status: "UNKNOWN", direction: "UNKNOWN", preTotal: null, postTotal: null, delta: null, missingPlayerIds: freezeList(missing), reason: "Complete active pre/post union-roster projection coverage is required.", assignments: null });
  const projectedPlayers = new Map(snapshot.players.map((player) => [player.id, { ...player, projection: points.get(player.id) }]));
  const optimizer = createLineupOptimizer(projectedPlayers, now);
  const pre = optimizer.optimize(preEntries, config.items);
  const post = optimizer.optimize(postEntries, config.items);
  if (pre.projectedTotal == null || post.projectedTotal == null || pre.status === "incomplete" || post.status === "incomplete") return Object.freeze({ ...sourceFields, status: "UNKNOWN", direction: "UNKNOWN", preTotal: null, postTotal: null, delta: null, missingPlayerIds: freezeList(unique([...(pre.missingPlayerIds || []), ...(post.missingPlayerIds || [])])), reason: "A complete legal lineup could not be produced for both rosters.", assignments: null });
  const delta = round(post.projectedTotal - pre.projectedTotal);
  const retained = new Set(preEntries.map((entry) => entry.playerId).filter((id) => postEntries.some((entry) => entry.playerId === id)));
  return Object.freeze({
    ...sourceFields,
    status: "READY",
    direction: direction(delta),
    preTotal: pre.projectedTotal,
    postTotal: post.projectedTotal,
    delta,
    missingPlayerIds: freezeList([]),
    reason: null,
    assignments: assignmentChanges(pre, post, incomingIds, outgoingIds, retained),
    preAssignments: freezeList(pre.assignments || []),
    postAssignments: freezeList(post.assignments || [])
  });
}

function resolveDirection(sourceResults) {
  const ready = sourceResults.filter((item) => item.status === "READY" && item.direction !== "UNKNOWN");
  if (!ready.length) return Object.freeze({ direction: "UNKNOWN", disagreement: false, readySources: 0 });
  const directions = new Set(ready.map((item) => item.direction));
  return Object.freeze({ direction: directions.size === 1 ? ready[0].direction : "UNKNOWN", disagreement: directions.size > 1, readySources: ready.length });
}

function currentLocks(snapshot, proposalIds, now) {
  const players = new Map(snapshot.players.map((player) => [player.id, player]));
  const entries = originalEntryByPlayer(snapshot);
  return freezeList(unique(proposalIds).flatMap((id) => {
    const player = players.get(id);
    if (!player) return [];
    const reason = getLineupLockReason(entries.get(id), player, now);
    return reason ? [Object.freeze({ playerId: id, playerName: player.name, reason })] : [];
  }));
}

function evaluateHorizon(snapshot, preEntries, postEntries, config, set, identityMap, weeks, label, now) {
  const normalizedWeeks = unique(weeks).filter((week) => Number.isInteger(week) && week >= 1 && week <= 18).sort((a, b) => a - b);
  if (!normalizedWeeks.length) return Object.freeze({ label, status: "UNKNOWN", weeks: freezeList([]), rows: freezeList([]), horizonDelta: null, meanWeeklyDelta: null, direction: "UNKNOWN", reason: "No weeks are selected for this horizon." });
  const compatibility = set ? evaluateFutureProjectionCompatibility(set, snapshot) : null;
  const sourceFields = set ? { source: set.provider, capturedAt: set.capturedAt || null, freshness: freshnessFor(set.capturedAt, now) } : {};
  if (!set || !compatibility?.usable || !(identityMap instanceof Map)) return Object.freeze({ ...sourceFields, label, status: "UNKNOWN", weeks: freezeList(normalizedWeeks), rows: freezeList([]), horizonDelta: null, meanWeeklyDelta: null, direction: "UNKNOWN", reason: compatibility?.errors?.join(" ") || "A compatible mapped future projection source is unavailable." });
  const ids = unionActiveIds(preEntries, postEntries);
  const rows = normalizedWeeks.map((week) => {
    const mapped = mappedExternalPoints(set, identityMap, ids, week);
    if (mapped.missing.length) return Object.freeze({ week, status: "UNKNOWN", preTotal: null, postTotal: null, delta: null, missing: freezeList(mapped.missing), assignments: null, preAssignments: null, postAssignments: null });
    const evaluated = evaluateLineupSource(snapshot, preEntries, postEntries, config, { name: set.provider, capturedAt: set.capturedAt, freshness: freshnessFor(set.capturedAt, now) }, mapped.points, FUTURE_EVALUATION_TIME, [], []);
    return Object.freeze({ week, status: evaluated.status, preTotal: evaluated.preTotal, postTotal: evaluated.postTotal, delta: evaluated.delta, direction: evaluated.direction, missing: freezeList([]), assignments: evaluated.assignments, preAssignments: evaluated.preAssignments, postAssignments: evaluated.postAssignments });
  });
  const complete = rows.length === normalizedWeeks.length && rows.every((row) => row.status === "READY" && Number.isFinite(row.delta));
  if (!complete) return Object.freeze({ ...sourceFields, label, status: "UNKNOWN", weeks: freezeList(normalizedWeeks), rows: freezeList(rows), horizonDelta: null, meanWeeklyDelta: null, direction: "UNKNOWN", reason: "At least one selected week lacks complete compatible pre/post union-roster coverage." });
  const horizonDelta = round(rows.reduce((sum, row) => sum + row.delta, 0));
  const meanWeeklyDelta = round(horizonDelta / normalizedWeeks.length);
  return Object.freeze({ ...sourceFields, label, status: "READY", weeks: freezeList(normalizedWeeks), rows: freezeList(rows), horizonDelta, meanWeeklyDelta, direction: direction(meanWeeklyDelta), reason: null });
}

function maximumFillable(players, slots) {
  const sortedPlayers = [...players].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const assignments = new Map();
  function assign(slot, seen) {
    for (const player of sortedPlayers) {
      if (!canFillSlot(player, slot.slot) || seen.has(player.id)) continue;
      seen.add(player.id);
      const previous = assignments.get(player.id);
      if (!previous || assign(previous, seen)) { assignments.set(player.id, slot); return true; }
    }
    return false;
  }
  for (const slot of slots) assign(slot, new Set());
  return assignments.size;
}

function listedDepth(entries, players) {
  const counts = new Map();
  for (const entry of activeEntries(entries)) {
    const position = players.get(entry.playerId)?.position;
    if (position) counts.set(position, (counts.get(position) || 0) + 1);
  }
  return Object.freeze(Object.fromEntries([...counts].sort()));
}

function contingency(entries, assignments, players, config) {
  if (!assignments || config.status === "unsupported" || config.status === "missing") return Object.freeze({ status: "UNKNOWN", maxUncoveredAfterLoss: null, items: freezeList([]) });
  const slots = expandedSlots(config);
  const activePlayers = activeEntries(entries).map((entry) => players.get(entry.playerId)).filter(Boolean);
  const items = assignments.map((assignment) => {
    const remaining = activePlayers.filter((player) => player.id !== assignment.player.id);
    const fillable = maximumFillable(remaining, slots);
    return Object.freeze({ playerId: assignment.player.id, slot: assignment.slot, uncoveredAfterLoss: Math.max(0, slots.length - fillable) });
  });
  return Object.freeze({ status: "READY", maxUncoveredAfterLoss: items.length ? Math.max(...items.map((item) => item.uncoveredAfterLoss)) : 0, items: freezeList(items) });
}

function replacementContext(snapshot, teamId, players, now) {
  const capacity = evaluateAcquisitionCapacity(snapshot, teamId);
  const sourceFields = { source: "ESPN availability", capturedAt: snapshot.meta?.capturedAt || null, freshness: freshnessFor(snapshot.meta?.capturedAt, now) };
  if (!Array.isArray(snapshot.availablePlayers)) return Object.freeze({ ...sourceFields, status: "UNKNOWN", candidates: freezeList([]), acquisitionCapacity: capacity, reason: "ESPN availability is missing from the latest snapshot; replacement quality is unknown, not weak or empty." });
  const candidates = snapshot.availablePlayers.map((id) => players.get(id)).filter(Boolean).sort((a, b) => (b.projection ?? -Infinity) - (a.projection ?? -Infinity));
  return Object.freeze({ ...sourceFields, status: "READY", candidates: freezeList(candidates.slice(0, 12).map((player) => Object.freeze({ playerId: player.id, name: player.name, position: player.position, projection: Number.isFinite(player.projection) ? player.projection : null }))), acquisitionCapacity: capacity, reason: candidates.length ? null : "ESPN explicitly reported no available players in the captured pool." });
}

function byeEffects(snapshot, teamId, preEntries, postEntries, affectedIds) {
  const pre = buildByeWeekCoverage(withRoster(snapshot, teamId, preEntries), teamId);
  const post = buildByeWeekCoverage(withRoster(snapshot, teamId, postEntries), teamId);
  const preRows = new Map((pre.weeks || []).map((row) => [row.week, row]));
  const postRows = new Map((post.weeks || []).map((row) => [row.week, row]));
  const weeks = unique([...preRows.keys(), ...postRows.keys()]).sort((a, b) => a - b);
  const rows = weeks.map((week) => {
    const before = preRows.get(week)?.uncoveredSlotCount || 0;
    const after = postRows.get(week)?.uncoveredSlotCount || 0;
    return Object.freeze({ week, preUncovered: before, postUncovered: after, gapDelta: after - before, postUncoveredSlotCandidates: freezeList(postRows.get(week)?.uncoveredSlotCandidates || []) });
  });
  const playerMap = new Map(snapshot.players.map((player) => [player.id, player]));
  const affectedUnknown = affectedIds.filter((id) => !Number.isInteger(playerMap.get(id)?.byeWeek));
  return Object.freeze({
    status: affectedUnknown.length || pre.unknownByePlayerIds?.length || post.unknownByePlayerIds?.length ? "PARTIAL" : "READY",
    rows: freezeList(rows),
    improvedWeeks: freezeList(rows.filter((row) => row.gapDelta < 0).map((row) => row.week)),
    worsenedWeeks: freezeList(rows.filter((row) => row.gapDelta > 0).map((row) => row.week)),
    affectedUnknownByePlayerIds: freezeList(affectedUnknown)
  });
}

function bestEligibleReplacement(replacement, slots, players) {
  if (replacement.status !== "READY") return null;
  const candidateObjects = replacement.candidates.map((item) => players.get(item.playerId)).filter(Boolean);
  return candidateObjects.find((player) => slots.some((slot) => canFillSlot(player, slot))) || null;
}

function fragilityState({ preContingency, postContingency, bye, replacement, outgoing, players }) {
  if (postContingency.status !== "READY") return Object.freeze({ state: "THIN", reason: "Contingency coverage could not be fully verified." });
  const postThin = postContingency.maxUncoveredAfterLoss > 0;
  if (!postThin) return Object.freeze({ state: "COVERED", reason: "Every optimized starter has a complete internal contingency lineup." });
  const newlyThin = preContingency.status === "READY" && preContingency.maxUncoveredAfterLoss === 0;
  const worsenedRows = bye.rows.filter((row) => row.gapDelta > 0);
  if (worsenedRows.length && replacement.status === "READY") {
    const uncoveredSlots = unique(worsenedRows.flatMap((row) => row.postUncoveredSlotCandidates));
    const replacementPlayer = bestEligibleReplacement(replacement, uncoveredSlots.map((slot) => ({ slot })), players);
    if (!replacementPlayer || replacement.acquisitionCapacity?.status === "exhausted") return Object.freeze({ state: "DANGEROUS", reason: replacement.acquisitionCapacity?.status === "exhausted" ? replacement.acquisitionCapacity.reason : `A known bye-week lineup gap is created and the latest ESPN pool has no verified eligible replacement for ${uncoveredSlots.join("/") || "the uncovered slot"}.` });
  }
  if (newlyThin) {
    if (replacement.status !== "READY") return Object.freeze({ state: "SCARCE_THIN", reason: "The trade newly removes complete internal contingency coverage, and ESPN replacement quality is unavailable." });
    const outgoingPlayers = outgoing.map((id) => players.get(id)).filter((player) => Number.isFinite(player?.projection));
    const scarce = outgoingPlayers.some((player) => {
      const best = replacement.candidates.find((candidate) => candidate.position === player.position && Number.isFinite(candidate.projection));
      return !best || player.projection - best.projection >= WAIVER_MATERIALITY;
    });
    if (scarce) return Object.freeze({ state: "SCARCE_THIN", reason: "The trade newly removes complete internal contingency coverage and the lost internal option is materially above the best verified same-position replacement context." });
  }
  return Object.freeze({ state: "THIN", reason: "At least one optimized starter lacks a complete internal contingency lineup after the trade." });
}

function longTermDirection(future, playoffs) {
  const known = [future?.direction, playoffs?.direction].filter((item) => item && item !== "UNKNOWN");
  if (!known.length) return "UNKNOWN";
  if (known.includes("UPGRADE") && known.includes("DOWNGRADE")) return "MIXED";
  if (known.includes("UPGRADE")) return "UPGRADE";
  if (known.includes("DOWNGRADE")) return "DOWNGRADE";
  return "TOSSUP";
}

function objectiveReason(objective) {
  if (objective === "CURRENT_WEEK_STABILITY") return "Objective framing: prioritize supported current-week stability and lock-safe consequences; underlying facts and thresholds are unchanged.";
  if (objective === "FUTURE_UPSIDE") return "Objective framing: emphasize supported future/playoff upside without changing any current-week or roster facts.";
  return "Objective framing: balance supported current, future, depth, and bye consequences without changing source facts.";
}

function chooseConclusion({ currentDirection, longDirection, sourceDisagreement, fragility, depthCost, depthGain, bye, anyUpgrade, numericEvidence }) {
  if (fragility.state === "DANGEROUS") return "DANGEROUS_POSITIONAL_FRAGILITY";
  if (currentDirection === "UPGRADE" && longDirection === "DOWNGRADE") return "SHORT_TERM_GAIN_LONG_TERM_COST";
  if (currentDirection === "DOWNGRADE" && longDirection === "UPGRADE") return "LONG_TERM_GAIN_SHORT_TERM_COST";
  if (longDirection === "MIXED" || sourceDisagreement) return "BALANCED_OBJECTIVE_DEPENDENT";
  if (anyUpgrade && currentDirection !== "DOWNGRADE" && longDirection !== "DOWNGRADE" && longDirection !== "MIXED" && !depthCost) return "CLEAR_TEAM_UPGRADE";
  if (currentDirection === "UPGRADE" && depthCost && longDirection !== "DOWNGRADE" && longDirection !== "MIXED") return "STARTER_UPGRADE_DEPTH_COST";
  if ((currentDirection === "TOSSUP" || currentDirection === "UNKNOWN") && depthGain && longDirection !== "DOWNGRADE") return "DEPTH_GAIN_STARTERS_FLAT";
  if ((bye.improvedWeeks.length || bye.worsenedWeeks.length || depthCost || depthGain) && currentDirection !== "UPGRADE" && currentDirection !== "DOWNGRADE") return "BALANCED_OBJECTIVE_DEPENDENT";
  if (numericEvidence) return "NO_MEANINGFUL_SUPPORTED_CHANGE";
  return "INSUFFICIENT_EVIDENCE";
}

function resultBase(snapshot, objective, outgoing, incoming, drops, now) {
  const playerMap = new Map((snapshot.players || []).map((player) => [player.id, player]));
  const describe = (ids) => freezeList(ids.map((id) => Object.freeze({ id, name: playerMap.get(id)?.name || "Unknown player", position: playerMap.get(id)?.position || null })));
  return {
    proposal: Object.freeze({ outgoing: describe(outgoing), incoming: describe(incoming), plannedFollowUpDrops: describe(drops), teamObjective: objective }),
    snapshot: Object.freeze({ provider: snapshot.provider || "espn", projectionsSource: snapshot.meta?.projectionsSource || null, capturedAt: snapshot.meta?.capturedAt || null, freshness: freshnessFor(snapshot.meta?.capturedAt, now), kind: snapshot.meta?.kind || null, currentWeek: snapshot.currentWeek ?? null }),
    readOnly: true,
    transactionActions: freezeList([])
  };
}

export function analyzeTrade(snapshot, teamId, proposal, options = {}) {
  const now = options.now ?? Date.now();
  const checked = validateProposal(snapshot, teamId, proposal);
  const fallbackObjective = OBJECTIVES.has(proposal?.teamObjective) ? proposal.teamObjective : "BALANCED";
  if (checked.error) return Object.freeze({ analysisState: "INVALID_PROPOSAL", ...resultBase(snapshot || { players: [] }, fallbackObjective, proposal?.outgoingPlayerIds || [], proposal?.incomingPlayerIds || [], proposal?.plannedFollowUpDropIds || [], now), conclusion: "INSUFFICIENT_EVIDENCE", reasons: freezeList([checked.error]), limitations: freezeList([checked.error]) });
  const { roster, players, outgoing, incoming, drops, objective } = checked;
  const directEntries = buildDirectEntries(snapshot, roster, outgoing, incoming);
  const directRules = rosterRuleState(snapshot, directEntries, players);
  if (!directRules.violations.length && drops.length) return Object.freeze({ analysisState: "INVALID_PROPOSAL", ...resultBase(snapshot, objective, outgoing, incoming, drops, now), conclusion: "INSUFFICIENT_EVIDENCE", reasons: freezeList(["Follow-up drops are only part of Trade Analyzer v1 when a known roster constraint requires another explicit removal."]), limitations: freezeList([]) });
  if (drops.some((id) => !directEntries.some((entry) => entry.playerId === id))) return Object.freeze({ analysisState: "INVALID_PROPOSAL", ...resultBase(snapshot, objective, outgoing, incoming, drops, now), conclusion: "INSUFFICIENT_EVIDENCE", reasons: freezeList(["Every follow-up drop must be a player on the direct post-trade roster."]), limitations: freezeList([]) });
  const resolvedEntries = directRules.violations.length && drops.length ? directEntries.filter((entry) => !drops.includes(entry.playerId)) : directEntries;
  const resolvedRules = rosterRuleState(snapshot, resolvedEntries, players);
  const rosterConsequences = Object.freeze({
    netRosterCount: incoming.length - outgoing.length,
    direct: directRules,
    resolved: resolvedRules,
    openRosterSpots: resolvedRules.rosterSpaceDelta != null ? Math.max(0, resolvedRules.rosterSpaceDelta) : null,
    requiredFollowUpRemovals: minimumFollowUpRemovals(directRules.violations),
    incomingPlacedOnIr: false
  });
  if (directRules.violations.length && (!drops.length || resolvedRules.violations.length)) {
    const reasons = directRules.violations.map((item) => item.kind === "ROSTER_SIZE" ? `Known ESPN roster size requires at least ${item.excess} explicit follow-up removal${item.excess === 1 ? "" : "s"}.` : `Known ESPN ${item.position} limit ${item.limit} is exceeded by ${item.excess}.`);
    if (rosterConsequences.requiredFollowUpRemovals > 1) reasons.unshift(`At least ${rosterConsequences.requiredFollowUpRemovals} explicit follow-up removals are required to resolve the known combined roster constraints.`);
    if (drops.length && resolvedRules.violations.length) reasons.push("The selected follow-up drop set does not yet resolve every known roster constraint.");
    return Object.freeze({ analysisState: "ROSTER_ACTION_REQUIRED", ...resultBase(snapshot, objective, outgoing, incoming, drops, now), roster: rosterConsequences, directPostTradeEntries: freezeList(directEntries), resolvedPostTradeEntries: null, conclusion: "INSUFFICIENT_EVIDENCE", reasons: freezeList(reasons), limitations: freezeList(["No expanded-roster optimizer result is presented as a final legal post-trade lineup."]) });
  }

  const config = lineupConfiguration(snapshot, roster);
  const espnSourceContext = { name: snapshot.meta?.projectionsSource || "ESPN", capturedAt: snapshot.meta?.capturedAt || null, freshness: freshnessFor(snapshot.meta?.capturedAt, now) };
  const espnCurrent = evaluateLineupSource(snapshot, roster.entries, resolvedEntries, config, espnSourceContext, mapForEspn(snapshot), now, incoming, outgoing);
  const currentSources = [espnCurrent];
  const futureSet = options.futureProjectionSet || null;
  const identityMap = options.identityMap instanceof Map ? options.identityMap : null;
  if (futureSet) {
    const compatibility = evaluateFutureProjectionCompatibility(futureSet, snapshot);
    const externalContext = { name: futureSet.provider, capturedAt: futureSet.capturedAt || null, freshness: freshnessFor(futureSet.capturedAt, now) };
    if (compatibility.usable) {
      const ids = unionActiveIds(roster.entries, resolvedEntries);
      const mapped = mappedExternalPoints(futureSet, identityMap, ids, snapshot.currentWeek);
      currentSources.push(mapped.missing.length
        ? Object.freeze({ source: externalContext.name, capturedAt: externalContext.capturedAt, freshness: externalContext.freshness, status: "UNKNOWN", direction: "UNKNOWN", preTotal: null, postTotal: null, delta: null, missingPlayerIds: freezeList(mapped.missing.map((item) => item.playerId)), reason: "External current-week union-roster coverage is incomplete.", assignments: null })
        : evaluateLineupSource(snapshot, roster.entries, resolvedEntries, config, externalContext, mapped.points, now, incoming, outgoing));
    } else {
      currentSources.push(Object.freeze({ source: externalContext.name || "External projections", capturedAt: externalContext.capturedAt, freshness: externalContext.freshness, status: "UNKNOWN", direction: "UNKNOWN", preTotal: null, postTotal: null, delta: null, missingPlayerIds: freezeList([]), reason: compatibility.errors.join(" "), assignments: null }));
    }
  }
  const currentResolution = resolveDirection(currentSources);
  const locks = currentLocks(snapshot, [...outgoing, ...incoming, ...drops], now);
  const currentWeek = Object.freeze({
    sources: freezeList(currentSources),
    direction: currentResolution.direction,
    sourceDisagreement: currentResolution.disagreement,
    actionability: locks.length ? "INFORMATIONAL_ONLY" : "HYPOTHETICAL_READ_ONLY",
    locks,
    limitation: locks.length ? "Current-week realization is locked or kickoff-qualified. The comparison is informational/counterfactual and does not claim whether ESPN would process the trade." : null
  });

  const importedWeeks = futureSet ? unique(futureSet.projections.map((item) => item.week)).sort((a, b) => a - b) : [];
  const futureWeeks = Array.isArray(options.futureWeeks) ? options.futureWeeks : importedWeeks.filter((week) => week > snapshot.currentWeek && !(snapshot.league?.playoffWeeks || []).includes(week));
  const playoffWeeks = Array.isArray(options.playoffWeeks) ? options.playoffWeeks : (Array.isArray(snapshot.league?.playoffWeeks) ? snapshot.league.playoffWeeks : []);
  const future = evaluateHorizon(snapshot, roster.entries, resolvedEntries, config, futureSet, identityMap, futureWeeks, futureWeeks.length ? `Weeks ${unique(futureWeeks).sort((a, b) => a - b).join(", ")}` : "Selected future weeks", now);
  const playoffs = evaluateHorizon(snapshot, roster.entries, resolvedEntries, config, futureSet, identityMap, playoffWeeks, playoffWeeks.length ? `Playoff weeks ${unique(playoffWeeks).sort((a, b) => a - b).join(", ")}` : "Playoff window", now);

  const bye = byeEffects(snapshot, teamId, roster.entries, resolvedEntries, unique([...outgoing, ...incoming, ...drops]));
  const replacement = replacementContext(snapshot, teamId, players, now);
  const primaryCurrentSource = espnCurrent.status === "READY" ? espnCurrent : currentSources.find((item) => item.status === "READY");
  const preContingency = contingency(roster.entries, primaryCurrentSource?.preAssignments || null, players, config);
  const postContingency = contingency(resolvedEntries, primaryCurrentSource?.postAssignments || null, players, config);
  const preListed = listedDepth(roster.entries, players);
  const postListed = listedDepth(resolvedEntries, players);
  const fragility = fragilityState({ preContingency, postContingency, bye, replacement, outgoing, players });
  const allPositions = unique([...Object.keys(preListed), ...Object.keys(postListed)]);
  const listedChanges = allPositions.map((position) => Object.freeze({ position, before: preListed[position] || 0, after: postListed[position] || 0, delta: (postListed[position] || 0) - (preListed[position] || 0) }));
  const depthCost = listedChanges.some((item) => item.delta < 0) || (preContingency.status === "READY" && postContingency.status === "READY" && postContingency.maxUncoveredAfterLoss > preContingency.maxUncoveredAfterLoss);
  const depthGain = listedChanges.some((item) => item.delta > 0) || (preContingency.status === "READY" && postContingency.status === "READY" && postContingency.maxUncoveredAfterLoss < preContingency.maxUncoveredAfterLoss);
  const depth = Object.freeze({ listedPositionChanges: freezeList(listedChanges), contingency: Object.freeze({ pre: preContingency, post: postContingency }), fragility, depthCost, depthGain });

  const longDirection = longTermDirection(future, playoffs);
  const anyUpgrade = currentResolution.direction === "UPGRADE" || longDirection === "UPGRADE";
  const numericEvidence = currentSources.some((item) => item.status === "READY") || future.status === "READY" || playoffs.status === "READY";
  const conclusion = chooseConclusion({ currentDirection: currentResolution.direction, longDirection, sourceDisagreement: currentResolution.disagreement, fragility, depthCost, depthGain, bye, anyUpgrade, numericEvidence });
  const incomplete = currentSources.some((item) => item.status !== "READY") || (futureWeeks.length && future.status !== "READY") || (playoffWeeks.length && playoffs.status !== "READY");
  const evidenceState = currentResolution.disagreement ? "SOURCE_DISAGREEMENT"
    : incomplete ? "PARTIAL_COVERAGE"
      : currentResolution.readySources >= 2 ? "COMPLETE_MULTI_SOURCE_AGREEMENT"
        : numericEvidence ? "COMPLETE_SINGLE_SOURCE" : "STRUCTURAL_ONLY";
  const limitations = [];
  if (resolvedRules.status === "unverified") limitations.push(resolvedRules.reason);
  if (config.status !== "ready") limitations.push(config.reason);
  if (currentWeek.limitation) limitations.push(currentWeek.limitation);
  if (future.status !== "READY" && futureWeeks.length) limitations.push(`Future window: ${future.reason}`);
  if (playoffs.status !== "READY" && playoffWeeks.length) limitations.push(`Playoff window: ${playoffs.reason}`);
  if (replacement.status !== "READY") limitations.push(replacement.reason);
  if (bye.status !== "READY") limitations.push("Bye comparison is partial because at least one materially affected bye week is unknown.");
  if (currentResolution.disagreement) limitations.push("Projection sources materially disagree; sources are shown independently and are never averaged.");
  const reasons = [objectiveReason(objective)];
  if (currentResolution.direction !== "UNKNOWN") reasons.push(`Current-week supported direction: ${currentResolution.direction}.`);
  if (longDirection !== "UNKNOWN") reasons.push(`Supported long-term direction: ${longDirection}.`);
  if (depthCost) reasons.push(`Depth/contingency cost: ${fragility.state} — ${fragility.reason}`);
  if (depthGain) reasons.push("The resolved roster gains listed-position or legal contingency depth.");
  if (rosterConsequences.openRosterSpots > 0) reasons.push(`The package creates ${rosterConsequences.openRosterSpots} open active roster spot${rosterConsequences.openRosterSpots === 1 ? "" : "s"}; no free agent is automatically added.`);
  if (bye.improvedWeeks.length) reasons.push(`Known bye coverage improves in Week${bye.improvedWeeks.length === 1 ? "" : "s"} ${bye.improvedWeeks.join(", ")}.`);
  if (bye.worsenedWeeks.length) reasons.push(`Known bye coverage worsens in Week${bye.worsenedWeeks.length === 1 ? "" : "s"} ${bye.worsenedWeeks.join(", ")}.`);
  if (currentResolution.disagreement) reasons.push("Current-week projection sources disagree materially; no source-agnostic winner is inferred.");
  const analysisState = conclusion === "INSUFFICIENT_EVIDENCE" && !numericEvidence ? "INSUFFICIENT_EVIDENCE" : (incomplete || resolvedRules.status === "unverified" ? "PARTIAL_EVIDENCE" : "READY");

  return Object.freeze({
    analysisState,
    ...resultBase(snapshot, objective, outgoing, incoming, drops, now),
    roster: rosterConsequences,
    directPostTradeEntries: freezeList(directEntries),
    resolvedPostTradeEntries: freezeList(resolvedEntries),
    currentWeek,
    future,
    playoffs,
    bye,
    depth,
    replacement,
    longTermDirection: longDirection,
    evidenceState,
    sourceAgreement: Object.freeze({ currentWeek: currentResolution.disagreement ? "DISAGREEMENT" : currentResolution.readySources >= 2 ? "AGREEMENT" : currentResolution.readySources === 1 ? "SINGLE_SOURCE" : "UNKNOWN" }),
    conclusion,
    reasons: freezeList(reasons),
    limitations: freezeList(limitations)
  });
}
