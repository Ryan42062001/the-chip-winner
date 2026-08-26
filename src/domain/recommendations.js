import { isStarter } from "./model.js";

const FLEX_POSITIONS = new Set(["RB", "WR", "TE"]);

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
      if (alternative.projection > starter.projection) {
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

export function buildWaiverIdeas(snapshot, teamId) {
  if (!Array.isArray(snapshot.availablePlayers)) return { status: "missing", items: [] };
  const roster = snapshot.rosters.find((r) => r.teamId === teamId);
  if (!roster) return { status: "missing", items: [] };
  const players = new Map(snapshot.players.map((p) => [p.id, p]));
  const rosterPlayers = roster.entries.map((e) => players.get(e.playerId)).filter(Boolean);
  const items = snapshot.availablePlayers
    .map((id) => players.get(id))
    .filter((p) => p?.projection != null)
    .map((add) => {
      const drops = rosterPlayers
        .filter((drop) => drop.position === add.position && drop.projection != null)
        .sort((a, b) => a.projection - b.projection);
      const drop = drops[0];
      return drop && add.projection > drop.projection
        ? { add, drop, gain: +(add.projection - drop.projection).toFixed(1) }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.gain - a.gain);
  return { status: "available", items };
}
