import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDynastyProcessWeeklyBundle,
  parseDynastyProcessPlayerIdsCsv
} from "../scripts/lib/dynastyprocess-weekly.js";
import { parseCsvRows } from "../scripts/lib/fantasypros-manual-csv.js";

const WEEKLY_URL = "https://raw.githubusercontent.com/dynastyprocess/data/master/files/fp_latest_weekly.csv";
const IDS_URL = "https://raw.githubusercontent.com/dynastyprocess/data/master/files/db_playerids.csv";
const ESPN_URL = "https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2026/segments/0/leaguedefaults/1?view=kona_player_info&scoringPeriodId=1";

const ESPN_POSITION_ID = Object.freeze({ QB: 1, RB: 2, WR: 3, TE: 4, K: 5 });
const ESPN_PRO_TEAM_ID_BY_CODE = Object.freeze({
  ATL: 1, BUF: 2, CHI: 3, CIN: 4, CLE: 5, DAL: 6, DEN: 7, DET: 8,
  GB: 9, TEN: 10, IND: 11, KC: 12, LV: 13, LAR: 14, MIA: 15,
  MIN: 16, NE: 17, NO: 18, NYG: 19, NYJ: 20, PHI: 21, ARI: 22,
  PIT: 23, LAC: 24, SF: 25, SEA: 26, TB: 27, WAS: 28, WSH: 28,
  CAR: 29, JAC: 30, JAX: 30, BAL: 33, HOU: 34
});

const clean = (value) => String(value ?? "").replaceAll("\u00a0", " ").trim();
const normalize = (value) => clean(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

async function fetchText(url, headers = {}) {
  const response = await fetch(url, {
    headers: { "user-agent": "the-chip-winner-unresolved-refresh-diagnostic", ...headers }
  });
  assert.equal(response.ok, true, `${url} returned ${response.status}`);
  return response.text();
}

function weeklyRows(csv) {
  const rows = parseCsvRows(csv);
  const headers = rows[0].map((value) => clean(value).toLowerCase());
  const at = (name) => headers.indexOf(name);
  return rows.slice(1).map((row) => ({
    fantasyprosId: clean(row[at("fantasypros_id")]),
    name: clean(row[at("player_name")]),
    position: clean(row[at("pos")]).toUpperCase(),
    team: clean(row[at("team")]).toUpperCase(),
    rank: clean(row[at("pos_rank")]),
    points: clean(row[at("r2p_pts")]),
    sourceDate: clean(row[at("scrape_date")])
  }));
}

function unwrap(entry) {
  return entry?.player || entry?.playerPoolEntry?.player || entry;
}

function classify(row, exact, playerIds) {
  if (exact.length === 0) return "espn-fantasy-missing";
  if (exact.length > 1) return "espn-fantasy-ambiguous";
  const candidate = exact[0];
  const espnId = String(candidate.id);
  const proTeamId = Number(candidate.proTeamId);
  const hasUnassignedDynastyProcessEspnId = playerIds.espnIdsWithoutFantasyPros.has(espnId);

  if (row.team === "FA") {
    if (proTeamId === 0) {
      return hasUnassignedDynastyProcessEspnId
        ? "espn-fantasy-fa-with-dp-id-evidence"
        : "espn-fantasy-fa-no-dp-id-evidence";
    }
    return "weekly-source-team-stale";
  }

  const expectedTeamId = ESPN_PRO_TEAM_ID_BY_CODE[row.team];
  if (!Number.isInteger(expectedTeamId)) return "weekly-source-team-unknown";
  if (proTeamId === expectedTeamId) {
    return hasUnassignedDynastyProcessEspnId
      ? "reviewed-bridge-ready"
      : "espn-team-match-no-dp-id-evidence";
  }
  if (proTeamId === 0) return "espn-fantasy-team-unassigned";
  return "espn-fantasy-team-mismatch";
}

test("TEMPORARY refresh the remaining DynastyProcess identity gaps against live ESPN Fantasy", { timeout: 120_000 }, async () => {
  const [weeklyCsv, idsCsv, espnText] = await Promise.all([
    fetchText(WEEKLY_URL),
    fetchText(IDS_URL),
    fetchText(ESPN_URL, {
      "x-fantasy-filter": JSON.stringify({
        players: { limit: 5000, sortPercOwned: { sortPriority: 1, sortAsc: false } }
      })
    })
  ]);

  const publishedAt = new Date().toISOString();
  const bundle = buildDynastyProcessWeeklyBundle({
    weeklyCsv,
    playerIdsCsv: idsCsv,
    season: 2026,
    week: 1,
    publishedAt
  });
  const playerIds = parseDynastyProcessPlayerIdsCsv(idsCsv);
  const unresolved = new Set(bundle.unresolvedProviderIds);
  const sourceRows = weeklyRows(weeklyCsv).filter((row) => unresolved.has(row.fantasyprosId));
  const payload = JSON.parse(espnText);
  const players = (Array.isArray(payload?.players) ? payload.players : payload)
    .map(unwrap)
    .filter(Boolean);

  const counts = {};
  for (const row of sourceRows) {
    const positionId = ESPN_POSITION_ID[row.position];
    const exact = players.filter((player) =>
      Number(player.defaultPositionId) === positionId && normalize(player.fullName) === normalize(row.name)
    );
    const classification = classify(row, exact, playerIds);
    counts[classification] = (counts[classification] || 0) + 1;
    console.log(`UNRESOLVED_REFRESH ${JSON.stringify({
      source: row,
      classification,
      espn: exact.map((player) => ({
        id: player.id,
        name: player.fullName,
        proTeamId: player.proTeamId,
        active: player.active,
        dpUnassignedEspnEvidence: playerIds.espnIdsWithoutFantasyPros.has(String(player.id))
      }))
    })}`);
  }

  console.log(`UNRESOLVED_REFRESH_SUMMARY ${JSON.stringify({
    sourceDate: sourceRows[0]?.sourceDate || null,
    sourceRecordCount: bundle.sourceRecordCount,
    mappedCount: bundle.mappedCount,
    unresolvedCount: sourceRows.length,
    espnPoolCount: players.length,
    classifications: counts
  })}`);
});
