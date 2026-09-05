import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, rm } from "node:fs/promises";
import { parseFutureProjectionCsv } from "../src/providers/projections/future-projection-provider.js";
import { parseProjectionIdentityMapCsv } from "../src/providers/projections/projection-identity-map.js";
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

    const summary = {
      sourceDate: metadata.sourceDate,
      publishedAt: metadata.publishedAt,
      sourceRecordCount: metadata.sourceRecordCount,
      mappedCount: metadata.mappedCount,
      mappingRatePct: Number(((metadata.mappedCount / metadata.sourceRecordCount) * 100).toFixed(2)),
      unresolvedCount: metadata.unresolvedProviderIds.length,
      excludedSourceRowCount: metadata.excludedSourceRows.length,
      skippedPlayerIdRowCount: metadata.skippedPlayerIdRows,
      byPosition,
      mappedByPosition,
      unresolvedProviderIdsSample: metadata.unresolvedProviderIds.slice(0, 25),
      commandStdout: stdout.trim().split(/\r?\n/)
    };

    console.log(`LIVE_DYNASTYPROCESS_WEEK1_SUMMARY ${JSON.stringify(summary)}`);
    if (stderr.trim()) console.log(`LIVE_DYNASTYPROCESS_WEEK1_STDERR ${JSON.stringify(stderr.trim())}`);
  } finally {
    await Promise.all(paths.map((path) => rm(path, { force: true })));
  }
});
