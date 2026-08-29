export function parseCsvRows(text) {
  const rows = []; let row = []; let field = ""; let quoted = false;
  for (let index = 0; index < String(text || "").length; index += 1) {
    const character = text[index];
    if (quoted && character === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (!quoted && character === ",") { row.push(field); field = ""; }
    else if (!quoted && (character === "\n" || character === "\r")) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += character;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  if (quoted) throw new Error("FantasyPros CSV contains an unterminated quoted field.");
  return rows;
}

function clean(value) { return String(value ?? "").replaceAll("\u00a0", " ").trim(); }

export function parseFantasyProsManualProjectionCsv(text, { sourceFile, position }) {
  const rows = parseCsvRows(text);
  if (rows.length < 2) throw new Error(`${sourceFile} is empty.`);
  const headers = rows[0].map((value) => clean(value).toUpperCase());
  const playerIndex = headers.indexOf("PLAYER"); const teamIndex = headers.indexOf("TEAM"); const positionIndex = headers.indexOf("POS"); const pointsIndex = headers.lastIndexOf("FPTS");
  if (playerIndex < 0 || teamIndex < 0 || pointsIndex < 0) throw new Error(`${sourceFile} must include Player, Team, and FPTS columns.`);
  const records = []; const exclusions = [];
  for (let index = 1; index < rows.length; index += 1) {
    const values = rows[index]; const playerName = clean(values[playerIndex]); const team = clean(values[teamIndex]); const pointsText = clean(values[pointsIndex]);
    if (!playerName && !pointsText) continue;
    const points = Number(pointsText);
    if (!playerName) { exclusions.push(Object.freeze({ sourceRow: index + 1, reason: "missing-player-label" })); continue; }
    if (!pointsText || !Number.isFinite(points) || points < 0) { exclusions.push(Object.freeze({ sourceRow: index + 1, reason: "invalid-fpts" })); continue; }
    const listedPosition = positionIndex >= 0 ? clean(values[positionIndex]).replace(/\d+$/, "") : "";
    records.push(Object.freeze({ sourceFile, sourceRow: index + 1, playerName, team: team || null, position: listedPosition || position, points, fantasyProsPlayerId: null, espnPlayerId: null }));
  }
  if (!records.length) throw new Error(`${sourceFile} contains no usable projection rows.`);
  return Object.freeze({ records: Object.freeze(records), exclusions: Object.freeze(exclusions) });
}

function csvCell(value) { const string = value == null ? "" : String(value); return /[",\r\n]/.test(string) ? `"${string.replaceAll('"', '""')}"` : string; }

export function manualProjectionReviewToCsv(records, metadata) {
  const header = ["provider", "scoring_format", "season", "week", "retrieved_at", "source_file", "source_row", "fantasypros_player_id", "espn_player_id", "player_name_for_review_only", "team_for_review_only", "position_for_review_only", "points"];
  const rows = records.map((item) => ["FantasyPros manual CSV", metadata.scoringFormat, metadata.season, metadata.week, metadata.retrievedAt, item.sourceFile, item.sourceRow, "", "", item.playerName, item.team, item.position, item.points]);
  return `${[header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

export function finalizeManualProjectionReview(text) {
  const rows = parseCsvRows(text);
  if (rows.length < 2) throw new Error("Manual projection review CSV is empty.");
  const headers = rows[0].map((value) => clean(value).toLowerCase());
  const required = ["provider", "scoring_format", "season", "week", "retrieved_at", "fantasypros_player_id", "espn_player_id", "points"];
  for (const name of required) if (!headers.includes(name)) throw new Error(`Manual projection review CSV is missing ${name}.`);
  const at = (row, name) => clean(row[headers.indexOf(name)]);
  const completed = []; let skipped = 0;
  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index];
    if (!row.some((value) => clean(value))) continue;
    const providerPlayerId = at(row, "fantasypros_player_id"); const espnPlayerId = at(row, "espn_player_id");
    if (!providerPlayerId && !espnPlayerId) { skipped += 1; continue; }
    if (!providerPlayerId || !espnPlayerId) throw new Error(`Manual projection review row ${index + 1} has only one player ID. Provide both IDs or leave both blank.`);
    const season = Number(at(row, "season")); const week = Number(at(row, "week")); const pointsText = at(row, "points"); const points = Number(pointsText);
    if (!Number.isInteger(season) || season < 2000 || season > 2100) throw new Error(`Manual projection review row ${index + 1} has an invalid season.`);
    if (!Number.isInteger(week) || week < 1 || week > 18) throw new Error(`Manual projection review row ${index + 1} has an invalid week.`);
    if (!pointsText || !Number.isFinite(points) || points < 0) throw new Error(`Manual projection review row ${index + 1} has invalid points.`);
    const capturedAt = at(row, "retrieved_at"); if (!capturedAt || !Number.isFinite(Date.parse(capturedAt))) throw new Error(`Manual projection review row ${index + 1} has an invalid retrieved_at value.`);
    completed.push(Object.freeze({ provider: at(row, "provider"), scoringFormat: at(row, "scoring_format"), season, week, capturedAt, providerPlayerId, espnPlayerId, points }));
  }
  if (!completed.length) throw new Error("No approved mappings were found. Fill both player-ID columns for at least one row.");
  const metadata = completed.map((item) => JSON.stringify([item.provider, item.scoringFormat, item.season, item.capturedAt]));
  if (new Set(metadata).size !== 1) throw new Error("Approved rows must use identical source metadata.");
  if (new Set(completed.map((item) => `${item.providerPlayerId}:${item.week}`)).size !== completed.length) throw new Error("Approved rows contain duplicate FantasyPros player-week records.");
  const identityPairs = [...new Map(completed.map((item) => [item.providerPlayerId, item.espnPlayerId])).entries()];
  for (const [providerPlayerId, espnPlayerId] of identityPairs) {
    if (completed.some((item) => item.providerPlayerId === providerPlayerId && item.espnPlayerId !== espnPlayerId)) throw new Error(`FantasyPros ID ${providerPlayerId} maps to more than one ESPN player.`);
  }
  if (new Set(identityPairs.map(([, espnPlayerId]) => espnPlayerId)).size !== identityPairs.length) throw new Error("More than one FantasyPros ID maps to the same ESPN player.");
  const first = completed[0];
  const projectionRows = [["provider", "scoring_format", "season", "captured_at", "provider_player_id", "week", "points"], ...completed.map((item) => [item.provider, item.scoringFormat, item.season, item.capturedAt, item.providerPlayerId, item.week, item.points])];
  const identityRows = [["provider_player_id", "espn_player_id"], ...identityPairs];
  return Object.freeze({ approvedCount: completed.length, skippedCount: skipped, provider: first.provider, season: first.season, week: first.week, projectionsCsv: `${projectionRows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`, identityMapCsv: `${identityRows.map((row) => row.map(csvCell).join(",")).join("\n")}\n` });
}
