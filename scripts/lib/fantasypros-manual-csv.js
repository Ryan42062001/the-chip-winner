function parseCsvRows(text) {
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
