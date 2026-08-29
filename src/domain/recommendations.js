import { isStarter } from "./model.js";

const FLEX_POSITIONS = new Set(["RB", "WR", "TE"]);
const OP_POSITIONS = new Set(["QB", "RB", "WR", "TE"]);
const MIN_LINEUP_GAIN = 1;
const MIN_WAIVER_GAIN = 0.5;

export function canFillSlot(player, slot) {
  if (slot === "FLEX") return FLEX_POSITIONS.has(player.position);
  if (slot === "OP") return OP_POSITIONS.has(player.position);
  return player.position === slot;
}

export function buildLineupSuggestions(snapshot, teamId) {
  const players = new Map(snapshot.players.map((p) => [p.id, p]));
  const entries = snapshot.rosters.find((r) => r.teamId === teamId)?.entries || [];
  const starters = entries.filter((entry) => isStarter(entry.lineupSlot));
  const bench = entries.filter((entry) => entry.lineupSlot === "BE");
  const candidates = [];

  for (const starterEntry of starters) {
    const starter = players.get(starterEntry.playerId);
    if (!starter || starter.projection == null) continue;
    const alternatives = bench
      .map((entry) => players.get(entry.playerId))
      .filter((player) => player && player.projection != null && canFillSlot(player, starterEntry.lineupSlot))
      .sort((a, b) => b.projection - a.projection);
    for (const alternative of alternatives) {
      if (alternative.projection - starter.projection >= MIN_LINEUP_GAIN) {
        candidates.push({
          type: "swap",
          slot: starterEntry.lineupSlot,
          start: alternative,
          sit: starter,
          gain: +(alternative.projection - starter.projection).toFixed(1),
          reason: "Higher available projection"
        });
      }
    }
  }
  const usedStarters = new Set();
  const usedBench = new Set();
  return candidates
    .sort((a, b) => b.gain - a.gain)
    .filter((candidate) => {
      if (usedStarters.has(candidate.sit.id) || usedBench.has(candidate.start.id)) return false;
      usedStarters.add(candidate.sit.id);
      usedBench.add(candidate.start.id);
      return true;
    });
}

export function buildWarnings(snapshot, teamId) {
  const players = new Map(snapshot.players.map((p) => [p.id, p]));
  const entries = snapshot.rosters.find((r) => r.teamId === teamId)?.entries || [];
  const warnings = [];
  for (const entry of entries) {
    const player = players.get(entry.playerId);
    if (!player) continue;
    if (player.byeWeek === snapshot.currentWeek) warnings.push({ kind: "bye", player, lineupSlot: entry.lineupSlot });
    if (player.injury?.status && player.injury.status !== "ACTIVE") {
      warnings.push({ kind: "injury", player, lineupSlot: entry.lineupSlot, detail: player.injury.detail || null });
    }
  }
  return warnings;
}

export function buildLineupVacancies(snapshot, teamId) {
  const reportedSlots = (snapshot?.league?.lineupSlots || []).filter((item) => Number.isInteger(item.count) && item.count > 0);
  if (!reportedSlots.length) return Object.freeze({ status: "missing-settings", totalMissing: null, items: Object.freeze([]), limitation: "ESPN lineup-slot settings are unavailable." });
  const configuredSlots = reportedSlots.filter((item) => isStarter(item.slot));
  const unsupportedSlots = reportedSlots.filter((item) => !isStarter(item.slot) && item.slot !== "BE" && item.slot !== "IR");
  const roster = snapshot?.rosters?.find((item) => item.teamId === teamId);
  if (!roster) return Object.freeze({ status: "missing-roster", totalMissing: null, items: Object.freeze([]), limitation: "The selected roster is unavailable." });
  const actualCounts = new Map();
  for (const entry of roster.entries || []) if (isStarter(entry.lineupSlot)) actualCounts.set(entry.lineupSlot, (actualCounts.get(entry.lineupSlot) || 0) + 1);
  const items = configuredSlots.flatMap((item) => { const missingCount = Math.max(0, item.count - (actualCounts.get(item.slot) || 0)); return missingCount ? [Object.freeze({ slot: item.slot, requiredCount: item.count, filledCount: item.count - missingCount, missingCount })] : []; });
  const limitation = unsupportedSlots.length ? `Unsupported reported lineup slots were excluded: ${unsupportedSlots.map((item) => item.slot).join(", ")}.` : null;
  return Object.freeze({ status: limitation ? "partial" : "ready", totalMissing: items.reduce((total, item) => total + item.missingCount, 0), items: Object.freeze(items), limitation });
}

