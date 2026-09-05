import test from "node:test";
import assert from "node:assert/strict";
import { buildDynastyProcessWeeklyBundle } from "../scripts/lib/dynastyprocess-weekly.js";
import { parseCsvRows } from "../scripts/lib/fantasypros-manual-csv.js";

const WEEKLY_URL = "https://raw.githubusercontent.com/dynastyprocess/data/master/files/fp_latest_weekly.csv";
const IDS_URL = "https://raw.githubusercontent.com/dynastyprocess/data/master/files/db_playerids.csv";
const ESPN_URL = "https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2026/segments/0/leaguedefaults/1?view=kona_player_info&scoringPeriodId=1";
const ESPN_POSITION_ID = Object.freeze({ QB:1, RB:2, WR:3, TE:4, K:5 });
const clean = (value) => String(value ?? "").replaceAll("\u00a0", " ").trim();
const normalize = (value) => clean(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const last = (value) => normalize(value).split(" ").at(-1) || "";

async function text(url, headers = {}) {
  const response = await fetch(url, { headers: { "user-agent": "the-chip-winner-name-diagnostic", ...headers } });
  assert.equal(response.ok, true, `${url} returned ${response.status}`);
  return response.text();
}
function weeklyRows(csv) {
  const rows = parseCsvRows(csv); const headers = rows[0].map((v) => clean(v).toLowerCase());
  const at = (name) => headers.indexOf(name);
  return rows.slice(1).map((row) => ({
    fantasypros_id: clean(row[at("fantasypros_id")]), player_name: clean(row[at("player_name")]), pos: clean(row[at("pos")]), team: clean(row[at("team")]), pos_rank: clean(row[at("pos_rank")]), player_page_url: clean(row[at("player_page_url")])
  }));
}
function unwrap(entry) { return entry?.player || entry?.playerPoolEntry?.player || entry; }

test("TEMPORARY inspect zero-team-match identities across the full ESPN pool", { timeout: 120_000 }, async () => {
  const [weeklyCsv, idsCsv, espnText] = await Promise.all([
    text(WEEKLY_URL), text(IDS_URL), text(ESPN_URL, { "x-fantasy-filter": JSON.stringify({ players: { limit: 5000, sortPercOwned: { sortPriority: 1, sortAsc: false } } }) })
  ]);
  const bundle = buildDynastyProcessWeeklyBundle({ weeklyCsv, playerIdsCsv: idsCsv, season: 2026, week: 1, publishedAt: new Date().toISOString() });
  const unresolved = new Set(bundle.unresolvedProviderIds);
  const source = weeklyRows(weeklyCsv).filter((row) => unresolved.has(row.fantasypros_id));
  const payload = JSON.parse(espnText);
  const players = (Array.isArray(payload?.players) ? payload.players : payload).map(unwrap).filter(Boolean);
  let exactCount = 0; let uniqueLastNameCount = 0;
  for (const row of source) {
    const positionId = ESPN_POSITION_ID[row.pos];
    const exact = players.filter((player) => Number(player.defaultPositionId) === positionId && normalize(player.fullName) === normalize(row.player_name));
    const sameLast = players.filter((player) => Number(player.defaultPositionId) === positionId && last(player.fullName) === last(row.player_name));
    if (exact.length === 1) exactCount += 1;
    if (sameLast.length === 1) uniqueLastNameCount += 1;
    console.log(`ESPN_GLOBAL_NAME_DIAGNOSTIC ${JSON.stringify({ source: row, exact: exact.map((p) => ({ id:p.id, name:p.fullName, proTeamId:p.proTeamId, active:p.active })), sameLast: sameLast.length <= 8 ? sameLast.map((p) => ({ id:p.id, name:p.fullName, proTeamId:p.proTeamId, active:p.active })) : { count:sameLast.length } })}`);
  }
  console.log(`ESPN_GLOBAL_NAME_SUMMARY ${JSON.stringify({ unresolvedCount:source.length, exactUniqueCount:exactCount, uniqueLastNameCount })}`);
});
