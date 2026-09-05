import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, rm } from "node:fs/promises";
import { parseFutureProjectionCsv } from "../src/providers/projections/future-projection-provider.js";
import { parseProjectionIdentityMapCsv } from "../src/providers/projections/projection-identity-map.js";
import { parseCsvRows } from "../scripts/lib/fantasypros-manual-csv.js";
import { parseDynastyProcessWeeklyCsv, parseDynastyProcessPlayerIdsCsv } from "../scripts/lib/dynastyprocess-weekly.js";

const execFileAsync = promisify(execFile);
const WEEKLY_URL = "https://raw.githubusercontent.com/dynastyprocess/data/master/files/fp_latest_weekly.csv";
const PLAYER_IDS_URL = "https://raw.githubusercontent.com/dynastyprocess/data/master/files/db_playerids.csv";

async function fetchText(url) {
  const response = await fetch(url, { headers: { "user-agent": "the-chip-winner-live-trial" } });
  assert.equal(response.ok, true, `Live source request failed (${response.status}) for ${url}`);
  return response.text();
}

function increment(map, key) { map[key] = (map[key] || 0) + 1; }
function pct(numerator, denominator) { return Number(((numerator / denominator) * 100).toFixed(2)); }

test("TEMPORARY live DynastyProcess Week 1 staging and mapping coverage", { timeout: 120_000 }, async () => {
  const prefix = "/tmp/tcw-dynastyprocess-2026-week-1-live-trial";
  const paths = [`${prefix}-projections.csv`, `${prefix}-identity-map.csv`, `${prefix}-metadata.json`];

  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, [
      "scripts/download-dynastyprocess-weekly.js",
      "--season", "2026",
      "--week", "1",
      "--output-prefix", prefix
    ], { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 });

    const [projectionCsv, identityCsv, metadataText, weeklyCsv, playerIdsCsv] = await Promise.all([
      readFile(paths[0], "utf8"),
      readFile(paths[1], "utf8"),
      readFile(paths[2], "utf8"),
      fetchText(WEEKLY_URL),
      fetchText(PLAYER_IDS_URL)
    ]);

    const metadata = JSON.parse(metadataText);
    const projections = parseFutureProjectionCsv(projectionCsv);
    const identities = parseProjectionIdentityMapCsv(identityCsv);
    const weekly = parseDynastyProcessWeeklyCsv(weeklyCsv);
    const playerIds = parseDynastyProcessPlayerIdsCsv(playerIdsCsv);

    assert.equal(metadata.season, 2026);
    assert.equal(metadata.week, 1);
    assert.equal(metadata.sourceDate, "2026-09-04");
    assert.equal(projections.projections.length, metadata.mappedCount);
    assert.equal(identities.length, metadata.mappedCount);
    assert.equal(metadata.sourceRecordCount, weekly.records.length);

    const byPosition = {};
    const mappedByPosition = {};
    for (const record of weekly.records) {
      increment(byPosition, record.position);
      if (playerIds.map.has(record.providerPlayerId)) increment(mappedByPosition, record.position);
    }
    const positionMappingRatePct = Object.fromEntries(Object.entries(byPosition).map(([position, count]) => [position, pct(mappedByPosition[position] || 0, count)]));

    const corePositions = new Set(["QB", "RB", "WR", "TE"]);
    const coreRecords = weekly.records.filter((record) => corePositions.has(record.position));
    const coreMapped = coreRecords.filter((record) => playerIds.map.has(record.providerPlayerId));

    const rawRows = parseCsvRows(weeklyCsv);
    const headers = rawRows[0].map((value) => String(value || "").trim().toLowerCase());
    const indexOf = (name) => headers.indexOf(name);
    const unresolvedSet = new Set(metadata.unresolvedProviderIds);
    const unresolvedDetails = rawRows.slice(1).map((row) => ({
      providerPlayerId: String(row[indexOf("fantasypros_id")] || "").trim(),
      playerName: String(row[indexOf("player_name")] || "").trim(),
      team: String(row[indexOf("team")] || "").trim(),
      position: String(row[indexOf("pos")] || "").trim().toUpperCase(),
      rank: Number(row[indexOf("rank")]),
      points: Number(row[indexOf("r2p_pts")])
    })).filter((item) => unresolvedSet.has(item.providerPlayerId) && Number.isFinite(item.points)).sort((a, b) => b.points - a.points || a.rank - b.rank);

    const nonDstUnresolved = unresolvedDetails.filter((item) => item.position !== "DST" && item.position !== "D/ST");
    const summary = {
      sourceDate: metadata.sourceDate,
      publishedAt: metadata.publishedAt,
      sourceRecordCount: metadata.sourceRecordCount,
      mappedCount: metadata.mappedCount,
      mappingRatePct: pct(metadata.mappedCount, metadata.sourceRecordCount),
      coreSkillSourceCount: coreRecords.length,
      coreSkillMappedCount: coreMapped.length,
      coreSkillMappingRatePct: pct(coreMapped.length, coreRecords.length),
      unresolvedCount: metadata.unresolvedProviderIds.length,
      unresolvedNonDstCount: nonDstUnresolved.length,
      unresolvedNonDstAtLeast10Pts: nonDstUnresolved.filter((item) => item.points >= 10).length,
      unresolvedNonDstAtLeast5Pts: nonDstUnresolved.filter((item) => item.points >= 5).length,
      unresolvedNonDstPositivePts: nonDstUnresolved.filter((item) => item.points > 0).length,
      excludedSourceRowCount: metadata.excludedSourceRows.length,
      skippedPlayerIdRowCount: metadata.skippedPlayerIdRows,
      byPosition,
      mappedByPosition,
      positionMappingRatePct,
      topUnresolvedNonDst: nonDstUnresolved.slice(0, 30),
      topUnresolvedAll: unresolvedDetails.slice(0, 30),
      commandStdout: stdout.trim().split(/\r?\n/)
    };

    console.log(`LIVE_DYNASTYPROCESS_WEEK1_SUMMARY ${JSON.stringify(summary)}`);
    if (stderr.trim()) console.log(`LIVE_DYNASTYPROCESS_WEEK1_STDERR ${JSON.stringify(stderr.trim())}`);
  } finally {
    await Promise.all(paths.map((path) => rm(path, { force: true })));
  }
});
