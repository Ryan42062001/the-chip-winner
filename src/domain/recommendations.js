import { isStarter } from "./model.js";

const FLEX_POSITIONS = new Set(["RB", "WR", "TE"]);
const MIN_LINEUP_GAIN = 1;
const MIN_WAIVER_GAIN = 0.5;

export function canFillSlot(player, slot) {
  if (slot === "FLEX") return FLEX_POSITIONS.has(player.position);
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

export function compareRosterPlayers(snapshot, teamId, firstPlayerId, secondPlayerId) {
  const roster = snapshot.rosters.find((item) => item.teamId === teamId)?.entries || [];
  const rosterIds = new Set(roster.map((entry) => entry.playerId));
  if (!rosterIds.has(firstPlayerId) || !rosterIds.has(secondPlayerId)) return { status: "invalid", reason: "Both players must be on the selected roster." };
  if (firstPlayerId === secondPlayerId) return { status: "invalid", reason: "Choose two different players." };
  const players = new Map(snapshot.players.map((player) => [player.id, player]));
  const first = players.get(firstPlayerId);
  const second = players.get(secondPlayerId);
  if (!first || !second) return { status: "invalid", reason: "A selected player identity is missing." };
  if (first.projection == null || second.projection == null) return { status: "missing", first, second, reason: "A projection is missing, so no projection-based preference is available." };
  const difference = +(first.projection - second.projection).toFixed(1);
  if (Math.abs(difference) < MIN_LINEUP_GAIN) return { status: "tossup", first, second, difference, reason: "The projection difference is below the 1-point action threshold." };
  return { status: "preference", first, second, difference, preferred: difference > 0 ? first : second, reason: "Higher available projection" };
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
