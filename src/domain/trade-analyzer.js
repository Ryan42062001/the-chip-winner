import { canFillSlot } from "./recommendations.js";
import { createLineupOptimizer, getLineupLockReason } from "./lineup-optimizer.js";
import { isStarter, SUPPORTED_LINEUP_SLOTS } from "./model.js";
import { buildByeWeekCoverage } from "./season-intelligence.js";
import { selectSnapshotFreshness } from "./selectors.js";
import { evaluateAcquisitionCapacity } from "./waiver-engine.js";
import { evaluatePackageValue, packageValueConfidence, withheldPackageValue } from "./trade-value-engine.js";
import { PRODUCTION_TRADE_VALUE_SOURCES } from "./trade-value-source.js";
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
export function buildTradeOwnershipIndex(snapshot) {
  const owners = new Map();
  for (const roster of snapshot?.rosters || []) {
    for (const entry of roster?.entries || []) {
      const teams = owners.get(entry.playerId) || new Set();
      teams.add(String(roster.teamId));
      owners.set(entry.playerId, teams);
    }
  }
  return owners;
}
export function isUniquelyOwnedByTeam(owners, playerId, teamId) {
  const teams = owners?.get(playerId);
  return Boolean(teams && teams.size === 1 && teams.has(String(teamId)));
}
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
  for (const rule of Array.isArray(rules.positionLimits) ? rules.positionLimits : []) {
    if (!rule || !Number.isInteger(rule.limit) || rule.limit < 0) continue;
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
  if (!roster || !Array.isArray(roster.entries)) return { error: "The connected user's roster is unavailable." };
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
  if (outgoing.some((id) => incoming.includes(id))) return { error: "A player cannot appear on both sides of the proposal." };
  if (outgoing.some((id) => !rosterIds.has(id))) return { error: "Every outgoing player must be on the connected user's current roster." };
  const owners = buildTradeOwnershipIndex(snapshot);
  if (outgoing.some((id) => !isUniquelyOwnedByTeam(owners, id, teamId))) return { error: "Every outgoing player must belong exclusively to the connected user's current roster; ambiguous ownership fails closed." };
  const partnerId = proposal?.partnerTeamId;
  if (partnerId == null || partnerId === "") return { error: "Select one opposing ESPN team before analyzing a trade." };
  if (partnerId === teamId) return { error: "The connected user's team cannot be its own trade partner." };
  const partnerTeam = (snapshot.teams || []).find((team) => team.id === partnerId);
  const partnerRosters = (snapshot.rosters || []).filter((item) => item.teamId === partnerId);
  if (!partnerTeam || partnerRosters.length !== 1 || !Array.isArray(partnerRosters[0].entries)) return { error: "The selected opposing team's roster is unavailable in the current ESPN snapshot." };
  if (incoming.some((id) => !players.has(id))) return { error: "Every incoming player must exist in the current ESPN snapshot." };
  if (incoming.some((id) => rosterIds.has(id))) return { error: "Incoming players cannot already be on the connected user's roster." };
  if (incoming.some((id) => !isUniquelyOwnedByTeam(owners, id, partnerId))) return { error: "Every incoming player must belong exclusively to the selected opposing team's current roster; free agents and mixed-opponent packages are not trades." };
  return { roster, partnerTeam, players, rosterIds, outgoing, incoming, drops, objective };
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

function evaluateLineupSource(snapshot, preEntries, postEntries, config, sourceContext, points, now, incomingIds, outgoingIds, optimizerOptions = {}) {
  const playerIds = unionActiveIds(preEntries, postEntries);
  const missing = playerIds.filter((id) => !Number.isFinite(points.get(id)));
  const sourceFields = { source: sourceContext.name, capturedAt: sourceContext.capturedAt || null, freshness: sourceContext.freshness || freshnessFor(sourceContext.capturedAt, now) };
  if (config.status === "unsupported" || config.status === "missing") return Object.freeze({ ...sourceFields, status: "UNKNOWN", direction: "UNKNOWN", preTotal: null, postTotal: null, delta: null, missingPlayerIds: freezeList(playerIds), reason: config.reason, assignments: null });
  if (missing.length) return Object.freeze({ ...sourceFields, status: "UNKNOWN", direction: "UNKNOWN", preTotal: null, postTotal: null, delta: null, missingPlayerIds: freezeList(missing), reason: "Complete active pre/post union-roster projection coverage is required.", assignments: null });
  const projectedPlayers = new Map(snapshot.players.map((player) => [player.id, { ...player, projection: points.get(player.id) }]));
  const optimizer = createLineupOptimizer(projectedPlayers, now, optimizerOptions);
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
    const evaluated = evaluateLineupSource(snapshot, preEntries, postEntries, config, { name: set.provider, capturedAt: set.capturedAt, freshness: freshnessFor(set.capturedAt, now) }, mapped.points, FUTURE_EVALUATION_TIME, [], [], { ignoreLocks: true });
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
  if (!Array.isArray(snapshot.availablePlayers)) return Object.freeze({ ...sourceFields, status: "UNKNOWN", candidates: freezeList([]), structuralCandidates: freezeList([]), acquisitionCapacity: capacity, reason: "ESPN availability is missing from the latest snapshot; replacement quality is unknown, not weak or empty." });
  const candidates = snapshot.availablePlayers
    .map((id) => players.get(id))
    .filter(Boolean)
    .sort((a, b) => (b.projection ?? -Infinity) - (a.projection ?? -Infinity) || String(a.name || a.id).localeCompare(String(b.name || b.id)) || String(a.id).localeCompare(String(b.id)));
  const describe = (player) => Object.freeze({ playerId: player.id, name: player.name, position: player.position, projection: Number.isFinite(player.projection) ? player.projection : null });
  return Object.freeze({
    ...sourceFields,
    status: "READY",
    candidates: freezeList(candidates.slice(0, 12).map(describe)),
    structuralCandidates: freezeList(candidates.map(describe)),
    acquisitionCapacity: capacity,
    reason: candidates.length ? null : "ESPN explicitly reported no available players in the captured pool."
  });
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

function structuralReplacementPlayers(replacement, players) {
  if (replacement.status !== "READY") return [];
  return (replacement.structuralCandidates || replacement.candidates || []).map((item) => players.get(item.playerId)).filter(Boolean);
}

function verifiedAcquisitionRosterState(snapshot, entries, players) {
  const rules = snapshot?.league?.rosterRules;
  const assessed = rosterRuleState(snapshot, entries, players);
  // A proven violation is blocking even when other settings are absent; absence of
  // a violation is NOT proof that the unreported constraints permit the move.
  if (assessed.violations.length) return Object.freeze({ status: "KNOWN_BLOCKED", reason: assessed.reason });
  const completeSize = Number.isInteger(rules?.size) && rules.size > 0;
  const completePositions = Array.isArray(rules?.positionLimits)
    && rules.positionLimits.every((rule) => typeof rule?.position === "string"
      && rule.position.length > 0 && Number.isInteger(rule.limit) && rule.limit >= -1);
  const knownPlayers = activeEntries(entries).every((entry) => {
    const player = players.get(entry.playerId);
    return player && typeof player.position === "string" && player.position.length > 0;
  });
  if (!completeSize || !completePositions || !knownPlayers || assessed.status !== "verified") {
    return Object.freeze({ status: "UNKNOWN", reason: "Complete applicable ESPN roster size, position-limit and player-position evidence is required before an acquisition path can be verified." });
  }
  return Object.freeze({ status: "KNOWN_LEGAL", reason: null });
}

function hasKnownLegalAcquisitionPath(snapshot, postEntries, candidate, players, now = Date.now()) {
  // Preserve the waiver listing as structural/future-week context. Generic
  // roster room does NOT verify this locked/kicked-off candidate can fill a
  // CURRENT-WEEK lineup need, regardless of whether ESPN permits a later add.
  const currentWeekLock = getLineupLockReason(null, candidate, now);
  if (currentWeekLock) return Object.freeze({
    status: "UNKNOWN", requiresExplicitDrop: false, conditionalDropPlayerId: null,
    reason: `Current-week replacement usability is unverified: ${currentWeekLock} This does not determine whether ESPN permits a later acquisition.`
  });
  const candidateEntry = { playerId: candidate.id, lineupSlot: "BE" };
  const direct = verifiedAcquisitionRosterState(snapshot, [...postEntries, candidateEntry], players);
  if (direct.status === "KNOWN_LEGAL") return Object.freeze({ status: "KNOWN_LEGAL", requiresExplicitDrop: false, conditionalDropPlayerId: null, reason: null });
  let unknown = direct.status === "UNKNOWN";
  let conditionalDropPlayerId = null;
  for (const entry of activeEntries(postEntries)) {
    // A locked entry cannot be assumed droppable for a current-week counterfactual.
    if (entry.locked === true || getLineupLockReason(entry, players.get(entry.playerId), now)) continue;
    const simulated = [...postEntries.filter((item) => item !== entry), candidateEntry];
    const assessed = verifiedAcquisitionRosterState(snapshot, simulated, players);
    if (assessed.status === "KNOWN_LEGAL" && conditionalDropPlayerId === null) conditionalDropPlayerId = entry.playerId;
    else if (assessed.status === "UNKNOWN") unknown = true;
  }
  if (conditionalDropPlayerId !== null) return Object.freeze({
    status: "KNOWN_LEGAL", requiresExplicitDrop: true, conditionalDropPlayerId,
    reason: "Only a hypothetical user-selected follow-up drop could create a legal acquisition path; no drop is authorized or automatic."
  });
  return Object.freeze({
    status: unknown ? "UNKNOWN" : "KNOWN_BLOCKED", requiresExplicitDrop: false, conditionalDropPlayerId: null,
    reason: unknown ? "Incomplete ESPN roster rules leave direct-add and hypothetical-drop feasibility unknown."
      : "Known ESPN roster constraints block direct addition and every eligible hypothetical drop path."
  });
}

function replacementPathState(snapshot, postEntries, replacement, slots, players, now) {
  if (replacement.status !== "READY") return Object.freeze({ status: "UNKNOWN", player: null, reason: replacement.reason });
  if (replacement.acquisitionCapacity?.status === "exhausted") return Object.freeze({ status: "BLOCKED", player: null, reason: replacement.acquisitionCapacity.reason });
  if (replacement.acquisitionCapacity?.status !== "available") return Object.freeze({ status: "UNKNOWN", player: null, reason: "Acquisition availability is not verified." });
  const candidateObjects = structuralReplacementPlayers(replacement, players);
  const eligible = candidateObjects.filter((player) => slots.some((slot) => canFillSlot(player, slot)));
  if (!eligible.length) return Object.freeze({ status: "NO_ELIGIBLE", player: null, reason: `The latest ESPN pool has no verified eligible replacement for ${slots.join("/") || "the uncovered slot"}.` });
  const assessed = eligible.map((player) => ({ player, path: hasKnownLegalAcquisitionPath(snapshot, postEntries, player, players, now) }));
  const direct = assessed.find((item) => item.path.status === "KNOWN_LEGAL" && !item.path.requiresExplicitDrop);
  if (direct) return Object.freeze({ status: "VERIFIED", player: direct.player, reason: null });
  const conditional = assessed.find((item) => item.path.status === "KNOWN_LEGAL" && item.path.requiresExplicitDrop);
  if (conditional) return Object.freeze({ status: "CONDITIONAL", player: conditional.player, reason: conditional.path.reason, conditionalDropPlayerId: conditional.path.conditionalDropPlayerId });
  if (assessed.some((item) => item.path.status === "UNKNOWN")) return Object.freeze({ status: "UNKNOWN", player: null, reason: "Roster rules or proposed drop feasibility are not fully verified." });
  return Object.freeze({ status: "BLOCKED", player: null, reason: `Known ESPN roster constraints block every eligible replacement path for ${slots.join("/") || "the uncovered slot"}.` });
}

function fragilityState({ snapshot, postEntries, preContingency, postContingency, bye, replacement, outgoing, players, now }) {
  if (postContingency.status !== "READY") return Object.freeze({ state: "UNKNOWN", reason: "Contingency coverage could not be fully verified from complete supported lineup evidence." });
  const postThin = postContingency.maxUncoveredAfterLoss > 0;
  if (!postThin) return Object.freeze({ state: "COVERED", reason: "Every optimized starter has a complete internal contingency lineup." });
  const newlyThin = preContingency.status === "READY" && preContingency.maxUncoveredAfterLoss === 0;
  const worsenedRows = bye.rows.filter((row) => row.gapDelta > 0);
  if (worsenedRows.length && replacement.status === "READY") {
    const uncoveredSlots = unique(worsenedRows.flatMap((row) => row.postUncoveredSlotCandidates));
    const path = replacementPathState(snapshot, postEntries, replacement, uncoveredSlots, players, now);
    if (path.status === "UNKNOWN" || path.status === "CONDITIONAL") return Object.freeze({ state: "UNKNOWN", reason: `A bye-week lineup gap exists but replacement acquisition feasibility is not established: ${path.reason}` });
    if (path.status === "NO_ELIGIBLE" || path.status === "BLOCKED") return Object.freeze({ state: "DANGEROUS", reason: `A known bye-week lineup gap is created and ${path.reason}` });
  }
  if (newlyThin) {
    const affectedSlots = (postContingency.items || []).filter((item) => item.uncoveredAfterLoss > 0).map((item) => item.slot);
    const acquisitionPath = replacementPathState(snapshot, postEntries, replacement, affectedSlots, players, now);
    if (acquisitionPath.status === "UNKNOWN" || acquisitionPath.status === "CONDITIONAL") {
      return Object.freeze({ state: "UNKNOWN", reason: `New contingency loss is supported, but replacement feasibility remains unresolved: ${acquisitionPath.reason}` });
    }
    if (replacement.status !== "READY") return Object.freeze({ state: "SCARCE_THIN", reason: "The trade newly removes complete internal contingency coverage, and ESPN replacement quality is unavailable." });
    const outgoingPlayers = outgoing.map((id) => players.get(id)).filter((player) => Number.isFinite(player?.projection));
    const fullCandidates = replacement.structuralCandidates || replacement.candidates;
    const scarce = outgoingPlayers.some((player) => {
      const best = fullCandidates.find((candidate) => candidate.position === player.position && Number.isFinite(candidate.projection));
      return !best || player.projection - best.projection >= WAIVER_MATERIALITY;
    });
    if (scarce) return Object.freeze({ state: "SCARCE_THIN", reason: "The trade newly removes complete internal contingency coverage and the lost internal option is materially above the best verified same-position replacement context." });
  }
  return Object.freeze({ state: "THIN", reason: "At least one optimized starter lacks a complete internal contingency lineup after the trade." });
}

function longTermDirection(future, restOfSeason, playoffs) {
  const known = [future?.direction, restOfSeason?.direction, playoffs?.direction].filter((item) => item && item !== "UNKNOWN");
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


function rosterSignature(entries) {
  return activeEntries(entries).map((entry) => `${entry.playerId}:${entry.lineupSlot}`).sort().join("|");
}

function withheldDoNothing(preEntries = [], postEntries = [], reason = "Roster consequence is not yet supportable.") {
  return Object.freeze({
    preRosterSignature: rosterSignature(preEntries),
    postResolvedRosterSignature: postEntries ? rosterSignature(postEntries) : null,
    userDecision: "WITHHELD",
    recommendation: "NOT_ENOUGH_EVIDENCE",
    supportedHorizonScope: freezeList([]),
    severeGap: false,
    materialBenefits: freezeList([]),
    materialCosts: freezeList([]),
    reasons: freezeList([reason])
  });
}

function deriveDoNothing({ preEntries, postEntries, currentWeek, future, restOfSeason, playoffs, depth, bye }) {
  const benefits = [];
  const costs = [];
  const supported = [];
  const addDirection = (label, item, actionable = true) => {
    if (!item || item.status === "UNKNOWN" || item.direction === "UNKNOWN") return;
    supported.push(label);
    if (!actionable) return;
    if (item.direction === "UPGRADE") benefits.push(`${label}_UPGRADE`);
    else if (item.direction === "DOWNGRADE") costs.push(`${label}_DOWNGRADE`);
  };
  addDirection("CURRENT_WEEK", currentWeek, currentWeek?.actionability !== "INFORMATIONAL_ONLY");
  addDirection("FUTURE_WINDOW", future);
  addDirection("REST_OF_SEASON", restOfSeason);
  addDirection("PLAYOFFS", playoffs);
  if (depth?.depthGain) benefits.push("DEPTH_OR_CONTINGENCY_GAIN");
  if (depth?.depthCost) costs.push("DEPTH_OR_CONTINGENCY_COST");
  if (bye?.improvedWeeks?.length) benefits.push("SUPPORTED_BYE_RELIEF");
  if (bye?.worsenedWeeks?.length) costs.push("SUPPORTED_BYE_GAP");
  const severeGap = depth?.fragility?.state === "DANGEROUS";
  if (severeGap && !costs.includes("DANGEROUS_POSITIONAL_FRAGILITY")) costs.unshift("DANGEROUS_POSITIONAL_FRAGILITY");

  const listedCountChanged = (depth?.listedPositionChanges || []).some((item) => item.delta !== 0);
  const contingencyUnknown = depth?.contingency?.pre?.status !== "READY" || depth?.contingency?.post?.status !== "READY";

  let userDecision;
  if (severeGap) userDecision = "WORSENS";
  else if (benefits.length && costs.length) userDecision = "MIXED";
  else if (benefits.length) userDecision = "IMPROVES";
  else if (costs.length) userDecision = "WORSENS";
  else if (listedCountChanged && contingencyUnknown) userDecision = "WITHHELD";
  else if (supported.length || depth?.fragility?.state === "COVERED" || depth?.fragility?.state === "THIN") userDecision = "NO_MATERIAL_CHANGE";
  else userDecision = "WITHHELD";

  const recommendation = userDecision === "IMPROVES" ? "CONSIDER"
    : userDecision === "WORSENS" ? "DO_NOT_PROCEED"
      : userDecision === "MIXED" ? "REVIEW_TRADEOFF"
        : userDecision === "NO_MATERIAL_CHANGE" ? "HOLD_DO_NOTHING"
          : "NOT_ENOUGH_EVIDENCE";
  return Object.freeze({
    preRosterSignature: rosterSignature(preEntries),
    postResolvedRosterSignature: rosterSignature(postEntries),
    userDecision,
    recommendation,
    supportedHorizonScope: freezeList(supported),
    severeGap,
    materialBenefits: freezeList(benefits),
    materialCosts: freezeList(costs),
    reasons: freezeList([
      severeGap ? "A supported dangerous roster gap overrides apparent starter benefit." : null,
      listedCountChanged && contingencyUnknown ? "Listed-position count changes remain descriptive because legal contingency evidence is incomplete." : null,
      currentWeek?.actionability === "INFORMATIONAL_ONLY" ? "Current-week locked evidence is counterfactual and does not drive an executable recommendation." : null
    ].filter(Boolean))
  });
}

function mappedLineupSources(currentWeek, future, restOfSeason, playoffs) {
  const current = (currentWeek?.sources || []).map((source) => Object.freeze({
    sourceId: source.source,
    capturedAt: source.capturedAt || null,
    horizonType: "CURRENT_WEEK",
    weeks: freezeList([]),
    status: source.status,
    preTotal: source.preTotal,
    postTotal: source.postTotal,
    delta: source.delta,
    meanWeeklyDelta: source.delta,
    direction: source.direction,
    preAssignments: source.preAssignments || null,
    postAssignments: source.postAssignments || null,
    startedIncomingIds: freezeList(source.assignments?.incomingStarters || []),
    benchedIncomingIds: freezeList(source.assignments?.incomingBenchDepth || []),
    displacedIds: freezeList(source.assignments?.displacedExisting || []),
    promotedIds: freezeList(source.assignments?.promotedExisting || []),
    missingPlayerIds: freezeList(source.missingPlayerIds || []),
    actionability: currentWeek?.actionability || "HYPOTHETICAL_READ_ONLY"
  }));
  const horizons = [
    ["FUTURE_WINDOW", future],
    ["REST_OF_SEASON", restOfSeason],
    ["PLAYOFFS", playoffs]
  ].flatMap(([horizonType, horizon]) => {
    if (!horizon) return [];
    return [Object.freeze({
      sourceId: horizon.source || null,
      capturedAt: horizon.capturedAt || null,
      horizonType,
      weeks: freezeList(horizon.weeks || []),
      status: horizon.status,
      preTotal: null,
      postTotal: null,
      delta: horizon.horizonDelta,
      meanWeeklyDelta: horizon.meanWeeklyDelta,
      direction: horizon.direction,
      preAssignments: null,
      postAssignments: null,
      startedIncomingIds: freezeList([]),
      benchedIncomingIds: freezeList([]),
      displacedIds: freezeList([]),
      promotedIds: freezeList([]),
      missingPlayerIds: freezeList((horizon.rows || []).flatMap((row) => (row.missing || []).map((item) => item.playerId))),
      actionability: "HYPOTHETICAL_READ_ONLY"
    })];
  });
  return freezeList([...current, ...horizons]);
}

function replacementDemandSlots(depth, bye) {
  const contingencySlots = depth?.contingency?.post?.status === "READY"
    ? (depth.contingency.post.items || []).filter((item) => item.uncoveredAfterLoss > 0).map((item) => item.slot)
    : [];
  const byeSlots = (bye?.rows || [])
    .filter((row) => row.gapDelta > 0)
    .flatMap((row) => row.postUncoveredSlotCandidates || []);
  return unique([...contingencySlots, ...byeSlots]).sort();
}

function supportedReplacementQualityCost({ snapshot, postEntries, replacement, postContingency, bye, outgoing, players, now }) {
  if (replacement?.status !== "READY" || replacement?.acquisitionCapacity?.status !== "available") return false;
  if (!snapshot?.meta?.capturedAt || replacement.capturedAt !== snapshot.meta.capturedAt || !Number.isInteger(snapshot?.currentWeek)) return false;
  const contingencySlots = postContingency?.status === "READY"
    ? (postContingency.items || []).filter((item) => item.uncoveredAfterLoss > 0).map((item) => item.slot)
    : [];
  const byeSlots = (bye?.rows || []).filter((row) => row.gapDelta > 0).flatMap((row) => row.postUncoveredSlotCandidates || []);
  const demandSlots = unique([...contingencySlots, ...byeSlots]).sort();
  if (!demandSlots.length) return false;

  const feasible = structuralReplacementPlayers(replacement, players)
    .filter((player) => demandSlots.some((slot) => canFillSlot(player, slot)))
    .filter((player) => { const path = hasKnownLegalAcquisitionPath(snapshot, postEntries, player, players, now); return path.status === "KNOWN_LEGAL" && !path.requiresExplicitDrop; })
    .filter((player) => Number.isFinite(player.projection));
  if (!feasible.length) return false;
  const bestReplacementProjection = Math.max(...feasible.map((player) => player.projection));
  return outgoing
    .map((id) => players.get(id))
    .filter((player) => Number.isFinite(player?.projection) && demandSlots.some((slot) => canFillSlot(player, slot)))
    .some((player) => player.projection - bestReplacementProjection >= WAIVER_MATERIALITY);
}

function replacementScarcityContract({ snapshot, postEntries, replacement, depth, bye, players, now }) {
  const ready = replacement?.status === "READY";
  const structural = ready ? (replacement.structuralCandidates || []) : [];
  const demandSlots = replacementDemandSlots(depth, bye);
  const candidateObjects = structuralReplacementPlayers(replacement, players);
  const eligibleSlots = demandSlots.filter((slot) => candidateObjects.some((player) => canFillSlot(player, slot)));
  const demand = demandSlots.map((slot) => {
    const eligible = candidateObjects.filter((player) => canFillSlot(player, slot));
    const feasible = replacement?.acquisitionCapacity?.status === "available"
      ? eligible.filter((player) => { const path = hasKnownLegalAcquisitionPath(snapshot, postEntries, player, players, now); return path.status === "KNOWN_LEGAL" && !path.requiresExplicitDrop; })
      : [];
    return Object.freeze({
      slot,
      eligibleCandidateIds: freezeList(eligible.map((player) => player.id).sort()),
      feasibleCandidateIds: freezeList(feasible.map((player) => player.id).sort()),
      acquisitionPathStatus: !ready || replacement?.acquisitionCapacity?.status !== "available" ? "UNKNOWN"
        : feasible.length ? "KNOWN_LEGAL"
          : eligible.some((player) => hasKnownLegalAcquisitionPath(snapshot, postEntries, player, players, now).status === "UNKNOWN") ? "UNKNOWN"
            : eligible.some((player) => hasKnownLegalAcquisitionPath(snapshot, postEntries, player, players, now).requiresExplicitDrop) ? "CONDITIONAL" : "KNOWN_BLOCKED"
    });
  });
  const feasibleProjected = candidateObjects
    .filter((player) => demandSlots.some((slot) => canFillSlot(player, slot)))
    .filter((player) => { const path = hasKnownLegalAcquisitionPath(snapshot, postEntries, player, players, now); return replacement?.acquisitionCapacity?.status === "available" && path.status === "KNOWN_LEGAL" && !path.requiresExplicitDrop; })
    .filter((player) => Number.isFinite(player.projection))
    .sort((left, right) => right.projection - left.projection || String(left.id).localeCompare(String(right.id)));
  const sameSourceWeek = Boolean(ready && snapshot?.meta?.capturedAt && replacement?.capturedAt === snapshot.meta.capturedAt && Number.isInteger(snapshot?.currentWeek));
  const numericReady = sameSourceWeek
    && demandSlots.length > 0
    && replacement?.acquisitionCapacity?.status === "available"
    && feasibleProjected.length > 0;
  const reason = !ready ? replacement?.reason || "Replacement basis unavailable."
    : !demandSlots.length ? "No explicit affected configured-slot demand is established, so numeric replacement projection is withheld."
      : replacement?.acquisitionCapacity?.status !== "available" ? "A known feasible acquisition path is not established, so numeric replacement projection is withheld."
        : !eligibleSlots.length ? "The structural pool has no candidate eligible for the supported configured-slot demand."
          : !feasibleProjected.length ? "No slot-eligible candidate has a verified direct-add path and same-horizon numeric projection; missing rules and hypothetical follow-up drops are not legal authorization."
            : "Numeric replacement projection uses the best verified feasible candidate for the explicit configured-slot demand; it remains separate from package market value.";
  return Object.freeze({
    poolSnapshotAt: replacement?.capturedAt || null,
    fullStructuralPoolUsed: ready,
    acquisitionPathStatus: replacement?.acquisitionCapacity?.status || "UNKNOWN",
    eligibleSlots: freezeList(eligibleSlots),
    candidateIds: freezeList(structural.map((item) => item.playerId)),
    sameSourceWeek,
    positionalAndFLEXOPDemand: freezeList(demand),
    replacementProjectionOrNull: numericReady ? feasibleProjected[0].projection : null,
    marginalVorpOrNull: null,
    scarcityState: depth?.fragility?.state || "UNKNOWN",
    noDoubleCountAttestation: true,
    reason
  });
}

function userDecisionConfidence(doNothing, evidenceState, depth) {
  const withheld = doNothing?.userDecision === "WITHHELD";
  return Object.freeze({
    claimConfidence: withheld ? "WITHHELD" : evidenceState?.startsWith("COMPLETE") && depth?.fragility?.state !== "UNKNOWN" ? "MODERATE" : "LOW",
    evidenceState: evidenceState || "UNKNOWN",
    coverage: withheld ? "INSUFFICIENT" : evidenceState?.startsWith("COMPLETE") ? "COMPLETE_SUPPORTED_HORIZONS" : "PARTIAL_SUPPORTED_HORIZONS",
    freshness: "SOURCE_SPECIFIC",
    identity: "VERIFIED_ESPN_ROSTER_OWNERSHIP",
    comparability: "DO_NOTHING_SAME_ROSTER_RULES",
    limitations: freezeList(withheld ? ["Roster consequence could not be established from supported evidence."] : [])
  });
}

function resultBase(snapshot, teamId, partnerTeamId, objective, outgoing, incoming, drops, now) {
  const playerMap = new Map((snapshot.players || []).map((player) => [player.id, player]));
  const teams = new Map((snapshot.teams || []).map((team) => [team.id, team]));
  const describe = (ids) => freezeList((Array.isArray(ids) ? ids : []).map((id) => Object.freeze({ id, name: playerMap.get(id)?.name || "Unknown player", position: playerMap.get(id)?.position || null })));
  const describeTeam = (id) => Object.freeze({ id: id ?? null, name: teams.get(id)?.name || "Unavailable" });
  return {
    proposal: Object.freeze({ userTeam: describeTeam(teamId), partnerTeam: describeTeam(partnerTeamId), outgoing: describe(outgoing), incoming: describe(incoming), plannedFollowUpDrops: describe(drops), teamObjective: objective }),
    snapshot: Object.freeze({ provider: snapshot.provider || "espn", projectionsSource: snapshot.meta?.projectionsSource || null, capturedAt: snapshot.meta?.capturedAt || null, freshness: freshnessFor(snapshot.meta?.capturedAt, now), kind: snapshot.meta?.kind || null, currentWeek: snapshot.currentWeek ?? null }),
    readOnly: true,
    transactionActions: freezeList([])
  };
}

export function analyzeTrade(snapshot, teamId, proposal, options = {}) {
  const now = options.now ?? Date.now();
  const valueSources = Array.isArray(options.tradeValueSources) ? options.tradeValueSources : PRODUCTION_TRADE_VALUE_SOURCES;
  const checked = validateProposal(snapshot, teamId, proposal);
  const fallbackObjective = OBJECTIVES.has(proposal?.teamObjective) ? proposal.teamObjective : "BALANCED";
  if (checked.error) return Object.freeze({
    contractVersion: "TCW_032_V1",
    analysisState: "INVALID_PROPOSAL",
    ...resultBase(snapshot || { players: [], teams: [] }, teamId, proposal?.partnerTeamId, fallbackObjective, proposal?.outgoingPlayerIds || [], proposal?.incomingPlayerIds || [], proposal?.plannedFollowUpDropIds || [], now),
    packageValue: withheldPackageValue("INVALID_PROPOSAL"),
    doNothing: withheldDoNothing([], null, checked.error),
    validation: Object.freeze({ identity: "INVALID", uniqueOwnership: "UNVERIFIED", userRosterLegality: "UNVERIFIED", opponentRosterLegality: "UNVERIFIED", unresolvedRules: freezeList([checked.error]), currentWeekActionability: "UNKNOWN", readOnly: true, transactionActions: freezeList([]) }),
    confidence: Object.freeze({ packageValue: packageValueConfidence(withheldPackageValue("INVALID_PROPOSAL")), userDecision: userDecisionConfidence(withheldDoNothing([], null, checked.error), "UNKNOWN", null) }),
    conclusion: "INSUFFICIENT_EVIDENCE",
    reasons: freezeList([checked.error]),
    limitations: freezeList([checked.error])
  });
  const { roster, players, outgoing, incoming, drops, objective } = checked;
  const packageValue = evaluatePackageValue({ snapshot, outgoingPlayerIds: outgoing, incomingPlayerIds: incoming, sources: valueSources, now });
  const directEntries = buildDirectEntries(snapshot, roster, outgoing, incoming);
  const directRules = rosterRuleState(snapshot, directEntries, players);
  if (!directRules.violations.length && drops.length) return Object.freeze({ contractVersion: "TCW_032_V1", analysisState: "INVALID_PROPOSAL", ...resultBase(snapshot, teamId, proposal?.partnerTeamId, objective, outgoing, incoming, drops, now), packageValue: withheldPackageValue("INVALID_PROPOSAL"), doNothing: withheldDoNothing(roster.entries, null, "Unexpected follow-up drop on an otherwise legal direct roster."), conclusion: "INSUFFICIENT_EVIDENCE", reasons: freezeList(["Follow-up drops are only part of Trade Analyzer v1 when a known roster constraint requires another explicit removal."]), limitations: freezeList([]) });
  if (drops.some((id) => !directEntries.some((entry) => entry.playerId === id))) return Object.freeze({ contractVersion: "TCW_032_V1", analysisState: "INVALID_PROPOSAL", ...resultBase(snapshot, teamId, proposal?.partnerTeamId, objective, outgoing, incoming, drops, now), packageValue: withheldPackageValue("INVALID_PROPOSAL"), doNothing: withheldDoNothing(roster.entries, null, "Follow-up drop identity is invalid."), conclusion: "INSUFFICIENT_EVIDENCE", reasons: freezeList(["Every follow-up drop must be a player on the direct post-trade roster."]), limitations: freezeList([]) });
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
    return Object.freeze({ contractVersion: "TCW_032_V1", analysisState: "ROSTER_ACTION_REQUIRED", ...resultBase(snapshot, teamId, proposal?.partnerTeamId, objective, outgoing, incoming, drops, now), packageValue, doNothing: withheldDoNothing(roster.entries, null, "Known roster constraints require explicit resolution before user-roster consequence can be finalized."), validation: Object.freeze({ identity: "VERIFIED", uniqueOwnership: "VERIFIED", userRosterLegality: "ACTION_REQUIRED", opponentRosterLegality: "UNKNOWN", unresolvedRules: freezeList(reasons), currentWeekActionability: "UNKNOWN", readOnly: true, transactionActions: freezeList([]) }), roster: rosterConsequences, directPostTradeEntries: freezeList(directEntries), resolvedPostTradeEntries: null, conclusion: "INSUFFICIENT_EVIDENCE", reasons: freezeList(reasons), limitations: freezeList(["No expanded-roster optimizer result is presented as a final legal post-trade lineup."]) });
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
  const canonicalPlayoffWeeks = unique(Array.isArray(snapshot.league?.playoffWeeks) ? snapshot.league.playoffWeeks : [])
    .filter((week) => Number.isInteger(week) && week >= 1 && week <= 18)
    .sort((a, b) => a - b);
  const futureWeeks = unique(Array.isArray(options.futureWeeks)
    ? options.futureWeeks
    : importedWeeks.filter((week) => week > snapshot.currentWeek && !canonicalPlayoffWeeks.includes(week)))
    .filter((week) => Number.isInteger(week) && week >= 1 && week <= 18)
    .sort((a, b) => a - b);
  const future = evaluateHorizon(snapshot, roster.entries, resolvedEntries, config, futureSet, identityMap, futureWeeks, futureWeeks.length ? `Weeks ${futureWeeks.join(", ")}` : "Selected future weeks", now);
  const playoffs = evaluateHorizon(snapshot, roster.entries, resolvedEntries, config, futureSet, identityMap, canonicalPlayoffWeeks, canonicalPlayoffWeeks.length ? `Playoff weeks ${canonicalPlayoffWeeks.join(", ")}` : "Playoff window", now);

  const canonicalRosWeeks = unique(Array.isArray(snapshot.league?.restOfSeasonWeeks) ? snapshot.league.restOfSeasonWeeks : [])
    .filter((week) => Number.isInteger(week) && week > snapshot.currentWeek && week >= 1 && week <= 18)
    .sort((a, b) => a - b);
  const restOfSeason = canonicalRosWeeks.length
    ? evaluateHorizon(snapshot, roster.entries, resolvedEntries, config, futureSet, identityMap, canonicalRosWeeks, `Rest of season: Weeks ${canonicalRosWeeks.join(", ")}`, now)
    : Object.freeze({ label: "Rest of season", status: "UNKNOWN", weeks: freezeList([]), rows: freezeList([]), horizonDelta: null, meanWeeklyDelta: null, direction: "UNKNOWN", reason: "No authoritative complete remaining-season week definition is configured in league state." });

  const bye = byeEffects(snapshot, teamId, roster.entries, resolvedEntries, unique([...outgoing, ...incoming, ...drops]));
  const replacement = replacementContext(snapshot, teamId, players, now);
  const primaryCurrentSource = espnCurrent.status === "READY" ? espnCurrent : currentSources.find((item) => item.status === "READY");
  const preContingency = contingency(roster.entries, primaryCurrentSource?.preAssignments || null, players, config);
  const postContingency = contingency(resolvedEntries, primaryCurrentSource?.postAssignments || null, players, config);
  const preListed = listedDepth(roster.entries, players);
  const postListed = listedDepth(resolvedEntries, players);
  const fragility = fragilityState({ snapshot, postEntries: resolvedEntries, preContingency, postContingency, bye, replacement, outgoing, players, now });
  const allPositions = unique([...Object.keys(preListed), ...Object.keys(postListed)]);
  const listedChanges = allPositions.map((position) => Object.freeze({ position, before: preListed[position] || 0, after: postListed[position] || 0, delta: (postListed[position] || 0) - (preListed[position] || 0) }));
  const contingencyCost = preContingency.status === "READY" && postContingency.status === "READY" && postContingency.maxUncoveredAfterLoss > preContingency.maxUncoveredAfterLoss;
  const contingencyGain = preContingency.status === "READY" && postContingency.status === "READY" && postContingency.maxUncoveredAfterLoss < preContingency.maxUncoveredAfterLoss;
  const replacementQualityCost = supportedReplacementQualityCost({
    snapshot,
    postEntries: resolvedEntries,
    replacement,
    postContingency,
    bye,
    outgoing,
    players,
    now
  });
  const depthCost = contingencyCost || replacementQualityCost;
  const depthGain = contingencyGain;
  const depth = Object.freeze({
    listedPositionChanges: freezeList(listedChanges),
    listedPositionChangesAreDescriptive: true,
    contingency: Object.freeze({ pre: preContingency, post: postContingency }),
    materialDepthEvidence: Object.freeze({ contingencyCost, contingencyGain, replacementQualityCost }),
    fragility,
    depthCost,
    depthGain
  });

  const longDirection = longTermDirection(future, restOfSeason, playoffs);
  const anyUpgrade = currentResolution.direction === "UPGRADE" || longDirection === "UPGRADE";
  const numericEvidence = currentSources.some((item) => item.status === "READY") || future.status === "READY" || restOfSeason.status === "READY" || playoffs.status === "READY";
  const conclusion = chooseConclusion({ currentDirection: currentResolution.direction, longDirection, sourceDisagreement: currentResolution.disagreement, fragility, depthCost, depthGain, bye, anyUpgrade, numericEvidence });
  const incomplete = currentSources.some((item) => item.status !== "READY") || (futureWeeks.length && future.status !== "READY") || (canonicalRosWeeks.length && restOfSeason.status !== "READY") || (canonicalPlayoffWeeks.length && playoffs.status !== "READY");
  const evidenceState = currentResolution.disagreement ? "SOURCE_DISAGREEMENT"
    : incomplete ? "PARTIAL_COVERAGE"
      : currentResolution.readySources >= 2 ? "COMPLETE_MULTI_SOURCE_AGREEMENT"
        : numericEvidence ? "COMPLETE_SINGLE_SOURCE" : "STRUCTURAL_ONLY";
  const limitations = [];
  if (resolvedRules.status === "unverified") limitations.push(resolvedRules.reason);
  if (config.status !== "ready") limitations.push(config.reason);
  if (currentWeek.limitation) limitations.push(currentWeek.limitation);
  if (future.status !== "READY" && futureWeeks.length) limitations.push(`Future window: ${future.reason}`);
  if (restOfSeason.status !== "READY") limitations.push(`Rest of season: ${restOfSeason.reason}`);
  if (playoffs.status !== "READY" && canonicalPlayoffWeeks.length) limitations.push(`Playoff window: ${playoffs.reason}`);
  if (replacement.status !== "READY") limitations.push(replacement.reason);
  if (fragility.state === "UNKNOWN") limitations.push(`Depth contingency: ${fragility.reason}`);
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
  const doNothing = deriveDoNothing({ preEntries: roster.entries, postEntries: resolvedEntries, currentWeek, future, restOfSeason, playoffs, depth, bye });
  const validation = Object.freeze({
    identity: "VERIFIED",
    uniqueOwnership: "VERIFIED",
    userRosterLegality: resolvedRules.status === "verified" ? "VERIFIED" : resolvedRules.status.toUpperCase(),
    opponentRosterLegality: "UNKNOWN",
    unresolvedRules: freezeList(resolvedRules.status === "unverified" ? [resolvedRules.reason] : []),
    currentWeekActionability: currentWeek.actionability,
    readOnly: true,
    transactionActions: freezeList([])
  });
  const lineup = Object.freeze({ sourceResults: mappedLineupSources(currentWeek, future, restOfSeason, playoffs), sameHorizonDisagreement: currentResolution.disagreement });
  const rosterSpace = Object.freeze({
    user: Object.freeze({
      preActiveCount: activeEntries(roster.entries).length,
      directActiveCount: directRules.activeCount,
      resolvedActiveCount: resolvedRules.activeCount,
      netRosterCount: rosterConsequences.netRosterCount,
      openActiveSlots: rosterConsequences.openRosterSpots,
      requiredDrops: freezeList(drops),
      ruleViolations: freezeList(resolvedRules.violations || [])
    }),
    opponent: Object.freeze({ status: "UNKNOWN", reason: "Opponent reciprocal roster consequence is deferred to the TCW-035 opportunity model boundary." }),
    conditionalFollowUpAddsExcluded: true
  });
  const replacementScarcity = replacementScarcityContract({ snapshot, postEntries: resolvedEntries, replacement, depth, bye, players, now });
  const horizons = Object.freeze({
    currentWeek,
    futureWindow: future,
    restOfSeason,
    playoffs,
    crossHorizonConflict: (currentResolution.direction === "UPGRADE" && longDirection === "DOWNGRADE") ? "SHORT_TERM_GAIN_LONG_TERM_COST"
      : (currentResolution.direction === "DOWNGRADE" && longDirection === "UPGRADE") ? "LONG_TERM_GAIN_SHORT_TERM_COST"
        : longDirection === "MIXED" ? "MIXED" : null
  });
  const confidence = Object.freeze({
    packageValue: packageValueConfidence(packageValue),
    userDecision: userDecisionConfidence(doNothing, evidenceState, depth),
    horizons: Object.freeze({
      currentWeek: currentResolution.direction === "UNKNOWN" ? "LOW" : currentWeek.actionability === "INFORMATIONAL_ONLY" ? "COUNTERFACTUAL" : "MODERATE",
      futureWindow: future.status === "READY" ? "MODERATE" : "WITHHELD",
      restOfSeason: restOfSeason.status === "READY" ? "MODERATE" : "WITHHELD",
      playoffs: playoffs.status === "READY" ? "MODERATE" : "WITHHELD"
    })
  });
  const analysisState = conclusion === "INSUFFICIENT_EVIDENCE" && !numericEvidence ? "INSUFFICIENT_EVIDENCE" : (incomplete || resolvedRules.status === "unverified" ? "PARTIAL_EVIDENCE" : "READY");

  return Object.freeze({
    contractVersion: "TCW_032_V1",
    analysisState,
    ...resultBase(snapshot, teamId, proposal?.partnerTeamId, objective, outgoing, incoming, drops, now),
    validation,
    packageValue,
    doNothing,
    lineup,
    rosterSpace,
    replacementScarcity,
    horizons,
    confidence,
    roster: rosterConsequences,
    directPostTradeEntries: freezeList(directEntries),
    resolvedPostTradeEntries: freezeList(resolvedEntries),
    currentWeek,
    future,
    restOfSeason,
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
