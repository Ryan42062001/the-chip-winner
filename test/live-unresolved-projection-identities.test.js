import test from "node:test";
import assert from "node:assert/strict";
import { buildDynastyProcessWeeklyBundle } from "../scripts/lib/dynastyprocess-weekly.js";
import { parseCsvRows } from "../scripts/lib/fantasypros-manual-csv.js";

const WEEKLY_URL = "https://raw.githubusercontent.com/dynastyprocess/data/master/files/fp_latest_weekly.csv";
const IDS_URL = "https://raw.githubusercontent.com/dynastyprocess/data/master/files/db_playerids.csv";
const MISSING_IDS_URL = "https://raw.githubusercontent.com/dynastyprocess/data/master/files/missing_ids.json";
const ESPN_URL = "https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2026/segments/0/leaguedefaults/1?view=kona_player_info&scoringPeriodId=1";

const ESPN_POSITION_ID = Object.freeze({ QB: 1, RB: 2, WR: 3, TE: 4, K: 5 });
const ESPN_TEAM_ID = Object.freeze({
  ATL:1, BUF:2, CHI:3, CIN:4, CLE:5, DAL:6, DEN:7, DET:8, GB:9, TEN:10, IND:11, KC:12, LV:13, LAR:14,
  MIA:15, MIN:16, NE:17, NO:18, NYG:19, NYJ:20, PHI:21, ARI:22, PIT:23, LAC:24, SF:25, SEA:26, TB:27,
  WSH:28, WAS:28, CAR:29, JAX:30, JAC:30, BAL:33, HOU:34
});

