import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, rm } from "node:fs/promises";
import { deriveEspnDefensePlayerId } from "../scripts/lib/dynastyprocess-weekly.js";

const execFileAsync = promisify(execFile);
const ESPN_URL = "https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2026/segments/0/leaguedefaults/1?view=kona_player_info&scoringPeriodId=1";

function unwrapPlayer(entry) {
  return entry?.player || entry?.playerPoolEntry?.player || entry;
}

test("TEMPORARY live Week 1 source maps all 32 D/ST rows", { timeout: 120_000 }, async () => {
  const prefix = "/tmp/tcw-dst-live-canary";
  const paths = [`${prefix}-projections.csv`, `${prefix}-identity-map.csv`, `${prefix}-metadata.json`];
  try {
    const { stdout } = await execFileAsync(process.execPath, [
      "scripts/download-dynastyprocess-weekly.js",
      "--season", "2026",
      "--week", "1",
      "--output-prefix", prefix
    ], { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 });
    const metadata = JSON.parse(await readFile(paths[2], "utf8"));
    assert.equal(metadata.sourceDate, "2026-09-04");
    assert.equal(metadata.sourceRecordCount, 682);
    assert.equal(metadata.derivedDefenseMappingCount, 32);
    assert.equal(metadata.mappedCount, 637);
    assert.equal(metadata.unresolvedProviderIds.length, 45);
    console.log(`LIVE_DST_SOURCE_CANARY ${JSON.stringify({ mappedCount: metadata.mappedCount, sourceRecordCount: metadata.sourceRecordCount, derivedDefenseMappingCount: metadata.derivedDefenseMappingCount, unresolvedCount: metadata.unresolvedProviderIds.length, stdout: stdout.trim().split(/\r?\n/) })}`);
  } finally {
    await Promise.all(paths.map((path) => rm(path, { force: true })));
  }
});

test("TEMPORARY live ESPN player pool confirms the synthetic D/ST ID rule", { timeout: 120_000 }, async () => {
  const filter = {
    players: {
      filterSlotIds: { value: [16] },
      limit: 100,
      sortPercOwned: { sortPriority: 1, sortAsc: false }
    }
  };
  const response = await fetch(ESPN_URL, {
    headers: {
      "user-agent": "the-chip-winner-live-dst-canary",
      accept: "application/json",
      "x-fantasy-filter": JSON.stringify(filter)
    }
  });
  assert.equal(response.ok, true, `ESPN D/ST canary request failed with ${response.status}`);
  const payload = await response.json();
  const entries = Array.isArray(payload?.players) ? payload.players : Array.isArray(payload) ? payload : [];
  const defenses = entries.map(unwrapPlayer).filter((player) => player && (player.defaultPositionId === 16 || player.eligibleSlots?.includes?.(16)));
  const byProTeamId = new Map(defenses.map((player) => [Number(player.proTeamId), String(player.id)]));
  const canonicalTeams = ["ATL","BUF","CHI","CIN","CLE","DAL","DEN","DET","GB","TEN","IND","KC","LV","LAR","MIA","MIN","NE","NO","NYG","NYJ","PHI","ARI","PIT","LAC","SF","SEA","TB","WSH","CAR","JAX","BAL","HOU"];
  const expectedIds = new Set(canonicalTeams.map((team) => deriveEspnDefensePlayerId(team)));
  const liveIds = new Set(defenses.map((player) => String(player.id)));
  const missing = [...expectedIds].filter((id) => !liveIds.has(id));
  assert.equal(missing.length, 0, `Live ESPN D/ST pool is missing expected IDs: ${missing.join(", ")}`);
  assert.ok(defenses.length >= 32, `Expected at least 32 D/ST entries, got ${defenses.length}`);
  console.log(`LIVE_ESPN_DST_CANARY ${JSON.stringify({ defenseCount: defenses.length, sample: defenses.slice(0, 5).map((player) => ({ id: String(player.id), proTeamId: player.proTeamId, name: player.fullName || null })), uniqueProTeams: byProTeamId.size })}`);
});
