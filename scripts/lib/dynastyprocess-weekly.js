import { parseCsvRows } from "./fantasypros-manual-csv.js";

export const DYNASTYPROCESS_WEEKLY_PROVIDER = "FantasyPros weekly r2p via DynastyProcess";
export const DYNASTYPROCESS_WEEKLY_SCORING = "PPR";

const EXPECTED_PAGE_BY_POSITION = Object.freeze({
  QB: "qb",
  RB: "ppr-rb",
  WR: "ppr-wr",
  TE: "ppr-te",
  K: "k",
  DST: "dst",
  "D/ST": "dst"
});

function clean(value) { return String(value ?? "").replaceAll("\u00a0", " ").trim(); }
function cleanId(value) {
  const normalized = clean(value);
  return !normalized || ["NA", "N/A", "NULL"].includes(normalized.toUpperCase()) ? null : normalized;
}
function csvCell(value) {
  const string = value == null ? "" : String(value);
  return /[",\r\n]/.test(string) ? `"${string.replaceAll('"', '""')}"` : string;
}
function csvText(rows) { return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`; }
function headerIndex(headers, name) {
  const index = headers.indexOf(name);
  if (index < 0) throw new Error(`DynastyProcess CSV is missing ${name}.`);
  return index;
}

export function parseDynastyProcessWeeklyCsv(text) {
  const rows = parseCsvRows(text);
  if (rows.length < 2) throw new Error("DynastyProcess weekly CSV is empty.");
  const headers = rows[0].map((value) => clean(value).toLowerCase());
  const pageIndex = headerIndex(headers, "page");
  const dateIndex = headerIndex(headers, "scrape_date");
  const idIndex = headerIndex(headers, "fantasypros_id");
  const posIndex = headerIndex(headers, "pos");
  const pointsIndex = headerIndex(headers, "r2p_pts");
  const records = []; const exclusions = [];
  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index]; if (!row.some((value) => clean(value))) continue;
    const position = clean(row[posIndex]).toUpperCase();
    const page = clean(row[pageIndex]).toLowerCase();
    if (!EXPECTED_PAGE_BY_POSITION[position] || page !== EXPECTED_PAGE_BY_POSITION[position]) continue;
    const providerPlayerId = cleanId(row[idIndex]);
    const pointsText = clean(row[pointsIndex]); const points = Number(pointsText);
    const sourceDate = clean(row[dateIndex]);
    if (!providerPlayerId) { exclusions.push(Object.freeze({ sourceRow: index + 1, reason: "missing-fantasypros-id" })); continue; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(sourceDate) || !Number.isFinite(Date.parse(`${sourceDate}T00:00:00Z`))) {
      exclusions.push(Object.freeze({ sourceRow: index + 1, providerPlayerId, reason: "invalid-scrape-date" })); continue;
    }
    if (!pointsText || !Number.isFinite(points) || points < 0) {
      exclusions.push(Object.freeze({ sourceRow: index + 1, providerPlayerId, reason: "invalid-r2p-points" })); continue;
    }
    records.push(Object.freeze({ providerPlayerId, position, points, sourceDate }));
  }
  if (!records.length) throw new Error("DynastyProcess weekly CSV contains no usable PPR weekly estimates.");
  const sourceDates = new Set(records.map((item) => item.sourceDate));
  if (sourceDates.size !== 1) throw new Error("DynastyProcess weekly CSV contains mixed scrape dates.");
  const providerIds = records.map((item) => item.providerPlayerId);
  if (new Set(providerIds).size !== providerIds.length) throw new Error("DynastyProcess weekly CSV contains duplicate FantasyPros IDs in supported PPR pages.");
  return Object.freeze({ sourceDate: records[0].sourceDate, records: Object.freeze(records), exclusions: Object.freeze(exclusions) });
}

export function parseDynastyProcessPlayerIdsCsv(text) {
  const rows = parseCsvRows(text);
  if (rows.length < 2) throw new Error("DynastyProcess player-ID CSV is empty.");
  const headers = rows[0].map((value) => clean(value).toLowerCase());
  const fantasyProsIndex = headerIndex(headers, "fantasypros_id");
  const espnIndex = headerIndex(headers, "espn_id");
  const byProvider = new Map(); const byEspn = new Map(); let skippedCount = 0;
  for (let index = 1; index < rows.length; index += 1) {
    const providerPlayerId = cleanId(rows[index][fantasyProsIndex]);
    const espnPlayerId = cleanId(rows[index][espnIndex]);
    if (!providerPlayerId || !espnPlayerId) { skippedCount += 1; continue; }
    const existingEspn = byProvider.get(providerPlayerId);
    if (existingEspn && existingEspn !== espnPlayerId) throw new Error(`FantasyPros ID ${providerPlayerId} maps to more than one ESPN player in DynastyProcess.`);
    const existingProvider = byEspn.get(espnPlayerId);
    if (existingProvider && existingProvider !== providerPlayerId) throw new Error(`ESPN ID ${espnPlayerId} maps to more than one FantasyPros player in DynastyProcess.`);
    byProvider.set(providerPlayerId, espnPlayerId); byEspn.set(espnPlayerId, providerPlayerId);
  }
  if (!byProvider.size) throw new Error("DynastyProcess player-ID CSV contains no usable FantasyPros-to-ESPN mappings.");
  return Object.freeze({ map: byProvider, skippedCount });
}

export function buildDynastyProcessWeeklyBundle({ weeklyCsv, playerIdsCsv, season, week, publishedAt }) {
  if (!Number.isInteger(season) || season < 2000 || season > 2100) throw new Error("A valid four-digit season is required.");
  if (!Number.isInteger(week) || week < 1 || week > 18) throw new Error("An explicit NFL week from 1 through 18 is required because the source file does not publish a week column.");
  if (!publishedAt || !Number.isFinite(Date.parse(publishedAt))) throw new Error("A valid DynastyProcess publication timestamp is required.");
  const weekly = parseDynastyProcessWeeklyCsv(weeklyCsv);
  if (Number(weekly.sourceDate.slice(0, 4)) !== season) throw new Error(`DynastyProcess scrape date ${weekly.sourceDate} does not match requested season ${season}.`);
  const playerIds = parseDynastyProcessPlayerIdsCsv(playerIdsCsv);
  const mapped = []; const unresolvedProviderIds = [];
  for (const item of weekly.records) {
    const espnPlayerId = playerIds.map.get(item.providerPlayerId);
    if (!espnPlayerId) { unresolvedProviderIds.push(item.providerPlayerId); continue; }
    mapped.push(Object.freeze({ ...item, espnPlayerId }));
  }
  if (!mapped.length) throw new Error("No DynastyProcess weekly estimates could be mapped to ESPN by stable IDs.");
  const projectionRows = [["provider", "scoring_format", "season", "captured_at", "provider_player_id", "week", "points"]];
  const identityRows = [["provider_player_id", "espn_player_id"]];
  for (const item of mapped) {
    projectionRows.push([DYNASTYPROCESS_WEEKLY_PROVIDER, DYNASTYPROCESS_WEEKLY_SCORING, season, publishedAt, item.providerPlayerId, week, item.points]);
    identityRows.push([item.providerPlayerId, item.espnPlayerId]);
  }
  return Object.freeze({
    provider: DYNASTYPROCESS_WEEKLY_PROVIDER,
    scoringFormat: DYNASTYPROCESS_WEEKLY_SCORING,
    season,
    week,
    sourceDate: weekly.sourceDate,
    publishedAt: new Date(publishedAt).toISOString(),
    sourceRecordCount: weekly.records.length,
    mappedCount: mapped.length,
    unresolvedProviderIds: Object.freeze(unresolvedProviderIds),
    excludedSourceRows: weekly.exclusions,
    skippedPlayerIdRows: playerIds.skippedCount,
    projectionsCsv: csvText(projectionRows),
    identityMapCsv: csvText(identityRows)
  });
}
