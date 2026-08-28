const POINT_FIELDS = Object.freeze({ PPR: "points_ppr", HALF: "points_half", STD: "points" });

function text(value) { return typeof value === "string" || typeof value === "number" ? String(value).trim() : ""; }

function playerRows(payload) {
  const rows = payload?.players ?? payload?.player;
  return Array.isArray(rows) ? rows : [];
}

function playerStats(player) {
  if (Array.isArray(player?.stats)) return player.stats[0] || null;
  return player?.stats && typeof player.stats === "object" ? player.stats : null;
}

export function normalizeFantasyProsProjectionResponses(responses, { season, week, scoring, capturedAt }) {
  const scoringFormat = text(scoring).toUpperCase();
  const pointField = POINT_FIELDS[scoringFormat];
  if (!pointField) throw new Error("FantasyPros scoring must be PPR, HALF, or STD.");
  if (!Number.isInteger(season) || season < 2000 || season > 2100) throw new Error("FantasyPros season is invalid.");
  if (!Number.isInteger(week) || week < 1 || week > 18) throw new Error("FantasyPros week is invalid.");
  if (!capturedAt || !Number.isFinite(Date.parse(capturedAt))) throw new Error("FantasyPros response capture time is unavailable.");
  const projections = new Map(); const identities = new Map(); const exclusions = [];
  for (const payload of responses || []) {
    if (payload?.season != null && Number(payload.season) !== season) throw new Error(`FantasyPros response season ${payload.season} does not match requested season ${season}.`);
    if (payload?.week != null && Number(payload.week) !== week) throw new Error(`FantasyPros response week ${payload.week} does not match requested week ${week}.`);
    if (payload?.scoring && text(payload.scoring).toUpperCase() !== scoringFormat) throw new Error(`FantasyPros response scoring ${payload.scoring} does not match requested scoring ${scoringFormat}.`);
    for (const player of playerRows(payload)) {
      const providerPlayerId = text(player.fpid ?? player.player_id);
      if (!providerPlayerId) { exclusions.push(Object.freeze({ reason: "missing-provider-player-id" })); continue; }
      const points = Number(playerStats(player)?.[pointField]);
      if (!Number.isFinite(points) || points < 0) { exclusions.push(Object.freeze({ providerPlayerId, reason: `missing-${pointField}` })); continue; }
      const prior = projections.get(providerPlayerId);
      if (prior && prior.points !== points) throw new Error(`FantasyPros returned conflicting Week ${week} values for player ${providerPlayerId}.`);
      projections.set(providerPlayerId, Object.freeze({ providerPlayerId, week, points }));
      identities.set(providerPlayerId, Object.freeze({ providerPlayerId, playerName: text(player.name ?? player.player_name) || null, team: text(player.team_id ?? player.player_team_id) || null, position: text(player.position_id ?? player.position) || null }));
    }
  }
  if (!projections.size) throw new Error("FantasyPros returned no usable projections with provider player IDs and explicit fantasy points.");
  return Object.freeze({
    projectionSet: Object.freeze({ provider: "FantasyPros API", scoringFormat, season, capturedAt: new Date(capturedAt).toISOString(), projections: Object.freeze([...projections.values()]) }),
    identities: Object.freeze([...identities.values()]),
    exclusions: Object.freeze(exclusions)
  });
}

function csvCell(value) { const string = value == null ? "" : String(value); return /[",\r\n]/.test(string) ? `"${string.replaceAll('"', '""')}"` : string; }
function csv(rows) { return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`; }

export function projectionSetToCsv(set) {
  return csv([["provider", "scoring_format", "season", "captured_at", "provider_player_id", "week", "points"], ...set.projections.map((item) => [set.provider, set.scoringFormat, set.season, set.capturedAt, item.providerPlayerId, item.week, item.points])]);
}

export function identityReferenceToCsv(identities) {
  return csv([["provider_player_id", "espn_player_id", "player_name_for_review_only", "team_for_review_only", "position_for_review_only"], ...identities.map((item) => [item.providerPlayerId, "", item.playerName, item.team, item.position])]);
}

export function normalizeFantasyProsPlayerDirectory(payload) {
  const rows = playerRows(payload); const players = []; const seen = new Set(); const exclusions = [];
  for (const player of rows) {
    const providerPlayerId = text(player.player_id ?? player.fpid);
    if (!providerPlayerId) { exclusions.push(Object.freeze({ reason: "missing-provider-player-id" })); continue; }
    if (seen.has(providerPlayerId)) throw new Error(`FantasyPros player directory contains duplicate provider ID ${providerPlayerId}.`);
    seen.add(providerPlayerId);
    players.push(Object.freeze({ providerPlayerId, playerName: text(player.player_name ?? player.name) || null, team: text(player.team_id ?? player.player_team_id) || null, position: text(player.position_id ?? player.position) || null }));
  }
  if (!players.length) throw new Error("FantasyPros returned no player-directory records with provider IDs.");
  return Object.freeze({ players: Object.freeze(players), exclusions: Object.freeze(exclusions) });
}

export function playerDirectoryToCsv(players) {
  return csv([["fantasypros_player_id", "player_name_for_review_only", "team_for_review_only", "position_for_review_only"], ...players.map((item) => [item.providerPlayerId, item.playerName, item.team, item.position])]);
}
