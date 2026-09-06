const DISPLAY_POSITIONS = Object.freeze(["QB", "RB", "WR", "TE", "K", "D/ST"]);
const SIGNAL_THRESHOLD = 0.5;
const DISPLAY_LIMIT = 3;

function roundedDelta(value) {
  return +value.toFixed(1);
}

function signalFor(delta) {
  if (delta == null) return "unknown";
  if (delta >= SIGNAL_THRESHOLD) return "better";
  if (delta <= -SIGNAL_THRESHOLD) return "below";
  return "similar";
}

function compareProjectedPlayers(left, right) {
  return right.projection - left.projection
    || String(left.name || "").localeCompare(String(right.name || ""))
    || String(left.id || "").localeCompare(String(right.id || ""));
}

function weakestProjectedRosterPlayer(entries, players, position) {
  return entries
    .map((entry) => players.get(entry.playerId))
    .filter((player) => player?.position === position && player.projection != null)
    .sort((left, right) => left.projection - right.projection
      || String(left.name || "").localeCompare(String(right.name || ""))
      || String(left.id || "").localeCompare(String(right.id || "")))[0] || null;
}

export function buildWaiverPositionBoard(snapshot, teamId) {
  if (!Array.isArray(snapshot?.availablePlayers)) {
    return Object.freeze({ status: "missing-availability", positions: Object.freeze([]), totalAvailable: 0, totalProjected: 0, displayLimit: DISPLAY_LIMIT });
  }

  const roster = snapshot?.rosters?.find((item) => item.teamId === teamId);
  if (!roster) {
    return Object.freeze({ status: "missing-roster", positions: Object.freeze([]), totalAvailable: 0, totalProjected: 0, displayLimit: DISPLAY_LIMIT });
  }

  const players = new Map((snapshot.players || []).map((player) => [player.id, player]));
  const rosterIds = new Set((roster.entries || []).map((entry) => entry.playerId));
  const activeRosterEntries = (roster.entries || []).filter((entry) => entry.lineupSlot !== "IR");
  const availablePlayers = [...new Set(snapshot.availablePlayers)]
    .map((playerId) => players.get(playerId))
    .filter((player) => player && !rosterIds.has(player.id));

  let totalAvailable = 0;
  let totalProjected = 0;
  const positions = DISPLAY_POSITIONS.map((position) => {
    const allAtPosition = availablePlayers.filter((player) => player.position === position);
    const projectedAtPosition = allAtPosition.filter((player) => player.projection != null).sort(compareProjectedPlayers);
    const baselinePlayer = weakestProjectedRosterPlayer(activeRosterEntries, players, position);
    totalAvailable += allAtPosition.length;
    totalProjected += projectedAtPosition.length;

    const baseline = baselinePlayer ? Object.freeze({
      status: "ready",
      playerId: baselinePlayer.id,
      name: baselinePlayer.name,
      projection: baselinePlayer.projection
    }) : Object.freeze({ status: "unavailable", playerId: null, name: null, projection: null });

    const items = projectedAtPosition.slice(0, DISPLAY_LIMIT).map((player, index) => {
      const delta = baselinePlayer ? roundedDelta(player.projection - baselinePlayer.projection) : null;
      return Object.freeze({
        rank: index + 1,
        player,
        delta,
        signal: signalFor(delta),
        baseline
      });
    });

    return Object.freeze({
      position,
      totalAvailable: allAtPosition.length,
      projectedAvailable: projectedAtPosition.length,
      baseline,
      items: Object.freeze(items)
    });
  });

  return Object.freeze({
    status: "ready",
    source: "ESPN current-week projection",
    comparison: "lowest projected non-IR rostered player at the same listed position",
    signalThreshold: SIGNAL_THRESHOLD,
    displayLimit: DISPLAY_LIMIT,
    totalAvailable,
    totalProjected,
    positions: Object.freeze(positions)
  });
}

export const WAIVER_POSITION_BOARD_POSITIONS = DISPLAY_POSITIONS;
export const WAIVER_POSITION_SIGNAL_THRESHOLD = SIGNAL_THRESHOLD;
