const EXPECTED_HEADERS = ["RK", "PLAYER NAME", "TEAM", "POS"];

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') { field += '"'; index += 1; }
      else quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(field); field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field); field = "";
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
    } else field += character;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function parseStars(value) {
  const match = String(value || "").match(/^([1-5]) out of 5 stars$/);
  return match ? Number(match[1]) : null;
}

function parsePosition(value) {
  const match = String(value || "").match(/^(QB|RB|WR|TE|K|DST)(\d+)$/);
  return match ? { position: match[1], positionRank: Number(match[2]) } : null;
}

export function parseFantasyProsRankingsCsv(text, metadata = {}) {
  const rows = parseCsvRows(String(text || ""));
  if (rows.length < 2) throw new Error("FantasyPros rankings CSV is empty.");
  const headers = rows[0].map((header) => header.trim());
  for (const header of EXPECTED_HEADERS) {
    if (!headers.includes(header)) throw new Error(`FantasyPros rankings CSV is missing ${header}.`);
  }
  const get = (row, header) => row[headers.indexOf(header)]?.trim() || "";
  const rankings = rows.slice(1).map((row, index) => {
    const rank = Number(get(row, "RK"));
    const parsedPosition = parsePosition(get(row, "POS"));
    if (!Number.isInteger(rank) || rank < 1) throw new Error(`Invalid overall rank on CSV row ${index + 2}.`);
    if (!parsedPosition) throw new Error(`Invalid position rank on CSV row ${index + 2}.`);
    const ecrVsAdpText = get(row, "ECR VS. ADP");
    const ecrVsAdp = /^[-+]?\d+$/.test(ecrVsAdpText) ? Number(ecrVsAdpText) : null;
    return Object.freeze({
      rank,
      playerName: get(row, "PLAYER NAME"),
      team: get(row, "TEAM"),
      ...parsedPosition,
      seasonScheduleStrength: parseStars(get(row, "SOS SEASON")),
      playoffScheduleStrength: parseStars(get(row, "SOS PLAYOFFS")),
      ecrVsAdp
    });
  });
  if (new Set(rankings.map((item) => item.rank)).size !== rankings.length) throw new Error("FantasyPros rankings CSV contains duplicate overall ranks.");
  return Object.freeze({
    source: "fantasypros",
    kind: metadata.kind || "unknown",
    season: Number(metadata.season) || null,
    scoringFormat: metadata.scoringFormat || null,
    expertFilter: metadata.expertFilter || null,
    importedAt: metadata.importedAt || new Date().toISOString(),
    rankings: Object.freeze(rankings)
  });
}

export function validateFantasyProsRankingUsage(set) {
  const limitations = [];
  if (set.kind !== "rest-of-season") limitations.push("This file is not identified as a rest-of-season export.");
  if (!set.scoringFormat) limitations.push("Scoring format is not recorded in the CSV.");
  if (!set.expertFilter) limitations.push("The selected experts are not recorded in the CSV.");
  limitations.push("FantasyPros player IDs are absent; records require explicit reconciliation before recommendations can use them.");
  return limitations;
}