export function buildPrioritizedWarnings(snapshot, teamId, now = Date.now()) {
  const weights = { critical: 4, high: 3, medium: 2, unknown: 1 };
  return buildWarnings(snapshot, teamId).map((warning) => {
    const starter = isStarter(warning.lineupSlot); const kickoff = Date.parse(warning.player.gameTime); const hours = Number.isFinite(kickoff) ? (kickoff - now) / 36e5 : null;
    let urgency = "unknown";
    if (warning.kind === "bye" && starter) urgency = "high";
    else if (warning.kind === "injury" && starter && hours != null && hours <= 24) urgency = "critical";
    else if (warning.kind === "injury" && starter && hours != null && hours <= 72) urgency = "high";
    else if (starter) urgency = "medium";
    return Object.freeze({ ...warning, urgency, hoursToKickoff: hours == null ? null : Math.max(0, +hours.toFixed(1)) });
  }).sort((a, b) => weights[b.urgency] - weights[a.urgency] || (a.hoursToKickoff ?? Infinity) - (b.hoursToKickoff ?? Infinity));
}

export function assessStartSitDataConfidence(snapshot, players, now = Date.now()) {
  const limitations = []; const checks = [];
  for (const player of players) {
    checks.push(player?.projection != null, player?.injury?.status != null, Boolean(player?.opponent), Number.isFinite(Date.parse(player?.gameTime)));
    if (player?.projection == null) limitations.push(`${player?.name || "A player"} projection unavailable.`);
    if (player?.injury?.status == null) limitations.push(`${player?.name || "A player"} injury status unavailable.`);
    if (!player?.opponent) limitations.push(`${player?.name || "A player"} opponent unavailable.`);
    if (!Number.isFinite(Date.parse(player?.gameTime))) limitations.push(`${player?.name || "A player"} kickoff unavailable.`);
  }
  const captured = Date.parse(snapshot?.meta?.capturedAt); const ageMs = Number.isFinite(captured) ? Math.max(0, now - captured) : null;
  const freshness = ageMs == null ? "unknown" : ageMs <= 15 * 60_000 ? "fresh" : ageMs <= 6 * 60 * 60_000 ? "aging" : "stale";
  if (freshness !== "fresh") limitations.push(freshness === "unknown" ? "Snapshot freshness unavailable." : `Snapshot is ${freshness}.`);
  const score = Math.round((checks.filter(Boolean).length + (freshness === "fresh" ? 1 : freshness === "aging" ? 0.5 : 0)) / 9 * 100);
  return Object.freeze({ label: score >= 80 ? "High" : score >= 55 ? "Medium" : "Low", score, freshness, limitations: Object.freeze(limitations) });
}

export function compareRosterPlayers(snapshot, teamId, firstPlayerId, secondPlayerId, now = Date.now()) {
  const roster = snapshot.rosters.find((item) => item.teamId === teamId)?.entries || [];
  const rosterIds = new Set(roster.map((entry) => entry.playerId));
  if (!rosterIds.has(firstPlayerId) || !rosterIds.has(secondPlayerId)) return { status: "invalid", reason: "Both players must be on the selected roster." };
  if (firstPlayerId === secondPlayerId) return { status: "invalid", reason: "Choose two different players." };
  const players = new Map(snapshot.players.map((player) => [player.id, player]));
  const first = players.get(firstPlayerId);
  const second = players.get(secondPlayerId);
  if (!first || !second) return { status: "invalid", reason: "A selected player identity is missing." };
  const confidence = assessStartSitDataConfidence(snapshot, [first, second], now);
  if (first.projection == null || second.projection == null) return { status: "missing", first, second, confidence, reason: "A projection is missing, so no projection-based preference is available." };
  const difference = +(first.projection - second.projection).toFixed(1);
  if (Math.abs(difference) < MIN_LINEUP_GAIN) return { status: "tossup", first, second, difference, confidence, reason: "The projection difference is below the 1-point action threshold." };
  return { status: "preference", first, second, difference, preferred: difference > 0 ? first : second, confidence, reason: "Higher available projection" };
}

export function buildWaiverIdeas(snapshot, teamId) {
  if (!Array.isArray(snapshot.availablePlayers)) return { status: "missing", items: [] };
  const roster = snapshot.rosters.find((r) => r.teamId === teamId);
  if (!roster) return { status: "missing", items: [] };
  const players = new Map(snapshot.players.map((p) => [p.id, p]));
  const rosterPlayers = roster.entries.map((e) => players.get(e.playerId)).filter(Boolean);
  const candidates = snapshot.availablePlayers
    .map((id) => players.get(id))
    .filter((p) => p?.projection != null)
    .flatMap((add) => rosterPlayers
      .filter((drop) => drop.position === add.position && drop.projection != null && add.projection - drop.projection >= MIN_WAIVER_GAIN)
      .map((drop) => ({ add, drop, gain: +(add.projection - drop.projection).toFixed(1) })))
    .sort((a, b) => b.gain - a.gain);
  const usedAdds = new Set();
  const usedDrops = new Set();
  const items = candidates.filter((candidate) => {
    if (usedAdds.has(candidate.add.id) || usedDrops.has(candidate.drop.id)) return false;
    usedAdds.add(candidate.add.id);
    usedDrops.add(candidate.drop.id);
    return true;
  }).slice(0, 8);
  return { status: "available", items };
}
