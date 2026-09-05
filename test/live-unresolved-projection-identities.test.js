import test from "node:test";
import assert from "node:assert/strict";
import { buildDynastyProcessWeeklyBundle } from "../scripts/lib/dynastyprocess-weekly.js";
import { parseCsvRows } from "../scripts/lib/fantasypros-manual-csv.js";

const WEEKLY_URL = "https://raw.githubusercontent.com/dynastyprocess/data/master/files/fp_latest_weekly.csv";
const IDS_URL = "https://raw.githubusercontent.com/dynastyprocess/data/master/files/db_playerids.csv";

function clean(value) { return String(value ?? "").replaceAll("\u00a0", " ").trim(); }
function table(text) {
  const rows = parseCsvRows(text);
  const headers = rows[0].map((value) => clean(value).toLowerCase());
  return { headers, rows: rows.slice(1) };
}
function rowObject(headers, row, selectedHeaders) {
  return Object.fromEntries(selectedHeaders.map((header) => [header, clean(row[headers.indexOf(header)]) || null]));
}

async function getText(url) {
  const response = await fetch(url, { headers: { "user-agent": "the-chip-winner-unresolved-identity-diagnostic" } });
  assert.equal(response.ok, true, `${url} returned ${response.status}`);
  return response.text();
}

test("TEMPORARY classify every unresolved DynastyProcess weekly identity", { timeout: 120_000 }, async () => {
  const [weeklyCsv, playerIdsCsv] = await Promise.all([getText(WEEKLY_URL), getText(IDS_URL)]);
  const bundle = buildDynastyProcessWeeklyBundle({
    weeklyCsv,
    playerIdsCsv,
    season: 2026,
    week: 1,
    publishedAt: new Date().toISOString()
  });
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
    details.push({
      fantasypros_id: providerId,
      weekly: weeklyObject,
      playerIdRows: idRows.map((row) => rowObject(ids.headers, row, idFields))
    });
  }

  console.log(`UNRESOLVED_IDENTITY_HEADERS ${JSON.stringify({ weeklyFields, idFields })}`);
  console.log(`UNRESOLVED_IDENTITY_SUMMARY ${JSON.stringify({ sourceRecordCount: bundle.sourceRecordCount, mappedCount: bundle.mappedCount, unresolvedCount: unresolved.size, byPosition, skippedPlayerIdRows: bundle.skippedPlayerIdRows })}`);
  for (const detail of details) console.log(`UNRESOLVED_IDENTITY ${JSON.stringify(detail)}`);

  assert.equal(details.length, bundle.unresolvedProviderIds.length);
});
