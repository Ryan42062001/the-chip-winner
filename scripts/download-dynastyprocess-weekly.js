import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildDynastyProcessWeeklyBundle } from "./lib/dynastyprocess-weekly.js";

const WEEKLY_URL = "https://raw.githubusercontent.com/dynastyprocess/data/master/files/fp_latest_weekly.csv";
const PLAYER_IDS_URL = "https://raw.githubusercontent.com/dynastyprocess/data/master/files/db_playerids.csv";
const WEEKLY_COMMITS_URL = "https://api.github.com/repos/dynastyprocess/data/commits?path=files/fp_latest_weekly.csv&per_page=1";

function argument(name, fallback = null) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
}
async function fetchText(url) {
  const response = await fetch(url, { headers: { "user-agent": "the-chip-winner", accept: "text/plain,*/*" } });
  if (!response.ok) throw new Error(`DynastyProcess request failed (${response.status}) for ${url}.`);
  return response.text();
}
async function fetchPublishedAt() {
  const response = await fetch(WEEKLY_COMMITS_URL, { headers: { "user-agent": "the-chip-winner", accept: "application/vnd.github+json" } });
  if (!response.ok) throw new Error(`DynastyProcess publication lookup failed (${response.status}).`);
  const commits = await response.json();
  const publishedAt = commits?.[0]?.commit?.committer?.date || commits?.[0]?.commit?.author?.date || null;
  if (!publishedAt || !Number.isFinite(Date.parse(publishedAt))) throw new Error("DynastyProcess publication lookup did not return a valid commit timestamp.");
  return publishedAt;
}

const season = Number(argument("season"));
const week = Number(argument("week"));
if (!Number.isInteger(season) || season < 2000 || season > 2100) throw new Error("Pass a valid --season.");
if (!Number.isInteger(week) || week < 1 || week > 18) throw new Error("Pass the explicit ESPN/NFL --week. The upstream weekly file does not expose a week column, so this script will not guess it.");

const [weeklyCsv, playerIdsCsv, publishedAt] = await Promise.all([fetchText(WEEKLY_URL), fetchText(PLAYER_IDS_URL), fetchPublishedAt()]);
const bundle = buildDynastyProcessWeeklyBundle({ weeklyCsv, playerIdsCsv, season, week, publishedAt });
const prefix = resolve(argument("output-prefix", `local-data/dynastyprocess-${season}-week-${week}-ppr`));
const projectionsPath = `${prefix}-projections.csv`;
const identityPath = `${prefix}-identity-map.csv`;
const metadataPath = `${prefix}-metadata.json`;
await mkdir(dirname(prefix), { recursive: true });
await Promise.all([
  writeFile(projectionsPath, bundle.projectionsCsv, "utf8"),
  writeFile(identityPath, bundle.identityMapCsv, "utf8"),
  writeFile(metadataPath, `${JSON.stringify({
    provider: bundle.provider,
    scoringFormat: bundle.scoringFormat,
    season: bundle.season,
    week: bundle.week,
    sourceDate: bundle.sourceDate,
    publishedAt: bundle.publishedAt,
    sourceRecordCount: bundle.sourceRecordCount,
    mappedCount: bundle.mappedCount,
    derivedDefenseMappingCount: bundle.derivedDefenseMappingCount,
    reviewedIdentityMappingCount: bundle.reviewedIdentityMappingCount,
    unresolvedProviderIds: bundle.unresolvedProviderIds,
    excludedSourceRows: bundle.excludedSourceRows,
    skippedPlayerIdRows: bundle.skippedPlayerIdRows,
    sources: { weekly: WEEKLY_URL, playerIds: PLAYER_IDS_URL, publication: WEEKLY_COMMITS_URL },
    limitations: [
      "The upstream weekly file does not publish an NFL week column; the requested week is supplied explicitly by the user or connected ESPN state.",
      "r2p_pts is retained as the source-published PPR weekly estimate. The Chip Winner does not recalculate or relabel it as a custom ESPN scoring projection.",
      "publishedAt is the DynastyProcess GitHub publication timestamp used for freshness; it is not claimed to be the time FantasyPros recalculated its underlying rankings.",
      "Non-D/ST identities normally use stable FantasyPros-ID to ESPN-ID mappings from DynastyProcess. Missing or conflicting athlete IDs are never repaired by display name.",
      "A narrow reviewed bridge may activate for documented FantasyPros IDs only while the current DynastyProcess player-ID table independently publishes the reviewed ESPN ID on an otherwise-unassigned FantasyPros row. The bridge fails closed if that evidence disappears or the ESPN ID becomes claimed by another FantasyPros ID.",
      "D/ST rows may use the source-published NFL team code plus an explicit ESPN pro-team-ID table to derive ESPN's synthetic team-defense player ID. Unknown team codes and conflicting direct IDs are rejected rather than name-matched."
    ]
  }, null, 2)}\n`, "utf8")
]);

console.log(`Staged ${bundle.mappedCount}/${bundle.sourceRecordCount} mapped DynastyProcess PPR weekly estimates for Week ${week}.`);
console.log(`Projection CSV: ${projectionsPath}`);
console.log(`Identity map CSV: ${identityPath}`);
console.log(`Metadata: ${metadataPath}`);
if (bundle.derivedDefenseMappingCount) console.log(`${bundle.derivedDefenseMappingCount} D/ST rows used the explicit ESPN team-defense identity bridge.`);
if (bundle.reviewedIdentityMappingCount) console.log(`${bundle.reviewedIdentityMappingCount} rows used reviewed FantasyPros-to-ESPN identity bridges backed by current unassigned ESPN-ID evidence.`);
if (bundle.unresolvedProviderIds.length) console.log(`${bundle.unresolvedProviderIds.length} weekly FantasyPros IDs had no stable ESPN mapping and were excluded.`);
if (bundle.excludedSourceRows.length) console.log(`${bundle.excludedSourceRows.length} source rows were excluded because required IDs, dates, team codes, or r2p points were missing or invalid.`);