function clean(value) { return String(value ?? "").replaceAll("\u00a0", " ").trim(); }
function normalizeName(value) { return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function lastNameToken(value) { return normalizeName(value).split(" ").at(-1) || ""; }
function table(text) {
  const rows = parseCsvRows(text);
  const headers = rows[0].map((value) => clean(value).toLowerCase());
  return { headers, rows: rows.slice(1) };
}
function rowObject(headers, row, selectedHeaders) {
  return Object.fromEntries(selectedHeaders.map((header) => [header, clean(row[headers.indexOf(header)]) || null]));
}
function unwrapPlayer(entry) { return entry?.player || entry?.playerPoolEntry?.player || entry; }
function inspectEspnPlayer(player) {
  return Object.fromEntries(Object.entries(player || {}).filter(([key]) => /(id|uid|guid|name|team|position|active|universe)/i.test(key)));
}

async function getText(url, headers = {}) {
  const response = await fetch(url, { headers: { "user-agent": "the-chip-winner-unresolved-identity-diagnostic", ...headers } });
  assert.equal(response.ok, true, `${url} returned ${response.status}`);
  return response.text();
}
async function sourceData() {
  const [weeklyCsv, playerIdsCsv] = await Promise.all([getText(WEEKLY_URL), getText(IDS_URL)]);
  const bundle = buildDynastyProcessWeeklyBundle({ weeklyCsv, playerIdsCsv, season: 2026, week: 1, publishedAt: new Date().toISOString() });
  return { weeklyCsv, playerIdsCsv, bundle };
}

function unresolvedDetails(weeklyCsv, playerIdsCsv, bundle) {
  const unresolved = new Set(bundle.unresolvedProviderIds);
  const weekly = table(weeklyCsv);
  const ids = table(playerIdsCsv);
  const weeklyIdIndex = weekly.headers.indexOf("fantasypros_id");
  const idsIdIndex = ids.headers.indexOf("fantasypros_id");
  assert.ok(weeklyIdIndex >= 0);
  assert.ok(idsIdIndex >= 0);
  const weeklyFields = weekly.headers.filter((header) => /(^|_)(player|name|team|pos|position|page|id)(_|$)/.test(header));
  const idFields = ids.headers.filter((header) => /(^|_)(player|name|team|pos|position|id)(_|$)/.test(header));
  const byPosition = {};
  const details = [];
  for (const providerId of unresolved) {
    const weeklyRows = weekly.rows.filter((row) => clean(row[weeklyIdIndex]) === providerId);
    const idRows = ids.rows.filter((row) => clean(row[idsIdIndex]) === providerId);
    const weeklyObject = weeklyRows[0] ? rowObject(weekly.headers, weeklyRows[0], weeklyFields) : null;
    const position = weeklyObject?.pos || weeklyObject?.position || "UNKNOWN";
    byPosition[position] = (byPosition[position] || 0) + 1;
    details.push({ fantasypros_id: providerId, weekly: weeklyObject, playerIdRows: idRows.map((row) => rowObject(ids.headers, row, idFields)) });
  }
  return { weeklyFields, idFields, byPosition, details };
}

async function liveEspnPlayers() {
  const espnText = await getText(ESPN_URL, { "x-fantasy-filter": JSON.stringify({ players: { limit: 5000, sortPercOwned: { sortPriority: 1, sortAsc: false } } }) });
  const payload = JSON.parse(espnText);
  const entries = Array.isArray(payload?.players) ? payload.players : Array.isArray(payload) ? payload : [];
  return entries.map(unwrapPlayer).filter(Boolean);
}
function candidatePlayers(report, players) {
  return report.details.map((detail) => {
    const source = detail.weekly || {};
    const positionId = ESPN_POSITION_ID[source.pos];
    const teamId = ESPN_TEAM_ID[source.team] || null;
    const sourceLast = lastNameToken(source.player_name);
    const candidates = players.filter((player) => {
      if (Number(player.defaultPositionId) !== positionId) return false;
      if (teamId && Number(player.proTeamId) !== teamId) return false;
      const espnLast = lastNameToken(player.fullName || `${player.firstName || ""} ${player.lastName || ""}`);
      return sourceLast && espnLast === sourceLast;
    });
    return { detail, candidates };
  });
}

test("TEMPORARY classify every unresolved DynastyProcess weekly identity", { timeout: 120_000 }, async () => {
  const { weeklyCsv, playerIdsCsv, bundle } = await sourceData();
  const report = unresolvedDetails(weeklyCsv, playerIdsCsv, bundle);
  console.log(`UNRESOLVED_IDENTITY_HEADERS ${JSON.stringify({ weeklyFields: report.weeklyFields, idFields: report.idFields })}`);
  console.log(`UNRESOLVED_IDENTITY_SUMMARY ${JSON.stringify({ sourceRecordCount: bundle.sourceRecordCount, mappedCount: bundle.mappedCount, unresolvedCount: report.details.length, byPosition: report.byPosition, skippedPlayerIdRows: bundle.skippedPlayerIdRows })}`);
  for (const detail of report.details) console.log(`UNRESOLVED_IDENTITY ${JSON.stringify(detail)}`);
  assert.equal(report.details.length, bundle.unresolvedProviderIds.length);
});

test("TEMPORARY inspect live ESPN candidates for unresolved identities", { timeout: 120_000 }, async () => {
  const [{ weeklyCsv, playerIdsCsv, bundle }, players] = await Promise.all([sourceData(), liveEspnPlayers()]);
  const report = unresolvedDetails(weeklyCsv, playerIdsCsv, bundle);
  console.log(`ESPN_PLAYER_SHAPE_KEYS ${JSON.stringify(Object.keys(players[0] || {}).sort())}`);
  const candidateReport = candidatePlayers(report, players);
  const uniqueCandidateCount = candidateReport.filter((item) => item.candidates.length === 1).length;
  for (const { detail, candidates } of candidateReport) {
    const source = detail.weekly || {};
    console.log(`ESPN_UNRESOLVED_CANDIDATE ${JSON.stringify({ fantasypros_id: detail.fantasypros_id, source: { name: source.player_name, pos: source.pos, team: source.team, rank: source.pos_rank, owned: source.player_owned_avg }, candidateCount: candidates.length, candidates: candidates.map(inspectEspnPlayer) })}`);
  }
  console.log(`ESPN_UNRESOLVED_CANDIDATE_SUMMARY ${JSON.stringify({ unresolvedCount: report.details.length, uniqueCandidateCount, espnPoolCount: players.length })}`);
});

test("TEMPORARY inspect DynastyProcess partial missing-id records", { timeout: 120_000 }, async () => {
  const [{ weeklyCsv, playerIdsCsv, bundle }, players, missingIdsText] = await Promise.all([sourceData(), liveEspnPlayers(), getText(MISSING_IDS_URL)]);
  const report = unresolvedDetails(weeklyCsv, playerIdsCsv, bundle);
  const candidateReport = candidatePlayers(report, players);
  const missingIds = JSON.parse(missingIdsText);
  assert.ok(Array.isArray(missingIds));

  const directFantasyProsMatches = report.details.map((detail) => ({
    fantasypros_id: detail.fantasypros_id,
    rows: missingIds.filter((row) => clean(row?.fantasypros_id) === detail.fantasypros_id)
  })).filter((item) => item.rows.length);
  console.log(`PARTIAL_ID_FANTASYPROS_MATCHES ${JSON.stringify(directFantasyProsMatches)}`);

  for (const { detail, candidates } of candidateReport.filter((item) => item.candidates.length === 1)) {
    const espnId = clean(candidates[0].id);
    const partialRows = missingIds.filter((row) => clean(row?.espn_id) === espnId);
    console.log(`PARTIAL_ID_ESPN_MATCH ${JSON.stringify({ fantasypros_id: detail.fantasypros_id, name: detail.weekly?.player_name, espn_id: espnId, partialRows })}`);
  }
  console.log(`PARTIAL_ID_SUMMARY ${JSON.stringify({ missingIdsCount: missingIds.length, directFantasyProsMatchCount: directFantasyProsMatches.length })}`);
});
